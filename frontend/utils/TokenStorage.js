'use client'

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from "next/navigation";
/**
 * This component transfers tokens from the NextAuth session to localStorage
 * Include it in your layout or on pages that need access to Django tokens
 */

export default function TokenStorage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only run when session is loaded and authenticated
    if (typeof window === 'undefined') {
      return
    }
    if (status === 'authenticated' && session && session.djangoTokens) {
      console.log('TokenStorage: Syncing Django tokens from NextAuth session');

      // Store Django tokens in localStorage
      localStorage.setItem('djangoAccessToken', session.djangoTokens.access);
      localStorage.setItem('djangoRefreshToken', session.djangoTokens.refresh);

      // Store user data if available
      if (session.djangoUser) {
        localStorage.setItem('user', JSON.stringify(session.djangoUser));

        // Dispatch custom event to notify AuthProvider of user update
        window.dispatchEvent(new CustomEvent('auth-updated'));
      }

      // Redirect to home page after successful OAuth login
      // Only if we're on the login page
      if (window.location.pathname.includes('/login')) {
        console.log('TokenStorage: Redirecting to home after OAuth login');
        router.replace('/users/home');
      }
    }
  }, [session, status, router]);

  // For manual credential login, we need to check if user is in localStorage
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const checkCredentialLogin = () => {
      const accessToken = localStorage.getItem('djangoAccessToken');
      const storedUser = localStorage.getItem('user');

      if (accessToken && storedUser && status !== 'authenticated') {
        console.log('TokenStorage: Detected credential login, notifying auth provider');
        window.dispatchEvent(new CustomEvent('auth-updated'));
      }
    };

    // Check immediately on component mount
    checkCredentialLogin();

    // Also listen for storage events (from other tabs/windows)
    const handleStorageChange = (e) => {
      if (e.key === 'djangoAccessToken' || e.key === 'user') {
        checkCredentialLogin();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [status]);

  return null; // This component doesn't render anything
}