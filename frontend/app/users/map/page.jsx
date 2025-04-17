"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import LocationSearchForm from "@/app/custom-components/LocationSearchForm";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useUserLocationWithNYCCheck, isWithinNYC} from "@/hooks/location";

// Dynamically import the map component with SSR disabled
const ClientOnlyMap = dynamic(
  () => import("@/app/custom-components/MapComponents/MapComponent.jsx"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] flex items-center justify-center bg-map-color rounded-lg">
        <div className="text-lg font-semibold">Loading map component...</div>
      </div>
    ),
  }
);

function DashboardContent() {
  // Routing related
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // State for map and routing
  const [mapboxToken, setMapboxToken] = useState("");
  const [departureCoords, setDepartureCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routeCalculated, setRouteCalculated] = useState(false);
  
  // Add state for tracking if we're using current location (for UI purposes)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  
  // URL parameters handling
  const [initialDepartureCoords, setInitialDepartureCoords] = useState(null);
  const [initialDestinationCoords, setInitialDestinationCoords] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [readyToRender, setReadyToRender] = useState(false);
  
  // Other state
  const { showError, showWarning, showSuccess } = useNotification();
  const containerRef = useRef(null);
  const [mapKey, setMapKey] = useState(1);

  // User location handling
  const {
    userLocation,
    isLocationValid,
    isLocationAvailable,
    isGettingLocation,
    locationDenied,
    locationError,
    fetchUserLocation
  } = useUserLocationWithNYCCheck();

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

  // When userLocation changes and we're using current location, update departure coords
  useEffect(() => {
    if (useCurrentLocation && userLocation && canUseCurrentLocation) {
      setDepartureCoords(userLocation);
    }
  }, [userLocation, useCurrentLocation, canUseCurrentLocation]);

  // Load coordinates from URL on initial render
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
      if (canUseCurrentLocation && userLocation) {
        setUseCurrentLocation(true);
        setDepartureCoords(userLocation); // Set departure to current location
        validParams = true;
      }
    }

    // Handle explicit coordinates
    if (depLat && depLon && destLat && destLon) {
      const departure = [parseFloat(depLat), parseFloat(depLon)];
      const destination = [parseFloat(destLat), parseFloat(destLon)];

      // Validate coordinates are within NYC
      if (isWithinNYC(departure) && isWithinNYC(destination)) {
        setInitialDepartureCoords(departure);
        setInitialDestinationCoords(destination);
        validParams = true;
      }
    }

    // If no valid parameters found, clear URL
    if (!validParams) {
      router.replace(pathname);
    }

    setInitialLoad(false);
  }, [initialLoad, searchParams, router, pathname, canUseCurrentLocation, userLocation]);

  // Handle search form submission
  const handleSearch = async ({
    departure,
    departureCoordinates,
    destination,
    destinationCoordinates,
    useCurrentLocation: formUseCurrentLocation,
  }) => {
    if (!mapboxToken) {
      showError("Configuration error", "Missing Mapbox API key. The map cannot be displayed.");
      return;
    }

    setIsLoading(true);
    setRouteCalculated(false);

    try {
      // Set the useCurrentLocation state for UI purposes
      setUseCurrentLocation(formUseCurrentLocation);
      
      // Clear existing values first
      setDepartureCoords(null);
      setDestinationCoords(null);
      
      // Validation
      if (formUseCurrentLocation) {
        if (!canUseCurrentLocation || !userLocation) {
          showWarning("Cannot use current location", "Your location is unavailable or outside NYC boundaries");
          setIsLoading(false);
          return;
        }
        // Set departure coordinates to user location
        setDepartureCoords(userLocation);
      } else if (!departureCoordinates) {
        showWarning("Departure location required", "Please select a departure location from the suggestions");
        setIsLoading(false);
        return;
      } else {
        // Set explicit departure coordinates
        setDepartureCoords(departureCoordinates);
      }

      if (!destinationCoordinates) {
        showWarning("Destination required", "Please select a destination from the suggestions");
        setIsLoading(false);
        return;
      } else {
        setDestinationCoords(destinationCoordinates);
      }

      // Update route state and URL with a slight delay to avoid UI glitches
      setTimeout(() => {
        setIsLoading(false);
        setRouteCalculated(true);

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
          `Planning route from ${formUseCurrentLocation ? "your current location" : departure} to ${destination}`
        );
      }, 100);
    } catch (error) {
      console.error("Search error:", error);
      setIsLoading(false);
      setRouteCalculated(false);
      showError("Route planning failed", error.message || "Error processing locations. Please try again.");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="bg-[#424d5c] absolute top-0 left-0 z-[1001] w-full">
        <LocationSearchForm
          onSearch={handleSearch}
          isLoading={isLoading}
          mapboxToken={mapboxToken}
          initialDepartureCoords={initialDepartureCoords}
          initialDestinationCoords={initialDestinationCoords}
          routeCalculated={routeCalculated}
          canUseCurrentLocation={canUseCurrentLocation}
          isGettingLocation={isGettingLocation}
          fetchUserLocation={fetchUserLocation}
          userLocation={userLocation}
          useCurrentLocation={useCurrentLocation} // Pass current UI state for checkbox
        />
      </div>

      <div>
        {mapboxToken && readyToRender && (
          <ClientOnlyMap
            key={mapKey}
            mapboxToken={mapboxToken}
            departureCoords={departureCoords} // This will either be userLocation or explicit coordinates
            destinationCoords={destinationCoords}
            userLocation={userLocation}
            canUseCurrentLocation={canUseCurrentLocation}
            isGettingLocation={isGettingLocation}
            locationDenied={locationDenied}
            fetchUserLocation={fetchUserLocation}
          />
        )}
      </div>
    </div>
  );
}

// The main Dashboard component with Suspense boundary
export default function Dashboard() {
  const mainElementRef = useRef(null);

  return (
    <>
      <main
        ref={mainElementRef}
        className="min-h-screen bg-map-bg text-map-text overflow-y-auto"
        id="dashboard-main"
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-2"></div>
              <p className="ml-3">Loading route details...</p>
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </main>
    </>
  );
}