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
      showError("Token refresh failed", error, "token");
      handleLogout();
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showError]);

  // Fetch user data from Django
  const fetchUserData = useCallback(
    async (accessToken) => {
      try {
        const token = accessToken || localStorage.getItem("djangoAccessToken");

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
    },
    [showError]
  );

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
      showError("Error during logout", error);
    }
  }, [router, showError]);

  // Listen for custom auth update events (for credential login)
  useEffect(() => {
    const handleAuthUpdate = (event) => {
      // console.log("Auth update event received");
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // console.log("Setting user from auth update event", parsedUser);
          setUser(parsedUser);
          showSuccess("You've been successfully authenticated", null, "login");
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
              showError("Failed to refresh token", error, "token");
              // Clear auth state on refresh failure
              handleLogout();
              return;
            }
          } else {
            showError("No refresh token available", null, "token");
            handleLogout();
            return;
          }
        }
        // If NextAuth session exists but no Django token, try to get it from session
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
              showError("Error fetching user data from session", error, "api");
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
                showError("Error fetching user data", fetchError, "api");
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
              showError("Error fetching user data", error, "api");
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
        showError("Auth check error", error);
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
    fetchUserData,
  };

  // Provide auth context
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
