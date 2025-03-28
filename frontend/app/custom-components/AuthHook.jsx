<<<<<<< HEAD:frontend/app/custom-components/AuthHook.js
'use client'
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { apiGet } from '../../utils/fetch/fetch';
import { isTokenExpired, setupTokenRefresh, refreshDjangoToken as refreshToken } from '@/utils/token-utils';
import { useNotification } from './ToastComponent/NotificationContext';
=======
"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { apiGet } from "../../utils/fetch/fetch";
import {
  isTokenExpired,
  setupTokenRefresh,
  refreshDjangoToken as refreshToken,
} from "@/utils/token-utils";
import { useNotification } from "./ToastComponent/NotificationContext";
>>>>>>> origin/develop:frontend/app/custom-components/AuthHook.jsx

// Create auth context
const AuthContext = createContext(null);

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Auth provider component
export function AuthProvider({ children }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialCheckDone = useRef(false);

  // Use the notification context instead of managing notifications internally
  const { showError, showSuccess } = useNotification();

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
<<<<<<< HEAD:frontend/app/custom-components/AuthHook.js
      showError('Token refresh failed', error, 'token');
=======
      showError("Token refresh failed", error, "token");
>>>>>>> origin/develop:frontend/app/custom-components/AuthHook.jsx
      handleLogout();
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showError]);

  // Fetch user data from Django
<<<<<<< HEAD:frontend/app/custom-components/AuthHook.js
  const fetchUserData = useCallback(async (accessToken) => {
    try {
      const token = accessToken || localStorage.getItem('djangoAccessToken');
=======
  const fetchUserData = useCallback(
    async (accessToken) => {
      try {
        const token = accessToken || localStorage.getItem("djangoAccessToken");
>>>>>>> origin/develop:frontend/app/custom-components/AuthHook.jsx

        if (!token) {
          throw new Error("No access token available");
        }

        // Use our apiGet helper with auth headers
        const userData = await apiGet("/users/me/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userData) {
          throw new Error("Failed to fetch user data");
        }

        return userData;
      } catch (error) {
        showError("Error fetching user data", error, "api");
        throw error;
      }
<<<<<<< HEAD:frontend/app/custom-components/AuthHook.js

      return userData;
    } catch (error) {
      showError('Error fetching user data', error, 'api');
      throw error;
    }
  }, [showError]);
=======
    },
    [showError]
  );
>>>>>>> origin/develop:frontend/app/custom-components/AuthHook.jsx

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      // Sign out from NextAuth
      await signOut({ redirect: false });
      if (typeof window !== "undefined") {
        // Clear local storage
        localStorage.removeItem("djangoAccessToken");
        localStorage.removeItem("djangoRefreshToken");
        localStorage.removeItem("user");
      }

      // Reset state
      setUser(null);

      // Redirect to login page
      router.push("/users/login");
    } catch (error) {
<<<<<<< HEAD:frontend/app/custom-components/AuthHook.js
      showError('Error during logout', error);
=======
      showError("Error during logout", error);
>>>>>>> origin/develop:frontend/app/custom-components/AuthHook.jsx
    }
  }, [router, showError]);

  // Listen for custom auth update events (for credential login)
  useEffect(() => {
    const handleAuthUpdate = (event) => {
      // console.log("Auth update event received");
<<<<<<< HEAD:frontend/app/custom-components/AuthHook.js
      const storedUser = localStorage.getItem('user');
=======
      const storedUser = localStorage.getItem("user");
>>>>>>> origin/develop:frontend/app/custom-components/AuthHook.jsx

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // console.log("Setting user from auth update event", parsedUser);
          setUser(parsedUser);
<<<<<<< HEAD:frontend/app/custom-components/AuthHook.js
          showSuccess("You've been successfully authenticated", null, 'login');
=======
          showSuccess("You've been successfully authenticated", null, "login");
>>>>>>> origin/develop:frontend/app/custom-components/AuthHook.jsx
        } catch (e) {
          showError("Error parsing user data", e);
        }
      }
    };

    // Custom event for internal communication
    window.addEventListener("auth-updated", handleAuthUpdate);

    return () => {
      window.removeEventListener("auth-updated", handleAuthUpdate);
    };
  }, [showError, showSuccess]);

  // Initial authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Skip if we're still loading NextAuth session
        if (status === "loading") {
          return;
        }

        // console.log("Checking authentication state...");

        const accessToken = localStorage.getItem("djangoAccessToken");
        const refreshTokenValue = localStorage.getItem("djangoRefreshToken");
        const storedUser = localStorage.getItem("user");

        // Check if token is expired
        if (accessToken && isTokenExpired(accessToken)) {
          // console.log("Access token expired, attempting to refresh");

          if (refreshTokenValue) {
            try {
              // Attempt to refresh the token
              const newToken = await refreshToken();
              // console.log("Token refreshed successfully");

              // If we don't have user data, fetch it
              if (!storedUser) {
                const userData = await fetchUserData(newToken);
                localStorage.setItem("user", JSON.stringify(userData));
                setUser(userData);
              } else {
                try {
                  setUser(JSON.parse(storedUser));
                } catch (e) {
                  showError("Error parsing stored user data", e);
                  // Try to fetch fresh data if parse fails
                  const userData = await fetchUserData(newToken);
                  localStorage.setItem("user", JSON.stringify(userData));
                  setUser(userData);
                }
              }
            } catch (error) {
<<<<<<< HEAD:frontend/app/custom-components/AuthHook.js
              showError("Failed to refresh token", error, 'token');
=======
              showError("Failed to refresh token", error, "token");
>>>>>>> origin/develop:frontend/app/custom-components/AuthHook.jsx
              // Clear auth state on refresh failure
              handleLogout();
              return;
            }
          } else {
<<<<<<< HEAD:frontend/app/custom-components/AuthHook.js
            showError("No refresh token available", null, 'token');
=======
            showError("No refresh token available", null, "token");
>>>>>>> origin/develop:frontend/app/custom-components/AuthHook.jsx
            handleLogout();
            return;
          }
        }
        // If NextAuth session exists but no Django token, try to get it from session
<<<<<<< HEAD:frontend/app/custom-components/AuthHook.js
        else if (status === 'authenticated' && session?.djangoTokens && !accessToken) {
          // console.log("Found NextAuth session with Django tokens");
          localStorage.setItem('djangoAccessToken', session.djangoTokens.access);
          localStorage.setItem('djangoRefreshToken', session.djangoTokens.refresh);
=======
        else if (
          status === "authenticated" &&
          session?.djangoTokens &&
          !accessToken
        ) {
          // console.log("Found NextAuth session with Django tokens");
          localStorage.setItem(
            "djangoAccessToken",
            session.djangoTokens.access
          );
          localStorage.setItem(
            "djangoRefreshToken",
            session.djangoTokens.refresh
          );
>>>>>>> origin/develop:frontend/app/custom-components/AuthHook.jsx

          if (session.djangoUser) {
            localStorage.setItem("user", JSON.stringify(session.djangoUser));
            setUser(session.djangoUser);
          } else {
            // Fetch user data if not provided in session
            try {
              const userData = await fetchUserData(session.djangoTokens.access);
              localStorage.setItem("user", JSON.stringify(userData));
              setUser(userData);
            } catch (error) {
<<<<<<< HEAD:frontend/app/custom-components/AuthHook.js
              showError("Error fetching user data from session", error, 'api');
=======
              showError("Error fetching user data from session", error, "api");
>>>>>>> origin/develop:frontend/app/custom-components/AuthHook.jsx
            }
          }
        }
        // If we have stored credentials but no user state
        else if (accessToken && !user) {
          // console.log("Found access token, checking user data");

          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
            } catch (e) {
              showError("Error parsing stored user", e);

              // If parsing fails, try to fetch user data
              try {
                const userData = await fetchUserData(accessToken);
                localStorage.setItem("user", JSON.stringify(userData));
                setUser(userData);
              } catch (fetchError) {
<<<<<<< HEAD:frontend/app/custom-components/AuthHook.js
                showError("Error fetching user data", fetchError, 'api');
=======
                showError("Error fetching user data", fetchError, "api");
>>>>>>> origin/develop:frontend/app/custom-components/AuthHook.jsx
                handleLogout();
              }
            }
          } else {
            // No stored user but valid token, fetch user data
            try {
              // console.log("No stored user data, fetching from API");
              const userData = await fetchUserData(accessToken);
              localStorage.setItem("user", JSON.stringify(userData));
              setUser(userData);
            } catch (error) {
<<<<<<< HEAD:frontend/app/custom-components/AuthHook.js
              showError("Error fetching user data", error, 'api');
=======
              showError("Error fetching user data", error, "api");
>>>>>>> origin/develop:frontend/app/custom-components/AuthHook.jsx
              handleLogout();
            }
          }
        }
        // No authentication found
        else if (!accessToken && !user) {
          // console.log("No authentication found");
          setUser(null);
        }

        // Mark initial check as done and remove loading state
        initialCheckDone.current = true;
        setLoading(false);
      } catch (error) {
<<<<<<< HEAD:frontend/app/custom-components/AuthHook.js
        showError('Auth check error', error);
=======
        showError("Auth check error", error);
>>>>>>> origin/develop:frontend/app/custom-components/AuthHook.jsx
        setLoading(false);
      }
    };

    checkAuth();
  }, [status, session, user, handleLogout, fetchUserData, showError]);

  // Context value
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    logout: handleLogout,
    refreshToken: refreshDjangoToken,
<<<<<<< HEAD:frontend/app/custom-components/AuthHook.js
    fetchUserData
=======
    fetchUserData,
>>>>>>> origin/develop:frontend/app/custom-components/AuthHook.jsx
  };

  // Provide auth context
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
