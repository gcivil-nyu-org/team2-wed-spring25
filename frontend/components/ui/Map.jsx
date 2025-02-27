"use client";
// dont change these 3 imports order
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";
import "leaflet-defaulticon-compatibility";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useState, useEffect } from "react";
import "leaflet.heat";

function LocationMarker() {
  const [position, setPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const map = useMapEvents({});

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      // OpenStreetMaps Nominatim Api accepts place names and coords
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        const newPosition = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setPosition(newPosition);
        map.flyTo(newPosition, map.getZoom());
      }
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  return (
    <>
      <div className="leaflet-top leaflet-right mt-2.5 mr-2.5">
        <form onSubmit={handleSearch} className="leaflet-control">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location..."
            className="p-1.5 w-52 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="ml-1.5 p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Search
          </button>
        </form>
      </div>
      {position && (
        <Marker position={position}>
          <Popup>Location found!</Popup>
        </Marker>
      )}
    </>
  );
}

function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Set willReadFrequently on all canvas elements
    document.querySelectorAll("canvas").forEach((canvas) => {
      canvas.willReadFrequently = true;
    });

    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 20,
      max: 1.0,
      minOpacity: 0.5,
      gradient: {
        0.2: "#4575b4", // Dark blue
        0.4: "#74add1", // Medium blue
        0.6: "#f46d43", // Orange
        0.8: "#d73027", // Dark red
        1.0: "#a50026", // Very dark red
      },
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

export default function Map() {
  const points = [
    [40.7527, -73.9772, 0.7], // Midtown East
    [40.7589, -73.9851, 0.8], // Times Square
    [40.7484, -73.9857, 0.6], // Korea Town
    [40.7466, -73.9742, 0.5], // Murray Hill
    [40.7308, -73.9974, 0.9], // Washington Square Park Center
    [40.7312, -73.9979, 0.8], // WSP Northwest Corner
    [40.7304, -73.9969, 0.8], // WSP Southeast Corner
  ];

  return (
    <MapContainer
      preferCanvas={true}
      center={[40.7308, -73.9974]}
      zoom={11}
      scrollWheelZoom={true}
      className="h-[100vh] w-full rounded-lg shadow-md"
      whenCreated={(map) => {
        const canvas = document.createElement("canvas");
        canvas.willReadFrequently = true;
        return map;
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[40.7128, -74.006]}>
        <Popup>New York City</Popup>
      </Marker>
      <HeatmapLayer points={points} />
      <LocationMarker />
    </MapContainer>
  );
}
