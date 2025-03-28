import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '@/app/custom-components/AuthHook';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/utils/fetch/fetch';
import { 
  isTokenExpired, 
  setupTokenRefresh, 
  refreshDjangoToken 
} from '@/utils/token-utils';
import { useNotification } from '@/app/custom-components/ToastComponent/NotificationContext';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn()
}));

jest.mock('@/utils/fetch/fetch', () => ({
  apiGet: jest.fn()
}));

jest.mock('@/utils/token-utils', () => ({
  isTokenExpired: jest.fn(),
  setupTokenRefresh: jest.fn(),
  refreshDjangoToken: jest.fn()
}));

jest.mock('@/app/custom-components/ToastComponent/NotificationContext', () => ({
  useNotification: jest.fn()
}));

// Storage mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value?.toString() || '';
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// This is a component that uses the useAuth hook and exposes all functionality
const AuthConsumer = () => {
  const { user, loading, isAuthenticated, logout, refreshToken, fetchUserData } = useAuth();
  
  return (
    <div>
      <div data-testid="user">{JSON.stringify(user)}</div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <button data-testid="logout" onClick={logout}>Logout</button>
      <button data-testid="refresh" onClick={refreshToken}>Refresh Token</button>
      <button data-testid="fetch" onClick={fetchUserData}>Fetch User</button>
    </div>
  );
};

// Our main test suite
describe('AuthProvider', () => {
  // Set up common mocks
  const mockPush = jest.fn();
  const mockShowError = jest.fn();
  const mockShowSuccess = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Default mock implementations
    useRouter.mockReturnValue({ push: mockPush });
    useNotification.mockReturnValue({ 
      showError: mockShowError, 
      showSuccess: mockShowSuccess 
    });
    useSession.mockReturnValue({
      data: null,
      status: 'unauthenticated'
    });
    signOut.mockResolvedValue(undefined);
    isTokenExpired.mockReturnValue(false);
    setupTokenRefresh.mockImplementation(() => {});
    refreshDjangoToken.mockResolvedValue('new-token');
    apiGet.mockResolvedValue({ id: 1, username: 'testuser' });
  });

  it('should provide auth context to children', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('user')).toBeInTheDocument();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByTestId('isAuthenticated')).toBeInTheDocument();
  });

  it('should load user from localStorage if available', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    localStorageMock.setItem('djangoAccessToken', 'test-access-token');
    localStorageMock.setItem('user', JSON.stringify(mockUser));
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    await waitFor(() => {
      const userElement = screen.getByTestId('user');
      expect(userElement.textContent).toBe(JSON.stringify(mockUser));
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    });
  });

  it('should handle logout correctly', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    localStorageMock.setItem('djangoAccessToken', 'test-access-token');
    localStorageMock.setItem('user', JSON.stringify(mockUser));
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    // Wait for user to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    });
    
    // Trigger logout
    await act(async () => {
      fireEvent.click(screen.getByTestId('logout'));
    });
    
    // Verify logout behavior
    expect(signOut).toHaveBeenCalledWith({ redirect: false });
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('djangoAccessToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('djangoRefreshToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    expect(mockPush).toHaveBeenCalledWith('/users/login');
  });

  // Test for loading credentials from NextAuth session
  it('should load credentials from NextAuth session', async () => {
    const mockSession = {
      djangoTokens: {
        access: 'session-access-token',
        refresh: 'session-refresh-token'
      },
      djangoUser: { id: 1, username: 'session-user' }
    };
    
    // Mock authenticated session
    useSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated'
    });
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('djangoAccessToken', mockSession.djangoTokens.access);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('djangoRefreshToken', mockSession.djangoTokens.refresh);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockSession.djangoUser));
      expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(mockSession.djangoUser));
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    });
  });

  // Test for NextAuth session without user data
  it('should fetch user data from NextAuth session if no user data provided', async () => {
    const mockSession = {
      djangoTokens: {
        access: 'session-access-token',
        refresh: 'session-refresh-token'
      }
      // No djangoUser provided
    };
    
    const mockUser = { id: 1, username: 'api-user' };
    
    // Mock authenticated session
    useSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated'
    });
    
    apiGet.mockResolvedValueOnce(mockUser);
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('/users/me/', {
        headers: {
          Authorization: `Bearer ${mockSession.djangoTokens.access}`
        }
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(mockUser));
    });
  });

  // Test for token refresh
  it('should refresh token if token is expired', async () => {
    const expiredToken = 'expired-token';
    const refreshToken = 'refresh-token';
    const newToken = 'new-token';
    const mockUser = { id: 1, username: 'refreshed-user' };
    
    localStorageMock.setItem('djangoAccessToken', expiredToken);
    localStorageMock.setItem('djangoRefreshToken', refreshToken);
    
    // Token is expired
    isTokenExpired.mockReturnValue(true);
    refreshDjangoToken.mockResolvedValueOnce(newToken);
    apiGet.mockResolvedValueOnce(mockUser);
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(isTokenExpired).toHaveBeenCalledWith(expiredToken);
      expect(refreshDjangoToken).toHaveBeenCalled();
      expect(apiGet).toHaveBeenCalledWith('/users/me/', {
        headers: {
          Authorization: `Bearer ${newToken}`
        }
      });
      expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(mockUser));
    });
  });

  // Test for handling expired token with no refresh token
  it('should redirect to login if token is expired and no refresh token', async () => {
    const expiredToken = 'expired-token';
    
    localStorageMock.setItem('djangoAccessToken', expiredToken);
    // No refresh token set
    
    // Token is expired
    isTokenExpired.mockReturnValue(true);
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(isTokenExpired).toHaveBeenCalledWith(expiredToken);
      expect(mockShowError).toHaveBeenCalledWith('No refresh token available', null, 'token');
      expect(mockPush).toHaveBeenCalledWith('/users/login');
    });
  });

  // Test for token refresh failure
  it('should handle token refresh failure', async () => {
    const expiredToken = 'expired-token';
    const refreshToken = 'refresh-token';
    
    localStorageMock.setItem('djangoAccessToken', expiredToken);
    localStorageMock.setItem('djangoRefreshToken', refreshToken);
    
    // Token is expired
    isTokenExpired.mockReturnValue(true);
    refreshDjangoToken.mockRejectedValueOnce(new Error('Refresh failed'));
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(refreshDjangoToken).toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalledWith('Failed to refresh token', expect.any(Error), 'token');
      expect(mockPush).toHaveBeenCalledWith('/users/login');
    });
  });

  // Test for fetching user data
  it('should fetch user data when explicitly called', async () => {
    const token = 'test-token';
    const mockUser = { id: 1, username: 'api-user' };
    
    localStorageMock.setItem('djangoAccessToken', token);
    apiGet.mockResolvedValueOnce(mockUser);
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Trigger fetch
    await act(async () => {
      fireEvent.click(screen.getByTestId('fetch'));
    });
    
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('/users/me/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(mockUser));
    });
  });

  // Test for fetchUserData failure
  it('should handle fetchUserData failure', async () => {
    const token = 'test-token';
    
    localStorageMock.setItem('djangoAccessToken', token);
    apiGet.mockRejectedValueOnce(new Error('API Error'));
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Trigger fetch
    await act(async () => {
      fireEvent.click(screen.getByTestId('fetch'));
    });
    
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('/users/me/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      expect(mockShowError).toHaveBeenCalledWith('Error fetching user data', expect.any(Error), 'api');
    });
  });

  

  // Test for token refresh with refreshToken function
  it('should refresh token when refreshToken function is called', async () => {
    const token = 'old-token';
    const newToken = 'refreshed-token';
    
    localStorageMock.setItem('djangoAccessToken', token);
    refreshDjangoToken.mockResolvedValueOnce(newToken);
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Trigger token refresh
    await act(async () => {
      fireEvent.click(screen.getByTestId('refresh'));
    });
    
    await waitFor(() => {
      expect(refreshDjangoToken).toHaveBeenCalled();
      expect(setupTokenRefresh).toHaveBeenCalled();
    });
  });

  // Test for handling auth-updated event
  it('should handle auth-updated event', async () => {
    const mockUser = { id: 1, username: 'event-user' };
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Simulate auth-updated event
    await act(async () => {
      localStorageMock.setItem('user', JSON.stringify(mockUser));
      window.dispatchEvent(new Event('auth-updated'));
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe(JSON.stringify(mockUser));
      expect(mockShowSuccess).toHaveBeenCalledWith("You've been successfully authenticated", null, 'login');
    });
  });

  // Test for error parsing stored user
  it('should handle error parsing stored user', async () => {
    // Set invalid JSON for user
    localStorageMock.setItem('djangoAccessToken', 'test-token');
    localStorageMock.setItem('user', '{invalid-json}');
    
    const mockUser = { id: 1, username: 'api-user' };
    apiGet.mockResolvedValueOnce(mockUser);
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Error parsing stored user', expect.any(Error));
      expect(apiGet).toHaveBeenCalled(); // Should attempt to fetch user after parse error
    });
  });

  // Test failed user fetch after parse error
  it('should handle failed user fetch after parse error', async () => {
    // Set invalid JSON for user
    localStorageMock.setItem('djangoAccessToken', 'test-token');
    localStorageMock.setItem('user', '{invalid-json}');
    
    // Mock the API fetch to fail
    apiGet.mockRejectedValueOnce(new Error('API fetch failed'));
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Error parsing stored user', expect.any(Error));
      expect(apiGet).toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalledWith('Error fetching user data', expect.any(Error), 'api');
      expect(mockPush).toHaveBeenCalledWith('/users/login');
    });
  });

  // Test for the case when apiGet returns null/falsy value
  it('should handle null/falsy value from apiGet', async () => {
    const token = 'test-token';
    
    localStorageMock.setItem('djangoAccessToken', token);
    // Return null (falsy) instead of user data
    apiGet.mockResolvedValueOnce(null);
    
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Trigger fetch
    await act(async () => {
      fireEvent.click(screen.getByTestId('fetch'));
    });
    
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalledWith(
        'Error fetching user data', 
        expect.objectContaining({ message: 'Failed to fetch user data' }),
        'api'
      );
    });
  });
});