// Refactored LocationSearchForm (cleaner structure, same behavior)
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { v4 as uuidv4 } from "uuid";

const NYC_BOUNDS = {
  sw: [40.4957, -74.2557],
  ne: [40.9176, -73.7002],
};

const isWithinNYC = ([lat, lng]) =>
  lat >= NYC_BOUNDS.sw[0] && lat <= NYC_BOUNDS.ne[0] &&
  lng >= NYC_BOUNDS.sw[1] && lng <= NYC_BOUNDS.ne[1];

const formatCoords = ([lat, lng]) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

export default function LocationSearchForm({
  onSearch,
  isLoading,
  mapboxToken,
  initialDepartureCoords,
  initialDestinationCoords,
  routeCalculated = false,
}) {
  const { showError, showWarning, showSuccess } = useNotification();

  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [departureCoords, setDepartureCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [departureSuggestions, setDepartureSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showDepartureSuggestions, setShowDepartureSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [formError, setFormError] = useState(null);
  const [inputsModified, setInputsModified] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const initialLoadRef = useRef(false);
  const lastDepartureSearch = useRef("");
  const lastDestinationSearch = useRef("");

  const bboxString = `${NYC_BOUNDS.sw[1]},${NYC_BOUNDS.sw[0]},${NYC_BOUNDS.ne[1]},${NYC_BOUNDS.ne[0]}`;

  useEffect(() => setSessionToken(uuidv4()), []);

  useEffect(() => {
    if (initialDepartureCoords && initialDestinationCoords && !initialLoadRef.current) {
      setDepartureCoords(initialDepartureCoords);
      setDestinationCoords(initialDestinationCoords);
      setDeparture(formatCoords(initialDepartureCoords));
      setDestination(formatCoords(initialDestinationCoords));
      if (isWithinNYC(initialDepartureCoords) && isWithinNYC(initialDestinationCoords)) {
        setInputsModified(true);
      }
      initialLoadRef.current = true;
    }
  }, [initialDepartureCoords, initialDestinationCoords]);

  useEffect(() => {
    if (formError) {
      setFormError(null);
      setHasError(false);
    }
  }, [departure, destination, useCurrentLocation, formError]);

  useEffect(() => {
    if (routeCalculated) {
      setInputsModified(false);
      setHasError(false);
    }
  }, [routeCalculated]);

  useEffect(() => {
    const closeSuggestions = () => {
      setShowDepartureSuggestions(false);
      setShowDestinationSuggestions(false);
    };
    document.addEventListener("click", closeSuggestions);
    return () => document.removeEventListener("click", closeSuggestions);
  }, []);

  const fetchSuggestions = async (query, setResults, setShow, lastRef) => {
    if (!query || query.length < 3 || !mapboxToken) return;
    if (query === lastRef.current) return setShow(true);

    lastRef.current = query;
    try {
      const res = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(
          query
        )}&session_token=${sessionToken}&limit=5&country=US&bbox=${bboxString}&types=poi,address,place&access_token=${mapboxToken}`
      );
      const data = await res.json();
      if (data.suggestions?.length) {
        setResults(data.suggestions);
        setShow(true);
      } else {
        setResults([]);
        setShow(false);
        setHasError(true);
        showWarning("No locations found", `No results found for "${query}" in NYC.`);
      }
    } catch (err) {
      setHasError(true);
      showError("Search error", err.message || "Location search failed.");
    }
  };

  const handleSelectSuggestion = async (suggestion, type) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?session_token=${sessionToken}&access_token=${mapboxToken}`
      );
      const data = await res.json();
      const [lng, lat] = data.features[0].geometry.coordinates;
      if (!isWithinNYC([lat, lng])) throw new Error("Location outside NYC");

      const text = `${suggestion.name}${suggestion.place_formatted ? ", " + suggestion.place_formatted : ""}`;
      if (type === "departure") {
        setDeparture(text);
        setDepartureCoords([lat, lng]);
        setUseCurrentLocation(false);
        setShowDepartureSuggestions(false);
      } else {
        setDestination(text);
        setDestinationCoords([lat, lng]);
        setShowDestinationSuggestions(false);
      }
      setInputsModified(true);
    } catch (err) {
      setHasError(true);
      showWarning("Invalid location", err.message || "Unable to use this location.");
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setUseCurrentLocation(false);
      return showWarning("Geolocation not supported", "Browser does not support geolocation.");
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (!isWithinNYC([lat, lng])) {
          setUseCurrentLocation(false);
          setHasError(true);
          return showWarning("Outside NYC", "Current location is outside NYC.");
        }
        setUseCurrentLocation(true);
        setDeparture("");
        setDepartureCoords(null);
        setInputsModified(true);
        showSuccess("Using current location");
      },
      (err) => {
        setUseCurrentLocation(false);
        setHasError(true);
        showWarning("Location error", err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    setIsGettingLocation(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!useCurrentLocation && !departureCoords) {
      return setFormError("Please select a departure location from suggestions");
    }
    if (!destinationCoords) {
      return setFormError("Please select a destination from suggestions");
    }
    onSearch({
      departure,
      departureCoordinates: departureCoords,
      destination,
      destinationCoordinates: destinationCoords,
      useCurrentLocation,
    });
    setSessionToken(uuidv4());
  };

  const isButtonDisabled = () => {
    if (
      initialLoadRef.current &&
      !routeCalculated &&
      departureCoords &&
      destinationCoords
    ) return false;

    return (
      isLoading ||
      isGettingLocation ||
      (!useCurrentLocation && !departureCoords) ||
      !destinationCoords ||
      (routeCalculated && !inputsModified && !hasError)
    );
  };

  const getButtonText = () => {
    if (isLoading) return "Calculating Route...";
    if (routeCalculated && !inputsModified && !hasError) return "Route Already Calculated";
    if (initialLoadRef.current && !routeCalculated) return "Calculate This Route";
    return destinationCoords && (departureCoords || useCurrentLocation)
      ? "Get Directions"
      : "Enter Route Details";
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white rounded-lg shadow-md space-y-4">
      {formError && (
        <div className="p-2 bg-red-50 text-red-700 text-sm rounded border border-red-200">{formError}</div>
      )}

      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        {/* Departure */}
        <div className="flex-1 space-y-1 relative">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="departure" className="text-sm font-medium text-map-legendtext">
              Departure
            </label>
            <div className="flex items-center">
              <label htmlFor="useCurrentLocation" className="text-xs text-map-legendtext mr-2">
                Use current location
              </label>
              <input
                type="checkbox"
                id="useCurrentLocation"
                checked={useCurrentLocation}
                onChange={(e) => {
                  if (e.target.checked) {
                    getCurrentLocation(); // try to get location if turning on
                  } else {
                    setUseCurrentLocation(false); // turn off and re-enable input
                    setInputsModified(true);
                  }
                }}

                disabled={isGettingLocation}
                className="h-4 w-4 text-map-legendtext border-gray-300 rounded"
              />
              {isGettingLocation && (
                <div className="ml-2 w-4 h-4 border-2 border-t-transparent border-map-bg rounded-full animate-spin"></div>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            <Input
              id="departure"
              placeholder={useCurrentLocation ? "Using current location" : "Enter departure location"}
              value={departure}
              onChange={(e) => {
                setDeparture(e.target.value);
                setDepartureCoords(null);
                setInputsModified(true);
              }}
              disabled={useCurrentLocation}
              className={`text-map-legendtext flex-1 ${useCurrentLocation ? "bg-gray-100" : ""}`}
            />
            <Button
              type="button"
              variant="outline"
              disabled={departure.length < 3 || isGettingLocation}
              onClick={() => fetchSuggestions(departure, setDepartureSuggestions, setShowDepartureSuggestions, lastDepartureSearch)}
            >
              Search
            </Button>
          </div>

          {showDepartureSuggestions && departureSuggestions.length > 0 && (
            <div className="absolute z-[2000] mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden">
              <div className="max-h-60 overflow-auto">
                {departureSuggestions.map((s) => (
                  <div
                    key={s.mapbox_id}
                    onClick={() => handleSelectSuggestion(s, "departure")}
                    className="cursor-pointer text-map-legendtext hover:bg-gray-100 p-3 border-b border-gray-100"
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-gray-500">{s.place_formatted}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Destination */}
        <div className="flex-1 space-y-1 relative">
          <label htmlFor="destination" className="text-sm font-medium text-map-legendtext">
            Destination
          </label>
          <div className="flex space-x-2">
            <Input
              id="destination"
              placeholder="Enter destination"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setDestinationCoords(null);
                setInputsModified(true);
              }}
              className="flex-1 text-map-legendtext"
            />
            <Button
              type="button"
              variant="outline"
              disabled={destination.length < 3}
              onClick={() => fetchSuggestions(destination, setDestinationSuggestions, setShowDestinationSuggestions, lastDestinationSearch)}
            >
              Search
            </Button>
          </div>

          {showDestinationSuggestions && destinationSuggestions.length > 0 && (
            <div className="absolute z-[2000] mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden">
              <div className="max-h-60 overflow-auto">
                {destinationSuggestions.map((s) => (
                  <div
                    key={s.mapbox_id}
                    onClick={() => handleSelectSuggestion(s, "destination")}
                    className="cursor-pointer text-map-legendtext hover:bg-gray-100 p-3 border-b border-gray-100"
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-gray-500">{s.place_formatted}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isButtonDisabled}
        className="w-full mt-4 bg-map-pointer hover:bg-map-pointer2 text-map-legendtext"
      >
        {getButtonText()}
      </Button>

      {routeCalculated && !inputsModified && !hasError && (
        <div className="text-xs text-map-legendtext text-center mt-1">
          Change departure or destination to calculate a new route
        </div>
      )}

      <div className="text-xs text-map-legendtext mt-2 text-center">
        Note: SafeRouteNYC only supports locations within New York City&apos;s five boroughs.
      </div>
    </form>
  );
}
