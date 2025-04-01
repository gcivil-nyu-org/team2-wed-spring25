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
        console.log("Using cached user details from session");
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