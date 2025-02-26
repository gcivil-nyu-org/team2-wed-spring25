'use client'
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/custom-components/AuthHook';
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, ZoomIn, ZoomOut, Loader } from "lucide-react";

export default function ProtectedLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  console.log("Checking authentication:", { loading, isAuthenticated });
  // Handle redirect just once if not authenticated and not loading
  useEffect(() => {
    const accessToken = localStorage.getItem('djangoAccessToken');

    if (!loading && !isAuthenticated && !accessToken) {
      console.log('Not authenticated, redirecting to login');
      router.replace('/users/login');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading state while checking authentication

  if (loading) {
    console.log("ProtectedLayout: Showing loading UI while auth checks complete");
    return (
      <div className="relative w-full h-screen">
        {/* Full-screen map skeleton */}
        <Skeleton className="absolute inset-0 w-full h-full flex items-center justify-center">
          <Loader className="w-12 h-12 text-gray-400 animate-spin" />
        </Skeleton>

        {/* Floating controls */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          <Skeleton className="w-10 h-10 rounded-lg flex items-center justify-center">
            <ZoomIn className="w-5 h-5 text-gray-400" />
          </Skeleton>
          <Skeleton className="w-10 h-10 rounded-lg flex items-center justify-center">
            <ZoomOut className="w-5 h-5 text-gray-400" />
          </Skeleton>
        </div>

        <div className="absolute bottom-4 right-4">
          <Skeleton className="w-12 h-12 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6 text-gray-400" />
          </Skeleton>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <p>Redirecting to login...</p>;
  }
  // Only render children if authenticated
  return isAuthenticated ? children : null;
}