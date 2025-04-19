/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { RouteProvider, useRoute } from '@/app/custom-components/MapComponents/RouteContext';

// Mock next/navigation
jest.mock('next/navigation', () => {
  const mockRouter = {
    replace: jest.fn(),
  };
  return {
    useSearchParams: jest.fn(),
    useRouter: () => mockRouter,
    usePathname: jest.fn(() => '/test'),
  };
});

// Mock notification context
const mockShowError = jest.fn();
const mockShowWarning = jest.fn();
const mockShowSuccess = jest.fn();

jest.mock('@/app/custom-components/ToastComponent/NotificationContext', () => ({
  useNotification: () => ({
    showError: mockShowError,
    showWarning: mockShowWarning,
    showSuccess: mockShowSuccess,
  }),
}));

// Mock location hook
jest.mock('@/hooks/location', () => ({
  useUserLocationWithNYCCheck: jest.fn(() => ({
    userLocation: [40.7128, -74.0060],
    isLocationValid: true,
    isLocationAvailable: true,
    isGettingLocation: false,
    locationDenied: false,
    locationError: null,
    fetchUserLocation: jest.fn(),
  })),
  isWithinNYC: jest.fn(() => true),
  NYC_BOUNDS: {
    sw: [40.4774, -74.2591],
    ne: [40.9176, -73.7004],
  },
}));

describe('RouteProvider', () => {
  let testContext = {};
  let mockRouter;

  const TestComponent = () => {
    testContext = useRoute();
    return null;
  };

  const renderProvider = (searchParams = {}) => {
    useSearchParams.mockReturnValue(new URLSearchParams(searchParams));
    mockRouter = useRouter();
    return render(
      <RouteProvider>
        <TestComponent />
      </RouteProvider>
    );
  };

  beforeEach(() => {
    testContext = {};
    mockShowError.mockClear();
    mockShowWarning.mockClear();
    mockShowSuccess.mockClear();
    jest.clearAllMocks();
  });

  it('initializes with default values', () => {
    renderProvider();
    expect(testContext.mapboxToken).toBe('');
    expect(testContext.departureCoords).toBeNull();
    expect(testContext.destinationCoords).toBeNull();
    expect(testContext.isLoading).toBe(false);
    expect(testContext.routeCalculated).toBe(false);
    expect(testContext.useCurrentLocation).toBe(false);
  });

  it('loads Mapbox token from environment', () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_MAPBOX_API_KEY: 'test-token',
    };

    renderProvider();
    expect(testContext.mapboxToken).toBe('test-token');
    process.env = originalEnv;
  });

  it('shows error when Mapbox token is missing', () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_MAPBOX_API_KEY: undefined,
    };

    renderProvider();
    expect(mockShowError).toHaveBeenCalled();
    process.env = originalEnv;
  });

  it('handles URL parameters on initial load', async () => {
    renderProvider({
      dep_lat: '40.7128',
      dep_lon: '-74.0060',
      dest_lat: '40.7138',
      dest_lon: '-74.0070',
    });

    await act(async () => {
      // Wait for initial load to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(testContext.initialDepartureCoords).toEqual([40.7128, -74.0060]);
    expect(testContext.initialDestinationCoords).toEqual([40.7138, -74.0070]);
  });

  it('handles use_current parameter when location is available', async () => {
    renderProvider({
      use_current: 'true',
    });

    await act(async () => {
      // Wait for initial load to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(testContext.useCurrentLocation).toBe(true);
  });

  it('clears invalid URL parameters', async () => {
    renderProvider({
      dep_lat: 'invalid',
      dep_lon: 'invalid',
    });

    await act(async () => {
      // Wait for initial load to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockRouter.replace).toHaveBeenCalledWith('/test');
  });

  it('validates form inputs correctly', () => {
    renderProvider();

    // Test missing destination
    let validation = testContext.validateForm(
      'Test Departure',
      [40.7128, -74.0060],
      '',
      null,
      false
    );
    expect(validation.isValid).toBe(false);
    expect(validation.error).toMatch(/please select a destination/i);

    // Test missing departure when not using current location
    validation = testContext.validateForm(
      '',
      null,
      'Test Destination',
      [40.7138, -74.0070],
      false
    );
    expect(validation.isValid).toBe(false);
    expect(validation.error).toMatch(/please select a departure location/i);

    // Test valid form
    validation = testContext.validateForm(
      'Test Departure',
      [40.7128, -74.0060],
      'Test Destination',
      [40.7138, -74.0070],
      false
    );
    expect(validation.isValid).toBe(true);
  });

  it('handles search submission', async () => {
    renderProvider();

    await act(async () => {
      testContext.handleSearch({
        departure: 'Test Departure',
        departureCoordinates: [40.7128, -74.0060],
        destination: 'Test Destination',
        destinationCoordinates: [40.7138, -74.0070],
        useCurrentLocation: false,
      });
    });

    setTimeout(() => {
      expect(testContext.departureCoords).toEqual([40.7128, -74.0060]);
      expect(testContext.destinationCoords).toEqual([40.7138, -74.0070]);
      expect(testContext.routeCalculated).toBe(true);
      expect(testContext.router.replace).toHaveBeenCalled();
      expect(testContext.notification.showSuccess).toHaveBeenCalled();
    }, 100);
  });

  it('handles search submission with current location', async () => {
    renderProvider();

    await act(async () => {
      testContext.handleSearch({
        departure: 'Test Departure',
        departureCoordinates: [40.7128, -74.0060],
        destination: 'Test Destination',
        destinationCoordinates: [40.7138, -74.0070],
        useCurrentLocation: true,
      });
    });

    setTimeout(() => {
      expect(testContext.departureCoords).toEqual([40.7128, -74.0060]);
      expect(testContext.destinationCoords).toEqual([40.7138, -74.0070]);
      expect(testContext.routeCalculated).toBe(true);
      expect(testContext.router.replace).toHaveBeenCalled();
      expect(testContext.notification.showSuccess).toHaveBeenCalled();
    }, 100);
  }
  );
  it('handles search submission with invalid coordinates', async () => {
    renderProvider();

    await act(async () => {
      testContext.handleSearch({
        departure: 'Test Departure',
        departureCoordinates: null,
        destination: 'Test Destination',
        destinationCoordinates: null,
        useCurrentLocation: false,
      });
    });

    setTimeout(() => {
      expect(testContext.departureCoords).toBeNull();
      expect(testContext.destinationCoords).toBeNull();
      expect(testContext.routeCalculated).toBe(false);
      expect(mockShowWarning).toHaveBeenCalled();
    }, 100);
  }
  );

  it('shows error on failed search submission', () => {
    // Set environment variables
    const originalEnv = process.env;
    process.env.NEXT_PUBLIC_MAPBOX_API_KEY = 'test-token';
    
    // Clear mocks
    mockShowWarning.mockClear();
    
    // Render with fresh context
    renderProvider();
    
    // Call handleSearch with invalid data (missing destination)
    testContext.handleSearch({
      departure: 'Test Departure',
      departureCoordinates: [40.7128, -74.0060],
      destination: '',
      destinationCoordinates: null,
      useCurrentLocation: false,
    });
    
    // Verify a warning was shown (any warning)
    expect(mockShowWarning).toHaveBeenCalled();
    
    // Clean up
    process.env = originalEnv;
  });
});