"use client";

// utils/token-utils.js
import { jwtDecode } from "jwt-decode";
import { apiPost } from "./fetch/fetch";

/**
 * Check if a JWT token is expired
 * @param {string} token - The JWT token to check
 * @param {number} bufferSeconds - Buffer time in seconds before actual expiration (default: 60s)
 * @returns {boolean} - Whether the token is expired or will expire within the buffer time
 */
export function isTokenExpired(token, bufferSeconds = 60) {
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    // Add buffer to current time to prevent using a token that will expire very soon
    return decoded.exp < currentTime + bufferSeconds;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true; // If we can't decode the token, assume it's expired
  }
}

/**
 * Get payload data from a JWT token
 * @param {string} token - The JWT token
 * @returns {object|null} - The decoded payload or null if invalid
 */
export function getTokenPayload(token) {
  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

/**
 * Get time until token expiration in seconds
 * @param {string} token - The JWT token
 * @returns {number} - Seconds until expiration or 0 if expired/invalid
 */
export function getTokenTimeRemaining(token) {
  if (!token) return 0;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime
      ? Math.floor(decoded.exp - currentTime)
      : 0;
  } catch (error) {
    console.error("Error decoding token:", error);
    return 0;
  }
}

/**
 * Configure automated token refresh based on expiration
 * @param {Function} refreshCallback - Function to call to refresh token
 * @param {string} token - The JWT token to monitor
 * @param {number} refreshThresholdSeconds - Threshold in seconds to refresh before expiration
 * @returns {Function} - Cleanup function to cancel the refresh timer
 */
export function setupTokenRefresh(
  refreshCallback,
  token,
  refreshThresholdSeconds = 300
) {
  if (!token || !refreshCallback) return () => {};

  try {
    // Get token expiration time
    const decoded = jwtDecode(token);
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    // Calculate time until refresh (expiration minus threshold)
    const refreshTime = expirationTime - refreshThresholdSeconds * 1000;
    const timeUntilRefresh = refreshTime - currentTime;

    // If token is already due for refresh, do it immediately
    if (timeUntilRefresh <= 0) {
      refreshCallback();
      return () => {};
    }

    // Set up timer to refresh token when needed
    const timerId = setTimeout(refreshCallback, timeUntilRefresh);

    // Return cleanup function
    return () => clearTimeout(timerId);
  } catch (error) {
    console.error("Error setting up token refresh:", error);
    return () => {};
  }
}

/**
 * Refreshes the Django JWT token using the refresh token
 * @returns {Promise<string>} The new access token
 */
export async function refreshDjangoToken() {
  try {
    const refreshToken = localStorage.getItem("djangoRefreshToken");
    if (!refreshToken) throw new Error("No refresh token available");

    // Use our apiPost helper instead of fetch directly
    const response = await apiPost("/token/refresh/", {
      refresh: refreshToken,
    });

    // Store new tokens
    localStorage.setItem("djangoAccessToken", response.access);

    return response.access;
  } catch (error) {
    console.error("Token refresh failed:", error);

    // Clear tokens on refresh failure
    localStorage.removeItem("djangoAccessToken");
    localStorage.removeItem("djangoRefreshToken");
    localStorage.removeItem("djangoUser");

    throw error;
  }
}
