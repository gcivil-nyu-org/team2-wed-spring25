import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react'; // Changed from 'react-dom/test-utils'
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
    authenticatedGet: jest.fn(),
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

// Mock for fallback clipboard
Object.defineProperty(global.document, 'execCommand', {
  value: jest.fn().mockImplementation(() => true),
});

// Mock for navigator.clipboard
Object.defineProperty(global.navigator, 'clipboard', {
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
    // Pending promise to keep loading state
    let resolveFetch;
    const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
    authAPI.authenticatedGet.mockImplementation(() => fetchPromise);
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    // Check for skeleton elements
    const skeletonElements = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletonElements.length).toBeGreaterThan(0);
    
    // Clean up by resolving the promise
    await act(async () => {
      resolveFetch(mockRoutes);
    });
  });

  it('should display routes when loaded successfully', async () => {
    authAPI.authenticatedGet.mockResolvedValue(mockRoutes);
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    // Wait for component to finish rendering
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(screen.getByText('Route 1')).toBeInTheDocument();
    expect(screen.getByText('Route 2')).toBeInTheDocument();
    expect(screen.getByText('Route 3')).toBeInTheDocument();
  });

  it('should show error state when fetching fails', async () => {
    authAPI.authenticatedGet.mockRejectedValue(new Error('Network error'));
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    // Wait for component to finish rendering
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(screen.getByText('Failed to load your routes')).toBeInTheDocument();
    expect(mockShowError).toHaveBeenCalledWith('Failed to retrieve routes');
    
    // Test retry button
    await act(async () => {
      fireEvent.click(screen.getByText('Retry'));
    });
    
    expect(authAPI.authenticatedGet).toHaveBeenCalledTimes(2);
  });

  it('should display empty state when no routes are available', async () => {
    authAPI.authenticatedGet.mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    // Wait for component to finish rendering
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(screen.getByText('No saved routes')).toBeInTheDocument();
    expect(screen.getByText("You haven't saved any routes yet.")).toBeInTheDocument();
  });

  it('should toggle favorite status when star button is clicked', async () => {
    authAPI.authenticatedGet.mockResolvedValue(mockRoutes);
    authAPI.authenticatedPatch.mockResolvedValue({ success: true });
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    // Wait for component to finish rendering
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Toggle favorite for non-favorite route
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
    
    expect(mockShowSuccess).toHaveBeenCalledWith('Route added to favorites');
    
    // Toggle favorite for already-favorite route
    await act(async () => {
      const favoriteButtons = screen.getAllByTitle(/favorites/i);
      fireEvent.click(favoriteButtons[1]); // Second button is for Route 2 which is already a favorite
    });
    
    expect(authAPI.authenticatedPatch).toHaveBeenCalledWith(
      '/update-route/',
      {
        id: 2,
        favorite: false
      }
    );
    
    expect(mockShowSuccess).toHaveBeenCalledWith('Route removed from favorites');
  });

  it('should navigate to route when navigation button is clicked', async () => {
    authAPI.authenticatedGet.mockResolvedValue(mockRoutes);
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    // Wait for component to finish rendering
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      const navigateButtons = screen.getAllByTitle('Navigate to this route');
      fireEvent.click(navigateButtons[0]);
    });
    
    expect(mockPush).toHaveBeenCalledWith(
      `/users/map?dep_lat=51.5074&dep_lon=-0.1278&dest_lat=48.8566&dest_lon=2.3522`
    );
  });

  it('should copy route link using fallback when clipboard API fails', async () => {
    authAPI.authenticatedGet.mockResolvedValue(mockRoutes);
    
    // Save original clipboard API
    const originalClipboard = navigator.clipboard;
    
    // Remove clipboard API entirely to force fallback
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true
    });
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    // Wait for component to finish rendering
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      const shareButtons = screen.getAllByTitle('Share this route');
      fireEvent.click(shareButtons[0]);
    });
    
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(mockShowSuccess).toHaveBeenCalledWith('Link copied to clipboard');
    
    // Restore clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true
    });
  });

  it('should open delete dialog when delete button is clicked', async () => {
    authAPI.authenticatedGet.mockResolvedValue(mockRoutes);
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    // Wait for component to finish rendering
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      const deleteButtons = screen.getAllByTitle('Delete this route');
      fireEvent.click(deleteButtons[0]);
    });
    
    expect(screen.getByText('Delete Route')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete "Route 1"? This action cannot be undone.')).toBeInTheDocument();
    
    // Test cancel button
    await act(async () => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
    });
    
    // Dialog should be closed
    expect(screen.queryByText('Are you sure you want to delete "Route 1"?')).not.toBeInTheDocument();
  });

  it('should delete route when confirmed in dialog', async () => {
    authAPI.authenticatedGet.mockResolvedValue(mockRoutes);
    authAPI.authenticatedDelete.mockResolvedValue({ success: true });
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    // Wait for component to finish rendering
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
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
    expect(mockShowSuccess).toHaveBeenCalledWith('Route deleted successfully');
  });

  it('should handle failed route deletion', async () => {
    authAPI.authenticatedGet.mockResolvedValue(mockRoutes);
    authAPI.authenticatedDelete.mockRejectedValue(new Error('Delete failed'));
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    // Wait for component to finish rendering
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
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
    expect(mockShowError).toHaveBeenCalledWith('Failed to delete route');
  });

  it('should handle pagination correctly', async () => {
    authAPI.authenticatedGet.mockResolvedValue(mockRoutes);
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    // Wait for component to finish rendering
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
    });
    
    expect(authAPI.authenticatedGet).toHaveBeenCalledWith('/retrieve-routes?page=2');
  });

  it('should handle error when toggling favorite status', async () => {
    authAPI.authenticatedGet.mockResolvedValue(mockRoutes);
    authAPI.authenticatedPatch.mockRejectedValue(new Error('Update failed'));
    
    await act(async () => {
      render(<SavedRoutesList />);
    });
    
    // Wait for component to finish rendering
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    await act(async () => {
      const favoriteButtons = screen.getAllByTitle(/favorites/i);
      fireEvent.click(favoriteButtons[0]);
    });
    
    expect(mockShowError).toHaveBeenCalledWith('Failed to update route');
  });
});