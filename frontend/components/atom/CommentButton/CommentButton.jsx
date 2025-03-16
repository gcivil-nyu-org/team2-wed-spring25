<<<<<<< HEAD
export default function CommentButton({ children, theme = "blue", ...props }) {
  // Define button styles based on the theme
  const buttonStyles = {
    blue: "bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-300 active:bg-blue-800",
    red: "bg-red-700 text-white hover:bg-red-800 focus:ring-red-300 active:bg-red-800",
  };

  return (
    <button
      className={`px-3 py-1 mr-4 rounded-full  text-white font-semibold text-md focus:outline-none focus:ring ${buttonStyles[theme]}`}
      {...props}
    >
      {children}
    </button>
  );
}
=======
export default function CommentButton({ children, ...props }) {
    return (
        <button 
            className="px-3 py-1 mr-4 rounded-full bg-blue-700 text-white font-semibold text-md hover:bg-blue-800 focus:outline-none focus:ring focus:ring-blue-300 active:bg-blue-800" 
            {...props}
        >
            {children}
        </button>
    );
}
>>>>>>> 9dc5cd8 (Complete UI for add comment input button, user post)
