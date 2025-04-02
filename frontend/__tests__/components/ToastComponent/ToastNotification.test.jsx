import React from 'react';
import { render, act } from '@testing-library/react';
import ToastNotifications from '@/app/custom-components/ToastComponent/ToastNotification';
import { NotificationProvider, useNotification } from '@/app/custom-components/ToastComponent/NotificationContext';
import { toast } from 'sonner';

// Mock sonner toast functions
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    warning: jest.fn(),
    success: jest.fn()
  }
}));

// Tester component to trigger notifications
const NotificationTester = () => {
  const { showError, showWarning, showSuccess } = useNotification();
  
  return (
    <div>
      <button data-testid="trigger-error" onClick={() => showError('Error message', 'Error details', 'api')}>
        Trigger Error
      </button>
      <button data-testid="trigger-error-token" onClick={() => showError('Token error', null, 'token')}>
        Trigger Token Error
      </button>
      <button data-testid="trigger-error-login" onClick={() => showError('Login error', null, 'login')}>
        Trigger Login Error
      </button>
      <button data-testid="trigger-error-permission" onClick={() => showError('Permission error', null, 'permission')}>
        Trigger Permission Error
      </button>
      <button data-testid="trigger-error-map" onClick={() => showError('Map error', null, 'map_initialization_error')}>
        Trigger Map Error
      </button>
      <button data-testid="trigger-error-route" onClick={() => showError('Route error', null, 'route_fetch_error')}>
        Trigger Route Error
      </button>
      
      <button data-testid="trigger-warning" onClick={() => showWarning('Warning message', 'Warning details', 'routing_issue')}>
        Trigger Warning
      </button>
      <button data-testid="trigger-warning-location" onClick={() => showWarning('Location warning', null, 'location_outside_nyc')}>
        Trigger Location Warning
      </button>
      <button data-testid="trigger-warning-permission" onClick={() => showWarning('Location permission warning', null, 'location_permission_denied')}>
        Trigger Location Permission Warning
      </button>
      <button data-testid="trigger-warning-map" onClick={() => showWarning('Map data warning', null, 'map_data')}>
        Trigger Map Data Warning
      </button>
      
      <button data-testid="trigger-success" onClick={() => showSuccess('Success message', null, 'login')}>
        Trigger Success
      </button>
      <button data-testid="trigger-success-signup" onClick={() => showSuccess('Signup success', null, 'signup')}>
        Trigger Signup Success
      </button>
      <button data-testid="trigger-success-profile" onClick={() => showSuccess('Profile success', null, 'profile')}>
        Trigger Profile Success
      </button>
      <button data-testid="trigger-success-route" onClick={() => showSuccess('Route success', null, 'route_found')}>
        Trigger Route Success
      </button>
    </div>
  );
};

// Test component with both ToastNotifications and the tester
const TestApp = () => (
  <NotificationProvider>
    <ToastNotifications />
    <NotificationTester />
  </NotificationProvider>
);

describe('ToastNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should show error toast with correct icon when error is triggered', () => {
    const { getByTestId } = render(<TestApp />);
    
    act(() => {
      getByTestId('trigger-error').click();
    });
    
    expect(toast.error).toHaveBeenCalledWith(
      'API Error',
      expect.objectContaining({
        description: 'Error message',
        action: expect.any(Object)
      })
    );
  });

  test('should show token error toast with correct icon', () => {
    const { getByTestId } = render(<TestApp />);
    
    act(() => {
      getByTestId('trigger-error-token').click();
    });
    
    expect(toast.error).toHaveBeenCalledWith(
      'Session Error',
      expect.objectContaining({
        description: 'Token error'
      })
    );
  });

  test('should show login error toast with correct icon', () => {
    const { getByTestId } = render(<TestApp />);
    
    act(() => {
      getByTestId('trigger-error-login').click();
    });
    
    expect(toast.error).toHaveBeenCalledWith(
      'Login Failed',
      expect.objectContaining({
        description: 'Login error'
      })
    );
  });

  test('should show permission error toast with correct icon', () => {
    const { getByTestId } = render(<TestApp />);
    
    act(() => {
      getByTestId('trigger-error-permission').click();
    });
    
    expect(toast.error).toHaveBeenCalledWith(
      'Permission Denied',
      expect.objectContaining({
        description: 'Permission error'
      })
    );
  });

  test('should show map error toast with correct icon', () => {
    const { getByTestId } = render(<TestApp />);
    
    act(() => {
      getByTestId('trigger-error-map').click();
    });
    
    expect(toast.error).toHaveBeenCalledWith(
      'Map Error',
      expect.objectContaining({
        description: 'Map error'
      })
    );
  });

  test('should show route error toast with correct icon', () => {
    const { getByTestId } = render(<TestApp />);
    
    act(() => {
      getByTestId('trigger-error-route').click();
    });
    
    expect(toast.error).toHaveBeenCalledWith(
      'Routing Error',
      expect.objectContaining({
        description: 'Route error'
      })
    );
  });

  test('should show warning toast with correct icon when warning is triggered', () => {
    const { getByTestId } = render(<TestApp />);
    
    act(() => {
      getByTestId('trigger-warning').click();
    });
    
    expect(toast.warning).toHaveBeenCalledWith(
      'Routing Issue',
      expect.objectContaining({
        description: 'Warning message',
        action: expect.any(Object)
      })
    );
  });

  test('should show location warning toast with correct icon', () => {
    const { getByTestId } = render(<TestApp />);
    
    act(() => {
      getByTestId('trigger-warning-location').click();
    });
    
    expect(toast.warning).toHaveBeenCalledWith(
      'Location Warning',
      expect.objectContaining({
        description: 'Location warning'
      })
    );
  });

  test('should show location permission warning toast with correct icon', () => {
    const { getByTestId } = render(<TestApp />);
    
    act(() => {
      getByTestId('trigger-warning-permission').click();
    });
    
    expect(toast.warning).toHaveBeenCalledWith(
      'Location Access Denied',
      expect.objectContaining({
        description: 'Location permission warning'
      })
    );
  });

  test('should show map data warning toast with correct icon', () => {
    const { getByTestId } = render(<TestApp />);
    
    act(() => {
      getByTestId('trigger-warning-map').click();
    });
    
    expect(toast.warning).toHaveBeenCalledWith(
      'Map Data Issue',
      expect.objectContaining({
        description: 'Map data warning'
      })
    );
  });

  test('should show success toast with correct icon when success is triggered', () => {
    const { getByTestId } = render(<TestApp />);
    
    act(() => {
      getByTestId('trigger-success').click();
    });
    
    expect(toast.success).toHaveBeenCalledWith(
      'Login Successful',
      expect.objectContaining({
        description: 'Success message'
      })
    );
  });

  test('should show signup success toast with correct icon', () => {
    const { getByTestId } = render(<TestApp />);
    
    act(() => {
      getByTestId('trigger-success-signup').click();
    });
    
    expect(toast.success).toHaveBeenCalledWith(
      'Registration Complete',
      expect.objectContaining({
        description: 'Signup success'
      })
    );
  });

  test('should show profile success toast with correct icon', () => {
    const { getByTestId } = render(<TestApp />);
    
    act(() => {
      getByTestId('trigger-success-profile').click();
    });
    
    expect(toast.success).toHaveBeenCalledWith(
      'Profile Updated',
      expect.objectContaining({
        description: 'Profile success'
      })
    );
  });

  test('should show route success toast with correct icon', () => {
    const { getByTestId } = render(<TestApp />);
    
    act(() => {
      getByTestId('trigger-success-route').click();
    });
    
    expect(toast.success).toHaveBeenCalledWith(
      'Route Found',
      expect.objectContaining({
        description: 'Route success'
      })
    );
  });
});