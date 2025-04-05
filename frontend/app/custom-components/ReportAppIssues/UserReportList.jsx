'use client';

import React, { useEffect, useState } from 'react';
import { authAPI } from '@/utils/fetch/fetch';
import { AlertCircle, ClipboardList, Clock, AlertTriangle } from 'lucide-react';
import { formatDateAgoShort } from '@/utils/datetime';

const UserReportsList = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const data = await authAPI.authenticatedGet('/report-app-issue/');
        setReports(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load reports');
        console.error('Error fetching reports:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Loading skeleton component
  const ReportSkeleton = () => (
    <>
      {[1, 2, 3].map((index) => (
        <div key={index} className="animate-pulse border rounded-lg p-4 mb-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
    </>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12 border border-dashed rounded-lg bg-gray-50">
      <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">No reports yet</h3>
      <p className="mt-2 text-sm text-gray-500">
        You haven't submitted any bug reports. When you do, they'll appear here.
      </p>
      {/* <div className="mt-6">
        <button
          onClick={() => window.location.href = '/report-issue'}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Report an Issue
        </button>
      </div> */}
    </div>
  );

  // Error state component
  const ErrorState = ({ message }) => (
    <div className="rounded-md bg-red-50 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error loading reports</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Individual report card component
  const ReportCard = ({ report }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Set character limit for truncated view
    const CHARACTER_LIMIT = 120;
    
    // Function to intelligently truncate text
    const getTruncatedText = (text) => {
      if (text.length <= CHARACTER_LIMIT) return text;
      
      // Try to find a sentence break (period, question mark, exclamation point)
      const sentenceBreak = Math.max(
        text.substring(0, CHARACTER_LIMIT).lastIndexOf('.'),
        text.substring(0, CHARACTER_LIMIT).lastIndexOf('?'),
        text.substring(0, CHARACTER_LIMIT).lastIndexOf('!')
      );
      
      // If we found a sentence break that's reasonable (not at the very beginning)
      if (sentenceBreak > CHARACTER_LIMIT / 3) {
        return text.substring(0, sentenceBreak + 1);
      }
      
      // Try to break at a space to avoid cutting words
      const spaceBreak = text.substring(0, CHARACTER_LIMIT).lastIndexOf(' ');
      if (spaceBreak > 0) {
        return text.substring(0, spaceBreak);
      }
      
      // Fallback to just cutting at the limit
      return text.substring(0, CHARACTER_LIMIT);
    };
    
    const truncatedText = getTruncatedText(report.description);
    const hasMoreText = report.description.length > truncatedText.length;
    
    return (
      <div className="border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow duration-200 bg-white">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900">{report.title}</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {report.status || 'Open'}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-500 mt-1 mb-3">
          <Clock className="mr-1 h-4 w-4" />
          <span>Reported {formatDateAgoShort(report.reported_at)}</span>
        </div>
        <div className="text-gray-600 text-sm">
          {isExpanded ? (
            <p className="whitespace-pre-line">{report.description}</p>
          ) : (
            <p>{truncatedText}{hasMoreText ? '...' : ''}</p>
          )}
          
          {hasMoreText && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none"
            >
              {isExpanded ? 'Show less' : 'See more'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl py-6 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            My Reports
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and track the status of your submitted bug reports
          </p>
        </div>
        {/* <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => window.location.href = '/report-issue'}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            New Report
          </button>
        </div> */}
      </div>

      {isLoading ? (
        <ReportSkeleton />
      ) : error ? (
        <ErrorState message={error} />
      ) : reports.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserReportsList;