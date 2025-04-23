"use client";
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { authAPI } from "@/utils/fetch/fetch";
import { useNotification } from "../ToastComponent/NotificationContext";
import { enhanceTurnInstructions } from "../RoutingComponets/RouteHandler";
import SaveRouteComponent from "../RoutingComponets/SaveRoute";
import "@/styles/map_styles.css";
import HeatmapLayer from "./HeatmapLayer";
import MapCriticalErrorMsg from "./MapCriticalErrorMsg";
import MapRenderMsg from "./MapRenderMsg";
import RouteInfo from "./RouteInfo";
import RouteRenderer from "./RouteRender";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import { useRoute } from "./RouteContext";

// Default location (Washington Square Park)
const DEFAULT_LOCATION = [40.7308, -73.9974];

const RoutingMapComponent = () => {
  // Get state from context
  const {
    mapboxToken,
    departureCoords,
    destinationCoords,
    userLocation,
    canUseCurrentLocation,
    isGettingLocation,
    locationDenied,
    fetchUserLocation,
    routeKey
  } = useRoute();
  
  const { showError, showWarning, showSuccess } = useNotification();
  const mapContainerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstanceRef = useRef(null);
  const mapInitializedRef = useRef(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeDetails, setRouteDetails] = useState(null);
  const [routeData, setRouteData] = useState(null); // Store the raw route data
  const [activeRoute, setActiveRoute] = useState("initial"); // 'initial' or 'safer'
  const [mapCriticalError, setMapCriticalError] = useState(null); // Keep this for UI display of critical errors
  const [successfulRoute, setSuccessfulRoute] = useState(false);
  const [showRouteInfoPanel, setShowRouteInfoPanel] = useState(true);
  const [waitingForLocation, setWaitingForLocation] = useState(isGettingLocation && !userLocation);
  
  // Track if route has been calculated for these specific coordinates
  const previousDepartureRef = useRef(null);
  const previousDestinationRef = useRef(null);
  const routeCalculatedRef = useRef(false);
  const [shouldCalculateRoute, setShouldCalculateRoute] = useState(false);

  // Helper function to center map on user location
  const centerMapOnUserLocation = () => {
    if (mapInstanceRef.current && userLocation && canUseCurrentLocation) {
      // Center map on user location
      mapInstanceRef.current.setView(userLocation, 15);
    }
  };

  // Wait for user location if using current location
  useEffect(() => {
    if (userLocation && canUseCurrentLocation && waitingForLocation) {
      setWaitingForLocation(false);
    }
  }, [userLocation, canUseCurrentLocation, waitingForLocation]);

  // Reset route calculation state when routeKey changes (meaning user wants a new route)
  useEffect(() => {
    if (routeKey) {
      routeCalculatedRef.current = false;
      previousDepartureRef.current = null;
      previousDestinationRef.current = null;
      setShouldCalculateRoute(true);
    }
  }, [routeKey]);

  // Initialize map only when we have all necessary data
  useEffect(() => {
    // Don't initialize map if:
    // - We're waiting for location
    // - No container element
    // - No mapbox token
    // - Map is already initialized
    if (
      waitingForLocation ||
      typeof window === "undefined" ||
      !mapContainerRef.current ||
      !mapboxToken ||
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

      // Determine map center based on priority:
      // 1. Explicit departure coordinates
      // 2. Valid user location if using current location
      // 3. Default to Washington Square Park
      const mapCenter = departureCoords || 
        (canUseCurrentLocation && userLocation ? 
          userLocation : DEFAULT_LOCATION);

      // Create map centered on appropriate location
      const map = L.map(container, {
        maxBounds: [
          [40.4957, -74.2557], // Southwest coordinates (Staten Island)
          [40.9176, -73.7002], // Northeast coordinates (Bronx)
        ],
        maxBoundsViscosity: 1.0,
        minZoom: 11,
        maxZoom: 18,
        bounceAtZoomLimits: true,
      }).setView(mapCenter, 15);
      
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

      // Only add user marker if using current location AND the location is valid
      if (canUseCurrentLocation && userLocation && !waitingForLocation) {
        addUserMarker(map, userLocation);
      }

      // Only add locate button if location is valid
      if (canUseCurrentLocation) {
        // Add locate button
        const locateButton = L.DomUtil.create("div", "leaflet-control");
        locateButton.innerHTML = `
          <div class="bg-[#1c2735] rounded-md shadow-md p-2 cursor-pointer hover:bg-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white">
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
          if (fetchUserLocation) {
            fetchUserLocation(); // Get updated location
            // Center on user location
            setTimeout(() => centerMapOnUserLocation(), 300);
          }
        });
      }

      // Mark map as initialized
      setMapLoaded(true);
      mapInitializedRef.current = true;
      setMapCriticalError(null); // Clear any previous errors
      
      // Trigger calculation after map is loaded
      setShouldCalculateRoute(true);
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapCriticalError("Failed to initialize map. Please refresh the page.");
      mapInitializedRef.current = false;
      showError(
        "Could not initialize map",
        error.message || "Unknown error initializing map",
        "map_initialization_error"
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken, departureCoords, userLocation, canUseCurrentLocation, fetchUserLocation, showError, waitingForLocation]);

  // Function to add user marker with pulsing effect
  const addUserMarker = (map, location) => {
    // Create user marker icon with pulsing animation
    const userIcon = L.divIcon({
      className: "custom-user-marker-icon",
      html: `
        <div class="user-location-pulse" style="z-index: 1000; position: relative;">
          <div class="user-location-dot" style="background-color: #0078FF; width: 16px; height: 16px; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background-color: rgba(0, 120, 255, 0.3); border-radius: 50%; animation: pulse 1.5s infinite; z-index: 999;"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    // Add user marker
    map._userMarker = L.marker(location, {
      icon: userIcon,
      zIndexOffset: 1010,
    }).addTo(map);
  };

  // Update user marker position if location changes
  useEffect(() => {
    if (
      mapInstanceRef.current && 
      userLocation && 
      canUseCurrentLocation
    ) {
      if (mapInstanceRef.current._userMarker) {
        // Update existing marker
        mapInstanceRef.current._userMarker.setLatLng(userLocation);
      } else {
        // Add user marker if it doesn't exist
        addUserMarker(mapInstanceRef.current, userLocation);
      }
    } else if (
      mapInstanceRef.current && 
      mapInstanceRef.current._userMarker && 
      (!canUseCurrentLocation)
    ) {
      // Remove marker if not using current location or location not valid
      mapInstanceRef.current.removeLayer(mapInstanceRef.current._userMarker);
      mapInstanceRef.current._userMarker = null;
    }
  }, [userLocation, canUseCurrentLocation]);

  useEffect(() => {
    // If we're no longer getting location but still waiting, stop waiting
    if (!isGettingLocation && waitingForLocation) {
      setWaitingForLocation(false);
    }
  }, [isGettingLocation, waitingForLocation]);

  // Helper function to check if coordinates have meaningfully changed
  const areCoordinatesDifferent = (coords1, coords2) => {
    if (!coords1 || !coords2) return true;
    
    // Deep comparison of coordinates
    return JSON.stringify(coords1) !== JSON.stringify(coords2);
  };

  // Trigger route calculation
  useEffect(() => {
    if (!mapLoaded || !departureCoords || !destinationCoords || !shouldCalculateRoute) {
      return;
    }

    // Check if these are new coordinates or we need to recalculate
    const departureChanged = areCoordinatesDifferent(departureCoords, previousDepartureRef.current);
    const destinationChanged = areCoordinatesDifferent(destinationCoords, previousDestinationRef.current);
    
    // Only fetch a new route if coordinates have changed or we haven't calculated yet
    if (!routeCalculatedRef.current || departureChanged || destinationChanged) {
      // Update references to current coordinates
      previousDepartureRef.current = [...departureCoords];
      previousDestinationRef.current = [...destinationCoords];
      
      // Calculate the route
      fetchRouteData(departureCoords, destinationCoords);
      
      // Mark that we've calculated for these coordinates
      routeCalculatedRef.current = true;
    }
    
    // Reset the trigger flag
    setShouldCalculateRoute(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, departureCoords, destinationCoords, shouldCalculateRoute]);

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
      const response = await authAPI.authenticatedPost(
        "/get-route/",
        requestData
      );

      // Extract route summary for display
      let routeInfo = {};

      // Manual parsing of initial route data
      if (
        response.initial_route &&
        response.initial_route.routes &&
        response.initial_route.routes.length > 0
      ) {
        const initialRoute = response.initial_route.routes[0];
        routeInfo.initial = {
          distance: initialRoute.summary?.distance || 0,
          duration: initialRoute.summary?.duration || 0,
          instructions: initialRoute.segments?.[0]?.steps || [],
        };

        // Enhance turn instructions
        if (routeInfo.initial.instructions) {
          routeInfo.initial.instructions = enhanceTurnInstructions(
            routeInfo.initial.instructions
          );
        }
      }

      // Manual parsing of safer route data
      if (
        response.safer_route &&
        response.safer_route.routes &&
        response.safer_route.routes.length > 0
      ) {
        const saferRoute = response.safer_route.routes[0];
        routeInfo.safer = {
          distance: saferRoute.summary?.distance || 0,
          duration: saferRoute.summary?.duration || 0,
          instructions: saferRoute.segments?.[0]?.steps || [],
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
      // Reset route calculated flag to allow retrying
      routeCalculatedRef.current = false;
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Cleanup function for map
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

  return (
    <div className="space-y-4">
      <div className="relative w-full h-[100vh] rounded-lg overflow-hidden shadow-lg">
        <HeatmapLayer {...{ mapLoaded, mapInstanceRef }} />
        {/* Display critical error in the UI if map can't load */}
        {mapCriticalError && <MapCriticalErrorMsg />}

        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Map loading states */}
        {/* Waiting for initial location */}
        {waitingForLocation && <MapRenderMsg text="Waiting for your location..." />}
        {/* loading location */}
        {isGettingLocation && <MapRenderMsg text="Getting your location..." />}
        {/* loading route */}
        {isLoadingRoute && <MapRenderMsg text="Calculating Safe Route..." />}
        {/* catch all */}
        {!isGettingLocation && !mapLoaded && !mapCriticalError && !waitingForLocation && (
          <MapRenderMsg text="Loading map..." />
        )}

        {/* Optional: Location retry button for when permission is denied */}
        {locationDenied && !isGettingLocation && (
          <div className="absolute top-4 right-4 z-[1000]">
            <button
              onClick={fetchUserLocation}
              className="bg-map-pointer text-white px-3 py-2 rounded-md text-sm shadow-md hover:bg-map-pointer2 transition-colors"
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

      <div
        className={`absolute mt-2 mb-2 px-2 bottom-[52px] z-[1001] w-full bg-[#424d5c] transition-all duration-300 ease-in-out ${
          showRouteInfoPanel ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Route information panel */}
        {successfulRoute && (
          <SaveRouteComponent
            departure={userLocation ? userLocation : departureCoords}
            destination={destinationCoords}
          />
        )}
        {routeDetails && (
          <RouteInfo {...{ routeDetails, activeRoute, setActiveRoute }} />
        )}

        {successfulRoute && routeDetails && (
          <div
            onClick={() => setShowRouteInfoPanel(!showRouteInfoPanel)}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-map-pointer border border-[#414976]"
          >
            <ChevronsDown className="m-1 hover:text-[#ffffff] cursor-pointer w-[50px] flex items-center justify-center" />
          </div>
        )}
      </div>

      {!showRouteInfoPanel && (
        <div
          onClick={() => setShowRouteInfoPanel(true)}
          className="absolute bottom-[64px] left-1/2 transform -translate-x-1/2 translate-y-1/2 z-[1001] rounded-t-2xl bg-map-pointer2 border border-[#414976]"
        >
          <ChevronsUp className="m-1 hover:text-[#ffffff] cursor-pointer w-[50px] flex items-center justify-center" />
        </div>
      )}
    </div>
  );
};

export default RoutingMapComponent;