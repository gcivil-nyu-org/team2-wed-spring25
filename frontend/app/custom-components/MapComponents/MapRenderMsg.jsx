import React from "react";

const MapRenderMsg = ({ text }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 z-40">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-2"></div>
        <div className="text-lg font-semibold text-gray-700">{text}</div>
      </div>
    </div>
  );
};

export default MapRenderMsg;
