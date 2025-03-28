// components/custom/CustomAlertDialog.jsx
'use client'
import React from 'react';
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <div className="mb-6">
          <h2 className="text-lg font-medium">{title}</h2>
          <p className="text-sm text-gray-500 mt-2">{description}</p>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button 
            variant="default"
            className={confirmButtonClassName}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlertDialog;