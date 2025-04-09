'use client'
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

const CustomAlertDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  cancelText = "Cancel", 
  confirmText = "Confirm",
  confirmButtonClassName = "bg-red-500 hover:bg-red-600"
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isProcessing) return; // Prevent multiple clicks
    
    setIsProcessing(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Error in confirmation action:", error);
      setIsProcessing(false); // Reset only on error, so user can try again
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling to backdrop
      >
        <div className="mb-6">
          <h2 className="text-lg font-medium text-black">{title}</h2>
          <p className="text-sm text-gray-500 mt-2">{description}</p>
        </div>
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-500 hover:text-gray-700"
          >
            {cancelText}
          </Button>
          <Button 
            variant="default"
            className={confirmButtonClassName}
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlertDialog;