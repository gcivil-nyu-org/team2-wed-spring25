// app/custom-components/LocationSearchForm.js
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LocationSearchForm = ({ onSearch, isLoading, mapboxToken }) => {
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
    const [formError, setFormError] = useState(null);
    
    // Clear form error when inputs change
    useEffect(() => {
        if (formError) setFormError(null);
    }, [departure, destination, useCurrentLocation, formError]);
    
    // Remove auto-search to conserve Mapbox API requests
    
    // Function to fetch suggestions for departure
    const fetchDepartureSuggestions = async () => {
        if (!departure || departure.length < 3 || !mapboxToken || useCurrentLocation) return;
        
        setIsSearchingDeparture(true);
        try {
            console.log("Fetching departure suggestions for:", departure);
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(departure)}.json?access_token=${mapboxToken}&types=address,place,poi&limit=5`
            );
            
            if (!response.ok) throw new Error('Geocoding failed');
            
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                console.log("Received departure suggestions:", data.features.length);
                setDepartureSuggestions(data.features);
                setShowDepartureSuggestions(true);
            } else {
                console.log("No departure suggestions found");
                setDepartureSuggestions([]);
                setShowDepartureSuggestions(false);
            }
        } catch (error) {
            console.error('Error fetching departure suggestions:', error);
            setDepartureSuggestions([]);
            setFormError("Failed to fetch location suggestions. Please check your internet connection.");
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
            
            if (!response.ok) throw new Error('Geocoding failed');
            
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                console.log("Received destination suggestions:", data.features.length);
                setDestinationSuggestions(data.features);
                setShowDestinationSuggestions(true);
            } else {
                console.log("No destination suggestions found");
                setDestinationSuggestions([]);
                setShowDestinationSuggestions(false);
            }
        } catch (error) {
            console.error('Error fetching destination suggestions:', error);
            setDestinationSuggestions([]);
            setFormError("Failed to fetch location suggestions. Please check your internet connection.");
        } finally {
            setIsSearchingDestination(false);
        }
    };
    
    // Handle selecting a departure suggestion
    const handleSelectDeparture = (suggestion) => {
        console.log("Selected departure:", suggestion.place_name);
        setDeparture(suggestion.place_name);
        // Convert coordinates to [lat, lng] for Leaflet
        const [lng, lat] = suggestion.center;
        setDepartureCoordinates([lat, lng]);
        setShowDepartureSuggestions(false);
        setUseCurrentLocation(false);
    };
    
    // Handle selecting a destination suggestion
    const handleSelectDestination = (suggestion) => {
        console.log("Selected destination:", suggestion.place_name);
        setDestination(suggestion.place_name);
        // Convert coordinates to [lat, lng] for Leaflet
        const [lng, lat] = suggestion.center;
        setDestinationCoordinates([lat, lng]);
        setShowDestinationSuggestions(false);
    };
    
    // Toggle current location usage
    const toggleUseCurrentLocation = () => {
        setUseCurrentLocation(!useCurrentLocation);
        if (!useCurrentLocation) {
            // If enabling current location, clear departure
            setDeparture('');
            setDepartureCoordinates(null);
            setShowDepartureSuggestions(false);
        }
    };
    
    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError(null);
        
        // Validation
        if (!useCurrentLocation && !departureCoordinates) {
            setFormError('Please select a departure location from the suggestions');
            return;
        }
        
        if (!destinationCoordinates) {
            setFormError('Please select a destination from the suggestions');
            return;
        }
        
        console.log("Form is valid, submitting with coordinates:", {
            departure: useCurrentLocation ? "Current Location" : departure,
            departureCoordinates: departureCoordinates,
            destination: destination,
            destinationCoordinates: destinationCoordinates
        });
        
        onSearch({
            departure: useCurrentLocation ? "Current Location" : departure,
            departureCoordinates: useCurrentLocation ? null : departureCoordinates, 
            destination,
            destinationCoordinates,
            useCurrentLocation
        });
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
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Input
                            type="text"
                            id="departure"
                            placeholder={useCurrentLocation ? "Using current location" : "Enter departure location"}
                            value={departure}
                            onChange={(e) => setDeparture(e.target.value)}
                            onFocus={() => {}}
                            onClick={(e) => e.stopPropagation()}
                            className={`flex-1 ${useCurrentLocation ? 'bg-gray-100' : ''}`}
                            disabled={useCurrentLocation}
                        />
                        <Button 
                            type="button" 
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
                        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="max-h-60 overflow-auto">
                                {departureSuggestions.map((suggestion) => (
                                    <div
                                        key={suggestion.id}
                                        onClick={() => handleSelectDeparture(suggestion)}
                                        className="cursor-pointer hover:bg-gray-100 p-3 border-b border-gray-100"
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
                            onFocus={() => {}}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1"
                        />
                        <Button 
                            type="button" 
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
                        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="max-h-60 overflow-auto">
                                {destinationSuggestions.map((suggestion) => (
                                    <div
                                        key={suggestion.id}
                                        onClick={() => handleSelectDestination(suggestion)}
                                        className="cursor-pointer hover:bg-gray-100 p-3 border-b border-gray-100"
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
                disabled={isLoading || (!useCurrentLocation && !departureCoordinates) || !destinationCoordinates}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
            >
                {isLoading ? 
                    <span className="flex items-center">
                        <div className="w-4 h-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        Calculating Route...
                    </span>
                    : 'Get Directions'}
            </Button>
        </form>
    );
};

export default LocationSearchForm;