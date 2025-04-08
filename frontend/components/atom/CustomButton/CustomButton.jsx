"use client";
export default function CustomButton({
  children,
  theme = "blue",
  disabled = false,
  ...props
}) {
  // Define theme classes

  const themeClasses = {
    blue: {
      bg: "bg-blue-500",
      hover: "hover:bg-blue-700",
      focusRing: "focus:ring-blue-300",
      active: "active:bg-blue-800",
    },
    red: {
      bg: "bg-red-500",
      hover: "hover:bg-red-700",
      focusRing: "focus:ring-red-300",
      active: "active:bg-red-800",
    },

    // Add more themes as needed
  };

  const selectedTheme = themeClasses[theme] || themeClasses.blue;

  return (
    <button
      className={`px-4 py-2 rounded-full ${selectedTheme.bg} text-white font-semibold text-md ${selectedTheme.hover} focus:outline-none focus:ring-2 ${selectedTheme.focusRing} ${selectedTheme.active}`}
      {...props}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
