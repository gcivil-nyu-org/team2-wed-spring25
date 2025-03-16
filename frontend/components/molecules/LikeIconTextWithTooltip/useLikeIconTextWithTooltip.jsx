import { useState, useEffect, useRef } from 'react';

export default function useLikeIconTextWithTooltip() {
    const [isTooltipVisible, setTooltipVisible] = useState(false);
    const hoverTimeoutRef = useRef(null); // Ref to store the timeout ID
    
    const handleMouseEnter = () => {
        // Clear any existing timeout to avoid hiding the tooltip prematurely
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setTooltipVisible(true);
    };
    
    const handleMouseLeave = () => {
        // Set a timeout to hide the tooltip after 0.5 seconds
        hoverTimeoutRef.current = setTimeout(() => {
            setTooltipVisible(false);
        }, 100); // 500ms = 0.5 seconds
    };
    
    // Cleanup the timeout when the component unmounts
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);
    return {
        isTooltipVisible,
        handleMouseEnter,
        handleMouseLeave,
    };
}