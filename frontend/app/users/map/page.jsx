"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import LocationSearchForm from "@/app/custom-components/LocationSearchForm";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowUp } from "lucide-react";

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
  const searchParams = useSearchParams();
  const [mapboxToken, setMapboxToken] = useState("");
  const [departureCoords, setDepartureCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showError, showWarning, showSuccess } = useNotification();
  const [routeName, setRouteName] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);
  const [initialDepartureCoords, setInitialDepartureCoords] = useState(null);
  const [initialDestinationCoords, setInitialDestinationCoords] = useState(null);
  const [readyToRender, setReadyToRender] = useState(false);
  const [routeCalculated, setRouteCalculated] = useState(false); // Track if a route has been calculated

  // Create a ref for the main container
  const containerRef = useRef(null);

  // Used to force map re-renders when needed
  const [mapKey, setMapKey] = useState(1);

  // Load coordinates from URL on initial render
  useEffect(() => {
    if (initialLoad) {
      // Get coordinates from URL parameters
      const depLat = searchParams.get("dep_lat");
      const depLon = searchParams.get("dep_lon");
      const destLat = searchParams.get("dest_lat");
      const destLon = searchParams.get("dest_lon");
      const name = searchParams.get("name");

      // Only set coordinates if they exist in the URL
      if (depLat && depLon && destLat && destLon) {
        const departure = [parseFloat(depLat), parseFloat(depLon)];
        const destination = [parseFloat(destLat), parseFloat(destLon)];

        setInitialDepartureCoords(departure);
        setInitialDestinationCoords(destination);

        if (name) {
          setRouteName(decodeURIComponent(name));
        }
      }

      setInitialLoad(false);
    }
  }, [initialLoad, searchParams]);

  useEffect(() => {
    // Get the Mapbox API key safely
    const token = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "";
    if (!token) {
      showError(
        "Configuration error",
        "Missing Mapbox API key. Please set NEXT_PUBLIC_MAPBOX_API_KEY in your .env.local file.",
        "api_key_missing"
      );
    } else {
      setMapboxToken(token);
      setReadyToRender(true);
    }
  }, [showError]);

  // Handle search form submission
  const handleSearch = async ({
    departure,
    departureCoordinates,
    destination,
    destinationCoordinates,
    useCurrentLocation,
  }) => {
    if (!mapboxToken) {
      showError(
        "Configuration error",
        "Missing Mapbox API key. The map cannot be displayed.",
        "api_key_missing"
      );
      return;
    }

    setIsLoading(true);
    setRouteCalculated(false); // Reset route calculated state when starting a new search

    try {
      console.log("Search form submitted with values:", {
        departure,
        departureCoordinates,
        destination,
        destinationCoordinates,
        useCurrentLocation,
      });

      // Validation
      if (!useCurrentLocation && !departureCoordinates) {
        showWarning(
          "Departure location required",
          "Please select a departure location from the suggestions",
          "location_validation_error"
        );
        setIsLoading(false);
        return;
      }

      if (!destinationCoordinates) {
        showWarning(
          "Destination required",
          "Please select a destination from the suggestions",
          "location_validation_error"
        );
        setIsLoading(false);
        return;
      }

      // First, reset the map completely
      setDepartureCoords(null);
      setDestinationCoords(null);
      setUseCurrentLocation(false);

      // Wait for state to clear
      setTimeout(() => {

        // Then set the new values
        setUseCurrentLocation(!!useCurrentLocation);

        if (departureCoordinates) {
          setDepartureCoords(departureCoordinates);
        }
        if (!useCurrentLocation && departureCoordinates) {
          setDepartureCoords(departureCoordinates);
        } else if (useCurrentLocation) {
          // If using current location, we still need to pass null for departureCoords
          // The map component will use geolocation API instead
          setDepartureCoords(null);
        }

        // Set endpoint with a slight delay to ensure start point is registered first
        setTimeout(() => {
          setDestinationCoords(destinationCoordinates);
          setIsLoading(false);
          setRouteCalculated(true); // Mark that a route has been successfully calculated

          // Update URL with the current coordinates
          const url = new URL(window.location.href);
          if (departureCoordinates) {
            url.searchParams.set("dep_lat", departureCoordinates[0]);
            url.searchParams.set("dep_lon", departureCoordinates[1]);
          }
          if (destinationCoordinates) {
            url.searchParams.set("dest_lat", destinationCoordinates[0]);
            url.searchParams.set("dest_lon", destinationCoordinates[1]);
          }
          window.history.replaceState({}, "", url.toString());

          showSuccess(
            "Route planning started",
            `Planning route from ${useCurrentLocation ? "your current location" : departure
            } to ${destination}`,
            "route_planning"
          );
        }, 100);
      }, 100);
    } catch (error) {
      console.error("Search error:", error);
      setIsLoading(false);
      setRouteCalculated(false); // Reset on error

      showError(
        "Route planning failed",
        error.message || "Error processing locations. Please try again.",
        "route_planning_error"
      );
    }
  };

  return (
    <div ref={containerRef} className="relative flex flex-col h-screen w-full">
      {/* Search Form Section (Top) */}
      <div className="p-0 mb-0 mt-0">
        <h2 className="text-lg font-semibold mt-0 mb-0 text-map-text flex items-center ml-2">
          Travel Safely
          <Image
            className="mx-0 ml-2"
            src="/owl-logo.svg"
            width={24}
            height={24}
            alt="Nightwalkers Logo"
          />
        </h2>
        <LocationSearchForm
          onSearch={handleSearch}
          isLoading={isLoading}
          mapboxToken={mapboxToken}
          initialDepartureCoords={initialDepartureCoords}
          initialDestinationCoords={initialDestinationCoords}
          routeCalculated={routeCalculated}
        />
      </div>

      {/* Map Section (Center, takes remaining height) */}
      <div className="w-full flex-grow pb-20 mb-0">
        {mapboxToken && readyToRender && (
          <ClientOnlyMap
            key={mapKey}
            mapboxToken={mapboxToken}
            departureCoords={departureCoords}
            destinationCoords={destinationCoords}
            useCurrentLocation={useCurrentLocation}
          />
        )}
      </div>
    </div>
  );
}

// The main Dashboard component with Suspense boundary
export default function Dashboard() {
  const mainElementRef = useRef(null);

  // Simple scroll to top function - no complexity
  const scrollToTop = () => {
    // Just set the scroll position directly - no smooth behavior
    window.scrollTo(0, 0);

    // Also try these as direct fallbacks
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Try to find the main scrollable element and scroll it
    const mainElement = document.getElementById('dashboard-main');
    if (mainElement) {
      mainElement.scrollTop = 0;
    }
  };

  return (
    <>
      <main
        ref={mainElementRef}
        className="min-h-screen bg-map-bg text-map-text p-0 overflow-y-auto mt-0 pt-3"
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

      {/* Always visible scroll button - no conditions */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-16 left-6 bg-map-bg hover:bg-blue-700 p-3 rounded-full shadow-lg text-white z-[9999] flex items-center justify-center w-12 h-12 opacity-90 transition-all duration-300 hover:scale-110"
        aria-label="Scroll to top"
        type="button"
      >
        <ArrowUp size={24} />
      </button>
    </>
  );
}