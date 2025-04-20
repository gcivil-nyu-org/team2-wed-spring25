'use client';
import { useState } from 'react';
import ForumSidebarInfo from './ForumSidebarInfo';

export default function ForumSidebarDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Info Button --> visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-50 sm:hidden bg-gray-800 text-white rounded-full px-4 py-2 text-sm shadow-md hover:bg-gray-700 transition"
      >
        ℹ️ Info
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-end sm:hidden">
          <div className="bg-[#1e1e1e] w-full max-h-[80vh] rounded-t-xl p-4 overflow-y-auto shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-white text-sm">Forum Info</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            <ForumSidebarInfo />
          </div>
        </div>
      )}
    </>
  );
}
