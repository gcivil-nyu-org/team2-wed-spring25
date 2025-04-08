"use client";
export default function Button({ children, ...props }) {
  return (
    <button
      className="px-4 py-2 rounded-full bg-blue-500 text-white font-semibold text-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 active:bg-blue-800"
      {...props}
    >
      {children}
    </button>
  );
}
