import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { NotificationProvider, useNotification } from '@/app/custom-components/ToastComponent/NotificationContext';

// Mock the setTimeout function
jest.useFakeTimers();

// Testing component that uses the notification context
const TestComponent = () => {
  const { 
    showError, showWarning, showSuccess, 
    clearError, clearWarning, clearSuccess,
    error, warning, success 
  } = useNotification();

  return (
    <div>
      <button data-testid="show-error" onClick={() => showError('Error message', 'Details', 'test')}>
        Show Error
      </button>
      <button data-testid="show-warning" onClick={() => showWarning('Warning message', 'Details', 'test')}>
        Show Warning
      </button>
      <button data-testid="show-success" onClick={() => showSuccess('Success message', 'Details', 'test')}>
        Show Success
      </button>
      <button data-testid="clear-error" onClick={clearError}>
        Clear Error
      </button>
      <button data-testid="clear-warning" onClick={clearWarning}>
        Clear Warning
      </button>
      <button data-testid="clear-success" onClick={clearSuccess}>
        Clear Success
      </button>

      {error && <div data-testid="error-message">{error.message}</div>}
      {warning && <div data-testid="warning-message">{warning.message}</div>}
      {success && <div data-testid="success-message">{success.message}</div>}
    </div>
  );
};

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('provides notification context to children', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(screen.getByTestId('show-error')).toBeInTheDocument();
  });

  test('shows and clears error notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Show error
    act(() => {
      screen.getByTestId('show-error').click();
    });

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByTestId('error-message').textContent).toBe('Error message');

    // Clear error
    act(() => {
      screen.getByTestId('clear-error').click();
    });

    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });

  test('shows and clears warning notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Show warning
    act(() => {
      screen.getByTestId('show-warning').click();
    });

    expect(screen.getByTestId('warning-message')).toBeInTheDocument();
    expect(screen.getByTestId('warning-message').textContent).toBe('Warning message');

    // Clear warning
    act(() => {
      screen.getByTestId('clear-warning').click();
    });

    expect(screen.queryByTestId('warning-message')).not.toBeInTheDocument();
  });

  test('shows and clears success notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Show success
    act(() => {
      screen.getByTestId('show-success').click();
    });

    expect(screen.getByTestId('success-message')).toBeInTheDocument();
    expect(screen.getByTestId('success-message').textContent).toBe('Success message');

    // Clear success
    act(() => {
      screen.getByTestId('clear-success').click();
    });

    expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
  });

  test('automatically clears notifications after timeout', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Show all notification types
    act(() => {
      screen.getByTestId('show-error').click();
      screen.getByTestId('show-warning').click();
      screen.getByTestId('show-success').click();
    });

    // Verify notifications are displayed
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByTestId('warning-message')).toBeInTheDocument();
    expect(screen.getByTestId('success-message')).toBeInTheDocument();

    // Fast-forward time to trigger the timeout
    act(() => {
      jest.advanceTimersByTime(9000); // Slightly more than the 8000ms timeout
    });

    // Notifications should be cleared automatically
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    expect(screen.queryByTestId('warning-message')).not.toBeInTheDocument();
    expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
  });

  test('throws error when useNotification is used outside provider', () => {
    // Suppress error output
    const originalError = console.error;
    console.error = jest.fn();
    
    // Function to render component without provider
    const renderWithoutProvider = () => {
      render(<TestComponent />);
    };

    // Assert that rendering without provider throws error
    expect(renderWithoutProvider).toThrow('useNotification must be used within a NotificationProvider');
    
    // Restore console.error
    console.error = originalError;
  });
});