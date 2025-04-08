import React from "react";
import { render, act } from "@testing-library/react";
import RoutingMapComponent from "../../../app/custom-components/MapComponents/MapComponent";
import { useNotification } from "../../../app/custom-components/ToastComponent/NotificationContext";
import useUserLocation from "../../../hooks/useUserLocation";

// Mock CSS imports
jest.mock("leaflet/dist/leaflet.css", () => ({}));
jest.mock("../../../styles/map_styles.css", () => ({}));

// Mock Leaflet
jest.mock("leaflet", () => ({}));
jest.mock("leaflet.heat", () => ({}));

// Mock child components
jest.mock(
  "../../../app/custom-components/MapComponents/MapCriticalErrorMsg",
  () => ({
    __esModule: true,
    default: () => <div data-testid="mock-error-msg">Mock Error Message</div>,
  })
);

jest.mock("../../../app/custom-components/MapComponents/MapRenderMsg", () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="mock-render-msg">{text}</div>,
}));

jest.mock("../../../app/custom-components/MapComponents/HeatmapLayer", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-heatmap">Mock Heatmap</div>,
}));

jest.mock("../../../app/custom-components/MapComponents/RouteRender", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="mock-route-renderer">Mock Route Renderer</div>
  ),
}));

jest.mock("../../../app/custom-components/MapComponents/RouteInfo", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-route-info">Mock Route Info</div>,
}));

jest.mock("../../../app/custom-components/RoutingComponets/SaveRoute", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-save-route">Mock Save Route</div>,
}));

// Mock API
jest.mock("../../../utils/fetch/fetch", () => ({

  authAPI: {
    authenticatedPost: jest.fn(),
  },
}));

// Mock dependencies
jest.mock(
  "../../../app/custom-components/ToastComponent/NotificationContext",
  () => ({
    useNotification: jest.fn(),
  })
);

jest.mock("../../../hooks/useUserLocation", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock console to reduce noise
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

describe("RoutingMapComponent", () => {
  const mockShowError = jest.fn();
  const mockShowWarning = jest.fn();
  const mockShowSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNotification.mockReturnValue({
      showError: mockShowError,
      showWarning: mockShowWarning,
      showSuccess: mockShowSuccess,
    });
    useUserLocation.mockReturnValue({
      userLocation: [40.7128, -74.006],
      isGettingLocation: false,
      locationDenied: false,
      retryLocation: jest.fn(),
    });
  });

  it("renders without crashing", () => {
    render(
      <RoutingMapComponent
        mapboxToken="mock-token"
        departureCoords={[40.7128, -74.006]}
        destinationCoords={[40.7589, -73.9851]}
      />
    );
  });

  it("shows loading state while getting location", () => {
    useUserLocation.mockReturnValue({
      userLocation: null,
      isGettingLocation: true,
      locationDenied: false,
      retryLocation: jest.fn(),
    });

    const { getByText } = render(
      <RoutingMapComponent mapboxToken="mock-token" useCurrentLocation={true} />
    );

    expect(getByText("Getting your location...")).toBeInTheDocument();
  });

  it("shows loading message when map is not loaded", () => {
    useUserLocation.mockReturnValue({
      userLocation: null,
      isGettingLocation: false,
      locationDenied: false,
      retryLocation: jest.fn(),
    });

    const { getByTestId } = render(
      <RoutingMapComponent
        mapboxToken="mock-token"
        departureCoords={[40.7128, -74.006]}
        destinationCoords={[40.7589, -73.9851]}
      />
    );

    expect(getByTestId("mock-render-msg")).toHaveTextContent("Loading map...");
  });

  it("shows critical error message when map fails to load", () => {
    const { getByText } = render(
      <RoutingMapComponent
        mapboxToken="mock-token"
        departureCoords={[40.7128, -74.006]}
        destinationCoords={[40.7589, -73.9851]}
      />
    );

    expect(mockShowError).toHaveBeenCalledWith(
      "Could not initialize map",
      expect.any(String),
      "map_initialization_error"
    );
  });
});

it("handles location permission denied when useCurrentLocation is true", () => {
  useUserLocation.mockReturnValue({
    userLocation: null,
    isGettingLocation: false,
    locationDenied: true,
    retryLocation: jest.fn(),
  });

  const { getByText } = render(
    <RoutingMapComponent mapboxToken="mock-token" useCurrentLocation={true} />
  );

  // Ensure the retry button is displayed when location access is denied
  expect(getByText("Enable Location Access")).toBeInTheDocument();
});

