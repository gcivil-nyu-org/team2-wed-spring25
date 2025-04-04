import React from 'react'

const MapCriticalErrorMsg = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
        <div className="text-red-500 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Map Error</h3>
        <p className="text-gray-600 mb-4">{mapCriticalError}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-map-bg text-white px-4 py-2 rounded hover:bg-map-darkerbg transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

export default MapCriticalErrorMsg