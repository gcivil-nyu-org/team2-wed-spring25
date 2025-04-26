"use client";

import { cn } from "@/lib/utils";

export default function CommentButton({ children, theme = "blue", ...props }) {
  // Define button styles based on the theme

  return (
    <button
      className={cn(
        `px-3 py-1 mr-4 rounded-full  text-white font-semibold text-md focus:outline-none focus:ring`,
        {
          "bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-300 active:bg-blue-800":
            theme === "blue",
          "bg-red-700 text-white hover:bg-red-800 focus:ring-red-300 active:bg-red-800":
            theme === "red",
        }
      )}
      {...props}
    >
      {children}
    </button>
  );
}
