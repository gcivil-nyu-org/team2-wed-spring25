import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SavedRoutesList from '@/app/custom-components/RoutingComponets/SavedRoutesList';
import { authAPI } from "@/utils/fetch/fetch";
import { useNotification } from '@/app/custom-components/ToastComponent/NotificationContext';
import { formatDate } from '@/utils/datetime';
import { useRouter } from "next/navigation";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/utils/fetch/fetch", () => ({
  authAPI: {
    authenticatedFetch: jest.fn(),
    authenticatedPatch: jest.fn(),
    authenticatedDelete: jest.fn(),
  },
}));

jest.mock("@/app/custom-components/ToastComponent/NotificationContext", () => ({
  useNotification: jest.fn(),
}));

jest.mock("@/utils/datetime", () => ({
  formatDate: jest.fn(),
}));

// Mock for window.location
const originalLocation = window.location;
delete window.location;
window.location = {
  origin: 'https://example.com',
};

// Mock for navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(),
  },
  configurable: true,
});

const mockRoutes = {
  count: 25,
  next: "https://api.example.com/retrieve-routes?page=2",
  previous: null,
  results: [
    {
      id: 1,
      name: "Route 1",
      favorite: false,
      created_at: "2025-03-20T08:00:00Z",
      departure_lat: 51.5074,
      departure_lon: -0.1278,
      destination_lat: 48.8566,
      destination_lon: 2.3522
    },
    {
      id: 2,
      name: "Route 2",
      favorite: true,
      created_at: "2025-03-15T10:30:00Z",
      departure_lat: 40.7128,
      departure_lon: -74.0060,
      destination_lat: 34.0522,
      destination_lon: -118.2437
    },
    {
      id: 3,
      name: "Route 3",
      favorite: false,
      created_at: "2025-03-10T14:15:00Z",
      departure_lat: 35.6762,
      departure_lon: 139.6503,
      destination_lat: 22.3193,
      destination_lon: 114.1694
    }
  ]
};

describe('SavedRoutesList', () => {
  const mockPush = jest.fn();
  const mockShowError = jest.fn();
  const mockShowSuccess = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ push: mockPush });
    useNotification.mockReturnValue({ showError: mockShowError, showSuccess: mockShowSuccess });
    formatDate.mockImplementation(date => `Formatted: ${date}`);
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  });

  afterAll(() => {
    window.location = originalLocation;
    jest.restoreAllMocks();
  });

  it('should render loading state initially', async () => {
    // Setup a promise that never resolves to keep component in loading state
    let fetchPromise;
    authAPI.authenticatedFetch.mockImplementation(() => {
      fetchPromise = new Promise(() => {});
      return fetchPromise;
    });
    
    render(<SavedRoutesList />);
    
    // Check for skeletons by data-slot instead of data-testid
    await waitFor(() => {
      const skeletonElements = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  it('should display routes when loaded successfully', async () => {
    authAPI.authenticatedFetch.mockResolvedValue(mockRoutes);
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Route 1')).toBeInTheDocument();
      expect(screen.getByText('Route 2')).toBeInTheDocument();
      expect(screen.getByText('Route 3')).toBeInTheDocument();
    });
  });

  it('should show error state when fetching fails', async () => {
    authAPI.authenticatedFetch.mockRejectedValue(new Error('Network error'));
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load your routes')).toBeInTheDocument();
      expect(mockShowError).toHaveBeenCalledWith('Failed to retrieve routes');
    });
    
    // Test retry button
    await act(async () => {
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
    });
    
    expect(authAPI.authenticatedFetch).toHaveBeenCalledTimes(2);
  });

  it('should display empty state when no routes are available', async () => {
    authAPI.authenticatedFetch.mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('No saved routes')).toBeInTheDocument();
      expect(screen.getByText("You haven't saved any routes yet.")).toBeInTheDocument();
    });
  });

  it('should toggle favorite status when star button is clicked', async () => {
    authAPI.authenticatedFetch.mockResolvedValue(mockRoutes);
    authAPI.authenticatedPatch.mockResolvedValue({ success: true });
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Route 1')).toBeInTheDocument();
    });
    
    // Find and click the first star button (non-favorite route)
    await act(async () => {
      const favoriteButtons = screen.getAllByTitle(/favorites/i);
      fireEvent.click(favoriteButtons[0]);
    });
    
    expect(authAPI.authenticatedPatch).toHaveBeenCalledWith(
      '/update-route/',
      {
        id: 1,
        favorite: true
      }
    );
    
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith('Route added to favorites');
    });
  });

  it('should navigate to route when navigation button is clicked', async () => {
    authAPI.authenticatedFetch.mockResolvedValue(mockRoutes);
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Route 1')).toBeInTheDocument();
    });
    
    // Find and click a navigation button
    await act(async () => {
      const navigateButtons = screen.getAllByTitle('Navigate to this route');
      fireEvent.click(navigateButtons[0]);
    });
    
    expect(mockPush).toHaveBeenCalledWith(
      `/users/map?dep_lat=51.5074&dep_lon=-0.1278&dest_lat=48.8566&dest_lon=2.3522`
    );
  });

  it('should copy route link when share button is clicked', async () => {
    authAPI.authenticatedFetch.mockResolvedValue(mockRoutes);
    navigator.clipboard.writeText.mockResolvedValue(undefined);
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Route 1')).toBeInTheDocument();
    });
    
    // Find and click a share button
    await act(async () => {
      const shareButtons = screen.getAllByTitle('Share this route');
      fireEvent.click(shareButtons[0]);
    });
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://example.com/users/map?dep_lat=51.5074&dep_lon=-0.1278&dest_lat=48.8566&dest_lon=2.3522'
    );
    
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith('Link copied to clipboard');
    });
  });

  it('should open delete dialog when delete button is clicked', async () => {
    authAPI.authenticatedFetch.mockResolvedValue(mockRoutes);
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Route 1')).toBeInTheDocument();
    });
    
    // Find and click a delete button
    await act(async () => {
      const deleteButtons = screen.getAllByTitle('Delete this route');
      fireEvent.click(deleteButtons[0]);
    });
    
    // Check if dialog is opened with correct content
    expect(screen.getByText('Delete Route')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete "Route 1"? This action cannot be undone.')).toBeInTheDocument();
  });

  it('should delete route when confirmed in dialog', async () => {
    authAPI.authenticatedFetch.mockResolvedValue(mockRoutes);
    authAPI.authenticatedDelete.mockResolvedValue({ success: true });
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Route 1')).toBeInTheDocument();
    });
    
    // Open delete dialog
    await act(async () => {
      const deleteButtons = screen.getAllByTitle('Delete this route');
      fireEvent.click(deleteButtons[0]);
    });
    
    // Confirm deletion
    await act(async () => {
      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);
    });
    
    expect(authAPI.authenticatedDelete).toHaveBeenCalledWith('/delete-route/1/');
    
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith('Route deleted successfully');
    });
  });

  it('should handle pagination correctly', async () => {
    authAPI.authenticatedFetch.mockResolvedValue(mockRoutes);
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Route 1')).toBeInTheDocument();
    });
    
    // Find and click next page button
    await act(async () => {
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
    });
    
    expect(authAPI.authenticatedFetch).toHaveBeenCalledWith('/retrieve-routes?page=2');
  });
});