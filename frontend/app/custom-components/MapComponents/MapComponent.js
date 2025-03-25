"use client";
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { apiPost, authAPI } from "@/utils/fetch/fetch";
import { useNotification } from "../ToastComponent/NotificationContext";
import {
  extractCoordinates,
  extractRouteSummary,
  enhanceTurnInstructions,
} from "../RoutingComponets/RouteHandler";
import SaveRouteComponent from "../RoutingComponets/SaveRoute";
import "@/styles/map_styles.css";
import HeatmapLayer from "./HeatmapLayer";
import MapCriticalErrorMsg from "./MapCriticalErrorMsg";
import MapRenderMsg from "./MapRenderMsg";
import useUserLocation from "@/hooks/useUserLocation";
import RouteInfo from "./RouteInfo";
import RouteRenderer from "./RouteRender";

const RoutingMapComponent = ({
  mapboxToken,
  departureCoords,
  destinationCoords,
  useCurrentLocation = false,
}) => {
  const { showError, showWarning, showSuccess } = useNotification();
  const mapContainerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstanceRef = useRef(null);
  const mapInitializedRef = useRef(false);
  const { userLocation, isGettingLocation, locationDenied, retryLocation } = useUserLocation({
    departureCoords,
    mapInitializedRef,
    mapInstanceRef
  });
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeDetails, setRouteDetails] = useState(null);
  const [routeData, setRouteData] = useState(null); // Store the raw route data
  const [activeRoute, setActiveRoute] = useState("initial"); // 'initial' or 'safer'
  const [mapCriticalError, setMapCriticalError] = useState(null); // Keep this for UI display of critical errors
  const [successfulRoute, setSuccessfulRoute] = useState(false);

  // Initialize map when we have location
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !mapContainerRef.current ||
      !mapboxToken ||
      !userLocation ||
      mapInitializedRef.current
    ) {
      return;
    }

    // Clean up any existing map
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn("Error removing existing map:", err);
      }
      mapInstanceRef.current = null;
    }

    try {
      // Clean up container if needed
      const container = mapContainerRef.current;
      if (container._leaflet_id) {
        console.warn("Container already has Leaflet ID. Cleaning up.");
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        delete container._leaflet_id;
      }

      // Create map centered on user location
      console.log("Creating map instance");
      const map = L.map(container, {
        maxBounds: [
          [40.4957, -74.2557], // Southwest coordinates (Staten Island)
          [40.9176, -73.7002], // Northeast coordinates (Bronx)
        ],
        maxBoundsViscosity: 1.0,
        minZoom: 11,
        maxZoom: 18,
        bounceAtZoomLimits: true,
      }).setView(userLocation, 15);
      mapInstanceRef.current = map;
      const mapboxNavigationNightId = "mapbox/navigation-night-v1";
      const mapboxUrl = `https://api.mapbox.com/styles/v1/${mapboxNavigationNightId}/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`;
      // Add tile layer
      L.tileLayer(mapboxUrl, {
        attribution:
          'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 18,
        minZoom: 11,
        id: "mapbox/streets-v11",
        tileSize: 512,
        zoomOffset: -1,
        accessToken: mapboxToken,
      }).addTo(map);

      // Create user marker icon
      const userIcon = L.divIcon({
        className: "custom-user-marker-icon",
        html: `
          <div class="user-location-pulse">
            <div class="user-location-dot"></div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      // Add user marker
      map._userMarker = L.marker(userLocation, {
        icon: userIcon,
        zIndexOffset: 499,
      }).addTo(map);

      // Add locate button
      const locateButton = L.DomUtil.create("div", "leaflet-control");
      locateButton.innerHTML = `
        <div class="bg-white rounded-md shadow-md p-2 cursor-pointer hover:bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="1"></circle>
          </svg>
        </div>
      `;
      locateButton.style.position = "absolute";
      locateButton.style.left = "10px";
      locateButton.style.top = "80px";
      locateButton.style.zIndex = "499";

      // Add locate button to container
      container.appendChild(locateButton);

      // Handle locate button click
      locateButton.addEventListener("click", (e) => {
        e.stopPropagation();
        retryLocation(); // Use our retry location function instead of just centering
      });

      // Mark map as initialized
      console.log("Map initialized successfully");
      setMapLoaded(true);
      mapInitializedRef.current = true;
      setMapCriticalError(null); // Clear any previous errors
    } catch (error) {
      console.error("Error initializing map:", error);

      // Set critical error for UI display
      setMapCriticalError("Failed to initialize map. Please refresh the page.");
      mapInitializedRef.current = false;

      // Also show a toast notification
      showError(
        "Could not initialize map",
        error.message || "Unknown error initializing map",
        "map_initialization_error"
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, mapboxToken, showError]);

  // Fetch route when coordinates change
  useEffect(() => {
    if (mapLoaded && destinationCoords) {
      // Only proceed if we have a destination
      if (useCurrentLocation) {
        // If using current location, we need to wait until userLocation is set
        if (userLocation) {
          console.log("Using current location for route:", userLocation);
          fetchRouteData(userLocation, destinationCoords);
        } else {
          console.log("Waiting for current location to be detected...");
          // The userLocation will be set by the geolocation logic elsewhere in the component
        }
      } else if (departureCoords) {
        // Using explicit departure coordinates
        console.log(
          "Using explicit departure coordinates for route:",
          departureCoords
        );
        fetchRouteData(departureCoords, destinationCoords);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mapLoaded,
    departureCoords,
    destinationCoords,
    userLocation,
    useCurrentLocation,
  ]);

  // Function to fetch route data from your Django API
  const fetchRouteData = async (departure, destination) => {
    if (!departure || !destination) {
      return;
    }

    setIsLoadingRoute(true);
    setMapCriticalError(null); // Clear any previous errors

    try {
      // Prepare the request data for the Django API
      const requestData = {
        departure: departure,
        destination: destination,
        save_route: false, // Don't save for testing
      };

      // Make API call
      console.log("Fetching route with:", requestData);
      const response = await authAPI.authenticatedPost(
        "/get-route/",
        requestData
      );
      console.log("API response:", response);

      // Extract route summary for display
      // If extractRouteSummary isn't working correctly, let's create the routeInfo manually
      let routeInfo = {};
      
      // Manual parsing of initial route data
      if (response.initial_route && response.initial_route.routes && response.initial_route.routes.length > 0) {
        const initialRoute = response.initial_route.routes[0];
        routeInfo.initial = {
          distance: initialRoute.summary?.distance || 0,
          duration: initialRoute.summary?.duration || 0,
          instructions: initialRoute.segments?.[0]?.steps || []
        };
        
        // Enhance turn instructions
        if (routeInfo.initial.instructions) {
          routeInfo.initial.instructions = enhanceTurnInstructions(
            routeInfo.initial.instructions
          );
        }
      }
      
      // Manual parsing of safer route data
      if (response.safer_route && response.safer_route.routes && response.safer_route.routes.length > 0) {
        const saferRoute = response.safer_route.routes[0];
        routeInfo.safer = {
          distance: saferRoute.summary?.distance || 0,
          duration: saferRoute.summary?.duration || 0,
          instructions: saferRoute.segments?.[0]?.steps || []
        };
        
        // Enhance turn instructions
        if (routeInfo.safer.instructions) {
          routeInfo.safer.instructions = enhanceTurnInstructions(
            routeInfo.safer.instructions
          );
        }
      }
      
      // Add the original response structure for debugging
      routeInfo.initial_route = response.initial_route;
      routeInfo.safer_route = response.safer_route;

      // Store the route information
      setRouteDetails(routeInfo);
      // Store the raw route data for the renderer
      setRouteData(response);

      // Show success notification
      showSuccess("Route calculated successfully", null, "route_found");

      //Show the option to save this route
      setSuccessfulRoute(true);
    } catch (error) {
      console.error("Error fetching route:", error);

      showError(
        "Could not calculate route",
        error.message || "Failed to get route. Please try again.",
        "route_fetch_error"
      );
    } finally {
      setIsLoadingRoute(false);
    }
  };

  return (
    <div className="space-y-4">
      {successfulRoute && (
        <SaveRouteComponent
          departure={useCurrentLocation ? userLocation : departureCoords}
          destination={destinationCoords}
        />
      )}
      <div className="relative w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
        <HeatmapLayer {...{ mapLoaded, mapInstanceRef }} />
        {/* Display critical error in the UI if map can't load */}
        {mapCriticalError && <MapCriticalErrorMsg />}

        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Map loading states */}
        {/* loading location */}
        {isGettingLocation && <MapRenderMsg text="Getting your location..." />}
        {/* loading route */}
        {isLoadingRoute && <MapRenderMsg text="Calculating Safe Route..." />}
        {/* catch all */}
        {!isGettingLocation && !mapLoaded && !mapCriticalError && (
          <MapRenderMsg text="Loading map..." />
        )}

        {/* Optional: Location retry button for when permission is denied */}
        {locationDenied && !isGettingLocation && (
          <div className="absolute top-4 right-4 z-[1000]">
            <button
              onClick={retryLocation}
              className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm shadow-md hover:bg-indigo-700 transition-colors"
            >
              Enable Location Access
            </button>
          </div>
        )}

        {/* Route Renderer Component */}
        {mapLoaded && routeData && (
          <RouteRenderer
            mapInstance={mapInstanceRef.current}
            routeData={routeData}
            activeRoute={activeRoute}
            setActiveRoute={setActiveRoute}
            showWarning={showWarning}
          />
        )}
      </div>

      {/* Route information panel */}
      {routeDetails && (
        <RouteInfo {...{ routeDetails, activeRoute, setActiveRoute }} />
      )}
    </div>
  );
};

export default RoutingMapComponent;