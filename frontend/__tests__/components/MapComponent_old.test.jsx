import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RoutingMapComponent from "@/app/custom-components/MapComponents/MapComponent";
jest.mock("@/app/custom-components/ToastComponent/NotificationContext");
jest.mock("next/dynamic", () => () => {
  const DynamicComponent = () => (
    <div data-testid="mock-map">Map Component</div>
  );
  return DynamicComponent;
});

// Mock environment variable
process.env.NEXT_PUBLIC_MAPBOX_API_KEY = "test-token";

// Mock Leaflet
jest.mock("leaflet", () => ({
  map: jest.fn(() => ({
    setView: jest.fn(),
    remove: jest.fn(),
    removeLayer: jest.fn(),
    hasLayer: jest.fn(),
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
  })),
  polyline: jest.fn(() => ({
    addTo: jest.fn(),
    on: jest.fn(),
  })),
  layerGroup: jest.fn(() => ({
    addTo: jest.fn(),
  })),
  divIcon: jest.fn(),
  control: jest.fn(() => ({
    addTo: jest.fn(),
  })),
}));

describe("Sample Test Suite", () => {
  test("basic arithmetic works", () => {
    expect(2 + 2).toBe(4);
  });

  test("strings can be concatenated", () => {
    expect("hello" + " world").toBe("hello world");
  });

  test("arrays can be manipulated", () => {
    const array = [1, 2, 3];
    expect(array).toHaveLength(3);
    expect(array).toContain(2);
  });
});

describe("MapComponent", () => {
  const defaultProps = {
    mapboxToken: "test-token",
    departureCoords: [40.7128, -74.006],
    destinationCoords: [40.758, -73.9855],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays loading state when getting location", () => {
    render(<MapComponent {...defaultProps} useCurrentLocation={true} />);
    expect(screen.getByText("Getting your location...")).toBeInTheDocument();
  });

  it("displays error state when map has critical error", () => {
    render(<MapComponent {...defaultProps} />);
    // Trigger a critical error
    fireEvent.error(screen.getByTestId("map-container"));

    expect(screen.getByText("Map Error")).toBeInTheDocument();
    expect(screen.getByText("Refresh Page")).toBeInTheDocument();
  });

  it("displays route details when available", async () => {
    const routeData = {
      initial_route: {
        coordinates: [
          [40.7128, -74.006],
          [40.758, -73.9855],
        ],
        instructions: [
          { instruction: "Turn right", distance: 100, duration: 60 },
        ],
      },
    };

    render(<MapComponent {...defaultProps} />);

    // Simulate route data being loaded
    await waitFor(() => {
      const routeDetails = screen.getByText("Turn right");
      expect(routeDetails).toBeInTheDocument();
    });
  });

  it("cleans up map instance on unmount", () => {
    const { unmount } = render(<MapComponent {...defaultProps} />);
    unmount();

    // Verify cleanup was called
    expect(L.map().remove).toHaveBeenCalled();
  });

  it("handles route switching between initial and safer routes", () => {
    render(<MapComponent {...defaultProps} />);

    // Find and click the route toggle
    const routeToggle = screen.getByRole("button", { name: /switch route/i });
    fireEvent.click(routeToggle);

    // Verify route style updates
    expect(L.polyline).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        opacity: 0.9, // Active route opacity
      })
    );
  });
});

// describe('Dashboard Map Component', () => {
//   // Setup common mocks
//   const mockShowError = jest.fn()
//   const mockShowWarning = jest.fn()
//   const mockShowSuccess = jest.fn()

//   beforeEach(() => {
//     // Reset all mocks before each test
//     jest.clearAllMocks()

//     // Mock auth hook
//     useAuth.mockReturnValue({
//       user: { email: 'test@example.com' },
//       logout: jest.fn()
//     })

//     // Mock notification hook
//     useNotification.mockReturnValue({
//       showError: mockShowError,
//       showWarning: mockShowWarning,
//       showSuccess: mockShowSuccess
//     })
//   })

//   test('renders dashboard with user information', () => {
//     render(<Dashboard />)

//     expect(screen.getByText('Dashboard')).toBeInTheDocument()
//     expect(screen.getByText('Logged in as: test@example.com')).toBeInTheDocument()
//     expect(screen.getByText('Logout')).toBeInTheDocument()
//   })

//   test('renders route planner section', () => {
//     render(<Dashboard />)

//     expect(screen.getByText('Route Planner')).toBeInTheDocument()
//     expect(screen.getByText('How to Use This Map')).toBeInTheDocument()
//   })

//   test('displays map component when mapbox token is available', () => {
//     render(<Dashboard />)

//     expect(screen.getByTestId('mock-map')).toBeInTheDocument()
//   })

//   test('shows error when mapbox token is missing', () => {
//     // Temporarily remove the token
//     const originalToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY
//     delete process.env.NEXT_PUBLIC_MAPBOX_API_KEY

//     render(<Dashboard />)

//     expect(mockShowError).toHaveBeenCalledWith(
//       'Configuration error',
//       'Missing Mapbox API key. Please set NEXT_PUBLIC_MAPBOX_API_KEY in your .env.local file.',
//       'api_key_missing'
//     )

//     // Restore the token
//     process.env.NEXT_PUBLIC_MAPBOX_API_KEY = originalToken
//   })

//   test('handles search form submission with missing departure location', async () => {
//     render(<Dashboard />)

//     // Simulate form submission with missing departure
//     const handleSearch = screen.getByRole('button', { name: /get directions/i })
//     fireEvent.click(handleSearch)

//     expect(mockShowWarning).toHaveBeenCalledWith(
//       'Departure location required',
//       'Please select a departure location from the suggestions',
//       'location_validation_error'
//     )
//   })

//   test('handles successful route planning', async () => {
//     render(<Dashboard />)

//     // Mock successful search submission
//     const searchData = {
//       departure: 'Start Location',
//       departureCoordinates: [0, 0],
//       destination: 'End Location',
//       destinationCoordinates: [1, 1],
//       useCurrentLocation: false
//     }

//     // Find and trigger the search form submission
//     const form = screen.getByTestId('location-search-form')
//     fireEvent.submit(form, { searchData })

//     await waitFor(() => {
//       expect(mockShowSuccess).toHaveBeenCalledWith(
//         'Route planning started',
//         'Planning route from Start Location to End Location',
//         'route_planning'
//       )
//     })
//   })

//   test('handles use current location option', async () => {
//     render(<Dashboard />)

//     const searchData = {
//       destination: 'End Location',
//       destinationCoordinates: [1, 1],
//       useCurrentLocation: true
//     }

//     const form = screen.getByTestId('location-search-form')
//     fireEvent.submit(form, { searchData })

//     await waitFor(() => {
//       expect(mockShowSuccess).toHaveBeenCalledWith(
//         'Route planning started',
//         expect.stringContaining('your current location'),
//         'route_planning'
//       )
//     })
//   })
// })
