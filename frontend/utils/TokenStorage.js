'use client'

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * This component transfers tokens from the NextAuth session to localStorage
 * Include it in your layout or on pages that need access to Django tokens
 */
export default function TokenStorage() {
  const { data: session } = useSession();
  
  useEffect(() => {
    // When session data is available and contains Django tokens
    if (session?.djangoTokens) {
      // Store Django tokens in localStorage for client-side API calls
      localStorage.setItem('djangoAccessToken', session.djangoTokens.access);
      localStorage.setItem('djangoRefreshToken', session.djangoTokens.refresh);
      
      if (session.djangoUser) {
        localStorage.setItem('djangoUser', JSON.stringify(session.djangoUser));
      }
    }
  }, [session]);
  
  // This component doesn't render anything
  return null;
}