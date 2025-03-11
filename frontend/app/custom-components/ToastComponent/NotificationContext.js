'use client'

import { createContext, useContext, useState, useCallback } from 'react';

// Create notification context
const NotificationContext = createContext(null);

// Custom hook to use the notification context
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// Notification provider component
export function NotificationProvider({ children }) {
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [success, setSuccess] = useState(null);

  // Handle error notifications
  const showError = useCallback((message, details = null, type = null) => {
    setError({
      message,
      details,
      type,
      timestamp: new Date().toISOString()
    });

    // Clear error after 8 seconds (longer than toast duration)
    setTimeout(() => {
      setError(null);
    }, 8000);
  }, []);

  // Handle warning notifications
  const showWarning = useCallback((message, details = null, type = null) => {
    setWarning({
      message,
      details,
      type,
      timestamp: new Date().toISOString()
    });

    // Clear warning after 8 seconds
    setTimeout(() => {
      setWarning(null);
    }, 8000);
  }, []);

  // Handle success notifications
  const showSuccess = useCallback((message, details = null, type = null) => {
    setSuccess({
      message,
      details,
      type,
      timestamp: new Date().toISOString()
    });

    // Clear success after 8 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 8000);
  }, []);

  // Context value
  const value = {
    error,
    warning,
    success,
    showError,
    showWarning,
    showSuccess,
    clearError: () => setError(null),
    clearWarning: () => setWarning(null),
    clearSuccess: () => setSuccess(null),
  };

  // Provide notification context
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}