import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SaveRouteComponent from '@/app/custom-components/RoutingComponets/SaveRoute';
import { authAPI } from '@/utils/fetch/fetch';
import { NotificationProvider } from '@/app/custom-components/ToastComponent/NotificationContext';

// Mock the fetch API
jest.mock('@/utils/fetch/fetch', () => ({
  authAPI: {
    authenticatedPost: jest.fn(),
  },
}));

// Sample props
const mockProps = {
  departure: [40.7128, -74.0060], // New York City coordinates
  destination: [34.0522, -118.2437], // Los Angeles coordinates
};

// Helper function to render component with NotificationProvider
const renderWithProvider = (component) => {
  return render(
    <NotificationProvider>
      {component}
    </NotificationProvider>
  );
};

describe('SaveRouteComponent', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders the save route button', () => {
    renderWithProvider(<SaveRouteComponent {...mockProps} />);
    
    // Use a more specific query to find the button text
    const saveButtonText = screen.getByText(/save this route/i);
    expect(saveButtonText).toBeInTheDocument();
  });

  test('opens popover when save button is clicked', async () => {
    renderWithProvider(<SaveRouteComponent {...mockProps} />);
    
    // Find the button by text and click its parent element (the PopoverTrigger)
    const saveButtonText = screen.getByText(/save this route/i);
    // Click the closest button ancestor
    const saveButton = saveButtonText.closest('button');
    fireEvent.click(saveButton);
    
    // Verify popover content is shown
    await waitFor(() => {
      expect(screen.getByText('Save this route to your account for quick access later.')).toBeInTheDocument();
      expect(screen.getByLabelText(/route name/i)).toBeInTheDocument();
    });
  });

  test('displays formatted coordinates correctly', async () => {
    renderWithProvider(<SaveRouteComponent {...mockProps} />);
    
    const saveButtonText = screen.getByText(/save this route/i);
    const saveButton = saveButtonText.closest('button');
    fireEvent.click(saveButton);
    
    // Check for formatted coordinates
    await waitFor(() => {
      expect(screen.getByText('40.7128, -74.0060')).toBeInTheDocument();
      expect(screen.getByText('34.0522, -118.2437')).toBeInTheDocument();
    });
  });

  test('toggles favorite status when favorite button is clicked', async () => {
    renderWithProvider(<SaveRouteComponent {...mockProps} />);
    
    const saveButtonText = screen.getByText(/save this route/i);
    const saveButton = saveButtonText.closest('button');
    fireEvent.click(saveButton);
    
    // Initially should show "Mark as favorite"
    await waitFor(() => {
      expect(screen.getByText('Mark as favorite')).toBeInTheDocument();
    });
    
    // Find the favorite button by its sibling text
    const markAsFavoriteText = screen.getByText('Mark as favorite');
    const favoriteButtonContainer = markAsFavoriteText.previousSibling;
    fireEvent.click(favoriteButtonContainer);
    
    // Should now show "Favorite route"
    expect(screen.getByText('Favorite route')).toBeInTheDocument();
    
    // Click again to toggle back
    fireEvent.click(favoriteButtonContainer);
    expect(screen.getByText('Mark as favorite')).toBeInTheDocument();
  });

  test('submit button is disabled when route name is empty', async () => {
    renderWithProvider(<SaveRouteComponent {...mockProps} />);
    
    const saveButtonText = screen.getByText(/save this route/i);
    const saveButton = saveButtonText.closest('button');
    fireEvent.click(saveButton);
    
    // Submit button should be disabled initially
    await waitFor(() => {
      // Find the submit button by its inner text
      const submitButtonText = screen.getByText('Save Route', { selector: 'span' });
      const submitButton = submitButtonText.closest('button');
      expect(submitButton).toBeDisabled();
    });
  });

  test('enables submit button when route name is entered', async () => {
    renderWithProvider(<SaveRouteComponent {...mockProps} />);
    
    const saveButtonText = screen.getByText(/save this route/i);
    const saveButton = saveButtonText.closest('button');
    fireEvent.click(saveButton);
    
    // Enter a route name
    const nameInput = screen.getByLabelText(/route name/i);
    fireEvent.change(nameInput, { target: { value: 'My Test Route' } });
    
    // Submit button should now be enabled
    const submitButtonText = screen.getByText('Save Route', { selector: 'span' });
    const submitButton = submitButtonText.closest('button');
    expect(submitButton).not.toBeDisabled();
  });

  test('submits form with correct data', async () => {
    // Mock successful API response
    authAPI.authenticatedPost.mockResolvedValueOnce({ success: true });
    
    renderWithProvider(<SaveRouteComponent {...mockProps} />);
    
    const saveButtonText = screen.getByText(/save this route/i);
    const saveButton = saveButtonText.closest('button');
    fireEvent.click(saveButton);
    
    // Fill the form
    const nameInput = screen.getByLabelText(/route name/i);
    fireEvent.change(nameInput, { target: { value: 'My Test Route' } });
    
    // Toggle favorite to true
    const markAsFavoriteText = screen.getByText('Mark as favorite');
    const favoriteButtonContainer = markAsFavoriteText.previousSibling;
    fireEvent.click(favoriteButtonContainer);
    
    // Submit the form
    const submitButtonText = screen.getByText('Save Route', { selector: 'span' });
    const submitButton = submitButtonText.closest('button');
    fireEvent.click(submitButton);
    
    // Check if API was called with correct data
    await waitFor(() => {
      expect(authAPI.authenticatedPost).toHaveBeenCalledWith(
        '/save-route/',
        {
          name: 'My Test Route',
          departure_lat: 40.7128,
          departure_lon: -74.0060,
          destination_lat: 34.0522,
          destination_lon: -118.2437,
          favorite: true
        }
      );
    });
  });

  test('shows loading state during form submission', async () => {
    // Mock API with a delay to show loading state
    authAPI.authenticatedPost.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );
    
    renderWithProvider(<SaveRouteComponent {...mockProps} />);
    
    const saveButtonText = screen.getByText(/save this route/i);
    const saveButton = saveButtonText.closest('button');
    fireEvent.click(saveButton);
    
    // Fill and submit the form
    const nameInput = screen.getByLabelText(/route name/i);
    fireEvent.change(nameInput, { target: { value: 'My Test Route' } });
    
    // Submit using text to find the button
    const submitButtonText = screen.getByText('Save Route', { selector: 'span' });
    const submitButton = submitButtonText.closest('button');
    fireEvent.click(submitButton);
    
    // Verify loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    // Wait for API call to resolve
    await waitFor(() => {
      expect(authAPI.authenticatedPost).toHaveBeenCalled();
    });
  });

  test('handles API error gracefully', async () => {
    // Mock API error
    const errorMessage = 'Network error';
    authAPI.authenticatedPost.mockRejectedValueOnce(new Error(errorMessage));
    
    renderWithProvider(<SaveRouteComponent {...mockProps} />);
    
    const saveButtonText = screen.getByText(/save this route/i);
    const saveButton = saveButtonText.closest('button');
    fireEvent.click(saveButton);
    
    // Fill and submit the form
    const nameInput = screen.getByLabelText(/route name/i);
    fireEvent.change(nameInput, { target: { value: 'My Test Route' } });
    
    // Submit using text to find the button
    const submitButtonText = screen.getByText('Save Route', { selector: 'span' });
    const submitButton = submitButtonText.closest('button');
    fireEvent.click(submitButton);
    
    // Wait for API call to be made
    await waitFor(() => {
      expect(authAPI.authenticatedPost).toHaveBeenCalled();
    });
    
    // Form should still be visible after error
    expect(nameInput).toBeInTheDocument();
  });
  
  test('handles unknown location gracefully', () => {
    // Test with missing coordinates
    const propsWithoutCoords = {
      departure: null,
      destination: [34.0522, -118.2437],
    };
    
    renderWithProvider(<SaveRouteComponent {...propsWithoutCoords} />);
    
    const saveButtonText = screen.getByText(/save this route/i);
    const saveButton = saveButtonText.closest('button');
    fireEvent.click(saveButton);
    
    // Should show "Current location" for departure
    expect(screen.getByText('Current location')).toBeInTheDocument();
  });
});