'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, getSession, signOut } from 'next-auth/react';
import { apiGet, apiPost } from './fetch/fetch';
import { isTokenExpired, setupTokenRefresh, refreshDjangoToken as refreshToken } from '@/utils/token-utils';

// Create auth context
const AuthContext = createContext(null);

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth provider component
export function AuthProvider({ children }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refresh Django token - using our token utilities
  const refreshDjangoToken = useCallback(async () => {
    try {
      // Use the refreshToken utility function from token-utils
      const newToken = await refreshToken();
      
      // Set up new refresh timer
      setupTokenRefresh(refreshDjangoToken, newToken);
      
      return newToken;
    } catch (error) {
      // If refresh fails, clear all tokens and redirect to login
      console.error('Token refresh failed:', error);
      handleLogout();
      throw error;
    }
  }, []);

  // Fetch user data from Django
  const fetchUserData = async (accessToken) => {
    try {
      const token = accessToken || localStorage.getItem('djangoAccessToken');
      // Use our apiGet helper with auth headers
      const userData = await apiGet('/users/me/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      // Sign out from NextAuth
      await signOut({ redirect: false });
      
      // Clear Django tokens from localStorage
      localStorage.removeItem('djangoAccessToken');
      localStorage.removeItem('djangoRefreshToken');
      localStorage.removeItem('djangoUser');
      
      // Reset state
      setUser(null);
      
      // Redirect to login page
      router.push('/users/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, [router]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If we're loading the session or not authenticated yet, wait
        if (status === 'loading') return;
        
        // If we don't have a session, redirect to login
        if (status === 'unauthenticated') {
          // Clear any stale tokens
          localStorage.removeItem('djangoAccessToken');
          localStorage.removeItem('djangoRefreshToken');
          
          // Only redirect if not already on login page
          if (!router.pathname?.includes('/login')) {
            router.push('/users/login');
          }
          setLoading(false);
          return;
        }
        
        // At this point, we have a NextAuth session
        let accessToken = localStorage.getItem('djangoAccessToken');
        
        // Check if token is expired and refresh if needed
        if (!accessToken || isTokenExpired(accessToken)) {
          try {
            accessToken = await refreshDjangoToken();
          } catch (error) {
            // If refresh fails, handleLogout will redirect
            setLoading(false);
            return;
          }
        } else {
          // If token is valid, set up refresh timer
          setupTokenRefresh(refreshDjangoToken, accessToken);
        }
        
        // Now fetch user data with the valid token
        const userData = await fetchUserData(accessToken);
        setUser(userData);
        
        // Save user data to localStorage for session callback
        localStorage.setItem('djangoUser', JSON.stringify(userData));
        
      } catch (error) {
        console.error('Auth check error:', error);
        
        // If there's an authentication error, redirect to login
        if (error.message?.includes('Authentication credentials') || 
            error.message?.includes('Invalid token') ||
            error.message?.includes('Token is invalid or expired')) {
          handleLogout();
        } else {
          setError(error.message || 'Authentication error');
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [status, router, refreshDjangoToken, handleLogout]);

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    logout: handleLogout,
    refreshToken: refreshDjangoToken,
    fetchUserData,
  };

  // Provide auth context
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Protected route wrapper component
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!loading && !isAuthenticated) {
      router.push('/users/login');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Only render children if authenticated
  return isAuthenticated ? children : null;
}