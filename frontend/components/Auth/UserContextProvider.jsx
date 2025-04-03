"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { authAPI } from "@/utils/fetch/fetch";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Create the context
const UserContext = createContext(null);

// Loading spinner component
function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bglinkedin">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg font-medium text-gray-600">{message}</p>
    </div>
  );
}

// Provider component
export function UserProvider({ 
  children,
  disableBackgroundRefresh = false // Set to true to disable background refresh
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userDetails, setUserDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("Fetching user details...");

  // Maximum time to wait for user details before showing an error
  const MAX_LOADING_TIME = 10000; // 10 seconds

  // Sync userDetails to localStorage whenever it changes
  useEffect(() => {    
    if (userDetails) {
      try {
        console.log("Storing user in localStorage");
        localStorage.setItem("user", JSON.stringify(userDetails));
      } catch (err) {
        console.error("[UserProvider] Error syncing user to localStorage:", err);
      }
    } else if (status === "unauthenticated") {
      try {
        console.log("Removing user from localStorage");
        localStorage.removeItem("user");
      } catch (err) {
        console.error("[UserProvider] Error removing user from localStorage:", err);
      }
    }
  }, [userDetails, status]);

  // Set up timeout for loading
  useEffect(() => {
    let timeoutId;

    if (isLoading) {
      timeoutId = setTimeout(() => {
        if (isLoading) {
          console.log("Loading taking longer than expected");
          setLoadingMessage("Taking longer than expected...");

          // After another delay, we could redirect to login with error
          setTimeout(() => {
            if (isLoading) {
              console.error("[UserProvider] User details fetch timeout");
              router.push("/login?error=timeout");
            }
          }, 5000);
        }
      }, MAX_LOADING_TIME);
    }

    return () => {
      if (timeoutId) {
        console.log("Clearing loading timeout");
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, router]);

  // Fetch user details when session changes
  useEffect(() => {
    async function fetchUserDetails() {
      // console.log("fetchUserDetails called", { status, sessionExists: !!session });
      
      // If session is still loading, wait
      if (status === "loading") {
        console.log("Session still loading");
        setLoadingMessage("Initializing session...");
        return;
      }

      // If user is not authenticated, clear state and stop loading
      if (status === "unauthenticated" || !session?.djangoTokens?.access) {
        console.log("User not authenticated or no access token", { 
          status, 
          hasAccessToken: !!session?.djangoTokens?.access 
        });
        setUserDetails(null);
        setIsLoading(false);
        router.push("/login");
        return;
      }

      // Check if session has an error
      if (session.error) {
        console.error("[UserProvider] Session error detected:", session.error);
        setError(session.error);
        setIsLoading(false);
        router.push(`/login?error=${encodeURIComponent(session.error)}`);
        return;
      }

      setLoadingMessage("Fetching user details...");

      // Use cached details from session if available and complete
      if (session.djangoUser &&
          session.djangoUser.id &&
          session.djangoUser.email) {
        console.log("Using user details from session", { 
          id: session.djangoUser.id,
          email: session.djangoUser.email 
        });
        
        setUserDetails(session.djangoUser);
        setIsLoading(false);

        // Optionally refresh in background with more safety checks
        if (!disableBackgroundRefresh) {
          authAPI.authenticatedGet("/users/me/")
            .then(response => {              
              // Handle different response formats
              const freshData = response.user ? response.user : response;
                            
              // Only update if we have valid data that's different from current
              if (freshData && freshData.id && freshData.email) {
                // Check if data is actually different
                const isDataDifferent = JSON.stringify(freshData) !== JSON.stringify(session.djangoUser);
                console.log("Is data different?", { isDataDifferent });
                
                if (isDataDifferent) {
                  console.log("Updating user details from background refresh", freshData);
                  setUserDetails(freshData);
                } else {
                  console.log("No changes needed from background refresh");
                }
              } else {
                console.warn("[UserProvider] Background refresh returned invalid data:", freshData);            
              }
            })
            .catch(err => {
              console.error("[UserProvider] Background refresh error:", err);          
            });
        } else {
          console.log("Background refresh disabled");
        }

        return;
      }

      // Otherwise fetch fresh user details
      try {
        console.log("Fetching fresh user details");
        const response = await authAPI.authenticatedGet("/users/me/");
        console.log("Fresh user details response", response);
        
        // Handle different response formats
        const userData = response.user ? response.user : response;
        
        console.log("Processed user data", userData);
        
        if (userData && userData.id && userData.email) {
          setUserDetails(userData);
          setError(null);
        } else {
          console.error("[UserProvider] Invalid user data received:", userData);
          setError("Invalid user data received");
          router.push("/login?error=invalidUserData");
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("[UserProvider] Error fetching user details:", err);
        setError("Failed to load user details");
        setIsLoading(false);
        router.push("/login?error=fetchFailed");
      }
    }

    fetchUserDetails();
  }, [session, status, router, disableBackgroundRefresh]);

  // Force refresh function
  const refreshUserDetails = async () => {
    console.log("refreshUserDetails called", { status });
    
    if (status !== "authenticated") {
      console.log("Cannot refresh - not authenticated");
      return null;
    }

    try {
      setIsLoading(true);
      setLoadingMessage("Refreshing user details...");
      
      console.log("Fetching updated user details");
      const response = await authAPI.authenticatedGet("/users/me/");
      console.log("User details refresh response", response);
      
      // Handle different response formats
      const userData = response.user ? response.user : response;
      
      console.log("Processed user data", userData);
      
      if (userData && userData.id && userData.email) {
        setUserDetails(userData);
        setError(null);
      } else {
        console.error("[UserProvider] Invalid user data in refresh:", userData);
        // Keep existing user data
        setError("Received invalid user data");
      }
      
      setIsLoading(false);
      return userData;
    } catch (err) {
      console.error("[UserProvider] Error refreshing user details:", err);
      setError("Failed to refresh user details");
      setIsLoading(false);
      return null;
    }
  };

  // Create the value object to be provided
  const value = {
    user: userDetails,
    isLoading,
    error,
    isAuthenticated: status === "authenticated" && !!userDetails,
    refreshUserDetails
  };

  // Debug render state
  // console.log("Render state", { 
  //   isLoading, 
  //   hasUser: !!userDetails,
  //   status,
  //   loadingMessage,
  //   error
  // });

  // Conditional rendering based on loading state
  if (isLoading) {
    return <LoadingSpinner message={loadingMessage} />;
  }

  // Ensure we only render children when we have user details
  if (!userDetails && status === "authenticated") {
    console.log("Missing user details despite authenticated status");
    return <LoadingSpinner message="Verifying user details..." />;
  }

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