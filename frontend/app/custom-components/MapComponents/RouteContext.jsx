"use client";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import {
  useUserLocationWithNYCCheck,
  isWithinNYC,
  NYC_BOUNDS,
} from "@/hooks/location";

const RouteContext = createContext();

export function RouteProvider({ children }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // State for map and routing
  const [mapboxToken, setMapboxToken] = useState("");
  const [departureCoords, setDepartureCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routeCalculated, setRouteCalculated] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // State for tracking if we are using the current location
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  // Route key for forcing recalculation
  const [routeKey, setRouteKey] = useState(1);

  // URL parameters handling
  const [initialDepartureCoords, setInitialDepartureCoords] = useState(null);
  const [initialDestinationCoords, setInitialDestinationCoords] =
    useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [readyToRender, setReadyToRender] = useState(false);

  // Store location display names
  const [departureDisplayName, setDepartureDisplayName] = useState("");
  const [destinationDisplayName, setDestinationDisplayName] = useState("");

  // Get location state
  const { showError, showWarning, showSuccess } = useNotification();
  const {
    userLocation,
    isLocationValid,
    isLocationAvailable,
    isGettingLocation,
    locationDenied,
    locationError,
    fetchUserLocation,
  } = useUserLocationWithNYCCheck();

  // show location form
  const [showLocationSearchForm, setShowLocationSearchForm] = useState(true);

  // Derived state
  const canUseCurrentLocation = isLocationValid && isLocationAvailable;

  // Show location errors in notifications
  useEffect(() => {
    if (locationError && !locationDenied) {
      showWarning("Location issue", locationError);
    }
  }, [locationError, locationDenied, showWarning]);

  // Load Mapbox token
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "";
    if (!token) {
      showError(
        "Configuration error",
        "Missing Mapbox API key. Please set NEXT_PUBLIC_MAPBOX_API_KEY in your .env.local file."
      );
    } else {
      setMapboxToken(token);
      setReadyToRender(true);
    }
  }, [showError]);

  // Load coordinates from URL parameters WITHOUT calculating a route
  useEffect(() => {
    if (!initialLoad) return;

    // Get coordinates from URL parameters
    const depLat = searchParams.get("dep_lat");
    const depLon = searchParams.get("dep_lon");
    const destLat = searchParams.get("dest_lat");
    const destLon = searchParams.get("dest_lon");
    const useCurrentParam = searchParams.get("use_current");

    let validParams = false;

    // Handle use_current parameter
    if (useCurrentParam === "true") {
      if (canUseCurrentLocation) {
        setUseCurrentLocation(true);
        // We DON'T set departureCoords here to prevent automatic route calculation
        validParams = true;
      }
    }

    // Handle explicit coordinates
    if (depLat && depLon && destLat && destLon) {
      const departure = [parseFloat(depLat), parseFloat(depLon)];
      const destination = [parseFloat(destLat), parseFloat(destLon)];

      // Validate coordinates are within NYC
      if (isWithinNYC(departure) && isWithinNYC(destination)) {
        // Store in initial coordinates for form population
        setInitialDepartureCoords(departure);
        setInitialDestinationCoords(destination);

        // But don't set actual departure/destination coordinates yet
        // This prevents automatic route calculation
        validParams = true;
      }
    }

    // If no valid parameters found, clear URL
    if (!validParams) {
      router.replace(pathname);
    }

    setInitialLoad(false);
  }, [
    initialLoad,
    searchParams,
    router,
    pathname,
    canUseCurrentLocation,
    userLocation,
  ]);

  // Update departure coords when using current location
  useEffect(() => {
    if (useCurrentLocation && userLocation && canUseCurrentLocation) {
      // Only update departure coordinates if we're explicitly using current location
      // Don't do this for URL parameters on initial load
      if (routeCalculated) {
        setDepartureCoords(userLocation);
      }
    }
  }, [
    useCurrentLocation,
    userLocation,
    canUseCurrentLocation,
    routeCalculated,
  ]);

  useEffect(() => {
    if (routeCalculated && !isCalculatingRoute && !isLoading) {
      setShowLocationSearchForm(false);
    }
  }, [routeCalculated, isCalculatingRoute, isLoading]);

  // Centralized validation function
  const validateForm = (
    departure,
    departureCoordinates,
    destination,
    destinationCoordinates,
    formUseCurrentLocation
  ) => {
    if (formUseCurrentLocation) {
      if (!canUseCurrentLocation || !userLocation) {
        return {
          isValid: false,
          error:
            "Cannot use current location. Your location is unavailable or outside NYC boundaries.",
        };
      }
    } else if (!departureCoordinates) {
      return {
        isValid: false,
        error: "Please select a departure location from the suggestions",
      };
    }

    if (!destinationCoordinates) {
      return {
        isValid: false,
        error: "Please select a destination from the suggestions",
      };
    }

    return { isValid: true };
  };

  // Handle search form submission
  const handleSearch = async ({
    departure,
    departureCoordinates,
    destination,
    destinationCoordinates,
    useCurrentLocation: formUseCurrentLocation,
  }) => {
    if (!mapboxToken) {
      showError(
        "Configuration error",
        "Missing Mapbox API key. The map cannot be displayed."
      );
      return;
    }

    setIsLoading(true);
    setRouteCalculated(false);

    try {
      // Validate form inputs
      const validation = validateForm(
        departure,
        departureCoordinates,
        destination,
        destinationCoordinates,
        formUseCurrentLocation
      );

      if (!validation.isValid) {
        showWarning("Validation Error", validation.error);
        setIsLoading(false);
        return;
      }

      // Save the display names from the form
      if (!formUseCurrentLocation) {
        setDepartureDisplayName(departure);
      }
      setDestinationDisplayName(destination);

      // Update state based on form input
      setUseCurrentLocation(formUseCurrentLocation);

      // Clear existing coordinates first to trigger proper rerender
      setDepartureCoords(null);
      setDestinationCoords(null);

      // Update with new coordinates
      setTimeout(() => {
        if (formUseCurrentLocation) {
          // If using current location, set departure to user's current location
          setDepartureCoords(userLocation);
        } else {
          // Otherwise use the coordinates from the form
          setDepartureCoords(departureCoordinates);
        }

        // Always set destination coordinates
        setDestinationCoords(destinationCoordinates);

        // Force route recalculation
        setRouteKey((prev) => prev + 1);

        setIsLoading(false);

        // Update URL
        const params = new URLSearchParams();
        if (!formUseCurrentLocation && departureCoordinates) {
          params.set("dep_lat", departureCoordinates[0]);
          params.set("dep_lon", departureCoordinates[1]);
        } else if (formUseCurrentLocation) {
          params.set("use_current", "true");
        }

        if (destinationCoordinates) {
          params.set("dest_lat", destinationCoordinates[0]);
          params.set("dest_lon", destinationCoordinates[1]);
        }

        router.replace(`${pathname}?${params.toString()}`);

        showSuccess(
          "Route planning started",
          `Planning route from ${
            formUseCurrentLocation ? "your current location" : departure
          } to ${destination}`
        );
      }, 100);
    } catch (error) {
      console.error("Search error:", error);
      setIsLoading(false);
      setRouteCalculated(false);
      showError(
        "Route planning failed",
        error.message || "Error processing locations. Please try again."
      );
    }
  };

  // Reset route calculation state
  const resetRouteCalculation = () => {
    setRouteCalculated(false);
    setRouteKey((prev) => prev + 1);
  };

  // Format coordinates for display
  const formatCoords = ([lat, lng]) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  const value = {
    // Location state
    userLocation,
    isLocationValid,
    isLocationAvailable,
    isGettingLocation,
    locationDenied,
    locationError,
    fetchUserLocation,
    canUseCurrentLocation,

    // Route state
    mapboxToken,
    departureCoords,
    setDepartureCoords,
    destinationCoords,
    setDestinationCoords,
    isLoading,
    setIsLoading,
    routeCalculated,
    setRouteCalculated,
    useCurrentLocation,
    setUseCurrentLocation,
    routeKey,
    initialDepartureCoords,
    initialDestinationCoords,
    readyToRender,
    isCalculatingRoute,
    setIsCalculatingRoute,

    // showForm
    showLocationSearchForm,
    setShowLocationSearchForm,

    // Display names for locations
    departureDisplayName,
    setDepartureDisplayName,
    destinationDisplayName,
    setDestinationDisplayName,

    // NYC bounds and validation
    NYC_BOUNDS,
    isWithinNYC,
    formatCoords,

    // Form validation
    validateForm,

    // Actions
    handleSearch,
    resetRouteCalculation,
  };

  return (
    <RouteContext.Provider value={value}>{children}</RouteContext.Provider>
  );
}

export function useRoute() {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error("useRoute must be used within a RouteProvider");
  }
  return context;
}
