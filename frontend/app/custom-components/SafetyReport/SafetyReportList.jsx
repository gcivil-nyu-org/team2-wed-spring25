"use client";
import React, { useState } from "react";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CustomAlertDialog from "@/app/custom-components/CustomAlertDialog";

// Import our custom hooks and components
import { useSafetyReports } from "@/hooks/SafetyReports/useSafetyReports";
import { useIntersectionObserver } from "@/hooks/SafetyReports/useIntersectionObserver";
import FilterControls from "./FilterControls";
import SafetyReportItem from "./SafetyReportItem";
import LoadingState from "./LoadingState";
import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";

const SafetyReportsList = ({ homepage }) => {
  const router = useRouter();
  const { showError, showSuccess } = useNotification();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  // Use our custom hook to manage reports
  const {
    isLoading,
    error,
    reports,
    hasMore,
    totalCount,
    statusFilter,
    ordering,
    handleStatusFilterChange,
    handleOrderingChange,
    clearFilters,
    loadMore,
    fetchReports,
    deleteReport
  } = useSafetyReports({
    onError: showError
  });

  // Infinite scroll observer hook
  const lastReportElementRef = useIntersectionObserver(
    loadMore,
    !isLoading && hasMore
  );

  // Handle opening delete dialog
  const openDeleteDialog = (report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    const success = await deleteReport(reportToDelete?.id);
    
    if (success) {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
      showSuccess("Report deleted successfully");
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setReportToDelete(null);
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
                  <div className="ml-2">
                    <StatusBadge report={report} />
                  </div>
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
  if (isLoading && reports.length === 0) {
    return (
      <div className="p-6">
        <FilterControls
          statusFilter={statusFilter}
          ordering={ordering}
          onStatusFilterChange={handleStatusFilterChange}
          onOrderingChange={handleOrderingChange}
          onClearFilters={clearFilters}
        />
        <LoadingState />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <FilterControls
          statusFilter={statusFilter}
          ordering={ordering}
          onStatusFilterChange={handleStatusFilterChange}
          onOrderingChange={handleOrderingChange}
          onClearFilters={clearFilters}
        />
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">Failed to load your safety reports</div>
          <Button onClick={() => {
            fetchReports(1, false);
          }}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <FilterControls
        statusFilter={statusFilter}
        ordering={ordering}
        onStatusFilterChange={handleStatusFilterChange}
        onOrderingChange={handleOrderingChange}
        onClearFilters={clearFilters}
      />

      {reports.length === 0 ? (
        <EmptyState statusFilter={statusFilter} />
      ) : (
        <>
          {/* Reports list */}
          {reports.map((report, index) => {
            // Apply ref to last element for infinite scrolling
            const isLastElement = reports.length === index + 1;
            return (
              <SafetyReportItem
                key={report.id}
                report={report}
                onDelete={openDeleteDialog}
                isLastElement={isLastElement}
                lastReportElementRef={lastReportElementRef}
              />
            );
          })}

          {/* Loading spinner for additional content */}
          {isLoading && reports.length > 0 && (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}

          {/* Message when all content is loaded */}
          {!hasMore && reports.length > 0 && (
            <div className="text-center text-sm text-gray-500 my-4">
              You&apos;ve reached the end of the list
            </div>
          )}

          {/* Custom Delete Dialog */}
          <CustomAlertDialog
            isOpen={deleteDialogOpen}
            onClose={closeDeleteDialog}
            onConfirm={handleDeleteConfirm}
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