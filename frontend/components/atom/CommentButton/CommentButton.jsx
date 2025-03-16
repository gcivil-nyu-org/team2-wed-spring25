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