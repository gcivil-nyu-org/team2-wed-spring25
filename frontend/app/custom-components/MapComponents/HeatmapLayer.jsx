"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNotification } from "../ToastComponent/NotificationContext";
import { authAPI } from "@/utils/fetch/fetch";
import L from "leaflet";
import "leaflet.heat";

// Global state to prevent multiple components from fetching simultaneously
let isPrimaryFetching = false;
let isSecondaryFetching = false;

// Cache keys and expiry
const PRIMARY_CACHE_KEY = "primary_heatmap_data_cache";
const SECONDARY_CACHE_KEY = "secondary_heatmap_data_cache";
const CACHE_EXPIRY = 1000 * 60 * 60 * 3; // 3 hours cache

const HeatmapLayer = ({ mapLoaded, mapInstanceRef }) => {
  const primaryHeatLayerRef = useRef(null);
  const secondaryHeatLayerRef = useRef(null);
  const { showError, showWarning } = useNotification();
  
  // Primary heatmap states
  const [primaryHeatmapPoints, setPrimaryHeatmapPoints] = useState([]);
  const [primaryDataLoaded, setPrimaryDataLoaded] = useState(false);
  const [isPrimaryLoading, setIsPrimaryLoading] = useState(false);
  const [primaryRetryCount, setPrimaryRetryCount] = useState(0);
  
  // Secondary heatmap states
  const [secondaryHeatmapPoints, setSecondaryHeatmapPoints] = useState([]);
  const [secondaryDataLoaded, setSecondaryDataLoaded] = useState(false);
  const [isSecondaryLoading, setIsSecondaryLoading] = useState(false);
  const [secondaryRetryCount, setSecondaryRetryCount] = useState(0);
  
  // New toggle states for layers
  const [showLowCrime, setShowLowCrime] = useState(false);
  const [showHighCrime, setShowHighCrime] = useState(false);
  const [showingAny, setShowingAny] = useState(false);
  
  // Define loading state for UI
  const isLoading = isPrimaryLoading || isSecondaryLoading;
  const dataLoaded = primaryDataLoaded && secondaryDataLoaded;
  const hasData = primaryHeatmapPoints.length > 0 || secondaryHeatmapPoints.length > 0;

  // Fetch primary heatmap data (high crime areas)
  const fetchPrimaryHeatmapData = useCallback(async () => {
    if (isPrimaryLoading || isPrimaryFetching) return;
    
    // Check cache first
    try {
      const cachedData = localStorage.getItem(PRIMARY_CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const now = new Date().getTime();
        
        if (now - timestamp < CACHE_EXPIRY && Array.isArray(data) && data.length > 0) {
          setPrimaryHeatmapPoints(data);
          setPrimaryDataLoaded(true);
          return;
        }
      }
    } catch (error) {
      console.warn("Primary cache read error:", error);
    }
    
    setIsPrimaryLoading(true);
    isPrimaryFetching = true;
    
    try {
      const data = await authAPI.authenticatedGet("map/heatmap-data/?type=1");
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid or empty primary heatmap data received");
      }
      
      const formattedData = data.map((item) => [
        item.latitude,
        item.longitude,
        item.intensity,
      ]);
            
      // Store in cache
      try {
        localStorage.setItem(
          PRIMARY_CACHE_KEY, 
          JSON.stringify({
            data: formattedData,
            timestamp: new Date().getTime()
          })
        );
      } catch (cacheError) {
        console.warn("Primary cache write error:", cacheError);
      }
      
      setPrimaryHeatmapPoints(formattedData);
      setPrimaryDataLoaded(true);
      setPrimaryRetryCount(0);
    } catch (err) {
      console.error("Error fetching primary heatmap data:", err);
      
      if (primaryRetryCount < 2) {
        showWarning(
          "Loading high crime data...",
          "Retrying to load high crime heatmap data",
          "primary_heatmap_retry"
        );
        setPrimaryRetryCount((prev) => prev + 1);
        setTimeout(() => {
          setIsPrimaryLoading(false);
          isPrimaryFetching = false;
          fetchPrimaryHeatmapData();
        }, 3000);
      } else {
        showError(
          "High crime data unavailable",
          "Could not load high crime heatmap data. Some features may be limited.",
          "primary_heatmap_error"
        );
        setPrimaryDataLoaded(true);
        setPrimaryHeatmapPoints([]);
      }
    } finally {
      setIsPrimaryLoading(false);
      isPrimaryFetching = false;
    }
  }, [primaryRetryCount, isPrimaryLoading, showError, showWarning]);

  // Fetch secondary heatmap data (lower crime areas)
  const fetchSecondaryHeatmapData = useCallback(async () => {
    if (isSecondaryLoading || isSecondaryFetching) return;
    
    // Check cache first
    try {
      const cachedData = localStorage.getItem(SECONDARY_CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const now = new Date().getTime();
        
        if (now - timestamp < CACHE_EXPIRY && Array.isArray(data) && data.length > 0) {
          setSecondaryHeatmapPoints(data);
          setSecondaryDataLoaded(true);
          return;
        }
      }
    } catch (error) {
      console.warn("Secondary cache read error:", error);
    }
    
    setIsSecondaryLoading(true);
    isSecondaryFetching = true;
    
    try {
      const data = await authAPI.authenticatedGet("map/heatmap-data/?type=2");
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid or empty secondary heatmap data received");
      }
      
      const formattedData = data.map((item) => [
        item.latitude,
        item.longitude,
        item.intensity,
      ]);
            
      // Store in cache
      try {
        localStorage.setItem(
          SECONDARY_CACHE_KEY, 
          JSON.stringify({
            data: formattedData,
            timestamp: new Date().getTime()
          })
        );
      } catch (cacheError) {
        console.warn("Secondary cache write error:", cacheError);
      }
      
      setSecondaryHeatmapPoints(formattedData);
      setSecondaryDataLoaded(true);
      setSecondaryRetryCount(0);
    } catch (err) {
      console.error("Error fetching secondary heatmap data:", err);
      
      if (secondaryRetryCount < 2) {
        showWarning(
          "Loading low crime data...",
          "Retrying to load low crime heatmap data",
          "secondary_heatmap_retry"
        );
        setSecondaryRetryCount((prev) => prev + 1);
        setTimeout(() => {
          setIsSecondaryLoading(false);
          isSecondaryFetching = false;
          fetchSecondaryHeatmapData();
        }, 3000);
      } else {
        showError(
          "Low crime data unavailable",
          "Could not load low crime heatmap data. Some features may be limited.",
          "secondary_heatmap_error"
        );
        setSecondaryDataLoaded(true);
        setSecondaryHeatmapPoints([]);
      }
    } finally {
      setIsSecondaryLoading(false);
      isSecondaryFetching = false;
    }
  }, [secondaryRetryCount, isSecondaryLoading, showError, showWarning]);

  // Fetch data once on component mount
  const primaryDataFetchedRef = useRef(false);
  const secondaryDataFetchedRef = useRef(false);
  
  useEffect(() => {
    // Only fetch primary data once
    if (!primaryDataFetchedRef.current) {
      primaryDataFetchedRef.current = true;
      fetchPrimaryHeatmapData();
    }
    
    // Only fetch secondary data once
    if (!secondaryDataFetchedRef.current) {
      secondaryDataFetchedRef.current = true;
      fetchSecondaryHeatmapData();
    }
    
    // Cleanup function
    return () => {
      setIsPrimaryLoading(false);
      isPrimaryFetching = false;
      setIsSecondaryLoading(false);
      isSecondaryFetching = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // For linter satisfaction only
  useEffect(() => {}, [fetchPrimaryHeatmapData, fetchSecondaryHeatmapData]);

  // Update showingAny state whenever either layer is visible
  useEffect(() => {
    setShowingAny(showLowCrime || showHighCrime);
  }, [showLowCrime, showHighCrime]);

  // Handle primary heatmap layer
  useEffect(() => {
    if (
      !mapInstanceRef?.current || 
      !mapLoaded || 
      !primaryDataLoaded || 
      !primaryHeatmapPoints.length
    ) {
      return;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      // Clean up existing primary layer
      if (primaryHeatLayerRef.current) {
        try {
          if (map.hasLayer(primaryHeatLayerRef.current)) {
            map.removeLayer(primaryHeatLayerRef.current);
          }
        } catch (e) {
          console.warn("Error removing existing primary layer:", e);
        }
        primaryHeatLayerRef.current = null;
      }

      // Create new primary heatmap layer (high crime)
      primaryHeatLayerRef.current = L.heatLayer(primaryHeatmapPoints, {
        radius: 15,
        blur: 15,
        maxZoom: 18,
        max: 1,
        minOpacity: 0.6,
        gradient: {
          0.2: "#1e3a8a", // dark blue
          0.4: "#1d4ed8", // blue
          0.6: "#dc2626", // red
          0.8: "#991b1b", // medium dark red
          1.0: "#7f1d1d", // dark red
        },
      });

      // Add to map if showHighCrime is true
      if (showHighCrime) {
        primaryHeatLayerRef.current.addTo(map);
      }
    } catch (error) {
      console.error("Error managing primary heatmap layer:", error);
      primaryHeatLayerRef.current = null;
    }

    return () => {
      try {
        if (primaryHeatLayerRef.current && map) {
          if (map.hasLayer && map.hasLayer(primaryHeatLayerRef.current)) {
            map.removeLayer(primaryHeatLayerRef.current);
          }
          primaryHeatLayerRef.current = null;
        }
      } catch (e) {
        console.warn("Error during primary heatmap cleanup:", e);
      }
    };
  }, [mapLoaded, primaryDataLoaded, primaryHeatmapPoints, mapInstanceRef, showHighCrime]);

  // Handle secondary heatmap layer
  useEffect(() => {
    if (
      !mapInstanceRef?.current || 
      !mapLoaded || 
      !secondaryDataLoaded || 
      !secondaryHeatmapPoints.length
    ) {
      return;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      // Clean up existing secondary layer
      if (secondaryHeatLayerRef.current) {
        try {
          if (map.hasLayer(secondaryHeatLayerRef.current)) {
            map.removeLayer(secondaryHeatLayerRef.current);
          }
        } catch (e) {
          console.warn("Error removing existing secondary layer:", e);
        }
        secondaryHeatLayerRef.current = null;
      }

      // Create new secondary heatmap layer (low crime)
      secondaryHeatLayerRef.current = L.heatLayer(secondaryHeatmapPoints, {
        radius: 15,
        blur: 15,
        maxZoom: 18,
        max: 1,
        minOpacity: 0.4,
        gradient: {
          0.2: "#fef3c7", // light amber
          0.4: "#fbbf24", // amber
          0.6: "#f59e0b", // amber/orange
          0.8: "#d97706", // dark orange
          1.0: "#b45309", // brown-orange
        },
      });

      // Add to map if showLowCrime is true
      if (showLowCrime) {
        secondaryHeatLayerRef.current.addTo(map);
      }
    } catch (error) {
      console.error("Error managing secondary heatmap layer:", error);
      secondaryHeatLayerRef.current = null;
    }

    return () => {
      try {
        if (secondaryHeatLayerRef.current && map) {
          if (map.hasLayer && map.hasLayer(secondaryHeatLayerRef.current)) {
            map.removeLayer(secondaryHeatLayerRef.current);
          }
          secondaryHeatLayerRef.current = null;
        }
      } catch (e) {
        console.warn("Error during secondary heatmap cleanup:", e);
      }
    };
  }, [mapLoaded, secondaryDataLoaded, secondaryHeatmapPoints, mapInstanceRef, showLowCrime]);

  // Toggle layer visibility when buttons are clicked
  useEffect(() => {
    if (!mapInstanceRef?.current) return;
    const map = mapInstanceRef.current;
    
    try {
      // First, remove both layers to control the stacking order
      if (primaryHeatLayerRef.current && map.hasLayer(primaryHeatLayerRef.current)) {
        map.removeLayer(primaryHeatLayerRef.current);
      }
      
      if (secondaryHeatLayerRef.current && map.hasLayer(secondaryHeatLayerRef.current)) {
        map.removeLayer(secondaryHeatLayerRef.current);
      }
      
      // Add layers in specific order: first low crime (bottom), then high crime (top)
      if (showLowCrime && secondaryHeatLayerRef.current) {
        secondaryHeatLayerRef.current.addTo(map);
      }
      
      // Always add high crime layer last so it appears on top
      if (showHighCrime && primaryHeatLayerRef.current) {
        primaryHeatLayerRef.current.addTo(map);
      }
    } catch (error) {
      console.error("Error toggling heatmap layers:", error);
    }
  }, [showHighCrime, showLowCrime, mapInstanceRef]);

  // Handle button clicks
  const handleOffClick = () => {
    setShowLowCrime(false);
    setShowHighCrime(false);
  };

  const handleLowClick = () => {
    setShowLowCrime(!showLowCrime);
  };

  const handleHighClick = () => {
    setShowHighCrime(!showHighCrime);
  };

  // Handle refresh for both layers
  const handleRefresh = () => {
    // Refresh primary data
    setPrimaryDataLoaded(false);
    setPrimaryRetryCount(0);
    fetchPrimaryHeatmapData();
    
    // Refresh secondary data
    setSecondaryDataLoaded(false);
    setSecondaryRetryCount(0);
    fetchSecondaryHeatmapData();
  };

  return (
    <>
      {/* Heatmap Control */}
      <div className="absolute bottom-[60px] left-4 z-[499] bg-[#1c2735] text-white p-2 rounded-md shadow-md flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white mr-3">Crime Heatmap</span>
          
          {isLoading && (
            <span className="text-xs text-gray-500 flex items-center">
              <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-map-bg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          )}
          
          {!isLoading && dataLoaded && !hasData && (
            <button 
              onClick={handleRefresh}
              className="text-xs text-map-bg hover:text-map-darkerbg"
            >
              Retry
            </button>
          )}
        </div>
        
        {/* shadcn-style Toggle Group */}
        <div className="inline-flex items-center justify-center rounded-md p-1 shadow-sm space-x-1" role="group">
          {/* OFF Button */}
          <button
            onClick={handleOffClick}
            disabled={!dataLoaded || !hasData}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${
              !showingAny 
                ? "bg-black text-white shadow-sm" 
                : "text-white hover:bg-gray-900 hover:text-white"
            } ${
              (!dataLoaded || !hasData) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Off
          </button>
          
          {/* LOW Button */}
          <button
            onClick={handleLowClick}
            disabled={!dataLoaded || !hasData}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${
              showLowCrime 
                ? "bg-amber-500 text-white shadow-sm" 
                : "text-white hover:bg-amber-700 hover:text-gray-900"
            } ${
              (!dataLoaded || !hasData) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Low
          </button>
          
          {/* HIGH Button */}
          <button
            onClick={handleHighClick}
            disabled={!dataLoaded || !hasData}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 ${
              showHighCrime 
                ? "bg-red-600 text-white shadow-sm" 
                : "text-white hover:bg-red-800 "
            } ${
              (!dataLoaded || !hasData) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            High
          </button>
        </div>
        
        {/* Legend - Always present with fixed height */}
        <div className="h-14 mt-2 text-xs font-medium text-white">
          {showingAny ? (
            <div className="flex flex-col gap-1">
              {showHighCrime && (
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-600 mr-1.5"></div>
                  <span>High Crime</span>
                </div>
              )}
              {showLowCrime && (
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-1.5"></div>
                  <span>Low Crime</span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full"></div>
          )}
        </div>
      </div>
    </>
  );
};

export default HeatmapLayer;