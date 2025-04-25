"use client";
import { useState, useCallback, useEffect, useRef } from 'react';
import { authAPI } from "@/utils/fetch/fetch";
import { useDebounce } from './useDebounce';

export function useSafetyReports({ onError }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reports, setReports] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  
  // Debounce filter changes to prevent excessive API calls
  const debouncedFilter = useDebounce(statusFilter, 300);
  const debouncedOrdering = useDebounce(ordering, 300);
  
  // Current request controller reference for cancellation
  const currentRequestRef = useRef(null);
  // Flag to track if a request is in progress
  const isRequestInProgressRef = useRef(false);
  // Flag to prevent duplicate page requests
  const lastPageRequestedRef = useRef(0); // Initialize to 0 to allow first request

  // Memoize query params builder
  const buildQueryParams = useCallback((pageNum) => {
    let params = `page=${pageNum}`;

    if (debouncedFilter) {
      params += `&status=${debouncedFilter}`;
    }

    if (debouncedOrdering) {
      params += `&ordering=${debouncedOrdering}`;
    }

    return params;
  }, [debouncedFilter, debouncedOrdering]);

  // Fetch reports from API
  const fetchReports = useCallback(async (pageNum = 1, append = false, forcePageOne = false) => {
    // Use forcePageOne to override the pageNum parameter when filters change
    const effectivePageNum = forcePageOne ? 1 : pageNum;
    
    // Prevent duplicate requests for the same page
    if (lastPageRequestedRef.current === effectivePageNum && effectivePageNum > 1) {
      return;
    }
    
    // Set request in progress flag
    isRequestInProgressRef.current = true;
    lastPageRequestedRef.current = effectivePageNum;
    
    // Cancel any in-flight requests
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
    }
  
    // Create new abort controller
    const controller = new AbortController();
    currentRequestRef.current = controller;
    
    if (effectivePageNum === 1) setIsLoading(true);
    setError(false);
  
    try {
      const queryParams = buildQueryParams(effectivePageNum);
      
      const response = await authAPI.authenticatedGet(
        `/user/safety-report-list?${queryParams}`,
        { signal: controller.signal }
      );

      if (!controller.signal.aborted) {
        if (append) {
          setReports(prev => [...prev, ...response.results]);
        } else {
          setReports(response.results);
        }

        setTotalCount(response.count);
        setHasMore(response.next !== null);
        setIsLoading(false);
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        // Only set error if not aborted
        setError(true);
        setHasMore(false);
        if (onError) onError("Failed to retrieve safety reports");
        setIsLoading(false);
      }
    } finally {
      // Clear in-progress flag if this was the last request sent
      if (currentRequestRef.current === controller) {
        isRequestInProgressRef.current = false;
      }
    }
  }, [buildQueryParams, onError]);

  // Handle filter changes - only update if value changes
  const handleStatusFilterChange = useCallback((newStatus) => {
    if (newStatus !== statusFilter) {
      setPage(1);
      lastPageRequestedRef.current = 0; // Reset to allow page 1 request
      setStatusFilter(newStatus);
    }
  }, [statusFilter]);

  const handleOrderingChange = useCallback((newOrdering) => {
    if (newOrdering !== ordering) {
      setPage(1);
      lastPageRequestedRef.current = 0; // Reset to allow page 1 request
      setOrdering(newOrdering);
    }
  }, [ordering]);

  const clearFilters = useCallback(() => {
    setPage(1);
    lastPageRequestedRef.current = 0; // Reset to allow page 1 request
    setStatusFilter("");
    setOrdering("-created_at");
  }, []);

  // Load more data when scrolling - with preventive checks
  const loadMore = useCallback(() => {
    // Multiple checks to prevent unnecessary requests
    if (
      !isLoading && 
      hasMore && 
      !error && 
      !isRequestInProgressRef.current
    ) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, hasMore, error]);

  // Watch for page or filter changes to trigger fetch
  useEffect(() => {
    // Only fetch for page changes if we're not handling a filter change
    if (!isRequestInProgressRef.current) {
      fetchReports(page, page > 1);
    }
  }, [page, fetchReports]);
  
  // Watch for filter changes specifically
  useEffect(() => {
    // Skip initial render
    if (debouncedFilter !== undefined && debouncedOrdering !== undefined) {
      // Force page 1 when filters change
      fetchReports(1, false, true);
    }
  }, [debouncedFilter, debouncedOrdering, fetchReports]);

  // Delete a report
  const deleteReport = useCallback(async (reportId) => {
    try {
      await authAPI.authenticatedDelete(`/delete-safety-report/${reportId}/`);
      
      // Remove the report from the state
      setReports(prev => prev.filter(report => report.id !== reportId));
      setTotalCount(prev => prev - 1);
      
      return true;
    } catch (e) {
      if (onError) onError("Failed to delete report");
      return false;
    }
  }, [onError]);
  
  // Return the state and functions
  return {
    isLoading,
    error,
    reports,
    hasMore,
    page,
    totalCount,
    statusFilter,
    ordering,
    handleStatusFilterChange,
    handleOrderingChange,
    clearFilters,
    loadMore,
    fetchReports,
    deleteReport
  };
}