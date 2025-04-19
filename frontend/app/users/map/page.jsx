"use client";
import { useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import LocationSearchForm from "@/app/custom-components/LocationSearchForm";

// Dynamically import the map component with SSR disabled
const ClientOnlyMap = dynamic(
  () => import("@/app/custom-components/MapComponents/MapComponent.jsx"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] flex items-center justify-center bg-map-color rounded-lg">
        <div className="text-lg font-semibold">Loading map component...</div>
      </div>
    ),
  }
);

function DashboardContent() {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="relative">
      {/* Search Form at the top */}
      <div className="bg-[#424d5c] absolute top-0 left-0 z-[1001] w-full">
        <LocationSearchForm />
      </div>

      {/* Map Component */}
      <div>
        <ClientOnlyMap />
      </div>
    </div>
  );
}

// The main Dashboard component with Suspense boundary
export default function Dashboard() {
  const mainElementRef = useRef(null);

  return (
    <>
      <main
        ref={mainElementRef}
        className="min-h-screen bg-map-bg text-map-text overflow-y-auto"
        id="dashboard-main"
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-2"></div>
              <p className="ml-3">Loading route details...</p>
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </main>
    </>
  );
}