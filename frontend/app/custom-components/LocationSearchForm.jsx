"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { v4 as uuidv4 } from "uuid";
import { ChevronsUp, ChevronsDown } from "lucide-react";
import { useRoute } from "./MapComponents/RouteContext";

export default function LocationSearchForm() {
  const { showError, showWarning, showSuccess } = useNotification();

  // Get what we need from context
  const {
    mapboxToken,
    userLocation,
    canUseCurrentLocation,
    isGettingLocation,
    fetchUserLocation,
    routeCalculated,
    useCurrentLocation,
    setUseCurrentLocation,
    initialDepartureCoords,
    initialDestinationCoords,
    NYC_BOUNDS,
    isWithinNYC,
    formatCoords,
    handleSearch,
    isCalculatingRoute,
    showLocationSearchForm,
    setShowLocationSearchForm
  } = useRoute();

  // Local form state
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [departureCoords, setDepartureCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [departureSuggestions, setDepartureSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showDepartureSuggestions, setShowDepartureSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [formError, setFormError] = useState(null);
  const [inputsModified, setInputsModified] = useState(false);
  const [sessionToken, setSessionToken] = useState(uuidv4());
  const initialLoadDone = useRef(false);

  // Track last searched terms for anti-spam and caching
  const [lastDepartureSearch, setLastDepartureSearch] = useState("");
  const [lastDestinationSearch, setLastDestinationSearch] = useState("");

  // Track invalid searches to prevent spam
  const [invalidDepartureSearch, setInvalidDepartureSearch] = useState("");
  const [invalidDestinationSearch, setInvalidDestinationSearch] = useState("");

  // Add loading states for the search buttons
  const [isSearchingDeparture, setIsSearchingDeparture] = useState(false);
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);

  // Create bbox string for MapBox API
  const bboxString = `${NYC_BOUNDS.sw[1]},${NYC_BOUNDS.sw[0]},${NYC_BOUNDS.ne[1]},${NYC_BOUNDS.ne[0]}`;

  // Initialize form with initial coordinates (from URL)
  useEffect(() => {
    if (initialDepartureCoords && initialDestinationCoords && !initialLoadDone.current) {
      setDepartureCoords(initialDepartureCoords);
      setDestinationCoords(initialDestinationCoords);
      setDeparture(formatCoords(initialDepartureCoords));
      setDestination(formatCoords(initialDestinationCoords));
      initialLoadDone.current = true;
    }
  }, [initialDepartureCoords, initialDestinationCoords, formatCoords]);

  // Clear errors when inputs change
  useEffect(() => {
    if (formError) {
      setFormError(null);
    }
  }, [departure, destination, useCurrentLocation, formError]);

  // Reset inputsModified flag after route calculation
  useEffect(() => {
    if (routeCalculated) {
      setInputsModified(false);
    }
  }, [routeCalculated]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const closeSuggestions = (e) => {
      // Don't close if the click is on a search button
      if (e.target.closest('button') &&
        (e.target.closest('button').id === 'search-departure' ||
          e.target.closest('button').id === 'search-destination')) {
        return;
      }
      setShowDepartureSuggestions(false);
      setShowDestinationSuggestions(false);
    };
    document.addEventListener("click", closeSuggestions);
    return () => document.removeEventListener("click", closeSuggestions);
  }, []);

  // Fetch suggestions from Mapbox API
  const fetchSuggestions = async (query, forDeparture = true) => {
    // Don't do anything for empty or too short queries
    if (!query || query.length < 3 || !mapboxToken) return;

    // Set the appropriate loading state
    if (forDeparture) {
      setIsSearchingDeparture(true);
    } else {
      setIsSearchingDestination(true);
    }

    try {
      const res = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(
          query
        )}&session_token=${sessionToken}&limit=5&country=US&bbox=${bboxString}&types=poi,address,place&access_token=${mapboxToken}`
      );
      const data = await res.json();

      // Save this as the last search term
      if (forDeparture) {
        setLastDepartureSearch(query);
      } else {
        setLastDestinationSearch(query);
      }

      if (data.suggestions?.length) {
        if (forDeparture) {
          setDepartureSuggestions(data.suggestions);
          setShowDepartureSuggestions(true);
          setInvalidDepartureSearch(""); // Clear invalid flag on success
        } else {
          setDestinationSuggestions(data.suggestions);
          setShowDestinationSuggestions(true);
          setInvalidDestinationSearch(""); // Clear invalid flag on success
        }
      } else {
        if (forDeparture) {
          setDepartureSuggestions([]);
          setInvalidDepartureSearch(query); // Mark this query as invalid
        } else {
          setDestinationSuggestions([]);
          setInvalidDestinationSearch(query); // Mark this query as invalid
        }
        showWarning(
          "No locations found",
          `No results found for "${query}" in NYC.`
        );
      }
    } catch (err) {
      // Mark this query as invalid on error
      if (forDeparture) {
        setInvalidDepartureSearch(query);
      } else {
        setInvalidDestinationSearch(query);
      }
      showError("Search error", err.message || "Location search failed.");
    } finally {
      if (forDeparture) {
        setIsSearchingDeparture(false);
      } else {
        setIsSearchingDestination(false);
      }
    }
  };

  // Handle departure search button click
  const handleDepartureSearch = (e) => {
    e.stopPropagation(); // Prevent event bubbling

    // If we have cached results for this exact query, just show them
    if (departure === lastDepartureSearch && departureSuggestions.length > 0) {
      setShowDepartureSuggestions(true);
      return;
    }

    // Otherwise fetch new results
    fetchSuggestions(departure, true);
  };

  // Handle destination search button click
  const handleDestinationSearch = (e) => {
    e.stopPropagation(); // Prevent event bubbling

    // If we have cached results for this exact query, just show them
    if (destination === lastDestinationSearch && destinationSuggestions.length > 0) {
      setShowDestinationSuggestions(true);
      return;
    }

    // Otherwise fetch new results
    fetchSuggestions(destination, false);
  };

  // Handle selecting a suggestion from the dropdown
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
      showWarning(
        "Invalid location",
        err.message || "Unable to use this location."
      );
    }
  };

  // Handle toggling "Use current location"
  const handleUseCurrentLocation = (checked) => {
    if (checked) {
      if (!canUseCurrentLocation) {
        showWarning("Location unavailable", "Your current location is unavailable or outside NYC.");
        return;
      }

      fetchUserLocation(); // Refresh location if needed
      setUseCurrentLocation(true);
      setDeparture("");
      setDepartureCoords(null);
      setLastDepartureSearch(""); // Reset last search term
      showSuccess("Using current location");
    } else {
      setUseCurrentLocation(false);
      setDeparture("");
      setDepartureCoords(null);
      setLastDepartureSearch(""); // Reset last search term
    }
    setInputsModified(true);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate inputs
    if (!useCurrentLocation && !departureCoords) {
      return setFormError("Please select a departure location from suggestions");
    }
    if (!destinationCoords) {
      return setFormError("Please select a destination from suggestions");
    }

    // Submit to context
    handleSearch({
      departure,
      departureCoordinates: departureCoords,
      destination,
      destinationCoordinates: destinationCoords,
      useCurrentLocation,
    });

    // Generate a new session token for the next search
    setSessionToken(uuidv4());
  };

  // Determine if submit button should be disabled
  const isButtonDisabled = () => {
    // Already calculated and no changes
    if (isCalculatingRoute) return true;
    if (routeCalculated && !inputsModified) return true;

    // Getting location
    if (isGettingLocation) return true;

    // Need valid departure and destination
    if (!destinationCoords) return true;
    if (!useCurrentLocation && !departureCoords) return true;

    return false;
  };

  // Get button text based on state
  const getButtonText = () => {
    if (isCalculatingRoute) return "Calculating Route...";
    if (isGettingLocation) return "Calculating Route...";
    if (routeCalculated && !inputsModified && !isCalculatingRoute) return "Route Already Calculated";
    return "Get Directions";
  };

  // Toggle search form visibility
  const toggleSearchForm = () => {
    setShowLocationSearchForm(!showLocationSearchForm);
  };

  return (
    <div className={`transition-all duration-300 ease-in-out ${showLocationSearchForm ? "translate-y-0" : "-translate-y-full"}`}>
      {showLocationSearchForm ? (
        <form onSubmit={handleSubmit} className="relative pb-5 border-b-[1px] border-b-[#2E4965] p-2" role="form">
          {/* Error message */}
          {formError && (
            <div className="p-2 bg-red-50 text-red-700 text-sm rounded border border-red-200">
              {formError}
            </div>
          )}

          {/* Toggle button */}
          <div className="absolute w-[58px] left-1/2 transform -translate-x-1/2 translate-y-1/2 bottom-0 rounded-2xl bg-map-pointer border border-[#414976] flex items-center justify-center" aria-label="Toggle form visibility"
            onClick={toggleSearchForm}
          >
            <ChevronsUp
              className="m-1 hover:text-[#ffffff] cursor-pointer"
            />
          </div>

          {/* Current location toggle */}
          {canUseCurrentLocation && (
            <div className="flex items-center m-1">
              <label htmlFor="useCurrentLocation" className="text-xs text-map-text mr-2">
                Use current location
              </label>
              <input
                type="checkbox"
                id="useCurrentLocation"
                checked={useCurrentLocation}
                onChange={(e) => handleUseCurrentLocation(e.target.checked)}
                disabled={isGettingLocation}
                className="h-4 w-4 text-map-legendtext border-gray-300 rounded bg-blue-50"
              />
            </div>
          )}

          <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
            {/* Departure input */}
            <div className="flex-1 space-y-1 relative">
              {isGettingLocation && (
                <div className="flex items-center">
                  <div className="ml-2 w-4 h-4 border-2 border-t-transparent border-map-bg rounded-full animate-spin"></div>
                </div>
              )}

              <div className="flex space-x-2">
                <Input
                  id="departure"
                  autoComplete="off"
                  placeholder={useCurrentLocation ? "Using current location" : "Enter departure location"}
                  value={departure}
                  onChange={(e) => {
                    setDeparture(e.target.value);
                    // Clear invalid flag when input changes
                    if (e.target.value !== invalidDepartureSearch) {
                      setInvalidDepartureSearch("");
                    }
                    if (e.target.value !== lastDepartureSearch) {
                      setDepartureCoords(null);
                      setInputsModified(true);
                    }
                  }}
                  disabled={useCurrentLocation}
                  className={`text-map-legendtext flex-1 text-sm md:text-base sm:text-xs ${useCurrentLocation ? "bg-gray-100" : "bg-white"
                    } p-2 sm:p-1.5`}
                />
                <Button
                  id="search-departure"
                  type="button"
                  variant="outline"
                  disabled={
                    departure.length < 3 ||
                    isGettingLocation ||
                    useCurrentLocation ||
                    isSearchingDeparture ||
                    departure === invalidDepartureSearch // Disable if query is known to be invalid
                  }
                  className="text-sm md:text-base sm:text-xs p-2 sm:p-1.5 text-map-legendtext"
                  onClick={handleDepartureSearch}
                >
                  {isSearchingDeparture ? (
                    <div className="w-4 h-4 border-2 border-t-transparent border-map-bg rounded-full animate-spin"></div>
                  ) : "Search"}
                </Button>
              </div>

              {/* Departure suggestions dropdown */}
              {showDepartureSuggestions && departureSuggestions.length > 0 && (
                <div
                  className="absolute z-[2000] mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
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

            {/* Destination input */}
            <div className="flex-1 space-y-1 relative">
              <div className="flex space-x-2">
                <Input
                  id="destination"
                  autoComplete="off"
                  placeholder="Enter destination"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    // Clear invalid flag when input changes
                    if (e.target.value !== invalidDestinationSearch) {
                      setInvalidDestinationSearch("");
                    }
                    if (e.target.value !== lastDestinationSearch) {
                      setDestinationCoords(null);
                      setInputsModified(true);
                    }
                  }}
                  className="flex-1 text-map-legendtext text-sm md:text-base sm:text-xs p-2 sm:p-1.5 bg-white"
                />
                <Button
                  id="search-destination"
                  type="button"
                  variant="outline"
                  disabled={
                    destination.length < 3 ||
                    isSearchingDestination ||
                    destination === invalidDestinationSearch // Disable if query is known to be invalid
                  }
                  className="text-sm md:text-base sm:text-xs p-2 sm:p-1.5 text-map-legendtext"
                  onClick={handleDestinationSearch}
                >
                  {isSearchingDestination ? (
                    <div className="w-4 h-4 border-2 border-t-transparent border-map-bg rounded-full animate-spin"></div>
                  ) : "Search"}
                </Button>
              </div>

              {/* Destination suggestions dropdown */}
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div
                  className="absolute z-[2000] mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="max-h-60 overflow-auto">
                    {destinationSuggestions.map((s) => (
                      <div
                        key={s.mapbox_id}
                        onClick={() => handleSelectSuggestion(s, "destination")}
                        className="cursor-pointer text-map-legendtext hover:bg-gray-100 p-3 border-b border-gray-100 text-sm md:text-base sm:text-xs"
                      >
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-gray-500">{s.place_formatted}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isButtonDisabled()}
            className="w-full mt-4 bg-map-pointer hover:bg-map-pointer2 text-map-text text-sm md:text-base sm:text-xs p-2 sm:p-1.5"
          >
            {isCalculatingRoute ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                <span>{getButtonText()}</span>
              </div>
            ) : (
              getButtonText()
            )}
          </Button>

          {routeCalculated && !inputsModified && (
            <div className="text-xs text-center mt-2">
              Change departure or destination to calculate a new route
            </div>
          )}

          <div className="text-xs mt-2 text-center">
            Note: SafeRouteNYC only supports locations within New York City&apos;s five boroughs.
          </div>
        </form>
      ) : (
        <div
          onClick={toggleSearchForm}
          className="absolute top-0 left-1/2 transform -translate-x-1/2 rounded-b-2xl bg-map-pointer border border-[#414976] border-t-0"
          aria-label="Toggle form visibility"
        >
          <ChevronsDown className="m-1 hover:text-[#ffffff] cursor-pointer flex items-center justify-center w-[50px]" />
        </div>
      )}
    </div>
  );
}