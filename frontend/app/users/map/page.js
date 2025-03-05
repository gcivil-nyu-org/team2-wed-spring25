// app/users/map/page.js
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import our simple LocationSearchForm component
import LocationSearchForm from '@/app/custom-components/LocationSearchForm';

// Dynamically import the MapComponent with no SSR
const ClientOnlyMap = dynamic(
    () => import('@/app/custom-components/MapComponent'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-lg font-semibold">Loading map component...</div>
            </div>
        )
    }
);

export default function MapPage() {
    const [startPoint, setStartPoint] = useState(null);
    const [endPoint, setEndPoint] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mapboxToken, setMapboxToken] = useState('');
    const [useCurrentLocation, setUseCurrentLocation] = useState(false);
    const [mapKey, setMapKey] = useState(1); // Used to force re-render the map

    useEffect(() => {
        // Get the Mapbox API key safely
        const token = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || '';
        if (!token) {
            setError('Missing Mapbox API key. Please set NEXT_PUBLIC_MAPBOX_API_KEY in your .env.local file.');
        } else {
            setMapboxToken(token);
        }
    }, []);

    // Handle search form submission
    const handleSearch = async ({
        departure,
        departureCoordinates,
        destination,
        destinationCoordinates,
        useCurrentLocation: useCurrentLocationValue
    }) => {
        if (!mapboxToken) {
            setError('Missing Mapbox API key');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            console.log('Form submitted with values:', {
                departure,
                departureCoordinates,
                destination,
                destinationCoordinates,
                useCurrentLocation: useCurrentLocationValue
            });
            
            // Validation
            if (!useCurrentLocationValue && !departureCoordinates) {
                setError('Please select a departure location from the suggestions');
                setIsLoading(false);
                return;
            }
            
            if (!destinationCoordinates) {
                setError('Please select a destination from the suggestions');
                setIsLoading(false);
                return;
            }
            
            // First, reset the map completely
            setStartPoint(null);
            setEndPoint(null);
            setUseCurrentLocation(false);
            
            // Wait for state to clear
            setTimeout(() => {
                // Force a complete re-render of map
                setMapKey(prev => prev + 1);
                
                // Then set the new values
                setUseCurrentLocation(!!useCurrentLocationValue);
                
                if (departureCoordinates) {
                    setStartPoint(departureCoordinates);
                }
                
                // Set endpoint with a slight delay to ensure start point is registered first
                setTimeout(() => {
                    setEndPoint(destinationCoordinates);
                    setIsLoading(false);
                }, 100);
            }, 100);
            
        } catch (error) {
            console.error('Search error:', error);
            setError('Error processing locations. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Safe Route Planner</h1>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {error}
                    <button 
                        onClick={() => setError(null)} 
                        className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded"
                    >
                        Dismiss
                    </button>
                </div>
            )}
            
            <LocationSearchForm 
                onSearch={handleSearch} 
                isLoading={isLoading} 
                mapboxToken={mapboxToken}
            />
            
            {mapboxToken ? (
                <ClientOnlyMap
                    key={mapKey} // Force complete re-render
                    mapboxToken={mapboxToken}
                    startCoords={useCurrentLocation ? null : startPoint}
                    endCoords={endPoint}
                />
            ) : (
                ''
            )}

            <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-2">How to Use This Map</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Check &quot;Use current location&quot; if you want to use your current location as the starting point</li>
                    <li>Or enter your departure address and click &quot;Search&quot; to find locations</li>
                    <li>Enter your destination address and click &quot;Search&quot; to find locations</li>
                    <li>Select locations from the suggestions to set your points</li>
                    <li>Click &quot;Get Directions&quot; to calculate your route</li>
                    <li>The app will plan a walking route, avoiding high-crime areas when possible</li>
                </ul>
                <p className="text-sm text-gray-600 mt-4">
                    Note: Location services must be enabled in your browser when using &quot;Current Location&quot; as your starting point.
                </p>
            </div>
            
            {/* Future Crime Data Integration Notice */}
            <div className="mt-4 p-4 bg-indigo-50 text-indigo-800 rounded-lg border border-indigo-100">
                <h2 className="text-lg font-semibold mb-2">Safety Features</h2>
                <p>
                    This application will integrate crime data to help you navigate around higher-risk areas.
                    Currently in development, this feature will provide safer walking routes by analyzing 
                    historical crime patterns and avoiding streets with higher incident rates when possible.
                </p>
            </div>
        </div>
    );
}