"use client";
import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Component to display when no reports are found
 */
export default function EmptyState({ statusFilter }) {
  return (
    <div className="text-center py-8">
      <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-lg font-medium text-gray-900">
        No safety reports found
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {statusFilter
          ? `No ${statusFilter} reports found. Try changing your filters.`
          : "You haven't submitted any safety reports yet."}
      </p>
    </div>
  );
}