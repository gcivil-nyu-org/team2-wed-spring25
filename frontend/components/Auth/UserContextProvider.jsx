"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { authAPI } from "@/utils/fetch/fetch";

// Create the context
const UserContext = createContext(null);

// Provider component
export function UserProvider({ children }) {
  const { data: session, status } = useSession();
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync userDetails to localStorage whenever it changes
  useEffect(() => {
    if (userDetails) {
      try {
        // Store user data in localStorage for backward compatibility
        localStorage.setItem("user", JSON.stringify(userDetails));        
      } catch (err) {
        console.error("Error syncing user to localStorage:", err);
      }
    } else if (status === "unauthenticated") {
      // Clear localStorage when user is logged out
      try {
        localStorage.removeItem("user");        
      } catch (err) {
        console.error("Error removing user from localStorage:", err);
      }
    }
  }, [userDetails, status]);

  // Fetch user details when session changes
  useEffect(() => {
    async function fetchUserDetails() {
      if (status !== "authenticated" || !session?.djangoTokens?.access) {
        setUserDetails(null);
        setIsLoading(false);
        return;
      }

      // Use cached details from session if available
      if (session.djangoUser && 
          session.djangoUser.id && 
          session.djangoUser.email) {        
        setUserDetails(session.djangoUser);
        setIsLoading(false);
        return;
      }

      // Otherwise fetch fresh user details
      try {
        setIsLoading(true);
        const userData = await authAPI.authenticatedGet("/users/me/");        
        setUserDetails(userData);
        setError(null);
      } catch (err) {
        console.error("Error fetching user details:", err);
        setError("Failed to load user details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserDetails();
  }, [session, status]);

  // Check if localStorage has user data on initial load
  useEffect(() => {
    try {
      // Check if localStorage has user data that we might want to use
      // This is for compatibility during the transition period
      const storedUser = localStorage.getItem("user");
      if (storedUser && !userDetails && status === "loading") {
        // Only use localStorage data temporarily while Next-Auth is still loading
        const parsedUser = JSON.parse(storedUser);        
        // We don't set this to state to avoid conflicts with Next-Auth
      }
    } catch (err) {
      console.error("Error checking localStorage for user:", err);
    }
  }, []);

  // Force refresh function
  const refreshUserDetails = async () => {
    if (status !== "authenticated") return null;
    
    try {
      setIsLoading(true);
      const userData = await authAPI.authenticatedGet("/users/me/");
      setUserDetails(userData);
      setError(null);
      return userData;
    } catch (err) {
      console.error("Error refreshing user details:", err);
      setError("Failed to refresh user details");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Create the value object to be provided
  const value = {
    user: userDetails,
    isLoading,
    error,
    isAuthenticated: status === "authenticated",
    refreshUserDetails
  };

  // Provide the context to children
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Custom hook to use the context
export function useUser() {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}