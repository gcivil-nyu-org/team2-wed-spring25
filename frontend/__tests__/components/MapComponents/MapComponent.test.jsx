import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RoutingMapComponent from '@/app/custom-components/MapComponents/MapComponent';
import { useNotification } from '@/app/custom-components/ToastComponent/NotificationContext';
import useUserLocation from '@/hooks/useUserLocation';
import { authAPI } from '@/utils/fetch/fetch';

// Note: CSS will be mocked by moduleNameMapper in jest.config.js
// No need to mock CSS here as it's handled by the config

// Mock the notification context
jest.mock('@/app/custom-components/ToastComponent/NotificationContext', () => ({
  useNotification: jest.fn(),
}));

// Mock the user location hook
jest.mock('@/hooks/useUserLocation', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock leaflet
jest.mock('leaflet', () => {
  // Create a mock map instance with the methods we expect to use
  const mockMap = {
    setView: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    eachLayer: jest.fn(callback => {
      callback({ options: { type: 'mock-layer' }, remove: jest.fn() });
    }),
    _userMarker: {
      setLatLng: jest.fn(),
    },
  };

  return {
    map: jest.fn().mockImplementation(() => mockMap),
    tileLayer: jest.fn().mockImplementation(() => ({
      addTo: jest.fn(),
    })),
    marker: jest.fn().mockImplementation(() => ({
      addTo: jest.fn(),
      setLatLng: jest.fn(),
    })),
    divIcon: jest.fn(),
    DomUtil: {
      create: jest.fn().mockReturnValue({
        style: {},
        innerHTML: '',
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
        },
      }),
    },
    geoJSON: jest.fn().mockReturnValue({
      addTo: jest.fn().mockReturnThis(),
      setStyle: jest.fn().mockReturnThis(),
      addData: jest.fn().mockReturnThis(),
      getBounds: jest.fn().mockReturnValue({
        extend: jest.fn(),
      }),
      clearLayers: jest.fn(),
    }),
  };
});

// Mock the authAPI
jest.mock('@/utils/fetch/fetch', () => ({
  authAPI: {
    authenticatedPost: jest.fn(),
  },
}));

// Mock the sub-components that might be causing issues
jest.mock('@/app/custom-components/RoutingComponets/RouteHandler', () => ({
  enhanceTurnInstructions: jest.fn(instructions => instructions),
}), { virtual: true });

// Use a simple string mock approach for components that might render JSX
jest.mock('@/app/custom-components/MapComponents/RouteRender', () => () => 'RouteRenderer Mock', { virtual: true });
jest.mock('@/app/custom-components/MapComponents/RouteInfo', () => () => 'RouteInfo Mock', { virtual: true });
jest.mock('@/app/custom-components/MapComponents/HeatmapLayer', () => () => 'HeatmapLayer Mock', { virtual: true });
jest.mock('@/app/custom-components/RoutingComponets/SaveRoute', () => () => 'SaveRoute Mock', { virtual: true });
jest.mock('@/app/custom-components/MapComponents/MapRenderMsg', () => ({ text }) => `Loading: ${text}`, { virtual: true });
jest.mock('@/app/custom-components/MapComponents/MapCriticalErrorMsg', () => () => 'Critical Error', { virtual: true });

// Mock leaflet.heat
jest.mock('leaflet.heat', () => ({}), { virtual: true });

describe('RoutingMapComponent', () => {
  const mockShowError = jest.fn();
  const mockShowWarning = jest.fn();
  const mockShowSuccess = jest.fn();
  const mockMapboxToken = 'mock-mapbox-token';
  const mockDepartureCoords = [40.7128, -74.0060];
  const mockDestinationCoords = [40.6782, -73.9442];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup useNotification mock
    useNotification.mockImplementation(() => ({
      showError: mockShowError,
      showWarning: mockShowWarning,
      showSuccess: mockShowSuccess,
    }));
    
    // Setup useUserLocation mock with default values
    useUserLocation.mockImplementation(() => ({
      userLocation: [40.7128, -74.0060],
      isGettingLocation: false,
      locationDenied: false,
      retryLocation: jest.fn(),
    }));
    
    // Setup fetch API mock with successful response
    authAPI.authenticatedPost.mockResolvedValue({
      initial_route: {
        routes: [{
          summary: { distance: 5000, duration: 1200 },
          segments: [{ steps: [{ instruction: 'Turn right', distance: 100 }] }]
        }]
      },
      safer_route: {
        routes: [{
          summary: { distance: 5500, duration: 1300 },
          segments: [{ steps: [{ instruction: 'Turn left', distance: 120 }] }]
        }]
      }
    });
  });
  
  test('renders the map component with loading state', () => {
    // Mock the user location hook to simulate loading state
    useUserLocation.mockImplementation(() => ({
      userLocation: null,
      isGettingLocation: true,
      locationDenied: false,
      retryLocation: jest.fn(),
    }));
    
    render(
      <RoutingMapComponent
        mapboxToken={mockMapboxToken}
        departureCoords={null}
        destinationCoords={null}
        useCurrentLocation={true}
      />
    );
    
    expect(screen.getByText(/Getting your location/)).toBeInTheDocument();
  });
  
  test('fetches route data when coordinates are provided', async () => {
    render(
      <RoutingMapComponent
        mapboxToken={mockMapboxToken}
        departureCoords={mockDepartureCoords}
        destinationCoords={mockDestinationCoords}
        useCurrentLocation={false}
      />
    );
    
    // Wait for the route data to be fetched
    await waitFor(() => {
      expect(authAPI.authenticatedPost).toHaveBeenCalledWith(
        '/get-route/',
        expect.objectContaining({
          departure: mockDepartureCoords,
          destination: mockDestinationCoords,
        })
      );
    });
    
    // Should show success notification
    expect(mockShowSuccess).toHaveBeenCalledWith(
      "Route calculated successfully", 
      null, 
      "route_found"
    );
  });
  
  test('shows error when route fetching fails', async () => {
    // Mock API to simulate error
    authAPI.authenticatedPost.mockRejectedValue(new Error('Network error'));
    
    render(
      <RoutingMapComponent
        mapboxToken={mockMapboxToken}
        departureCoords={mockDepartureCoords}
        destinationCoords={mockDestinationCoords}
        useCurrentLocation={false}
      />
    );
    
    // Wait for the error to be handled
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        "Could not calculate route",
        expect.any(String),
        "route_fetch_error"
      );
    });
  });
  
  test('renders location denied UI when permission is denied', () => {
    // Mock useUserLocation to simulate denied permission
    useUserLocation.mockImplementation(() => ({
      userLocation: null,
      isGettingLocation: false,
      locationDenied: true,
      retryLocation: jest.fn(),
    }));
    
    render(
      <RoutingMapComponent
        mapboxToken={mockMapboxToken}
        departureCoords={null}
        destinationCoords={mockDestinationCoords}
        useCurrentLocation={true}
      />
    );
    
    expect(screen.getByText('Enable Location Access')).toBeInTheDocument();
  });
  
  test('renders route data when successfully fetched', async () => {
    // Setup successful route fetch
    render(
      <RoutingMapComponent
        mapboxToken={mockMapboxToken}
        departureCoords={mockDepartureCoords}
        destinationCoords={mockDestinationCoords}
        useCurrentLocation={false}
      />
    );
    
    // Wait for route data to be fetched and processed
    await waitFor(() => {
      expect(authAPI.authenticatedPost).toHaveBeenCalled();
    });
    
    // After getting route data, SaveRoute component should be rendered (we're checking for text now)
    await waitFor(() => {
      expect(screen.getByText(/SaveRoute Mock/)).toBeInTheDocument();
    });
  });
});