"use client";
// utils/fetch/api.js - Hybrid approach with both direct imports and hooks

import { getDjangoErrorMessage } from "../django-error-handler";
import { getSession, useSession, signOut } from "next-auth/react";

// Import your base URL from environment configuration
const BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL;

/**
 * Enhanced fetch utility for making API requests
 * @param {string} url - The endpoint URL (without the base URL)
 * @param {Object} options - Fetch options
 * @param {number} options.timeoutMs - Request timeout in milliseconds
 * @returns {Promise<any>} - Response data
 */
export async function enhancedFetch(url, options = {}, session = null) {
  const urlPath = url.startsWith("/") ? url : `/${url}`;
  const fullUrl = `${BASE_URL}${urlPath}`;
  const { timeoutMs = 8000, ...fetchOptions } = options;

  // Setup abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
      ...(process.env.NODE_ENV === "development"
        ? { rejectUnauthorized: false }
        : {}),
    });

    // Clear timeout since request completed
    clearTimeout(timeoutId);

    if (response.status === 401 && session) {
      // Token expired - redirect to login
      if (typeof window !== 'undefined') {
        signOut({ callbackUrl: '/users/login?error=session_expired' });
      }
      throw new Error("Session expired. Please login again.");
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
    clearTimeout(timeoutId);
    console.error("API Error:", error);

    // Handle different types of errors
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      // Pass through the error message (either from Django or network)
      throw new Error(error.message);
    }

    // Fallback for unexpected errors
    throw new Error("An unexpected error occurred");
  }
}

// ========= PUBLIC API METHODS (No authentication required) =========

export const apiGet = (url, options) =>
  enhancedFetch(url, { method: "GET", ...options });

export const apiPost = (url, data, options) =>
  enhancedFetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    ...options,
  });

export const apiPut = (url, data, options) =>
  enhancedFetch(url, {
    method: "PUT",
    body: JSON.stringify(data),
    ...options,
  });

export const apiPatch = (url, data, options) =>
  enhancedFetch(url, {
    method: "PATCH",
    body: JSON.stringify(data),
    ...options,
  });

export const apiDelete = (url, options) =>
  enhancedFetch(url, { method: "DELETE", ...options });

// ========= AUTHENTICATED API METHODS =========

export const authAPI = {
  // Helper to get auth headers from session
  getAuthHeaders(session) {
    return session?.djangoTokens?.access 
      ? { Authorization: `Bearer ${session.djangoTokens.access}` } 
      : {};
  },

  // Get the current session (for direct use without hooks)
  async getSession() {
    return await getSession();
  },

  // Authenticated fetch methods
  async authenticatedGet(url, options = {}) {
    const session = await this.getSession();
    return enhancedFetch(url, {
      method: "GET",
      ...options,
      headers: {
        ...options.headers,
        ...this.getAuthHeaders(session),
      },
    }, session);
  },

  async authenticatedPost(url, data, options = {}) {
    const session = await this.getSession();
    return enhancedFetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
      headers: {
        ...options.headers,
        ...this.getAuthHeaders(session),
      },
    }, session);
  },

  async authenticatedPut(url, data, options = {}) {
    const session = await this.getSession();
    return enhancedFetch(url, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
      headers: {
        ...options.headers,
        ...this.getAuthHeaders(session),
      },
    }, session);
  },

  async authenticatedPatch(url, data, options = {}) {
    const session = await this.getSession();
    return enhancedFetch(url, {
      method: "PATCH",
      body: JSON.stringify(data),
      ...options,
      headers: {
        ...options.headers,
        ...this.getAuthHeaders(session),
      },
    }, session);
  },

  async authenticatedDelete(url, options = {}) {
    const session = await this.getSession();
    return enhancedFetch(url, {
      method: "DELETE",
      ...options,
      headers: {
        ...options.headers,
        ...this.getAuthHeaders(session),
      },
    }, session);
  },
};

// ========= HOOK-BASED API (for components with frequent session changes) =========

export function useApi() {
  const { data: session, status } = useSession();
  
  return {
    // Regular API methods
    apiGet,
    apiPost,
    apiPut,
    apiPatch,
    apiDelete,
    
    // Auth methods with session from hook
    authAPI: {
      getAuthHeaders() {
        return session?.djangoTokens?.access 
          ? { Authorization: `Bearer ${session.djangoTokens.access}` } 
          : {};
      },
      
      authenticatedGet(url, options = {}) {
        return enhancedFetch(url, {
          method: "GET",
          ...options,
          headers: {
            ...options.headers,
            ...this.getAuthHeaders(),
          },
        }, session);
      },
      
      authenticatedPost(url, data, options = {}) {
        return enhancedFetch(url, {
          method: "POST",
          body: JSON.stringify(data),
          ...options,
          headers: {
            ...options.headers,
            ...this.getAuthHeaders(),
          },
        }, session);
      },
      
      authenticatedPut(url, data, options = {}) {
        return enhancedFetch(url, {
          method: "PUT",
          body: JSON.stringify(data),
          ...options,
          headers: {
            ...options.headers,
            ...this.getAuthHeaders(),
          },
        }, session);
      },
      
      authenticatedPatch(url, data, options = {}) {
        return enhancedFetch(url, {
          method: "PATCH",
          body: JSON.stringify(data),
          ...options,
          headers: {
            ...options.headers,
            ...this.getAuthHeaders(),
          },
        }, session);
      },
      
      authenticatedDelete(url, options = {}) {
        return enhancedFetch(url, {
          method: "DELETE",
          ...options,
          headers: {
            ...options.headers,
            ...this.getAuthHeaders(),
          },
        }, session);
      },
    },
    
    // Session status
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    session
  };
}