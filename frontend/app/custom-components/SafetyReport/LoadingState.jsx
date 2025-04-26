"use client";
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Component to display loading skeletons
 */
export default function LoadingState() {
  return (
    <>
      {Array(3)
        .fill()
        .map((_, i) => (
          <div
            key={i}
            className="mb-4 p-4 border rounded-lg flex flex-col"
          >
            <div className="flex justify-between items-center mb-2">
              <Skeleton className="h-6 w-40 bg-gray-200" data-slot="skeleton" />
              <Skeleton className="h-6 w-20 bg-gray-200" data-slot="skeleton" />
            </div>
            <Skeleton className="h-4 w-full mb-2 bg-gray-200" data-slot="skeleton" />
            <Skeleton className="h-4 w-3/4 mb-2 bg-gray-200" data-slot="skeleton" />
            <div className="flex justify-between items-center mt-2">
              <Skeleton className="h-4 w-32 bg-gray-200" data-slot="skeleton" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8 rounded-full bg-gray-200" data-slot="skeleton" />
              </div>
            </div>
          </div>
        ))}
    </>
  );
}