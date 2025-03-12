// utils/api.js
import { getDjangoErrorMessage } from "../django-error-handler";

// Import your base URL from environment configuration
const BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL

/**
 * Enhanced fetch utility for making API requests
 * @param {string} url - The endpoint URL (without the base URL)
 * @param {Object} options - Fetch options
 * @param {number} options.timeoutMs - Request timeout in milliseconds
 * @returns {Promise<any>} - Response data
 */
export async function enhancedFetch(url, options = {}) {
    const urlPath = url.startsWith('/') ? url : `/${url}`;
    const fullUrl = `${BASE_URL}${urlPath}`;
    console.log('Fetching:', fullUrl);
    const { timeoutMs = 5000, ...fetchOptions } = options;

    // Setup abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(fullUrl, {
            ...fetchOptions,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...fetchOptions.headers,
            },
            ...(process.env.NODE_ENV === 'development' ? { rejectUnauthorized: false } : {})
        });

        // Clear timeout since request completed
        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = getDjangoErrorMessage(data);
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        clearTimeout(timeoutId);

        // Handle different types of errors
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error(`Request timed out after ${timeoutMs}ms`);
            }
            // Pass through the error message (either from Django or network)
            throw new Error(error.message);
        }

        // Fallback for unexpected errors
        throw new Error('An unexpected error occurred');
    }
}

// Shorthand methods for common HTTP verbs
export const apiGet = (url, options) =>
    enhancedFetch(url, { method: 'GET', ...options });

export const apiPost = (url, data, options) =>
    enhancedFetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        ...options
    });

export const apiPut = (url, data, options) =>
    enhancedFetch(url, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options
    });

export const apiPatch = (url, data, options) =>
    enhancedFetch(url, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options
    });

export const apiDelete = (url, options) =>
    enhancedFetch(url, { method: 'DELETE', ...options });

// Simple API for authentication
export const authAPI = {
    // Add authentication token to headers
    getAuthHeaders() {
        const token = localStorage.getItem('djangoAccessToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    },

    // Example method for authenticated requests
    authenticatedFetch(url, options = {}) {
        return enhancedFetch(url, {
            ...options,
            headers: {
                ...options.headers,
                ...this.getAuthHeaders()
            }
        });
    },
    authenticatedPost(url, data, options = {}) {
        return enhancedFetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options,
            headers: {
                ...options.headers,
                ...this.getAuthHeaders()
            }
        });
    }
};