// app/custom-components/MapComponent.js
"use client";
import { apiGet } from '../../utils/fetch/fetch';

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import * as Switch from "@radix-ui/react-switch";
import { apiPost } from "@/utils/fetch/fetch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Navigation, Clock, CornerDownRight } from "lucide-react";
import { useNotification } from "./ToastComponent/NotificationContext";
import { extractCoordinates, extractRouteSummary, enhanceTurnInstructions } from "./RoutingComponets/RouteHandler";

const RoutingMapComponent = ({
    mapboxToken,
    departureCoords,
    destinationCoords,
    useCurrentLocation = false,
}) => {
    const { showError, showWarning, showSuccess } = useNotification();
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const mapInitializedRef = useRef(false);
    const routeLayerRef = useRef(null);
    const markersRef = useRef([]);
    const [outsideNYC, setOutsideNYC] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [locationDenied, setLocationDenied] = useState(false);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const heatLayerRef = useRef(null);
    const [routeDetails, setRouteDetails] = useState(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const [activeRoute, setActiveRoute] = useState('initial'); // 'initial' or 'safer'
    const [mapCriticalError, setMapCriticalError] = useState(null); // Keep this for UI display of critical errors
    const [heatmapPoints, setHeatmapPoints] = useState([]); // Use state for heatmap data
    const [heatmapDataLoaded, setHeatmapDataLoaded] = useState(false); // New state
      
    // Track if location has been set by explicit coordinates
    const [hasExplicitCoordinates, setHasExplicitCoordinates] = useState(false);
    // Track if we've attempted to get location on initial load
    const initialLocationAttemptRef = useRef(false);

    // NYC bounds for validation
    const nycBounds = {
        sw: [40.4957, -74.2557], // Southwest coordinates (Staten Island)
        ne: [40.9176, -73.7002], // Northeast coordinates (Bronx)
    };
    
    // Default location (Washington Square Park)
    const defaultLocation = [40.7308, -73.9974];

    // Add heatmap data
    useEffect(() => {
      console.log("useEffect for heatmap data is running"); // Add this line
      const fetchHeatmapData = async () => {
        try {
          const data = await apiGet("/map/heatmap-data/"); // Use apiGet
          const formattedData = data.map(item => [
            item.latitude,
            item.longitude,
            item.intensity,
          ]);
          console.log("Formatted Heatmap Data (before set):", formattedData);
          setHeatmapPoints(formattedData);
          console.log(formattedData);
          console.log(heatmapPoints);
          setHeatmapDataLoaded(true); // Set to true when data is loaded
        } catch (err) {
          console.error("Error fetching heatmap data:", err);
          setError("Failed to load heatmap data. Please try again.");
        }
      };
  
      fetchHeatmapData();
    }, []);

    // Function to check if coordinates are within NYC
    const isWithinNYC = (coords) => {
        if (!coords || !Array.isArray(coords) || coords.length < 2) return false;
        
        const [lat, lng] = coords;
        return (
            lat >= nycBounds.sw[0] && 
            lat <= nycBounds.ne[0] &&
            lng >= nycBounds.sw[1] && 
            lng <= nycBounds.ne[1]
        );
    };

    // Handle explicit departure coordinates when provided
    useEffect(() => {
        if (departureCoords && Array.isArray(departureCoords) && !hasExplicitCoordinates) {
            console.log("Setting explicit departure coordinates:", departureCoords);
            
            // Check if coordinates are within NYC
            if (isWithinNYC(departureCoords)) {
                setUserLocation(departureCoords);
                setHasExplicitCoordinates(true);
                setOutsideNYC(false);
            } else {
                showWarning(
                    'Location outside NYC',
                    'The selected departure location is outside NYC. Routes are limited to NYC area.',
                    'location_outside_nyc'
                );
                // Still use the coordinates even if outside NYC
                setUserLocation(departureCoords);
                setHasExplicitCoordinates(true);
                setOutsideNYC(true);
            }
        }
    }, [departureCoords, hasExplicitCoordinates, showWarning]);

    // Get user location on initial load
    useEffect(() => {
        if (
            typeof window === "undefined" ||
            userLocation || 
            mapInitializedRef.current || 
            initialLocationAttemptRef.current ||
            hasExplicitCoordinates
        ) {
            return;
        }

        initialLocationAttemptRef.current = true;
        
        const getUserLocationOnLoad = async () => {
            setIsGettingLocation(true);
            console.log("Getting user location on initial load...");

            try {
                if (!navigator.geolocation) {
                    throw new Error("Geolocation not available");
                }

                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0,
                    });

                    // Also set a timeout
                    setTimeout(() => {
                        reject(new Error("Geolocation timeout"));
                    }, 5000);
                });

                console.log("Got user location on initial load:", position.coords);

                // Check if location is within NYC bounds
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                if (isWithinNYC([lat, lng])) {
                    // Location is within NYC
                    setUserLocation([lat, lng]);
                    setOutsideNYC(false);
                } else {
                    // Outside NYC - default to Washington Square Park
                    console.log("Location outside NYC, defaulting to Washington Square Park");
                    setUserLocation(defaultLocation);
                    setOutsideNYC(true);

                    showWarning(
                        'Your location is outside NYC',
                        'Using Washington Square Park as default. SafeRouteNYC only supports navigation within New York City.',
                        'location_outside_nyc'
                    );
                }
            } catch (error) {
                console.warn("Geolocation error on initial load:", error);

                if (error.code === 1) {
                    // PERMISSION_DENIED
                    setLocationDenied(true);

                    showWarning(
                        'Location access denied',
                        'Using Washington Square Park as default location. To use your current location, please enable location services.',
                        'location_permission_denied'
                    );
                } else {
                    showWarning(
                        'Could not determine your location',
                        error.message || 'Unknown error getting location',
                        'location_error'
                    );
                }

                // Use Washington Square Park as default location
                setUserLocation(defaultLocation);
            } finally {
                setIsGettingLocation(false);
            }
        };

        getUserLocationOnLoad();
    }, [hasExplicitCoordinates, showWarning]); // Only run on initial mount and if no explicit coordinates

    // Get user location when explicitly requested through useCurrentLocation
    useEffect(() => {
        if (
            typeof window === "undefined" ||
            !useCurrentLocation || 
            hasExplicitCoordinates
        ) {
            return;
        }

        const getUserLocation = async () => {
            setIsGettingLocation(true);
            console.log("Getting user location due to useCurrentLocation flag...");

            try {
                if (!navigator.geolocation) {
                    throw new Error("Geolocation not available");
                }

                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0,
                    });

                    // Also set a timeout
                    setTimeout(() => {
                        reject(new Error("Geolocation timeout"));
                    }, 5000);
                });

                console.log("Got user location:", position.coords);

                // Check if location is within NYC bounds
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                if (isWithinNYC([lat, lng])) {
                    // Location is within NYC
                    setUserLocation([lat, lng]);
                    setOutsideNYC(false);
                } else {
                    // Outside NYC - default to Washington Square Park
                    console.log("Location outside NYC, defaulting to Washington Square Park");
                    setUserLocation(defaultLocation);
                    setOutsideNYC(true);

                    showWarning(
                        'Your location is outside NYC',
                        'Using Washington Square Park as default. SafeRouteNYC only supports navigation within New York City.',
                        'location_outside_nyc'
                    );
                }
            } catch (error) {
                console.warn("Geolocation error:", error);

                if (error.code === 1) {
                    // PERMISSION_DENIED
                    setLocationDenied(true);

                    showWarning(
                        'Location access denied',
                        'Using Washington Square Park as default location. To use your current location, please enable location services.',
                        'location_permission_denied'
                    );
                } else {
                    showWarning(
                        'Could not determine your location',
                        error.message || 'Unknown error getting location',
                        'location_error'
                    );
                }

                // Use Washington Square Park as default location
                setUserLocation(defaultLocation);
            } finally {
                setIsGettingLocation(false);
            }
        };

        getUserLocation();
    }, [useCurrentLocation, hasExplicitCoordinates, showWarning]);

    // If we don't have a location yet and no explicit coordinates, use default
    useEffect(() => {
        if (!userLocation && !isGettingLocation && !hasExplicitCoordinates && initialLocationAttemptRef.current) {
            console.log("No location set, using default location");
            setUserLocation(defaultLocation);
        }
    }, [userLocation, isGettingLocation, hasExplicitCoordinates]);

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

        console.log("Initializing map with location:", userLocation);

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

            // Add tile layer
            L.tileLayer(
                `https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
                {
                    attribution:
                        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
                    maxZoom: 18,
                    minZoom: 11,
                    id: "mapbox/streets-v11",
                    tileSize: 512,
                    zoomOffset: -1,
                    accessToken: mapboxToken,
                }
            ).addTo(map);

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
                zIndexOffset: 1000,
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
            locateButton.style.zIndex = "1000";

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
                'Could not initialize map',
                error.message || 'Unknown error initializing map',
                'map_initialization_error'
            );
        }
    }, [userLocation, mapboxToken, showError]);

    // Heatmap layer
    useEffect(() => {
        if (!mapInstanceRef.current || !mapLoaded || !heatmapDataLoaded) return;

        const map = mapInstanceRef.current;

        if (!heatLayerRef.current) {
            heatLayerRef.current = L.heatLayer(heatmapPoints, {
                radius: 25,
                blur: 15,
                maxZoom: 20,
                max: 1,
                minOpacity: 0.6,
                gradient: {
                    0.2: "#1e3a8a",
                    0.4: "#1d4ed8",
                    0.6: "#dc2626",
                    0.8: "#991b1b",
                    1.0: "#7f1d1d",
                },
            });
        }

        if (showHeatmap) {
            heatLayerRef.current.addTo(map);
        } else {
            map.removeLayer(heatLayerRef.current);
        }
    }, [mapLoaded, showHeatmap]);

    // Fetch route when coordinates change
    useEffect(() => {
        if (mapLoaded && departureCoords && destinationCoords) {
            // Get actual departure coordinates (user location if using current location, or provided departure coords)
            const actualDepartureCoords = useCurrentLocation ? userLocation : departureCoords;
            
            if (actualDepartureCoords) {
                fetchRouteData(actualDepartureCoords, destinationCoords);
            }
        }
    }, [mapLoaded, departureCoords, destinationCoords, userLocation, useCurrentLocation]);

    // Function to format duration from seconds to minutes/hours
    const formatDuration = (seconds) => {
        if (seconds < 60) return `${seconds} sec`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours} hr ${minutes} min`;
    };

    // Function to format distance
    const formatDistance = (meters) => {
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${(meters / 1000).toFixed(1)} km`;
    };

    // Function to fetch route data from your Django API
    const fetchRouteData = async (departure, destination) => {
        if (!departure || !destination) {
            return;
        }

        setIsLoadingRoute(true);
        setMapCriticalError(null); // Clear any previous errors

        try {
            // Prepare the request data for your Django API
            const requestData = {
                departure: departure,
                destination: destination,
                save_route: false // Don't save for testing
            };

            // Make API call
            console.log("Fetching route with:", requestData);
            const response = await apiPost('get-route/', requestData);
            console.log("API response:", response);

            // Extract route summary for display
            const routeInfo = extractRouteSummary(response);
            
            // Enhance turn instructions by adding missing street names
            if (routeInfo.initial && routeInfo.initial.instructions) {
                routeInfo.initial.instructions = enhanceTurnInstructions(routeInfo.initial.instructions);
            }
            if (routeInfo.safer && routeInfo.safer.instructions) {
                routeInfo.safer.instructions = enhanceTurnInstructions(routeInfo.safer.instructions);
            }
            
            setRouteDetails(routeInfo);

            // Display the route on the map
            displayRoute(response);

            // Show success notification
            showSuccess(
                'Route calculated successfully',
                null,
                'route_found'
            );
        } catch (error) {
            console.error("Error fetching route:", error);

            showError(
                'Could not calculate route',
                error.message || 'Failed to get route. Please try again.',
                'route_fetch_error'
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

        markersRef.current.forEach(marker => {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        });
        markersRef.current = [];

        // Get route coordinates using the imported utility function
        const initialRouteCoords = extractCoordinates(routeData.initial_route, 'ors');
        const saferRouteCoords = routeData.safer_route ? 
            extractCoordinates(routeData.safer_route, 'mapbox') : null;

        if (initialRouteCoords.length === 0 && (!saferRouteCoords || saferRouteCoords.length === 0)) {
            showError(
                'Could not display route',
                'No valid route coordinates found in the response',
                'route_coordinates_error'
            );
            return;
        }

        // Get departure and destination coordinates from the route
        // Use initial route if available, otherwise use safer route
        const routeToUse = initialRouteCoords.length > 0 ? initialRouteCoords : saferRouteCoords;
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
        const departureMarker = L.marker(departureCoord, { icon: departureIcon }).addTo(map);
        const destinationMarker = L.marker(destinationCoord, { icon: destinationIcon }).addTo(map);

        markersRef.current.push(departureMarker, destinationMarker);

        // Create route layer with both routes if available
        const routeLayers = [];

        // Initial route (ORS)
        if (initialRouteCoords.length > 0) {
            const initialRoute = L.polyline(initialRouteCoords, {
                color: '#3B82F6', // Blue for initial route
                weight: 5,
                opacity: activeRoute === 'initial' ? 0.9 : 0.4,
                dashArray: activeRoute === 'initial' ? null : '5, 5',
                lineCap: 'round'
            });

            initialRoute.on('click', () => {
                setActiveRoute('initial');
            });

            routeLayers.push(initialRoute);
        }

        // Safer route (Mapbox)
        if (saferRouteCoords && saferRouteCoords.length > 0) {
            const saferRoute = L.polyline(saferRouteCoords, {
                color: '#10B981', // Green for safer route
                weight: 5,
                opacity: activeRoute === 'safer' ? 0.9 : 0.4,
                dashArray: activeRoute === 'safer' ? null : '5, 5',
                lineCap: 'round'
            });

            saferRoute.on('click', () => {
                setActiveRoute('safer');
            });

            routeLayers.push(saferRoute);
        }

        // Add routes to map
        routeLayerRef.current = L.layerGroup(routeLayers).addTo(map);

        // Add a legend
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'bg-white shadow-md rounded-md p-2');
            div.innerHTML = `
                <div class="text-sm font-medium">Routes</div>
                <div class="flex items-center mt-1">
                  <div class="w-4 h-1 bg-blue-500 mr-2"></div>
                  <div class="text-xs">ORS Route</div>
                </div>
                ${saferRouteCoords ? `
                <div class="flex items-center mt-1">
                  <div class="w-4 h-1 bg-green-500 mr-2"></div>
                  <div class="text-xs">Mapbox Route</div>
                </div>
                ` : ''}
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
                            'Your location is outside NYC',
                            'Routes in SafeRouteNYC are optimized for NYC area.',
                            'location_outside_nyc'
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
                        'Location found',
                        'Successfully updated your location',
                        'location_found'
                    );
                },
                (error) => {
                    console.warn("Geolocation retry error:", error.message);
                    if (error.code === 1) {
                        // PERMISSION_DENIED
                        setLocationDenied(true);

                        showWarning(
                            'Location access denied',
                            'Please enable location in your browser settings to use this feature',
                            'location_permission_denied'
                        );
                    } else {
                        showError(
                            'Location error',
                            error.message || 'Could not get your location',
                            'location_error'
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
                'Geolocation not supported',
                'Your browser does not support geolocation',
                'location_not_supported'
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
            routeLayerRef.current.eachLayer(layer => {
                if (layer instanceof L.Polyline) {
                    // Check if this is the initial or safer route based on color
                    const isInitialRoute = layer.options.color === '#3B82F6';
                    const isSaferRoute = layer.options.color === '#10B981';

                    if (isInitialRoute) {
                        layer.setStyle({
                            opacity: activeRoute === 'initial' ? 0.9 : 0.4,
                            dashArray: activeRoute === 'initial' ? null : '5, 5'
                        });
                    } else if (isSaferRoute) {
                        layer.setStyle({
                            opacity: activeRoute === 'safer' ? 0.9 : 0.4,
                            dashArray: activeRoute === 'safer' ? null : '5, 5'
                        });
                    }
                }
            });
        } catch (e) {
            console.warn("Error updating route styles:", e);

            showWarning(
                'Route display issue',
                'Could not update route styles. The route may not display correctly.',
                'route_style_error'
            );

            // Fallback to re-creating the routes if direct style update fails
            if (map && routeLayerRef.current) {
                map.removeLayer(routeLayerRef.current);

                if (routeDetails) {
                    displayRoute({
                        initial_route: routeDetails.initial_route,
                        safer_route: routeDetails.safer_route
                    });
                }
            }
        }
    }, [activeRoute, showWarning]);

    return (
        <div className="space-y-4">
            <div className="relative w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
                {/* Heatmap Toggle */}
                <div className="absolute bottom-4 left-4 z-[1000] bg-white p-2 rounded-md shadow-md flex items-center gap-2">
                    <label
                        className="text-sm font-medium text-gray-700"
                        htmlFor="heatmap-switch"
                    >
                        Crime Heatmap
                    </label>
                    <Switch.Root
                        id="heatmap-switch"
                        checked={showHeatmap}
                        onCheckedChange={setShowHeatmap}
                        className={`${showHeatmap ? "bg-indigo-600" : "bg-gray-200"
                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                    >
                        <Switch.Thumb
                            className={`${showHeatmap ? "translate-x-6" : "translate-x-1"
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                    </Switch.Root>
                </div>

                {/* Display critical error in the UI if map can't load */}
                {mapCriticalError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
                            <div className="text-red-500 mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Map Error</h3>
                            <p className="text-gray-600 mb-4">{mapCriticalError}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                )}

                <div ref={mapContainerRef} className="w-full h-full" />

                {isGettingLocation && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-40">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-2"></div>
                            <div className="text-lg font-semibold text-gray-700">
                                Getting your location...
                            </div>
                        </div>
                    </div>
                )}

                {isLoadingRoute && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-40">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-2"></div>
                            <div className="text-lg font-semibold text-gray-700">
                                Calculating safe route...
                            </div>
                        </div>
                    </div>
                )}

                {!isGettingLocation && !mapLoaded && !mapCriticalError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-40">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-2"></div>
                            <div className="text-lg font-semibold text-gray-700">
                                Loading map...
                            </div>
                        </div>
                    </div>
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
            {routeDetails && (
                <Card className="w-full">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">Route Information</CardTitle>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={activeRoute === 'initial' ? 'default' : 'outline'}
                                    className="h-8 px-3 py-1"
                                    onClick={() => setActiveRoute('initial')}
                                    disabled={!routeDetails.initial}
                                >
                                    Standard Route
                                </Button>
                                <Button
                                    variant={activeRoute === 'safer' ? 'default' : 'outline'}
                                    className="h-8 px-3 py-1"
                                    onClick={() => setActiveRoute('safer')}
                                    disabled={!routeDetails.safer}
                                >
                                    Safer Route
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Route summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <div className="flex items-center mb-1">
                                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                        <span className="text-sm font-medium">Duration</span>
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {routeDetails[activeRoute] ? formatDuration(routeDetails[activeRoute].duration) : '--'}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <div className="flex items-center mb-1">
                                        <Navigation className="h-4 w-4 mr-2 text-gray-500" />
                                        <span className="text-sm font-medium">Distance</span>
                                    </div>
                                    <div className="text-lg font-semibold">
                                        {routeDetails[activeRoute] ? formatDistance(routeDetails[activeRoute].distance) : '--'}
                                    </div>
                                </div>
                            </div>

                            {/* Turn-by-turn instructions */}
                            <div>
                                <button
                                    onClick={() => setShowInstructions(!showInstructions)}
                                    className="flex w-full items-center justify-between p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                >
                                    <span className="font-medium">Turn-by-turn directions</span>
                                    {showInstructions ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </button>

                                {showInstructions && routeDetails[activeRoute]?.instructions && (
                                    <div className="mt-2 border rounded-md divide-y max-h-80 overflow-y-auto">
                                        {routeDetails[activeRoute].instructions.map((step, index) => (
                                            <div key={index} className="p-3 flex items-start hover:bg-gray-50">
                                                <CornerDownRight className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-gray-500" />
                                                <div className="flex-1">
                                                    <div className="text-sm">{step.instruction}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {formatDistance(step.distance)} · {formatDuration(step.duration)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {showInstructions && (!routeDetails[activeRoute]?.instructions || routeDetails[activeRoute].instructions.length === 0) && (
                                    <div className="mt-2 p-4 bg-gray-50 rounded-md text-center text-gray-500">
                                        No turn-by-turn directions available for this route.
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default RoutingMapComponent;