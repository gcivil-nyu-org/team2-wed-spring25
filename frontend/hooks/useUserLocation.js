import React, { useState, useEffect, useRef } from "react";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";

const useUserLocation = ({
  departureCoords,
  mapInitializedRef,
  mapInstanceRef,
  useCurrentLocation = false // Add default value
}) => {
  const { showWarning, showSuccess, showError } = useNotification(); // Added missing notification functions
  const [outsideNYC, setOutsideNYC] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
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
    if (
      departureCoords &&
      Array.isArray(departureCoords) &&
      !hasExplicitCoordinates
    ) {

      // Check if coordinates are within NYC
      if (isWithinNYC(departureCoords)) {
        setUserLocation(departureCoords);
        setHasExplicitCoordinates(true);
        setOutsideNYC(false);
      } else {
        showWarning(
          "Location outside NYC",
          "The selected departure location is outside NYC. Routes are limited to NYC area.",
          "location_outside_nyc"
        );
        // Still use the coordinates even if outside NYC
        setUserLocation(departureCoords);
        setHasExplicitCoordinates(true);
        setOutsideNYC(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departureCoords, hasExplicitCoordinates, showWarning]);

  // Get user location on initial load
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      userLocation ||
      initialLocationAttemptRef.current ||
      hasExplicitCoordinates
    ) {
      return;
    }

    initialLocationAttemptRef.current = true;

    const getUserLocationOnLoad = async () => {
      setIsGettingLocation(true);

      try {
        if (!navigator.geolocation) {
          throw new Error("Geolocation not available");
        }

        const position = await new Promise((resolve, reject) => {
          // Create a timeout ID that we can clear if geolocation succeeds
          const timeoutId = setTimeout(() => {
            reject(new Error("Geolocation timeout"));
          }, 10000); // Increase timeout to 10 seconds

          navigator.geolocation.getCurrentPosition(
            (position) => {
              clearTimeout(timeoutId); // Clear the timeout if we get a position
              resolve(position);
            },
            (error) => {
              clearTimeout(timeoutId); // Clear the timeout on error too
              reject(error);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000, // Increase timeout to 10 seconds
              maximumAge: 0,
            }
          );
        });


        // Check if location is within NYC bounds
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (isWithinNYC([lat, lng])) {
          // Location is within NYC
          setUserLocation([lat, lng]);
          setOutsideNYC(false);
        } else {
          setUserLocation(defaultLocation);
          setOutsideNYC(true);

          showWarning(
            "Your location is outside NYC",
            "Using Washington Square Park as default. SafeRouteNYC only supports navigation within New York City.",
            "location_outside_nyc"
          );
        }
      } catch (error) {
        console.warn("Geolocation error on initial load:", error);

        if (error.code === 1) {
          // PERMISSION_DENIED
          setLocationDenied(true);

          showWarning(
            "Location access denied",
            "Using Washington Square Park as default location. To use your current location, please enable location services.",
            "location_permission_denied"
          );
        } else {
          showWarning(
            "Could not determine your location",
            error.message || "Unknown error getting location",
            "location_error"
          );
        }

        // Use Washington Square Park as default location
        setUserLocation(defaultLocation);
      } finally {
        setIsGettingLocation(false);
      }
    };

    getUserLocationOnLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      try {
        if (!navigator.geolocation) {
          throw new Error("Geolocation not available");
        }

        const position = await new Promise((resolve, reject) => {
          // Create a timeout ID that we can clear if geolocation succeeds
          const timeoutId = setTimeout(() => {
            reject(new Error("Geolocation timeout"));
          }, 10000); // Increase timeout to 10 seconds

          navigator.geolocation.getCurrentPosition(
            (position) => {
              clearTimeout(timeoutId); // Clear the timeout if we get a position
              resolve(position);
            },
            (error) => {
              clearTimeout(timeoutId); // Clear the timeout on error too
              reject(error);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000, // Increase timeout to 10 seconds
              maximumAge: 0,
            }
          );
        });


        // Check if location is within NYC bounds
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (isWithinNYC([lat, lng])) {
          // Location is within NYC
          setUserLocation([lat, lng]);
          setOutsideNYC(false);
        } else {
          setUserLocation(defaultLocation);
          setOutsideNYC(true);

          showWarning(
            "Your location is outside NYC",
            "Using Washington Square Park as default. SafeRouteNYC only supports navigation within New York City.",
            "location_outside_nyc"
          );
        }
      } catch (error) {
        console.warn("Geolocation error:", error);

        if (error.code === 1) {
          // PERMISSION_DENIED
          setLocationDenied(true);

          showWarning(
            "Location access denied",
            "Using Washington Square Park as default location. To use your current location, please enable location services.",
            "location_permission_denied"
          );
        } else {
          showWarning(
            "Could not determine your location",
            error.message || "Unknown error getting location",
            "location_error"
          );
        }

        // Use Washington Square Park as default location
        setUserLocation(defaultLocation);
      } finally {
        setIsGettingLocation(false);
      }
    };

    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCurrentLocation, hasExplicitCoordinates, showWarning]);

  // If we don't have a location yet and no explicit coordinates, use default
  useEffect(() => {
    if (
      !userLocation &&
      !isGettingLocation &&
      !hasExplicitCoordinates &&
      initialLocationAttemptRef.current
    ) {
      setUserLocation(defaultLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, isGettingLocation, hasExplicitCoordinates]);

  // Function to retry getting location
  const retryLocation = () => {
    setIsGettingLocation(true);
    setLocationDenied(false);
    setHasExplicitCoordinates(false); // Reset this flag to try geolocation again

    if (navigator.geolocation) {
      // Create a timeout that gets cleared on success
      const timeoutId = setTimeout(() => {
        setIsGettingLocation(false);
        showWarning(
          "Location timeout",
          "Getting your location took too long. Please try again.",
          "location_timeout"
        );
        setUserLocation(defaultLocation);
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId); // Clear the timeout
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
          clearTimeout(timeoutId); // Clear the timeout
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
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
  }, [mapInstanceRef, mapInitializedRef]);

  return {
    userLocation,
    isGettingLocation,
    locationDenied,
    outsideNYC,
    retryLocation
  };
};

export default useUserLocation;