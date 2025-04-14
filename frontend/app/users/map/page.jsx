"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import LocationSearchForm from "@/app/custom-components/LocationSearchForm";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { ArrowUp } from "lucide-react";

// NYC boundary constants
const NYC_BOUNDS = {
  sw: [40.4957, -74.2557],
  ne: [40.9176, -73.7002],
};

const isWithinNYC = ([lat, lng]) =>
  lat >= NYC_BOUNDS.sw[0] &&
  lat <= NYC_BOUNDS.ne[0] &&
  lng >= NYC_BOUNDS.sw[1] &&
  lng <= NYC_BOUNDS.ne[1];

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
  const router = useRouter();
  const pathname = usePathname();

  const [mapboxToken, setMapboxToken] = useState("");
  const [departureCoords, setDepartureCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showError, showWarning, showSuccess } = useNotification();
  const [routeName, setRouteName] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);
  const [initialDepartureCoords, setInitialDepartureCoords] = useState(null);
  const [initialDestinationCoords, setInitialDestinationCoords] =
    useState(null);
  const [readyToRender, setReadyToRender] = useState(false);
  const [routeCalculated, setRouteCalculated] = useState(false);

  const containerRef = useRef(null);
  const [mapKey, setMapKey] = useState(1);

  // Load coordinates from URL on initial render with strict NYC validation
  useEffect(() => {
    if (initialLoad) {
      // Get coordinates from URL parameters
      const depLat = searchParams.get("dep_lat");
      const depLon = searchParams.get("dep_lon");
      const destLat = searchParams.get("dest_lat");
      const destLon = searchParams.get("dest_lon");
      const name = searchParams.get("name");

      // Check if we have parameters to validate
      if (depLat && depLon && destLat && destLon) {
        const departure = [parseFloat(depLat), parseFloat(depLon)];
        const destination = [parseFloat(destLat), parseFloat(destLon)];

        // Strict validation: Both must be within NYC, or clear all
        if (isWithinNYC(departure) && isWithinNYC(destination)) {
          // Both coordinates are valid - set them
          setInitialDepartureCoords(departure);
          setInitialDestinationCoords(destination);

          if (name) {
            setRouteName(decodeURIComponent(name));
          }
        } else {
          // Either coordinate is outside NYC - clear the URL using Next.js router
          console.log(
            "Coordinates outside NYC bounds, clearing URL parameters"
          );

          // Use Next.js router to navigate to the same page without query parameters
          router.replace(pathname);

          // Don't set any initial coordinates
          setInitialDepartureCoords(null);
          setInitialDestinationCoords(null);
          setRouteName("");
        }
      }

      setInitialLoad(false);
    }
  }, [initialLoad, searchParams, router, pathname]);

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

          // Update URL with the current coordinates using Next.js router
          const params = new URLSearchParams();
          if (departureCoordinates) {
            params.set("dep_lat", departureCoordinates[0]);
            params.set("dep_lon", departureCoordinates[1]);
          }
          if (destinationCoordinates) {
            params.set("dest_lat", destinationCoordinates[0]);
            params.set("dest_lon", destinationCoordinates[1]);
          }

          // Use router.replace to update URL without adding to history
          router.replace(`${pathname}?${params.toString()}`);

          showSuccess(
            "Route planning started",
            `Planning route from ${
              useCurrentLocation ? "your current location" : departure
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
    <div ref={containerRef} className="relative">
      {/* Search Form Section (Top) */}
      {/* <Image
            className="mx-0 ml-2"
            src="/owl-logo.svg"
            width={24}
            height={24}
            alt="Nightwalkers Logo"
          /> */}
      <div className="bg-[#424d5c] absolute top-0 left-0 z-[1001] w-full">
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
      <div>
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

  return (
    <>
      <main
        ref={mainElementRef}
        className="min-h-screen bg-map-bg text-map-text overflow-y-hidden"
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
