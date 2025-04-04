import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useNotification } from "../ToastComponent/NotificationContext";
import { extractCoordinates } from "../RoutingComponets/RouteHandler";

const RouteRenderer = ({
  mapInstance,
  routeData,
  activeRoute,
  setActiveRoute,
  showWarning
}) => {
  const { showError } = useNotification();
  const initialRouteRef = useRef(null);
  const saferRouteRef = useRef(null);
  const markersRef = useRef([]);
  const legendRef = useRef(null);
  const initialRenderRef = useRef(true);

  // Define consistent colors
  const INITIAL_ROUTE_COLOR = "#3B82F6"; // Blue
  const SAFER_ROUTE_COLOR = "#10b981";   // Green

  // Clear existing routes and markers
  const clearRoutes = () => {
    if (!mapInstance) return;

    if (initialRouteRef.current && mapInstance.hasLayer(initialRouteRef.current)) {
      mapInstance.removeLayer(initialRouteRef.current);
      initialRouteRef.current = null;
    }

    if (saferRouteRef.current && mapInstance.hasLayer(saferRouteRef.current)) {
      mapInstance.removeLayer(saferRouteRef.current);
      saferRouteRef.current = null;
    }

    markersRef.current.forEach((marker) => {
      if (mapInstance.hasLayer(marker)) {
        mapInstance.removeLayer(marker);
      }
    });
    markersRef.current = [];

    if (legendRef.current) {
      legendRef.current.remove();
      legendRef.current = null;
    }
  };

  // Create or update routes when routeData changes
  useEffect(() => {
    if (!mapInstance || !routeData) return;

    // Clear existing routes first
    clearRoutes();

    try {
      // Extract route coordinates - both use 'ors' format
      const initialRouteCoords = extractCoordinates(
        routeData.initial_route,
        "ors"
      );
      const saferRouteCoords = routeData.safer_route
        ? extractCoordinates(routeData.safer_route, "ors")
        : null;

      if (
        initialRouteCoords.length === 0 &&
        (!saferRouteCoords || saferRouteCoords.length === 0)
      ) {
        showError(
          "Could not display route",
          "No valid route coordinates found in the response",
          "route_coordinates_error"
        );
        return;
      }

      // Get departure and destination coords
      const routeToUse =
        initialRouteCoords.length > 0 ? initialRouteCoords : saferRouteCoords;
      const departureCoord = routeToUse[0];
      const destinationCoord = routeToUse[routeToUse.length - 1];

      // Create marker icons
      const departureIcon = L.divIcon({
        className: "custom-departure-marker",
        html: `
          <div class="bg-blue-500 h-5 w-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const destinationIcon = L.divIcon({
        className: "custom-destination-marker",
        html: `
          <div class="bg-red-500 h-5 w-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });

      // Add markers for departure and destination
      const departureMarker = L.marker(departureCoord, {
        icon: departureIcon,
      }).addTo(mapInstance);
      
      const destinationMarker = L.marker(destinationCoord, {
        icon: destinationIcon,
      }).addTo(mapInstance);

      markersRef.current = [departureMarker, destinationMarker];

      // Create initial route
      if (initialRouteCoords.length > 0) {
        initialRouteRef.current = L.polyline(initialRouteCoords, {
          color: INITIAL_ROUTE_COLOR, // Always blue
          weight: 5,
          opacity: activeRoute === "initial" ? 1.0 : 0.7,
          dashArray: activeRoute === "initial" ? null : "5, 5",
          lineCap: "round",
          lineJoin: "round"
        }).addTo(mapInstance);

        initialRouteRef.current.on("click", () => {
          setActiveRoute("initial");
        });
      }

      // Create safer route
      if (saferRouteCoords && saferRouteCoords.length > 0) {
        saferRouteRef.current = L.polyline(saferRouteCoords, {
          color: SAFER_ROUTE_COLOR, // Always green
          weight: 6,
          opacity: activeRoute === "safer" ? 1.0 : 0.7,
          dashArray: activeRoute === "safer" ? null : "5, 5",
          lineCap: "round",
          lineJoin: "round"
        }).addTo(mapInstance);

        saferRouteRef.current.on("click", () => {
          setActiveRoute("safer");
        });
      }

      // Add a legend
      const legend = L.control({ position: "bottomright" });
      legend.onAdd = function () {
        const div = L.DomUtil.create("div", "bg-white shadow-md rounded-md p-2");
        div.innerHTML = `
          <div class="text-sm font-medium text-map-legendtext">Routes</div>
          <div class="flex items-center mt-1">
            <div class="w-4 h-1" style="background-color: ${INITIAL_ROUTE_COLOR}; margin-right: 0.5rem;"></div>
            <div class="text-xs text-map-legendtext">Standard Route</div>
          </div>
          ${
            saferRouteCoords
              ? `
          <div class="flex items-center mt-1">
            <div class="w-4 h-1" style="background-color: ${SAFER_ROUTE_COLOR}; margin-right: 0.5rem;"></div>
            <div class="text-xs text-map-legendtext">Safer Route</div>
          </div>
          `
              : ""
          }
        `;
        return div;
      };
      legend.addTo(mapInstance);
      legendRef.current = legend;

      // Zoom to departure point ONLY on initial render of route data
      // This is crucial - we only want to center the map when the route is first loaded
      if (initialRenderRef.current) {
        mapInstance.setView(departureCoord, 16);
        initialRenderRef.current = false;
      }

    } catch (error) {
      console.error("Error creating routes:", error);
      showError(
        "Route display error",
        "Failed to create routes on the map",
        "route_creation_error"
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapInstance, routeData, showError]); // Removed activeRoute from dependencies

  // This separate effect handles route styling when activeRoute changes
  useEffect(() => {
    if (!initialRouteRef.current && !saferRouteRef.current) return;

    try {
      // Update initial route
      if (initialRouteRef.current) {
        initialRouteRef.current.setStyle({
          color: INITIAL_ROUTE_COLOR, // Always keep blue
          opacity: activeRoute === "initial" ? 1.0 : 0.7,
          dashArray: activeRoute === "initial" ? null : "5, 5",
        });
      }

      // Update safer route
      if (saferRouteRef.current) {
        saferRouteRef.current.setStyle({
          color: SAFER_ROUTE_COLOR, // Always keep green
          opacity: activeRoute === "safer" ? 1.0 : 0.7,
          dashArray: activeRoute === "safer" ? null : "5, 5",
        });
      }
    } catch (error) {
      console.error("Error updating route styles:", error);
      
      if (showWarning) {
        showWarning(
          "Route display issue",
          "Could not update route styles",
          "route_style_error"
        );
      }
    }
  }, [activeRoute, showWarning]);

  // Reset initialRender ref if routeData changes
  useEffect(() => {
    if (routeData) {
      initialRenderRef.current = true;
    }
    return () => {
      clearRoutes();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeData]);

  return null; // Non-visual component
};

export default RouteRenderer;