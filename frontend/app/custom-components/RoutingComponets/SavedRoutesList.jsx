"use client";
import React, { useEffect, useState, useRef } from "react";
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
import { Trash2, Star, MapPin, Share2, Navigation } from "lucide-react";
import { formatDate } from "@/utils/datetime";
import CustomAlertDialog from "@/app/custom-components/CustomAlertDialog";
import Link from "next/link";

const SavedRoutesList = ({ homepage }) => {
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
  const [routeToDelete, setRouteToDelete] = useState(null);
  const { showError, showSuccess } = useNotification();
  
  // Track routes that are on cooldown
  const [cooldowns, setCooldowns] = useState({});
  // Store timeouts to clear them when component unmounts
  const timeoutRefs = useRef({});

  const fetchRoutes = async (page = 1) => {
    setIsLoading(true);
    setError(false);

    try {
      const response = await authAPI.authenticatedGet(
        `/retrieve-routes?page=${page}`
      );
      setPagination({
        ...response,
        currentPage: page,
      });
      setIsLoading(false);
    } catch (e) {
      setError(true);
      showError("Failed to retrieve routes");
      setIsLoading(false);
    }
  };

  // Handle toggling favorite status with cooldown
  const toggleFavorite = async (routeId, isFavorite) => {
    // Check if this route is currently on cooldown
    if (cooldowns[routeId]) {
      // If on cooldown, show a message and do nothing
      showError("Please wait before toggling favorite status again");
      return;
    }

    try {
      // Set this route on cooldown immediately (before the API call)
      setCooldowns(prev => ({ ...prev, [routeId]: true }));

      await authAPI.authenticatedPatch("/update-route/", {
        id: routeId,
        favorite: isFavorite,
      });

      // Update the state to reflect the change
      setPagination((prev) => ({
        ...prev,
        results: prev.results.map((route) =>
          route.id === routeId ? { ...route, favorite: isFavorite } : route
        ),
      }));
      
      showSuccess(
        isFavorite ? "Route added to favorites" : "Route removed from favorites"
      );

      // Set a timeout to remove the cooldown after 2 seconds
      const timeoutId = setTimeout(() => {
        setCooldowns(prev => {
          const newCooldowns = { ...prev };
          delete newCooldowns[routeId];
          return newCooldowns;
        });
        delete timeoutRefs.current[routeId];
      }, 2000); // 2 second cooldown

      // Store the timeout reference so we can clear it if needed
      timeoutRefs.current[routeId] = timeoutId;

    } catch (e) {
      // If the request fails, remove the cooldown
      setCooldowns(prev => {
        const newCooldowns = { ...prev };
        delete newCooldowns[routeId];
        return newCooldowns;
      });
      showError("Failed to update route");
    }
  };

  // Handle opening delete dialog
  const openDeleteDialog = (route) => {
    setRouteToDelete(route);
    setDeleteDialogOpen(true);
  };

  // Handle route deletion
  const deleteRoute = async (routeId) => {
    try {
      await authAPI.authenticatedDelete(`/delete-route/${routeId}/`);

      // Remove the route from the state
      setPagination((prev) => ({
        ...prev,
        count: prev.count - 1,
        results: prev.results.filter((route) => route.id !== routeId),
      }));

      // Close the dialog
      setDeleteDialogOpen(false);
      setRouteToDelete(null);
      showSuccess("Route deleted successfully");
    } catch (e) {
      showError("Failed to delete route");
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRouteToDelete(null);
  };

  // Navigate to map with route coordinates
  const goToRoute = (route) => {
    router.push(
      `/users/map?dep_lat=${route.departure_lat}&dep_lon=${route.departure_lon}&dest_lat=${route.destination_lat}&dest_lon=${route.destination_lon}`
    );
  };

  // Share route
  const shareRoute = (route) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const shareUrl = `${baseUrl}/users/map?dep_lat=${route.departure_lat}&dep_lon=${route.departure_lon}&dest_lat=${route.destination_lat}&dest_lon=${route.destination_lon}`;

    // Try to use the clipboard API
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          showSuccess("Link copied to clipboard");
        })
        .catch((err) => {
          showError("Failed to copy link");
        });
    } else {
      // Fallback for browsers that don't support clipboard API
      try {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showSuccess("Link copied to clipboard");
      } catch (e) {
        showError("Failed to copy link");
      }
    }
  };

  useEffect(() => {
    fetchRoutes();
    
    // Store this for cleanup to avoid the React hooks warning
    // We need to capture timeoutRefs.current here, at effect execution time
    const currentTimeoutsRef = timeoutRefs;
    
    // Clean up all timeouts when component unmounts
    return () => {
      // Use the captured ref, not the potentially changed timeoutRefs.current
      Object.values(currentTimeoutsRef.current).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
    };
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
      fetchRoutes(page);
    }
  };

  if (homepage) {
    return (
      <>
        {pagination.results.length === 0 ? (
          <div className="text-center ">
            <h4 className="mt-2 text-sm text-muted-foreground">
              Begin plotting routes to bookmark routes and access them here
            </h4>
          </div>
        ) : (
          <>
            <div className="w-full mb-2 text-left text-sm text-muted-foreground">
              Bookmarked routes
            </div>
            {pagination.results.slice(0, 5).map((route) => (
              <div
                key={route.id}
                className="size-full p-2 border-b border-muted-foreground flex justify-between items-center hover:cursor-pointer hover:bg-stone-900 hover:border-stone-400"
                onClick={() => goToRoute(route)}
              >
                <span className="flex gap-2">
                  <h3 className="font-medium">{route.name}</h3>
                </span>
                <p className="hidden md:block text-sm text-gray-500">
                  Created {formatDate(route.created_at)}
                </p>
              </div>
            ))}
            {pagination.count > 1 && (
              <Button
                variant="ghost"
                className="w-full mt-2 text-muted-foreground hover:bg-stone-900 hover:text-muted-foreground"
                asChild
              >
                <Link href="/users/settings/routes">
                  View all routes ({pagination.count})
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
          <div className="text-red-500 mb-4">Failed to load your routes</div>
          <Button onClick={() => fetchRoutes()}>Retry</Button>
        </div>
      ) : isLoading ? (
        Array(3)
          .fill()
          .map((_, i) => (
            <div
              key={i}
              className="mb-4 p-4 border rounded-lg flex justify-between items-center"
            >
              <div>
                <Skeleton className="h-6 w-40 mb-2" data-slot="skeleton" />
                <Skeleton className="h-4 w-24" data-slot="skeleton" />
              </div>
              <div className="flex space-x-2">
                <Skeleton
                  className="h-8 w-8 rounded-full"
                  data-slot="skeleton"
                />
                <Skeleton
                  className="h-8 w-8 rounded-full"
                  data-slot="skeleton"
                />
              </div>
            </div>
          ))
      ) : (
        <>
          {pagination.results.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No saved routes
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven&apos;t saved any routes yet.
              </p>
            </div>
          ) : (
            <>
              {pagination.results.map((route) => (
                <div
                  key={route.id}
                  className="mb-4 p-4 border rounded-lg flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-medium">{route.name}</h3>
                    <p className="text-sm text-gray-500">
                      Created {formatDate(route.created_at)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(route.id, !route.favorite)}
                      title={
                        route.favorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      disabled={cooldowns[route.id]}
                      className={cooldowns[route.id] ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      {route.favorite ? (
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <Star className="h-5 w-5 text-gray-300" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => goToRoute(route)}
                      title="Navigate to this route"
                    >
                      <Navigation className="h-5 w-5 text-blue-500" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => shareRoute(route)}
                      title="Share this route"
                    >
                      <Share2 className="h-5 w-5 text-green-500" />
                    </Button>

                    <div
                      className="rounded-md p-2 text-red-500 hover:bg-gray-100 cursor-pointer"
                      onClick={() => openDeleteDialog(route)}
                      title="Delete this route"
                    >
                      <Trash2 className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}

              {/* Custom Delete Dialog */}
              <CustomAlertDialog
                isOpen={deleteDialogOpen}
                onClose={closeDeleteDialog}
                onConfirm={() => deleteRoute(routeToDelete?.id)}
                title="Delete Route"
                description={`Are you sure you want to delete "${routeToDelete?.name}"? This action cannot be undone.`}
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
                          className="cursor-pointer"
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
                            className="cursor-pointer"
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
                          className="cursor-pointer"
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

export default SavedRoutesList;