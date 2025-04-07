// Mock leaflet first
const mockAddTo = jest.fn();
const mockRemoveLayer = jest.fn();
const mockHasLayer = jest.fn();

jest.mock("leaflet", () => ({
  heatLayer: jest.fn(() => ({
    addTo: mockAddTo,
    removeLayer: mockRemoveLayer,
    hasLayer: mockHasLayer,
  })),
}));

// Mock leaflet.heat
jest.mock("leaflet.heat", () => {});

import React from "react";
import { render, fireEvent, act, screen } from "@testing-library/react";
import HeatmapLayer from "@/app/custom-components/MapComponents/HeatmapLayer";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiGet } from "@/utils/fetch/fetch";
import L from "leaflet"; // Import leaflet to use the mock

// Mock dependencies
jest.mock("@/app/custom-components/ToastComponent/NotificationContext", () => ({
  useNotification: jest.fn(),
}));

jest.mock("@/utils/fetch/fetch", () => ({
  apiGet: jest.fn(),
}));

// Add console mocking
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
  console.warn.mockRestore();
});

describe("HeatmapLayer", () => {
  const mockShowError = jest.fn();
  const mockShowWarning = jest.fn();
  const mockMapInstance = {
    removeLayer: jest.fn(),
    hasLayer: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useNotification.mockReturnValue({
      showError: mockShowError,
      showWarning: mockShowWarning,
    });

    // Mock localStorage for all tests
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
  });

  it("renders heatmap toggle switch", () => {
    const { getByText, getByRole } = render(
      <HeatmapLayer
        mapLoaded={true}
        mapInstanceRef={{ current: mockMapInstance }}
      />
    );

    expect(getByText("Crime Heatmap")).toBeInTheDocument();
    expect(getByRole("switch")).toBeInTheDocument();
  });

  it("fetches heatmap data on mount", async () => {
    const mockData = [
      { latitude: 1, longitude: 1, intensity: 0.5 },
      { latitude: 2, longitude: 2, intensity: 0.8 },
    ];

    apiGet.mockResolvedValueOnce(mockData);

    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });

    expect(apiGet).toHaveBeenCalledWith("map/heatmap-data/");
  });

  it("handles API errors gracefully", async () => {
    apiGet.mockRejectedValueOnce(new Error("API Error"));

    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });

    expect(mockShowWarning).toHaveBeenCalledWith(
      "Loading crime data...",
      "Retrying to load crime heatmap data",
      "heatmap_retry"
    );
  });

  it("initializes heatmap layer when data is loaded", async () => {
    // Mock localStorage
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
    });

    const mockData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
    apiGet.mockResolvedValueOnce(mockData);

    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
      // Wait for promises to resolve
      await Promise.resolve();
    });

    // Verify heatmap data was loaded
    expect(apiGet).toHaveBeenCalledWith("map/heatmap-data/");
  });

  it("handles toggle state correctly", async () => {
    const mockData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
    apiGet.mockResolvedValueOnce(mockData);

    let component;
    await act(async () => {
      component = render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });

    const toggle = component.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    // Toggle on
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(toggle).toHaveAttribute("aria-checked", "true");

    // Toggle off
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("handles missing map instance gracefully", () => {
    render(
      <HeatmapLayer mapLoaded={true} mapInstanceRef={{ current: null }} />
    );

    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("toggles heatmap visibility when switch is clicked", async () => {
    const mockData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
    apiGet.mockResolvedValueOnce(mockData);

    let rendered;
    await act(async () => {
      rendered = render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
    });

    const toggle = rendered.getByRole("switch");

    // Toggle on
    await act(async () => {
      fireEvent.click(toggle);
    });

    // Check if heatmap layer exists using the imported L mock
    expect(L.heatLayer).toHaveBeenCalled();
  });

  it("adds the heatmap layer to the map when data is loaded and toggle is on", async () => {
    const mockData = [{ latitude: 1, longitude: 1, intensity: 0.5 }];
    apiGet.mockResolvedValueOnce(mockData);

    await act(async () => {
      render(
        <HeatmapLayer
          mapLoaded={true}
          mapInstanceRef={{ current: mockMapInstance }}
        />
      );
      await Promise.resolve();
    });

    const toggle = screen.getByRole("switch");

    await act(async () => {
      fireEvent.click(toggle);
    });

    // Ensure heatLayer was called with correct data format
    expect(L.heatLayer).toHaveBeenCalledWith(
      [[1, 1, 0.5]],
      expect.objectContaining({
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
      })
    );

    // Verify the layer was added to the map using our mock function
    expect(mockAddTo).toHaveBeenCalled();
  });

  
});
