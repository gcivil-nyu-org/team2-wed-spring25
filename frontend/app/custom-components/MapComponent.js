// app/custom-components/MapComponent.js
"use client";

import React, { useEffect, useRef, useState } from "react";
// Import Leaflet statically - this works better in Next.js
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Import routing machine
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet.heat";
import * as Switch from "@radix-ui/react-switch";

const MapComponent = ({ mapboxToken, startCoords, endCoords }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routingControlRef = useRef(null);
  const mapInitializedRef = useRef(false);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [error, setError] = useState(null);

  // Add state for heatmap
  const [showHeatmap, setShowHeatmap] = useState(true);
  const heatLayerRef = useRef(null);

  // Add heatmap data
  const heatmapPoints = [
    [40.7308, -73.9974, 1.0], // Washington Square Park (increased intensity)
    [40.7484, -73.9857, 0.9], // Times Square
    [40.7587, -73.9877, 0.85], // Bryant Park
    [40.7794, -73.9632, 0.95], // Central Park
    [40.7127, -74.006, 0.7], // Financial District
    [40.7527, -73.9772, 0.75], // Midtown East
    [40.7831, -73.9653, 0.6], // Upper East Side
    [40.7618, -73.9708, 0.85], // Rockefeller Center
    [40.7411, -74.0046, 0.7], // Chelsea
    [40.7352, -73.989, 0.8], // Union Square
  ];

  // Fix Leaflet icon issues on load
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Fix Leaflet icon issues
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    // Add CSS for pulsing effect
    if (!document.getElementById("map-pulse-style")) {
      const pulseStyle = document.createElement("style");
      pulseStyle.id = "map-pulse-style";
      pulseStyle.innerHTML = `
        @keyframes pulse-ring {
          0% {
            transform: scale(0.5);
            opacity: 0.8;
          }
          80%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .user-location-pulse {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
        }
        
        .user-location-dot {
          background-color: #4F46E5;
          width: 23px;
          height: 23px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        
        .user-location-pulse::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          background: rgba(79, 70, 229, 0.4);
          border-radius: 50%;
          z-index: -1;
          animation: pulse-ring 2s infinite;
        }
      `;
      document.head.appendChild(pulseStyle);
    }
  }, []);

  // Get user location or use provided coords
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      userLocation ||
      mapInitializedRef.current
    )
      return;

    const getUserLocation = async () => {
      // If start coords provided, use those
      if (startCoords) {
        console.log("Using provided startCoords:", startCoords);
        setUserLocation(startCoords);
        return;
      }

      setIsGettingLocation(true);
      console.log("Getting user location...");

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
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      } catch (error) {
        console.warn("Geolocation error:", error);

        if (error.code === 1) {
          // PERMISSION_DENIED
          setLocationDenied(true);
        }

        // Use default location
        setUserLocation([40.7128, -74.006]); // NYC default
      } finally {
        setIsGettingLocation(false);
      }
    };

    getUserLocation();
  }, [startCoords, userLocation]);

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
        maxBoundsViscosity: 1.0, // Makes the bounds "harder" to scroll past
        minZoom: 11, // Restrict zoom out level
        maxZoom: 18, // Restrict zoom in level
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
          bounds: [
            [40.4957, -74.2557], // Southwest coordinates (Staten Island)
            [40.9176, -73.7002], // Northeast coordinates (Bronx),
          ], 
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
        map.setView(userLocation, 15);

        if (map._userMarker) {
          map._userMarker.setOpacity(0.5);
          setTimeout(() => {
            map._userMarker.setOpacity(1);
          }, 500);
        }
      });

      // Mark map as initialized
      console.log("Map initialized successfully");
      setMapLoaded(true);
      mapInitializedRef.current = true;

      // Set up routing if we have endpoints
      if (endCoords) {
        setupRouting();
      }
    } catch (error) {
      console.error("Error initializing map:", error);
      setError("Error creating map. Please refresh the page.");
      mapInitializedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, mapboxToken]);

  // Set up routing when endpoints change
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !userLocation || !endCoords) {
      return;
    }

    console.log("Setting up routing with endpoints:", {
      start: userLocation,
      end: endCoords,
    });
    setupRouting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, userLocation, endCoords]);

  // Update when start coordinates change
  useEffect(() => {
    if (!startCoords || !mapInstanceRef.current) return;

    console.log("Start coordinates changed:", startCoords);
    setUserLocation(startCoords);

    // Update user marker
    if (mapInstanceRef.current._userMarker) {
      mapInstanceRef.current._userMarker.setLatLng(startCoords);

      // Only update view if we don't have routing
      if (!endCoords) {
        mapInstanceRef.current.setView(startCoords, 15);
      }
    }
  }, [startCoords, endCoords]);

  // Setup routing function
  const setupRouting = () => {
    if (!mapInstanceRef.current || !userLocation || !endCoords) {
      console.log("Cannot setup routing - missing requirements");
      return;
    }

    console.log("Setting up routing from", userLocation, "to", endCoords);

    try {
      // Clean up existing routing
      if (routingControlRef.current) {
        try {
          mapInstanceRef.current.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        } catch (e) {
          console.warn("Error removing routing:", e);
        }
      }

      // Create custom marker icons
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

      // Custom marker creation function
      const createCustomMarker = function (i, waypoint, n) {
        const isStart = i === 0;
        return L.marker(waypoint.latLng, {
          draggable: true,
          icon: isStart ? userIcon : destinationIcon,
        });
      };

      // Verify routing machine is available and mapbox method exists
      if (!L.Routing || !L.Routing.mapbox) {
        console.error("Routing Machine or mapbox method not available");
        setError(
          "Routing libraries not properly loaded. Please refresh the page."
        );
        return;
      }

      // Create Mapbox router
      const router = L.Routing.mapbox(mapboxToken, {
        profile: "mapbox/walking",
        steps: true,
        language: "en",
      });

      // Add delay to ensure cleanup is complete
      setTimeout(() => {
        try {
          // Create routing control
          console.log("Creating routing control");
          const control = L.Routing.control({
            waypoints: [
              L.latLng(userLocation[0], userLocation[1]),
              L.latLng(endCoords[0], endCoords[1]),
            ],
            router: router,
            createMarker: createCustomMarker,
            lineOptions: {
              styles: [{ color: "#6366F1", opacity: 0.8, weight: 6 }],
              extendToWaypoints: true,
              missingRouteTolerance: 0,
            },
            routeWhileDragging: true,
            showAlternatives: true,
            addWaypoints: false,
            fitSelectedRoutes: true,
            collapsible: true,
          });

          // Handle routing errors
          control.on("routingerror", function (e) {
            console.error("Routing error:", e.error);

            // Try OSRM as fallback
            try {
              console.log("Trying OSRM as fallback");
              const osrmRouter = L.Routing.osrmv1({
                serviceUrl: "https://router.project-osrm.org/route/v1",
                profile: "foot",
              });

              control.getRouter = function () {
                return osrmRouter;
              };
              control.route();
            } catch (fallbackError) {
              console.error("Fallback routing error:", fallbackError);
              setError(
                "Unable to calculate a route. Please try different locations."
              );
            }
          });

          // Add control to map
          control.addTo(mapInstanceRef.current);
          routingControlRef.current = control;

          // Fit bounds after a delay
          setTimeout(() => {
            try {
              const bounds = L.latLngBounds([
                L.latLng(userLocation[0], userLocation[1]),
                L.latLng(endCoords[0], endCoords[1]),
              ]);
              mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
            } catch (e) {
              console.warn("Error fitting bounds:", e);
            }
          }, 500);

          console.log("Routing setup complete");
        } catch (error) {
          console.error("Error creating routing control:", error);
          setError("Failed to calculate route. Please try again.");
        }
      }, 300);
    } catch (error) {
      console.error("Error in routing setup:", error);
      setError("Failed to set up routing. Please try again later.");
    }
  };

  // Function to retry getting location
  const retryLocation = () => {
    setIsGettingLocation(true);
    setLocationDenied(false);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Got user location on retry:", position.coords);
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setIsGettingLocation(false);

          // Update map view
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 15);

            // Update marker if it exists
            if (mapInstanceRef.current._userMarker) {
              mapInstanceRef.current._userMarker.setLatLng([
                latitude,
                longitude,
              ]);
            }
          }
        },
        (error) => {
          console.warn("Geolocation retry error:", error.message);
          if (error.code === 1) {
            // PERMISSION_DENIED
            setLocationDenied(true);
          }
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setIsGettingLocation(false);
    }
  };

  // Heatmap layer
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

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

    // Cleanup
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [mapLoaded, showHeatmap, heatmapPoints]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          // Clean up routing first
          if (routingControlRef.current) {
            try {
              mapInstanceRef.current.removeControl(routingControlRef.current);
              routingControlRef.current = null;
            } catch (e) {
              console.warn("Error removing routing control:", e);
            }
          }

          // Remove map
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
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
      {/* Heatmap Toggle */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white p-2 rounded-md shadow-md flex items-center gap-2">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="heatmap-switch"
        >
          Heatmap
        </label>
        <Switch.Root
          id="heatmap-switch"
          checked={showHeatmap}
          onCheckedChange={setShowHeatmap}
          className={`${
            showHeatmap ? "bg-indigo-600" : "bg-gray-200"
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
        >
          <Switch.Thumb
            className={`${
              showHeatmap ? "translate-x-6" : "translate-x-1"
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch.Root>
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 z-50">
          <div className="text-lg font-semibold text-red-700 p-4 bg-white rounded-md shadow-md">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Location permission notice */}
      {locationDenied && mapLoaded && !startCoords && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-100 p-3 z-40 m-2 rounded-md shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Location access denied.</span>{" "}
              We&apos;re using a default location.
            </p>
            <button
              onClick={retryLocation}
              className="ml-3 px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 focus:outline-none"
            >
              Allow Location
            </button>
          </div>
        </div>
      )}

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

      {!isGettingLocation && !mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-40">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-2"></div>
            <div className="text-lg font-semibold text-gray-700">
              Loading map...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
