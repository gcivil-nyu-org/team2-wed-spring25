"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Switch from "@radix-ui/react-switch";
import { useNotification } from "../ToastComponent/NotificationContext";
import { apiGet } from "@/utils/fetch/fetch";
import L from "leaflet";
import "leaflet.heat";

// Global state to prevent multiple components from fetching simultaneously
// This prevents duplicate requests across component instances
let isGloballyFetching = false;
const CACHE_KEY = "heatmap_data_cache";
const CACHE_EXPIRY = 1000 * 60 * 60 * 3; // 3 hours cache

const HeatmapLayer = ({ mapLoaded, mapInstanceRef }) => {
  const heatLayerRef = useRef(null);
  const { showError, showWarning } = useNotification();
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [heatmapDataLoaded, setHeatmapDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Fetch heatmap data with caching and protection against infinite loops
  const fetchHeatmapData = useCallback(async () => {
    // Multiple protection layers against duplicate/infinite requests
    if (isLoading || isGloballyFetching) return;
    
    // Check cache first
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const now = new Date().getTime();
        
        // Use cache if it's still valid
        if (now - timestamp < CACHE_EXPIRY && Array.isArray(data) && data.length > 0) {
          setHeatmapPoints(data);
          setHeatmapDataLoaded(true);
          return;
        }
      }
    } catch (error) {
      console.warn("Cache read error:", error);
      // Continue to fetch if cache fails
    }
    
    // Set both local and global loading flags
    setIsLoading(true);
    isGloballyFetching = true;
    
    try {
      const data = await apiGet("map/heatmap-data/");
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid or empty heatmap data received");
      }
      
      const formattedData = data.map((item) => [
        item.latitude,
        item.longitude,
        item.intensity,
      ]);
            
      // Store in cache
      try {
        localStorage.setItem(
          CACHE_KEY, 
          JSON.stringify({
            data: formattedData,
            timestamp: new Date().getTime()
          })
        );
      } catch (cacheError) {
        console.warn("Cache write error:", cacheError);
      }
      
      setHeatmapPoints(formattedData);
      setHeatmapDataLoaded(true);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Error fetching heatmap data:", err);
      
      if (retryCount < 2) { // Reduced from 3 to 2 retries
        showWarning(
          "Loading crime data...",
          "Retrying to load crime heatmap data",
          "heatmap_retry"
        );
        setRetryCount((prev) => prev + 1);
        // Retry after delay - with cleanup of loading states
        setTimeout(() => {
          setIsLoading(false);
          isGloballyFetching = false;
          fetchHeatmapData();
        }, 3000); // Increased delay to prevent rapid retries
      } else {
        showError(
          "Crime data unavailable",
          "Could not load crime heatmap data. Some features may be limited.",
          "heatmap_error"
        );
        // Still set data loaded to true to prevent continuous retries
        setHeatmapDataLoaded(true);
        setHeatmapPoints([]);
      }
    } finally {
      setIsLoading(false);
      isGloballyFetching = false;
    }
  }, [retryCount, isLoading, showError, showWarning]);

  // One-time data fetch with cleanup to prevent memory leaks
  const dataFetchedRef = useRef(false);
  
  useEffect(() => {
    // Only fetch once per component instance
    if (!dataFetchedRef.current) {
      dataFetchedRef.current = true;
      fetchHeatmapData();
    }
    
    // Cleanup function to prevent memory leaks and stop any pending operations
    return () => {
      setIsLoading(false);
      isGloballyFetching = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once
  
  // Explicitly add the callback as a dependency to satisfy React lint rules
  useEffect(() => {
    // Intentionally empty to just satisfy the linter
  }, [fetchHeatmapData]);

  // Handle heatmap layer creation and visibility with strong protections
  useEffect(() => {
    // Only proceed if all conditions are met
    if (
      !mapInstanceRef?.current || 
      !mapLoaded || 
      !heatmapDataLoaded || 
      !heatmapPoints.length
    ) {
      return;
    }

    // Safety check - we don't want to try to access map if it's not defined
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      // Clean up any existing heatmap layer
      if (heatLayerRef.current) {
        try {
          if (map.hasLayer(heatLayerRef.current)) {
            map.removeLayer(heatLayerRef.current);
          }
        } catch (e) {
          console.warn("Error removing existing layer:", e);
        }
        heatLayerRef.current = null;
      }

      // Create new heatmap layer
      heatLayerRef.current = L.heatLayer(heatmapPoints, {
        radius: 15,
        blur: 15,
        maxZoom: 18,
        max: 1,
        minOpacity: 0.6,
        gradient: {
          0.2: "#1e3a8a",
          0.4: "#1d4ed8",
          0.6: "#dc2626",
          0.8: "#991b1b",
          1.0: "#7f1d1d",
        },
      });

      // Add to map if toggle is enabled
      if (showHeatmap) {
        heatLayerRef.current.addTo(map);
      }
    } catch (error) {
      console.error("Error managing heatmap layer:", error);
      // Reset state to prevent endless refresh cycles
      heatLayerRef.current = null;
    }

    // Cleanup function with error handling
    return () => {
      try {
        if (heatLayerRef.current && map) {
          if (map.hasLayer && map.hasLayer(heatLayerRef.current)) {
            map.removeLayer(heatLayerRef.current);
          }
          heatLayerRef.current = null;
        }
      } catch (e) {
        console.warn("Error during heatmap cleanup:", e);
      }
    };
  }, [mapLoaded, heatmapDataLoaded, heatmapPoints, mapInstanceRef, showHeatmap]);

  // Handle toggle changes
  useEffect(() => {
    if (!mapInstanceRef?.current || !heatLayerRef.current) return;

    const map = mapInstanceRef.current;
    
    try {
      if (showHeatmap) {
        if (!map.hasLayer(heatLayerRef.current)) {
          heatLayerRef.current.addTo(map);
        }
      } else {
        if (map.hasLayer(heatLayerRef.current)) {
          map.removeLayer(heatLayerRef.current);
        }
      }
    } catch (error) {
      console.error("Error toggling heatmap layer:", error);
    }
  }, [showHeatmap, mapInstanceRef]);

  // Handle manual refresh
  const handleRefresh = () => {
    setHeatmapDataLoaded(false);
    setRetryCount(0);
    fetchHeatmapData();
  };

  return (
    <>
      {/* Heatmap Toggle */}
      <div className="absolute bottom-4 left-4 z-[499] bg-white p-2 rounded-md shadow-md flex items-center gap-2">
        <label
          className="text-sm font-medium text-gray-700"
          htmlFor="heatmap-switch"
        >
          Crime Heatmap
        </label>
        <Switch.Root
          id="heatmap-switch"
          checked={showHeatmap}
          onCheckedChange={setShowHeatmap}
          disabled={!heatmapDataLoaded || heatmapPoints.length === 0}
          className={`${
            showHeatmap ? "bg-indigo-600" : "bg-gray-200"
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            (!heatmapDataLoaded || heatmapPoints.length === 0) ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Switch.Thumb
            className={`${
              showHeatmap ? "translate-x-6" : "translate-x-1"
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch.Root>
        
        {isLoading && (
          <span className="text-xs text-gray-500 ml-2 flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        )}
        
        {!isLoading && heatmapDataLoaded && heatmapPoints.length === 0 && (
          <button 
            onClick={handleRefresh}
            className="ml-2 text-xs text-indigo-600 hover:text-indigo-800"
          >
            Retry
          </button>
        )}
      </div>
    </>
  );
};

export default HeatmapLayer;