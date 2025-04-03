import React from "react";
import { render } from "@testing-library/react";
import RouteRenderer from "@/app/custom-components/MapComponents/RouteRender";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";

// Mock the notification context
jest.mock("@/app/custom-components/ToastComponent/NotificationContext", () => ({
  useNotification: jest.fn(),
}));

// Mock Leaflet
jest.mock("leaflet", () => {
  return {
    polyline: jest.fn(() => ({
      addTo: jest.fn().mockReturnThis(),
      setStyle: jest.fn(),
      on: jest.fn(),
      remove: jest.fn(),
    })),
    divIcon: jest.fn(() => ({})),
    marker: jest.fn(() => ({
      addTo: jest.fn().mockReturnThis(),
      remove: jest.fn(),
    })),
    control: jest.fn(() => ({
      addTo: jest.fn().mockReturnThis(),
      onAdd: jest.fn(),
      remove: jest.fn(),
    })),
  };
});

// Add this mock at the top with other mocks
jest.mock("@/app/custom-components/RoutingComponets/RouteHandler", () => ({
  extractCoordinates: jest.fn((route) => route?.geometry?.coordinates || []),
  log: jest.fn(), // Mock the log function to prevent console output
}));

describe("RouteRenderer", () => {
  const mockShowError = jest.fn();
  const mockShowWarning = jest.fn();
  const mockSetActiveRoute = jest.fn();
  const mockMapInstance = {
    hasLayer: jest.fn(() => true),
    removeLayer: jest.fn(),
    addLayer: jest.fn(),
  };

  const mockRouteData = {
    initial_route: {
      geometry: {
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      },
    },
    safer_route: {
      geometry: {
        coordinates: [
          [0, 0],
          [2, 2],
        ],
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mocks
    useNotification.mockReturnValue({
      showError: mockShowError,
      showWarning: mockShowWarning,
    });
    // Reset Leaflet mocks
    const L = require("leaflet");
    L.polyline.mockImplementation(() => ({
      addTo: jest.fn().mockReturnThis(),
      setStyle: jest.fn(),
      on: jest.fn(),
      remove: jest.fn(),
    }));
    L.marker.mockImplementation(() => ({
      addTo: jest.fn().mockReturnThis(),
      remove: jest.fn(),
    }));
    L.control.mockImplementation(() => ({
      addTo: jest.fn().mockReturnThis(),
      onAdd: () => document.createElement("div"),
      remove: jest.fn(),
    }));
  });

  it("renders without crashing", () => {
    render(
      <RouteRenderer
        mapInstance={mockMapInstance}
        routeData={null}
        activeRoute="initial"
        setActiveRoute={() => {}}
        showWarning={mockShowWarning}
      />
    );
  });

  it("clears existing routes when unmounting", () => {
    const mockRemoveLayer = jest.fn();
    const mockMapInstance = {
      hasLayer: jest.fn(() => true),
      removeLayer: mockRemoveLayer,
      addLayer: jest.fn(),
    };

    const { unmount } = render(
      <RouteRenderer
        mapInstance={mockMapInstance}
        routeData={mockRouteData}
        activeRoute="initial"
        setActiveRoute={() => {}}
        showWarning={mockShowWarning}
      />
    );

    unmount();
    // Should be called for both routes and markers
    expect(mockRemoveLayer).toHaveBeenCalled();
  });

  it("handles missing route data gracefully", () => {
    render(
      <RouteRenderer
        mapInstance={mockMapInstance}
        routeData={null}
        activeRoute="initial"
        setActiveRoute={() => {}}
        showWarning={mockShowWarning}
      />
    );

    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("shows error when no valid coordinates are found", () => {
    const invalidRouteData = {
      initial_route: {
        geometry: {
          coordinates: [],
        },
      },
      safer_route: {
        geometry: {
          coordinates: [],
        },
      },
    };

    render(
      <RouteRenderer
        mapInstance={mockMapInstance}
        routeData={invalidRouteData}
        activeRoute="initial"
        setActiveRoute={() => {}}
        showWarning={mockShowWarning}
      />
    );

    expect(mockShowError).toHaveBeenCalledWith(
      "Could not display route",
      "No valid route coordinates found in the response",
      "route_coordinates_error"
    );
  });

  it("updates route styles when active route changes", () => {
    const L = require("leaflet");
    const mockSetStyle = jest.fn();

    // Mock polyline to return a route with the mockSetStyle function
    L.polyline.mockImplementation(() => ({
      addTo: jest.fn().mockReturnThis(),
      setStyle: mockSetStyle,
      on: jest.fn(),
      remove: jest.fn(),
    }));

    render(
      <RouteRenderer
        mapInstance={mockMapInstance}
        routeData={mockRouteData}
        activeRoute={null} // Start with no active route
        setActiveRoute={mockSetActiveRoute}
        showWarning={mockShowWarning}
      />
    );

    // Initial style should have null dashArray
    expect(mockSetStyle).toHaveBeenCalled();

    // Reset mock to check next call
    mockSetStyle.mockClear();

    // Re-render with active route
    render(
      <RouteRenderer
        mapInstance={mockMapInstance}
        routeData={mockRouteData}
        activeRoute="safer"
        setActiveRoute={mockSetActiveRoute}
        showWarning={mockShowWarning}
      />
    );

    // Style should update with dash array
    expect(mockSetStyle).toHaveBeenCalledWith(
      expect.objectContaining({
        dashArray: "5, 5",
      })
    );
  });

  it("handles route creation errors gracefully", () => {
    const L = require("leaflet");
    L.polyline.mockImplementationOnce(() => {
      throw new Error("Failed to create route");
    });

    const invalidRouteData = {
      initial_route: null,
      safer_route: null,
    };

    render(
      <RouteRenderer
        mapInstance={mockMapInstance}
        routeData={invalidRouteData}
        activeRoute="initial"
        setActiveRoute={() => {}}
        showWarning={mockShowWarning}
      />
    );

    expect(mockShowError).toHaveBeenCalledWith(
      "Could not display route",
      "No valid route coordinates found in the response",
      "route_coordinates_error"
    );
  });

  it("resets initialRender when routeData changes", () => {
    const mockSetView = jest.fn();
    const customMapInstance = {
      hasLayer: jest.fn(() => true),
      removeLayer: jest.fn(),
      addLayer: jest.fn(),
    };

    const { rerender } = render(
      <RouteRenderer
        mapInstance={customMapInstance}
        routeData={mockRouteData}
        activeRoute="initial"
        setActiveRoute={() => {}}
        showWarning={mockShowWarning}
      />
    );

    // Rerender with new route data
    const newRouteData = {
      ...mockRouteData,
      initial_route: {
        geometry: {
          coordinates: [
            [2, 2],
            [3, 3],
          ],
        },
      },
    };

    rerender(
      <RouteRenderer
        mapInstance={customMapInstance}
        routeData={newRouteData}
        activeRoute="initial"
        setActiveRoute={() => {}}
        showWarning={mockShowWarning}
      />
    );
  });

  it("sets up routes with correct Leaflet configuration", () => {
    const L = require("leaflet");
    const mockOn = jest.fn();
    const mockSetActiveRoute = jest.fn();

    L.polyline.mockImplementation(() => ({
      addTo: jest.fn().mockReturnThis(),
      setStyle: jest.fn(),
      on: mockOn,
      remove: jest.fn(),
    }));

    render(
      <RouteRenderer
        mapInstance={mockMapInstance}
        routeData={mockRouteData}
        activeRoute="initial"
        setActiveRoute={mockSetActiveRoute}
        showWarning={mockShowWarning}
      />
    );

    // Verify routes were created with correct configuration
    expect(L.polyline).toHaveBeenCalledWith(
      mockRouteData.initial_route.geometry.coordinates,
      expect.objectContaining({
        weight: 5,
      })
    );

    // Verify event listeners were attached
    expect(mockOn).toHaveBeenCalledWith("click", expect.any(Function));
  });

  it("adds legend control to map", () => {
    const L = require("leaflet");
    const mockAddTo = jest.fn().mockReturnThis();

    L.control.mockReturnValue({
      addTo: mockAddTo,
      onAdd: () => document.createElement("div"),
      remove: jest.fn(),
    });

    render(
      <RouteRenderer
        mapInstance={mockMapInstance}
        routeData={mockRouteData}
        activeRoute="initial"
        setActiveRoute={() => {}}
        showWarning={mockShowWarning}
      />
    );

    expect(mockAddTo).toHaveBeenCalledWith(mockMapInstance);
  });
});
