import React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import HeatmapLayer from "@/app/custom-components/MapComponents/HeatmapLayer";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiGet } from "@/utils/fetch/fetch";

// Mock dependencies
jest.mock("@/app/custom-components/ToastComponent/NotificationContext", () => ({
  useNotification: jest.fn(),
}));

jest.mock("@/utils/fetch/fetch", () => ({
  apiGet: jest.fn(),
}));

// Mock Leaflet
const mockAddTo = jest.fn();
const mockRemoveLayer = jest.fn();

jest.mock("leaflet", () => ({
  heatLayer: jest.fn(() => ({
    addTo: mockAddTo,
    removeLayer: mockRemoveLayer,
  })),
}));

// Add console mocking at the top
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});

  // Mock global L object
  global.L = {
    heatLayer: jest.fn(() => ({
      addTo: jest.fn(),
      removeLayer: jest.fn(),
    })),
  };
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
  delete global.L;
});

describe("HeatmapLayer", () => {
  const mockShowError = jest.fn();
  const mockMapInstance = {
    removeLayer: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useNotification.mockReturnValue({ showError: mockShowError });
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

    expect(mockShowError).toHaveBeenCalledWith(
      "Failed to load heatmap data. Please try again. check logs"
    );
  });

  it("initializes heatmap layer when data is loaded", async () => {
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

    // Check if heatmap layer exists
    expect(global.L.heatLayer).toHaveBeenCalled();
  });
});
