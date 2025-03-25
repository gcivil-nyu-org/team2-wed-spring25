import {useState} from 'react';
export default function useUserPostBody(content, maxLength = 100) {
    const [showDetailedView, setShowDetailedView] = useState(false);

    const handleShowDetailedView = () => {
        setShowDetailedView(true);
    };

    const getPostContent = (content) => {
        if (showDetailedView) {
            return <p>{content}</p>;
        }
        return (
            <p>
                {content.substring(0, maxLength)}
                {content.length > maxLength && (
                    <span
                        className="text-gray-500 hover:text-blue-900 hover:underline hover:cursor-pointer"
                        onClick={handleShowDetailedView}
                    >
                        ...more
                    </span>
                )}
            </p>
        );
    };

    return { getPostContent, showDetailedView, setShowDetailedView };
}