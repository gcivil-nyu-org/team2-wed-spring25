"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { authAPI } from "@/utils/fetch/fetch";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Trash2, AlertCircle, MapPin, InfoIcon } from "lucide-react";
import { formatDate } from "@/utils/datetime";
import CustomAlertDialog from "@/app/custom-components/CustomAlertDialog";
import Link from "next/link";
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

const SafetyReportsList = ({ homepage }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reports, setReports] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const { showError, showSuccess } = useNotification();
  
  // Create observer ref for infinite scroll
  const observer = useRef();
  const lastReportElementRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    }, { threshold: 0.5 });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  const fetchReports = async (pageNum = 1, append = false) => {
    if (pageNum === 1) setIsLoading(true);
    setError(false);

    try {
      const response = await authAPI.authenticatedGet(
        `/user/safety-report-list?page=${pageNum}`
      );
      
      if (append) {
        setReports(prev => [...prev, ...response.results]);
      } else {
        setReports(response.results);
      }
      
      setTotalCount(response.count);
      setHasMore(response.next !== null);
      setIsLoading(false);
    } catch (e) {
      setError(true);
      showError("Failed to retrieve safety reports");
      setIsLoading(false);
    }
  };

  // Load more data when page changes
  useEffect(() => {
    if (page > 1) {
      fetchReports(page, true);
    }
  }, [page]);

  // Initial data fetch
  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle opening delete dialog
  const openDeleteDialog = (report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  // Handle report deletion
  const deleteReport = async (reportId) => {
    try {
      await authAPI.authenticatedDelete(`/delete-safety-report/${reportId}/`);

      // Remove the report from the state
      setReports(prev => prev.filter(report => report.id !== reportId));
      setTotalCount(prev => prev - 1);

      // Close the dialog
      setDeleteDialogOpen(false);
      setReportToDelete(null);
      showSuccess("Report deleted successfully");
    } catch (e) {
      showError("Failed to delete report");
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setReportToDelete(null);
  };

  // Navigate to map with report location
  const viewOnMap = (report) => {
    router.push(`/users/map?lat=${report.latitude}&lon=${report.longitude}`);
  };

  // Helper function to get status badge with popover
  const getStatusBadge = (report) => {
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
  };

  // Homepage simplified view
  if (homepage) {
    return (
      <>
        {reports.length === 0 ? (
          <div className="text-center ">
            <h4 className="mt-2 text-sm text-muted-foreground">
              Submit safety reports to see them listed here
            </h4>
          </div>
        ) : (
          <>
            <div className="w-full mb-2 text-left text-sm text-muted-foreground">
              Recent Safety Reports
            </div>
            {reports.slice(0, 5).map((report) => (
              <div
                key={report.id}
                className="size-full p-2 border-b border-muted-foreground flex justify-between items-center hover:cursor-pointer hover:bg-stone-900 hover:border-stone-400"
              >
                <span className="flex gap-2">
                  <h3 className="font-medium">{report.title}</h3>
                  <div className="ml-2">{getStatusBadge(report)}</div>
                </span>
                <p className="text-sm text-gray-500">
                  {formatDate(report.created_at)}
                </p>
              </div>
            ))}
            {totalCount > 1 && (
              <Button
                variant="ghost"
                className="w-full mt-2 text-muted-foreground hover:bg-stone-900 hover:text-muted-foreground"
                asChild
              >
                <Link href="/users/settings/safety-reports">
                  View all reports ({totalCount})
                </Link>
              </Button>
            )}
          </>
        )}
      </>
    );
  }

  // Loading state
  if (isLoading && page === 1) {
    return (
      <div className="p-6">
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
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">Failed to load your safety reports</div>
          <Button onClick={() => {
            setPage(1);
            fetchReports();
          }}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {reports.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No safety reports
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven&apos;t submitted any safety reports yet.
          </p>
        </div>
      ) : (
        <>
          {/* Reports list */}
          {reports.map((report, index) => {
            // Apply ref to last element for infinite scrolling
            const isLastElement = reports.length === index + 1;
            return (
              <div
                key={report.id}
                ref={isLastElement ? lastReportElementRef : null}
                className="mb-4 p-4 border rounded-lg"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{report.title}</h3>
                  {getStatusBadge(report)}
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
                      onClick={() => openDeleteDialog(report)}
                      title="Delete this report"
                    >
                      <Trash2 className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading spinner for additional content */}
          {isLoading && page > 1 && (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}

          {/* Message when all content is loaded */}
          {!hasMore && reports.length > 0 && (
            <div className="text-center text-sm text-gray-500 my-4">
              You've reached the end of the list
            </div>
          )}

          {/* Custom Delete Dialog */}
          <CustomAlertDialog
            isOpen={deleteDialogOpen}
            onClose={closeDeleteDialog}
            onConfirm={() => deleteReport(reportToDelete?.id)}
            title="Delete Safety Report"
            description={`Are you sure you want to delete "${reportToDelete?.title}"? This action cannot be undone.`}
            confirmText="Delete"
            confirmButtonClassName="bg-red-500 hover:bg-red-600"
          />
        </>
      )}
    </div>
  );
};

export default SafetyReportsList;