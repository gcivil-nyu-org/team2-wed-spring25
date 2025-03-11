'use client'
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/app/custom-components/AuthHook';
import { useNotification } from '@/app/custom-components/ToastComponent/NotificationContext';
import LocationSearchForm from '@/app/custom-components/LocationSearchForm';
import { DashboardHeader } from '../home/page';

// Dynamically import the map component with SSR disabled
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

export function LogoutButton() {
    const { logout } = useAuth();

    return (
        <Button
            onClick={logout}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
        >
            Logout
        </Button>
    );
}

// Dashboard header component
export function MapPage() {
    const { user } = useAuth();

    return (
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-4">
                {user && (
                    <span className="text-sm text-white/80">
                        Logged in as: {user.email}
                    </span>
                )}
                <LogoutButton />
                <Button><Link href={`map/`}>Map Route</Link></Button>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const [mapboxToken, setMapboxToken] = useState('');
    const [departureCoords, setDepartureCoords] = useState(null);
    const [destinationCoords, setDestinationCoords] = useState(null);
    const [useCurrentLocation, setUseCurrentLocation] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { showError, showWarning, showSuccess } = useNotification();

    // Used to force map re-renders when needed
    const [mapKey, setMapKey] = useState(1);

    useEffect(() => {
        // Get the Mapbox API key safely
        const token = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || '';
        if (!token) {
            showError(
                'Configuration error',
                'Missing Mapbox API key. Please set NEXT_PUBLIC_MAPBOX_API_KEY in your .env.local file.',
                'api_key_missing'
            );
        } else {
            setMapboxToken(token);
        }
    }, [showError]);

    // Handle search form submission
    const handleSearch = async ({
        departure,
        departureCoordinates,
        destination,
        destinationCoordinates,
        useCurrentLocation: useCurrentLocationValue
    }) => {
        if (!mapboxToken) {
            showError(
                'Configuration error',
                'Missing Mapbox API key. The map cannot be displayed.',
                'api_key_missing'
            );
            return;
        }

        setIsLoading(true);

        try {
            console.log('Search form submitted with values:', {
                departure,
                departureCoordinates,
                destination,
                destinationCoordinates,
                useCurrentLocation: useCurrentLocationValue
            });

            // Validation
            if (!useCurrentLocationValue && !departureCoordinates) {
                showWarning(
                    'Departure location required',
                    'Please select a departure location from the suggestions',
                    'location_validation_error'
                );
                setIsLoading(false);
                return;
            }

            if (!destinationCoordinates) {
                showWarning(
                    'Destination required',
                    'Please select a destination from the suggestions',
                    'location_validation_error'
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
                // Force a complete re-render of map
                setMapKey(prev => prev + 1);

                // Then set the new values
                setUseCurrentLocation(!!useCurrentLocationValue);

                if (departureCoordinates) {
                    setDepartureCoords(departureCoordinates);
                }

                // Set endpoint with a slight delay to ensure start point is registered first
                setTimeout(() => {
                    setDestinationCoords(destinationCoordinates);
                    setIsLoading(false);

                    showSuccess(
                        'Route planning started',
                        `Planning route from ${useCurrentLocationValue ? 'your current location' : departure} to ${destination}`,
                        'route_planning'
                    );
                }, 100);
            }, 100);

        } catch (error) {
            console.error('Search error:', error);
            setIsLoading(false);

            showError(
                'Route planning failed',
                error.message || 'Error processing locations. Please try again.',
                'route_planning_error'
            );
        }
    };

    return (
        <main className="min-h-screen  bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white p-8">
            <div className='max-w-4xl mx-auto'>
                <DashboardHeader />
                <div className="max-w-4xl mx-auto">

                    <div className="bg-white/10 rounded-lg p-4 mb-6">
                        <h2 className="text-xl font-semibold mb-3 text-white">Route Planner</h2>

                        {/* Location Search Form */}
                        <div className="mb-6">
                            <LocationSearchForm
                                onSearch={handleSearch}
                                isLoading={isLoading}
                                mapboxToken={mapboxToken}
                            />
                        </div>

                        {/* Map Container */}
                        {mapboxToken && (
                            <ClientOnlyMap
                                key={mapKey}
                                mapboxToken={mapboxToken}
                                departureCoords={departureCoords}
                                destinationCoords={destinationCoords}
                                useCurrentLocation={useCurrentLocation}
                            />
                        )}
                    </div>

                    {/* Instructions */}
                    <div className="bg-white/10 rounded-lg p-4 mb-6">
                        <h2 className="text-xl font-semibold mb-3 text-white">How to Use This Map</h2>
                        <ul className="list-disc pl-5 space-y-1 text-white/90">
                            <li>Check &quot;Use current location&quot; if you want to use your current location as the starting point</li>
                            <li>Or enter your departure address and click &quot;Search&quot; to find locations</li>
                            <li>Enter your destination address and click &quot;Search&quot; to find locations</li>
                            <li>Select locations from the suggestions to set your points</li>
                            <li>Click &quot;Get Directions&quot; to calculate your route</li>
                            <li>The app will plan a walking route, avoiding high-crime areas when possible</li>
                        </ul>
                        <p className="text-sm text-white/80 mt-4">
                            Note: Location services must be enabled in your browser when using &quot;Current Location&quot; as your starting point.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}