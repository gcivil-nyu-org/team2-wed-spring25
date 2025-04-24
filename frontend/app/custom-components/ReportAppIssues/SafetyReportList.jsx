"use client";
import React, { useEffect, useState } from "react";
import { authAPI } from "@/utils/fetch/fetch";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Trash2, AlertCircle, MapPin, ExternalLink } from "lucide-react";
import { formatDate } from "@/utils/datetime";
import CustomAlertDialog from "@/app/custom-components/CustomAlertDialog";
import Link from "next/link";

const SafetyReportsList = ({ homepage }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    results: [],
    currentPage: 1,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const { showError, showSuccess } = useNotification();

  const fetchReports = async (page = 1) => {
    setIsLoading(true);
    setError(false);

    try {
      const response = await authAPI.authenticatedGet(
        `/user/safety-report-list?page=${page}`
      );
      setPagination({
        ...response,
        currentPage: page,
      });
      setIsLoading(false);
    } catch (e) {
      setError(true);
      showError("Failed to retrieve safety reports");
      setIsLoading(false);
    }
  };

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
      setPagination((prev) => ({
        ...prev,
        count: prev.count - 1,
        results: prev.results.filter((report) => report.id !== reportId),
      }));

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
    router.push(
      `/users/map?lat=${report.latitude}&lon=${report.longitude}`
    );
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate total pages
  const totalPages = Math.ceil((pagination.count || 0) / 10);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const currentPage = pagination.currentPage;

    if (totalPages <= 5) {
      // If 5 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);

      // For current page not near the beginning or end
      if (currentPage > 3) {
        pages.push("...");
      }

      // Pages around the current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // For current page not near the end
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always include last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page !== pagination.currentPage) {
      fetchReports(page);
    }
  };

  // Helper function to get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case "approved":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Approved</span>;
      case "rejected":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (homepage) {
    return (
      <>
        {pagination.results.length === 0 ? (
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
            {pagination.results.slice(0, 5).map((report) => (
              <div
                key={report.id}
                className="size-full p-2 border-b border-muted-foreground flex justify-between items-center hover:cursor-pointer hover:bg-stone-900 hover:border-stone-400"
                
              >
                <span className="flex gap-2">
                  <h3 className="font-medium">{report.title}</h3>
                  <div className="ml-2">{getStatusBadge(report.status)}</div>
                </span>
                <p className="text-sm text-gray-500">
                  {formatDate(report.created_at)}
                </p>
              </div>
            ))}
            {pagination.count > 1 && (
              <Button
                variant="ghost"
                className="w-full mt-2 text-muted-foreground hover:bg-stone-900 hover:text-muted-foreground"
                asChild
              >
                <Link href="/users/settings/safety-reports">
                  View all reports ({pagination.count})
                </Link>
              </Button>
            )}
          </>
        )}
      </>
    );
  }

  return (
    <div className="p-6">
      {error ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">Failed to load your safety reports</div>
          <Button onClick={() => fetchReports()}>Retry</Button>
        </div>
      ) : isLoading ? (
        Array(3)
          .fill()
          .map((_, i) => (
            <div
              key={i}
              className="mb-4 p-4 border rounded-lg flex flex-col"
            >
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-6 w-40 bg-gray-200 " data-slot="skeleton" />
                <Skeleton className="h-6 w-20 bg-gray-200 " data-slot="skeleton" />
              </div>
              <Skeleton className="h-4 w-full mb-2 bg-gray-200 " data-slot="skeleton" />
              <Skeleton className="h-4 w-3/4 mb-2 bg-gray-200 " data-sloIt="skeleton" />
              <div className="flex justify-between items-center mt-2">
                <Skeleton className="h-4 w-32 bg-gray-200 " data-slot="skeleton" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8 rounded-full bg-gray-200 " data-slot="skeleton" />
                </div>
              </div>
            </div>
          ))
      ) : (
        <>
          {pagination.results.length === 0 ? (
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
              {pagination.results.map((report) => (
                <div
                  key={report.id}
                  className="mb-4 p-4 border rounded-lg"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{report.title}</h3>
                    {getStatusBadge(report.status)}
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
              ))}

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

              {totalPages > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    {pagination.previous && (
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            handlePageChange(pagination.currentPage - 1)
                          }
                          className="cursor-pointer bg-black"
                        />
                      </PaginationItem>
                    )}

                    {getPageNumbers().map((page, i) => (
                      <PaginationItem key={i}>
                        {page === "..." ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            isActive={page === pagination.currentPage}
                            onClick={() => handlePageChange(page)}
                            className="cursor-pointer bg-black"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    {pagination.next && (
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            handlePageChange(pagination.currentPage + 1)
                          }
                          className="cursor-pointer bg-black"
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default SafetyReportsList;