import React, { useState, useEffect, useRef } from "react";
import * as Switch from "@radix-ui/react-switch";
import { useNotification } from "../ToastComponent/NotificationContext";
import { apiGet } from "@/utils/fetch/fetch";

const HeatmapLayer = ({ mapLoaded, mapInstanceRef }) => {
  const heatLayerRef = useRef(null);
  const { showError } = useNotification();
  const [heatmapPoints, setHeatmapPoints] = useState([]); // Use state for heatmap data
  const [heatmapDataLoaded, setHeatmapDataLoaded] = useState(false);
  //   Swtich state
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Add heatmap data
  useEffect(() => {
    console.log("useEffect for heatmap data is running"); // Add this line
    const fetchHeatmapData = async () => {
      try {
        const data = await apiGet("map/heatmap-data/"); // Use apiGet
        const formattedData = data.map((item) => [
          item.latitude,
          item.longitude,
          item.intensity,
        ]);
        console.log("Formatted Heatmap Data (before set):", formattedData);
        setHeatmapPoints(formattedData);
        console.log(formattedData);
        console.log(heatmapPoints);
        setHeatmapDataLoaded(true); // Set to true when data is loaded
      } catch (err) {
        console.error("Error fetching heatmap data:", err);
        // setError("Failed to load heatmap data. Please try again.");
        showError("Failed to load heatmap data. Please try again. check logs");
        console.error(err);
      }
    };

    fetchHeatmapData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Heatmap layer
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded || !heatmapDataLoaded) return;

    const map = mapInstanceRef.current;

    if (!heatLayerRef.current) {
      heatLayerRef.current = L.heatLayer(heatmapPoints, {
        radius: 10,
        blur: 10,
        maxZoom: 20,
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
    }

    if (showHeatmap) {
      heatLayerRef.current.addTo(map);
    } else {
      map.removeLayer(heatLayerRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, showHeatmap]);

  return (
    <>
      {/* Heatmap Toggle */}
      <div className="absolute bottom-4 left-4 z-[499] bg-white p-2 rounded-md shadow-md flex items-center gap-2">
        <label
          className="text-sm font-medium text-legend-text"
          htmlFor="heatmap-switch"
        >
          Crime Heatmap
        </label>
        <Switch.Root
          id="heatmap-switch"
          checked={showHeatmap}
          onCheckedChange={setShowHeatmap}
          className={`${
            showHeatmap ? "bg-map-on" : "bg-gray-200"
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
        >
          <Switch.Thumb
            className={`${
              showHeatmap ? "translate-x-6" : "translate-x-1"
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch.Root>
      </div>
    </>
  );
};

export default HeatmapLayer;
