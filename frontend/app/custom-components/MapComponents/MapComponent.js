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
  const routeLayerRef = useRef(null);
  const markersRef = useRef([]);
  const [outsideNYC, setOutsideNYC] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeDetails, setRouteDetails] = useState(null);
  const [activeRoute, setActiveRoute] = useState("initial"); // 'initial' or 'safer'
  const [mapCriticalError, setMapCriticalError] = useState(null); // Keep this for UI display of critical errors
  const [successfulRoute, setSuccessfulRoute] = useState(false);

  // Track if location has been set by explicit coordinates
  const [hasExplicitCoordinates, setHasExplicitCoordinates] = useState(false);
  // Track if we've attempted to get location on initial load
  const initialLocationAttemptRef = useRef(false);

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
      const routeInfo = extractRouteSummary(response);

      // Enhance turn instructions by adding missing street names
      if (routeInfo.initial && routeInfo.initial.instructions) {
        routeInfo.initial.instructions = enhanceTurnInstructions(
          routeInfo.initial.instructions
        );
      }
      if (routeInfo.safer && routeInfo.safer.instructions) {
        routeInfo.safer.instructions = enhanceTurnInstructions(
          routeInfo.safer.instructions
        );
      }

      setRouteDetails(routeInfo);

      // Display the route on the map
      displayRoute(response);

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

  // Function to display the route on the map
  const displayRoute = (routeData) => {
    if (!mapInstanceRef.current || !routeData) return;

    const map = mapInstanceRef.current;

    // Clear existing route and markers
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
    }

    markersRef.current.forEach((marker) => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
    markersRef.current = [];

    // Get route coordinates using the imported utility function
    const initialRouteCoords = extractCoordinates(
      routeData.initial_route,
      "ors"
    );
    const saferRouteCoords = routeData.safer_route
      ? extractCoordinates(routeData.safer_route, "mapbox")
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

    // Get departure and destination coordinates from the route
    // Use initial route if available, otherwise use safer route
    const routeToUse =
      initialRouteCoords.length > 0 ? initialRouteCoords : saferRouteCoords;
    const departureCoord = routeToUse[0];
    const destinationCoord = routeToUse[routeToUse.length - 1];

    // Create custom marker icons (same as your existing code)
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
    }).addTo(map);
    const destinationMarker = L.marker(destinationCoord, {
      icon: destinationIcon,
    }).addTo(map);

    markersRef.current.push(departureMarker, destinationMarker);

    // Create route layer with both routes if available
    const routeLayers = [];

    // Initial route (ORS)
    if (initialRouteCoords.length > 0) {
      const initialRoute = L.polyline(initialRouteCoords, {
        color: "#3B82F6", // Blue for initial route
        weight: 5,
        opacity: activeRoute === "initial" ? 0.9 : 0.4,
        dashArray: activeRoute === "initial" ? null : "5, 5",
        lineCap: "round",
      });

      initialRoute.on("click", () => {
        setActiveRoute("initial");
      });

      routeLayers.push(initialRoute);
    }

    // Safer route (Mapbox)
    if (saferRouteCoords && saferRouteCoords.length > 0) {
      const saferRoute = L.polyline(saferRouteCoords, {
        color: "#10B981", // Green for safer route
        weight: 5,
        opacity: activeRoute === "safer" ? 0.9 : 0.4,
        dashArray: activeRoute === "safer" ? null : "5, 5",
        lineCap: "round",
      });

      saferRoute.on("click", () => {
        setActiveRoute("safer");
      });

      routeLayers.push(saferRoute);
    }

    // Add routes to map
    routeLayerRef.current = L.layerGroup(routeLayers).addTo(map);

    // Add a legend
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "bg-white shadow-md rounded-md p-2");
      div.innerHTML = `
                <div class="text-sm font-medium">Routes</div>
                <div class="flex items-center mt-1">
                  <div class="w-4 h-1 bg-blue-500 mr-2"></div>
                  <div class="text-xs">ORS Route</div>
                </div>
                ${
                  saferRouteCoords
                    ? `
                <div class="flex items-center mt-1">
                  <div class="w-4 h-1 bg-green-500 mr-2"></div>
                  <div class="text-xs">Mapbox Route</div>
                </div>
                `
                    : ""
                }
                <div class="text-xs mt-1 text-gray-500">Click on a route to select</div>
            `;
      return div;
    };
    legend.addTo(map);

    // Zoom to departure point instead of entire route
    map.setView(departureCoord, 18);
  };

  // Function to retry getting location
  const retryLocation = () => {
    setIsGettingLocation(true);
    setLocationDenied(false);
    setHasExplicitCoordinates(false); // Reset this flag to try geolocation again

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Got user location on retry:", position.coords);
          const { latitude, longitude } = position.coords;

          // Check if within NYC
          if (isWithinNYC([latitude, longitude])) {
            setUserLocation([latitude, longitude]);
            setOutsideNYC(false);
          } else {
            setUserLocation([latitude, longitude]);
            setOutsideNYC(true);

            showWarning(
              "Your location is outside NYC",
              "Routes in SafeRouteNYC are optimized for NYC area.",
              "location_outside_nyc"
            );
          }

          setIsGettingLocation(false);

          // Update map view
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 18);

            // Update marker if it exists
            if (mapInstanceRef.current._userMarker) {
              mapInstanceRef.current._userMarker.setLatLng([
                latitude,
                longitude,
              ]);
            }
          }

          showSuccess(
            "Location found",
            "Successfully updated your location",
            "location_found"
          );
        },
        (error) => {
          console.warn("Geolocation retry error:", error.message);
          if (error.code === 1) {
            // PERMISSION_DENIED
            setLocationDenied(true);

            showWarning(
              "Location access denied",
              "Please enable location in your browser settings to use this feature",
              "location_permission_denied"
            );
          } else {
            showError(
              "Location error",
              error.message || "Could not get your location",
              "location_error"
            );
          }
          setIsGettingLocation(false);

          // Set to default location
          setUserLocation(defaultLocation);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setIsGettingLocation(false);
      showWarning(
        "Geolocation not supported",
        "Your browser does not support geolocation",
        "location_not_supported"
      );

      // Set to default location
      setUserLocation(defaultLocation);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          mapInitializedRef.current = false;
        } catch (e) {
          console.warn("Error cleaning up map:", e);
        }
      }
    };
  }, []);

  // Update route styles when active route changes
  useEffect(() => {
    if (!routeLayerRef.current) return;

    // Apply the updated styles to the routes
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      // For each layer in the route layer group
      routeLayerRef.current.eachLayer((layer) => {
        if (layer instanceof L.Polyline) {
          // Check if this is the initial or safer route based on color
          const isInitialRoute = layer.options.color === "#3B82F6";
          const isSaferRoute = layer.options.color === "#10B981";

          if (isInitialRoute) {
            layer.setStyle({
              opacity: activeRoute === "initial" ? 0.9 : 0.4,
              dashArray: activeRoute === "initial" ? null : "5, 5",
            });
          } else if (isSaferRoute) {
            layer.setStyle({
              opacity: activeRoute === "safer" ? 0.9 : 0.4,
              dashArray: activeRoute === "safer" ? null : "5, 5",
            });
          }
        }
      });
    } catch (e) {
      console.warn("Error updating route styles:", e);

      showWarning(
        "Route display issue",
        "Could not update route styles. The route may not display correctly.",
        "route_style_error"
      );

      // Fallback to re-creating the routes if direct style update fails
      if (map && routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);

        if (routeDetails) {
          displayRoute({
            initial_route: routeDetails.initial_route,
            safer_route: routeDetails.safer_route,
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoute, showWarning]);

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
      </div>

      {/* Route information panel */}
      {routeDetails && <RouteInfo {...{ routeDetails, activeRoute, setActiveRoute }} />}
    </div>
  );
};

export default RoutingMapComponent;
