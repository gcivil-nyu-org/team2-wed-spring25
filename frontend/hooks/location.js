import { useState, useEffect, useCallback, useRef } from 'react';

export const NYC_BOUNDS = {
    sw: [40.4957, -74.2557],
    ne: [40.9176, -73.7002],
};

export const isWithinNYC = ([lat, lng]) =>
    lat >= NYC_BOUNDS.sw[0] &&
    lat <= NYC_BOUNDS.ne[0] &&
    lng >= NYC_BOUNDS.sw[1] &&
    lng <= NYC_BOUNDS.ne[1];


export function useUserLocationWithNYCCheck() {
    const [userLocation, setUserLocation] = useState(null);
    const [isLocationValid, setIsLocationValid] = useState(false);
    const [isLocationAvailable, setIsLocationAvailable] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [locationDenied, setLocationDenied] = useState(false); // Clear boolean state
    const [locationError, setLocationError] = useState(null);
    const watchIdRef = useRef(null);

    const handlePositionUpdate = useCallback((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const location = [lat, lng];

        setUserLocation(location);
        setLocationDenied(false);

        // Check if location is within NYC
        const validLocation = isWithinNYC(location);
        setIsLocationValid(validLocation);

        if (!validLocation) {
            setLocationError("Current location is outside NYC boundaries");
        } else {
            setLocationError(null);
        }

        setIsLocationAvailable(true);
        setIsGettingLocation(false);
    }, []);

    const handlePositionError = useCallback((error) => {
        console.error("Geolocation error:", error);
        setIsLocationAvailable(false);

        // Explicitly check for permission denied (error.code === 1)
        if (error.code === 1) {
            setLocationDenied(true);
            setLocationError("Location permission denied");
        } else {
            setLocationDenied(false);
        }

        setIsGettingLocation(false);
    }, []);

    const fetchUserLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setIsLocationAvailable(false);
            setLocationError("Browser does not support geolocation");
            return;
        }

        // Clear any existing watch
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        setIsGettingLocation(true);
        setLocationError(null);

        // Get initial position
        navigator.geolocation.getCurrentPosition(
            handlePositionUpdate,
            handlePositionError,
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        // Then set up continuous watching
        watchIdRef.current = navigator.geolocation.watchPosition(
            handlePositionUpdate,
            handlePositionError,
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
    }, [handlePositionUpdate, handlePositionError]);

    // Try to get location on initial mount
    useEffect(() => {
        fetchUserLocation();

        // Cleanup on unmount
        return () => {
            if (watchIdRef.current !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [fetchUserLocation]);

    return {
        userLocation,
        isLocationValid,
        isLocationAvailable,
        isGettingLocation,
        locationDenied,
        locationError,
        fetchUserLocation
    };
}