'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotification } from '@/app/custom-components/ToastComponent/NotificationContext'; // Update path as needed

const LocationSearchForm = ({ onSearch, isLoading, mapboxToken, initialDepartureCoords, initialDestinationCoords }) => {
    const { showError, showWarning, showSuccess } = useNotification();
    const [departure, setDeparture] = useState('');
    const [destination, setDestination] = useState('');
    const [departureCoordinates, setDepartureCoordinates] = useState(null);
    const [destinationCoordinates, setDestinationCoordinates] = useState(null);
    const [departureSuggestions, setDepartureSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    const [showDepartureSuggestions, setShowDepartureSuggestions] = useState(false);
    const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
    const [isSearchingDeparture, setIsSearchingDeparture] = useState(false);
    const [isSearchingDestination, setIsSearchingDestination] = useState(false);
    const [useCurrentLocation, setUseCurrentLocation] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [formError, setFormError] = useState(null);
    const [initializedWithCoords, setInitializedWithCoords] = useState(false);

    // NYC bounds for validation
    const nycBounds = {
        sw: [40.4957, -74.2557], // Southwest coordinates (Staten Island)
        ne: [40.9176, -73.7002], // Northeast coordinates (Bronx)
    };

    // Function to check if coordinates are within NYC
    const isWithinNYC = useCallback((coords) => {
        if (!coords || !Array.isArray(coords) || coords.length < 2) return false;

        const [lat, lng] = coords;
        return (
            lat >= nycBounds.sw[0] &&
            lat <= nycBounds.ne[0] &&
            lng >= nycBounds.sw[1] &&
            lng <= nycBounds.ne[1]
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Format coordinates as a string
    const formatCoordinates = (coordinates) => {
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) return '';
        const [lat, lng] = coordinates;
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    };

    // Initialize form with coordinates from URL if provided
    useEffect(() => {
        if (initialDepartureCoords && initialDestinationCoords && !initializedWithCoords) {
            // Set the coordinates
            setDepartureCoordinates(initialDepartureCoords);
            setDestinationCoordinates(initialDestinationCoords);
            
            // Just display the raw coordinates without reverse geocoding
            setDeparture(formatCoordinates(initialDepartureCoords));
            setDestination(formatCoordinates(initialDestinationCoords));
            
            setInitializedWithCoords(true);
        }
    }, [initialDepartureCoords, initialDestinationCoords, initializedWithCoords]);

    // Clear form error when inputs change
    useEffect(() => {
        if (formError) setFormError(null);
    }, [departure, destination, useCurrentLocation, formError]);

    // Function to fetch suggestions for departure
    const fetchDepartureSuggestions = async () => {
        if (!departure || departure.length < 3 || !mapboxToken || useCurrentLocation) return;

        setIsSearchingDeparture(true);
        try {
            console.log("Fetching departure suggestions for:", departure);
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(departure)}.json?access_token=${mapboxToken}&types=address,place,poi&limit=5`
            );

            if (!response.ok) {
                throw new Error('Geocoding failed with status: ' + response.status);
            }

            const data = await response.json();
            if (data.features && data.features.length > 0) {
                console.log("Received departure suggestions:", data.features.length);
                // Show all suggestions instead of filtering
                setDepartureSuggestions(data.features);
                setShowDepartureSuggestions(true);
            } else {
                console.log("No departure suggestions found");
                setDepartureSuggestions([]);
                setShowDepartureSuggestions(false);
                showWarning(
                    'No locations found',
                    `No results found for "${departure}". Try a different search term.`,
                    'location_search_empty'
                );
            }
        } catch (error) {
            console.error('Error fetching departure suggestions:', error);
            setDepartureSuggestions([]);
            setFormError("Failed to fetch location suggestions");

            showError(
                'Location search failed',
                error.message || 'Failed to fetch location suggestions. Please check your internet connection.',
                'location_search_error'
            );
        } finally {
            setIsSearchingDeparture(false);
        }
    };

    // Function to fetch suggestions for destination
    const fetchDestinationSuggestions = async () => {
        if (!destination || destination.length < 3 || !mapboxToken) return;

        setIsSearchingDestination(true);
        try {
            console.log("Fetching destination suggestions for:", destination);
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json?access_token=${mapboxToken}&types=address,place,poi&limit=5`
            );

            if (!response.ok) {
                throw new Error('Geocoding failed with status: ' + response.status);
            }

            const data = await response.json();
            if (data.features && data.features.length > 0) {
                console.log("Received destination suggestions:", data.features.length);
                // Show all suggestions instead of filtering
                setDestinationSuggestions(data.features);
                setShowDestinationSuggestions(true);
            } else {
                console.log("No destination suggestions found");
                setDestinationSuggestions([]);
                setShowDestinationSuggestions(false);

                showWarning(
                    'No locations found',
                    `No results found for "${destination}". Try a different search term.`,
                    'location_search_empty'
                );
            }
        } catch (error) {
            console.error('Error fetching destination suggestions:', error);
            setDestinationSuggestions([]);
            setFormError("Failed to fetch location suggestions");

            showError(
                'Location search failed',
                error.message || 'Failed to fetch location suggestions. Please check your internet connection.',
                'location_search_error'
            );
        } finally {
            setIsSearchingDestination(false);
        }
    };

    // Function to get current location when the checkbox is toggled
    const getCurrentLocation = async () => {
        if (!navigator.geolocation) {
            showWarning(
                'Geolocation not supported',
                'Your browser does not support geolocation services.',
                'location_not_supported'
            );
            setUseCurrentLocation(false);
            return;
        }

        setIsGettingLocation(true);

        try {
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

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Check if within NYC
            if (isWithinNYC([lat, lng])) {
                // Keep checkbox checked
                setUseCurrentLocation(true);
                // Clear departure field since we're using current location
                setDeparture('');
                setDepartureCoordinates(null);
            } else {
                // Outside NYC - warn and uncheck
                showWarning(
                    'Location outside NYC',
                    'Your current location is outside New York City. SafeRouteNYC only works within the five boroughs.',
                    'location_outside_nyc'
                );
                setUseCurrentLocation(false);
            }
        } catch (error) {
            console.error("Error getting location:", error);

            if (error.code === 1) {
                // Permission denied
                showWarning(
                    'Location access denied',
                    'Please enable location services in your browser to use this feature.',
                    'location_permission_denied'
                );
            } else {
                showError(
                    'Location error',
                    error.message || 'Failed to get your current location.',
                    'location_error'
                );
            }

            // Uncheck the box since we couldn't get location
            setUseCurrentLocation(false);
        } finally {
            setIsGettingLocation(false);
        }
    };

    // Handle selecting a departure suggestion
    const handleSelectDeparture = (suggestion) => {
        console.log("Selected departure:", suggestion.place_name);

        // Convert coordinates to [lat, lng] for Leaflet
        const [lng, lat] = suggestion.center;

        // Check if location is within NYC
        if (isWithinNYC([lat, lng])) {
            setDeparture(suggestion.place_name);
            setDepartureCoordinates([lat, lng]);
            setShowDepartureSuggestions(false);
            setUseCurrentLocation(false);

        } else {
            // Clear the input if outside NYC
            setDeparture('');
            setDepartureCoordinates(null);
            setShowDepartureSuggestions(false);

            showWarning(
                'Location outside NYC',
                `${suggestion.place_name} is outside New York City. SafeRouteNYC only works within the five boroughs.`,
                'location_outside_nyc'
            );
        }
    };

    // Handle selecting a destination suggestion
    const handleSelectDestination = (suggestion) => {
        console.log("Selected destination:", suggestion.place_name);

        // Convert coordinates to [lat, lng] for Leaflet
        const [lng, lat] = suggestion.center;

        // Check if location is within NYC
        if (isWithinNYC([lat, lng])) {
            setDestination(suggestion.place_name);
            setDestinationCoordinates([lat, lng]);
            setShowDestinationSuggestions(false);

        } else {
            // Clear the input if outside NYC
            setDestination('');
            setDestinationCoordinates(null);
            setShowDestinationSuggestions(false);

            showWarning(
                'Location outside NYC',
                `${suggestion.place_name} is outside New York City. SafeRouteNYC only works within the five boroughs.`,
                'location_outside_nyc'
            );
        }
    };

    // Toggle current location usage
    const toggleUseCurrentLocation = () => {
        const newValue = !useCurrentLocation;

        if (newValue) {
            // User is trying to enable current location
            getCurrentLocation();
        } else {
            // User is disabling current location
            setUseCurrentLocation(false);
        }
    };

    // Handle Enter key press for departure input
    const handleDepartureKeyDown = (e) => {
        // Check if the Enter key was pressed
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission

            // Only search if there's enough text and the field isn't disabled
            if (departure.length >= 3 && !isSearchingDeparture && !useCurrentLocation) {
                fetchDepartureSuggestions();
            }
        }
    };

    // Handle Enter key press for destination input
    const handleDestinationKeyDown = (e) => {
        // Check if the Enter key was pressed
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission

            // Only search if there's enough text
            if (destination.length >= 3 && !isSearchingDestination) {
                fetchDestinationSuggestions();
            }
        }
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError(null);
    
        // Validation
        if (!useCurrentLocation && !departureCoordinates) {
            setFormError('Please select a departure location from the suggestions');
    
            showWarning(
                'Departure location missing',
                'Please enter and select a departure location from the suggestions',
                'location_validation_error'
            );
            return;
        }
    
        if (!destinationCoordinates) {
            setFormError('Please select a destination from the suggestions');
    
            showWarning(
                'Destination location missing',
                'Please enter and select a destination location from the suggestions',
                'location_validation_error'
            );
            return;
        }
    
        // Final check that coordinates are within NYC - only for explicit coordinates
        if (!useCurrentLocation && departureCoordinates && !isWithinNYC(departureCoordinates)) {
            setFormError('Departure location must be within New York City');
            setDeparture('');
            setDepartureCoordinates(null);
    
            showWarning(
                'Departure outside NYC',
                'Your departure location is outside New York City. SafeRouteNYC only works within the five boroughs.',
                'location_outside_nyc'
            );
            return;
        }
    
        if (destinationCoordinates && !isWithinNYC(destinationCoordinates)) {
            setFormError('Destination must be within New York City');
            setDestination('');
            setDestinationCoordinates(null);
    
            showWarning(
                'Destination outside NYC',
                'Your destination is outside New York City. SafeRouteNYC only works within the five boroughs.',
                'location_outside_nyc'
            );
            return;
        }
    
        console.log("Form is valid, submitting with coordinates:", {
            departure: useCurrentLocation ? "Current Location" : departure,
            departureCoordinates: departureCoordinates,
            destination: destination,
            destinationCoordinates: destinationCoordinates,
            useCurrentLocation: useCurrentLocation // Make sure this is explicitly passed
        });
    
        // Send the search data to the parent component
        onSearch({
            departure: useCurrentLocation ? "Current Location" : departure,
            departureCoordinates: departureCoordinates, // Keep sending this even if null
            destination,
            destinationCoordinates,
            useCurrentLocation: useCurrentLocation // Fixed: Explicitly pass the useCurrentLocation state
        });
    
        showSuccess(
            'Calculating route',
            'Finding the safest route for your journey',
            'route_calculation_started'
        );
    };

    // Close suggestion dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setShowDepartureSuggestions(false);
            setShowDestinationSuggestions(false);
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    return (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white rounded-lg shadow-md space-y-4">
            {formError && (
                <div className="p-2 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                    {formError}
                </div>
            )}

            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                {/* Departure field */}
                <div className="flex-1 space-y-1 relative">
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="departure" className="block text-sm font-medium text-gray-700">
                            Departure
                        </label>
                        <div className="flex items-center">
                            <label htmlFor="useCurrentLocation" className="text-xs text-gray-600 mr-2">
                                Use current location
                            </label>
                            <input
                                type="checkbox"
                                id="useCurrentLocation"
                                checked={useCurrentLocation}
                                onChange={toggleUseCurrentLocation}
                                disabled={isGettingLocation}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            {isGettingLocation && (
                                <div className="ml-2 w-4 h-4 border-2 border-t-transparent border-indigo-600 rounded-full animate-spin"></div>
                            )}
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Input
                            type="text"
                            id="departure"
                            placeholder={useCurrentLocation ? "Using current location" : "Enter departure location"}
                            value={departure}
                            onChange={(e) => setDeparture(e.target.value)}
                            onKeyDown={handleDepartureKeyDown}
                            onFocus={() => { }}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-black flex-1 ${useCurrentLocation ? 'bg-gray-100' : ''}`}
                            disabled={useCurrentLocation}
                        />
                        <Button
                            type="button"
                            className="text-black"
                            onClick={(e) => {
                                e.stopPropagation();
                                fetchDepartureSuggestions();
                            }}
                            disabled={departure.length < 3 || isSearchingDeparture || useCurrentLocation}
                            variant="outline"
                        >
                            {isSearchingDeparture ?
                                <div className="w-4 h-4 border-2 border-t-transparent border-indigo-600 rounded-full animate-spin"></div>
                                : 'Search'}
                        </Button>
                    </div>

                    {/* Departure Suggestions Dropdown */}
                    {showDepartureSuggestions && departureSuggestions.length > 0 && (
                        <div className="absolute z-[2000] mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="max-h-60 overflow-auto">
                                {departureSuggestions.map((suggestion) => (
                                    <div
                                        key={suggestion.id}
                                        onClick={() => handleSelectDeparture(suggestion)}
                                        className="cursor-pointer text-black hover:bg-gray-100 p-3 border-b border-gray-100"
                                    >
                                        <div className="font-medium">{suggestion.text}</div>
                                        <div className="text-sm text-gray-500">{suggestion.place_name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Destination field */}
                <div className="flex-1 space-y-1 relative">
                    <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                        Destination
                    </label>
                    <div className="flex space-x-2">
                        <Input
                            type="text"
                            id="destination"
                            placeholder="Enter destination"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            onKeyDown={handleDestinationKeyDown}
                            onFocus={() => { }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 text-black"
                        />
                        <Button
                            type="button"
                            className="text-black"
                            onClick={(e) => {
                                e.stopPropagation();
                                fetchDestinationSuggestions();
                            }}
                            disabled={destination.length < 3 || isSearchingDestination}
                            variant="outline"
                        >
                            {isSearchingDestination ?
                                <div className="w-4 h-4 border-2 border-t-transparent border-indigo-600 rounded-full animate-spin"></div>
                                : 'Search'}
                        </Button>
                    </div>

                    {/* Destination Suggestions Dropdown */}
                    {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                        <div className="absolute z-[2000] mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="max-h-60 overflow-auto">
                                {destinationSuggestions.map((suggestion) => (
                                    <div
                                        key={suggestion.id}
                                        onClick={() => handleSelectDestination(suggestion)}
                                        className="cursor-pointer text-black hover:bg-gray-100 p-3 border-b border-gray-100"
                                    >
                                        <div className="font-medium">{suggestion.text}</div>
                                        <div className="text-sm text-gray-500">{suggestion.place_name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Button
                type="submit"
                disabled={isLoading || isGettingLocation || (!useCurrentLocation && !departureCoordinates) || !destinationCoordinates}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
            >
                {isLoading ?
                    <span className="flex items-center">
                        <div className="w-4 h-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        Calculating Route...
                    </span>
                    : destinationCoordinates && (!useCurrentLocation && departureCoordinates || useCurrentLocation) ? 
                      'Get Directions' : 'Enter Route Details'}
            </Button>

            {/* Add note about NYC-only policy */}
            <div className="text-xs text-gray-500 mt-2 text-center">
                Note: SafeRouteNYC only supports locations within New York City &apos;s five boroughs.
            </div>
        </form>
    );
};

export default LocationSearchForm;