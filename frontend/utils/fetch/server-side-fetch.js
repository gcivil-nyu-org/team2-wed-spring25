import { getServerSession } from "next-auth/next";
import { auth } from "@/auth"; // Your NextAuth configuration
import { getDjangoErrorMessage } from "@/utils/django-error-handler";

const BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

/**
 * Enhanced fetch utility for making API requests from the server
 * @param {string} url - The endpoint URL (without the base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
export async function serverFetch(url, options = {}) {
  const session = await getServerSession(auth);
  
  if (!session?.djangoTokens?.access) {
    throw new Error("Not authenticated");
  }
  
  const urlPath = url.startsWith("/") ? url : `/${url}`;
  const fullUrl = `${BASE_URL}${urlPath}`;
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.djangoTokens.access}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      throw new Error("Session expired");
    }

    if (response.status !== 204) {
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = getDjangoErrorMessage(data);
        throw new Error(errorMessage);
      }

      return data;
    } else {
      // For 204 No Content, just return success with no data
      return { success: true };
    }
  } catch (error) {
    console.error("API error:", error);
    
    // Rethrow the error to be handled by the caller
    throw error;
  }
}

// Server-side API methods 
export const serverApi = {
  get: (url, options = {}) => 
    serverFetch(url, { method: "GET", ...options }),
    
  post: (url, data, options = {}) => 
    serverFetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    }),
    
  put: (url, data, options = {}) => 
    serverFetch(url, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    }),
    
  patch: (url, data, options = {}) => 
    serverFetch(url, {
      method: "PATCH",
      body: JSON.stringify(data),
      ...options,
    }),
    
  delete: (url, options = {}) => 
    serverFetch(url, { method: "DELETE", ...options }),
};