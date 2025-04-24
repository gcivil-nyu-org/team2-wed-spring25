"use client";
import React from 'react';
import { Trash2, MapPin } from 'lucide-react';
import { formatDate } from "@/utils/datetime";
import StatusBadge from './StatusBadge';

/**
 * Component to display an individual safety report
 */
export default function SafetyReportItem({ 
  report, 
  onDelete, 
  isLastElement, 
  lastReportElementRef 
}) {
  return (
    <div
      ref={isLastElement ? lastReportElementRef : null}
      className="mb-4 p-4 border rounded-lg"
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">{report.title}</h3>
        <StatusBadge report={report} />
      </div>

      <p className="text-sm mb-2 line-clamp-2">{report.description}</p>

      <p className="text-xs text-gray-500 mb-2">
        <MapPin className="h-3 w-3 inline mr-1" />
        Near: {report.location_str}
      </p>

      <div className="flex justify-between items-center mt-3">
        <p className="text-xs text-gray-500">
          Reported: {formatDate(report.created_at)}
        </p>

        <div className="flex space-x-2">
          <div
            className="rounded-md p-2 text-red-500 hover:bg-gray-100 cursor-pointer"
            onClick={() => onDelete(report)}
            title="Delete this report"
          >
            <Trash2 className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}