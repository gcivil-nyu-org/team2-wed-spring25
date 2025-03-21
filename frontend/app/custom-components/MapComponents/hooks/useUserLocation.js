import React, { useState, useEffect } from "react";
import { useNotification } from "../../ToastComponent/NotificationContext";

const useUserLocation = () => {
  const { showWarning } = useNotification();
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
      console.log("Setting explicit departure coordinates:", departureCoords);

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
          console.log(
            "Location outside NYC, defaulting to Washington Square Park"
          );
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
          console.log(
            "Location outside NYC, defaulting to Washington Square Park"
          );
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
      console.log("No location set, using default location");
      setUserLocation(defaultLocation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, isGettingLocation, hasExplicitCoordinates]);

  return <div>useUserLocation</div>;
};

export default useUserLocation;
