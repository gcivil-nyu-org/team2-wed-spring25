"use client";
import React from 'react';
import { InfoIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Component to display the status badge with popover information
 */
export default function StatusBadge({ report }) {
  let badgeClass = "px-2 py-1 text-xs rounded-full flex items-center space-x-1 cursor-pointer";
  let textClass = "";
  let bgClass = "";
  let statusText = "Unknown";

  switch (report.status) {
    case "pending":
      bgClass = "bg-yellow-100";
      textClass = "text-yellow-800";
      statusText = "Pending";
      break;
    case "approved":
      bgClass = "bg-green-100";
      textClass = "text-green-800";
      statusText = "Approved";
      break;
    case "rejected":
      bgClass = "bg-red-100";
      textClass = "text-red-800";
      statusText = "Rejected";
      break;
    default:
      bgClass = "bg-gray-100";
      textClass = "text-gray-800";
      statusText = report.status;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className={`${badgeClass} ${bgClass} ${textClass}`}>
          <span>{statusText}</span>
          <InfoIcon className="h-3 w-3" />
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-gray-800 text-white" align="end">
        <Card className="border-0 shadow-none bg-gray-800 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">
              {report.status === "pending" && "Report Pending"}
              {report.status === "approved" && "Report Approved"}
              {report.status === "rejected" && "Report Rejected"}
            </CardTitle>
            <CardDescription>
              {report.status === "pending" && "Your report is awaiting review"}
              {report.status === "approved" && "Your report has been reviewed and approved"}
              {report.status === "rejected" && "Your report has been rejected"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report.status === "pending" && (
              <p className="text-sm text-gray-300">
                Once approved, this report will be integrated with our heatmap and contribute to safety awareness in the area.
              </p>
            )}
            {report.status === "approved" && (
              <p className="text-sm text-gray-300">
                Thank you for your contribution! Your report has been added to our safety heatmap and will help improve navigation safety for all users.
              </p>
            )}
            {report.status === "rejected" && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-300">Reason for rejection:</p>
                <div className="p-2 bg-gray-700 rounded-md text-sm">
                  {report.rejection_reason || "No reason provided"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}