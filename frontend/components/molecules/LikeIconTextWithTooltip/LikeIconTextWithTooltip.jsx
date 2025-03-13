import React, { useState, useRef, useEffect } from 'react';
import IconText from '@/components/molecules/IconText/IconText';
import LikeOptionList from '@/components/molecules/LikeOptionList/LikeOptionList';

export default function LikeIconTextWithTooltip({ iconData }){
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

    return (
        <div
            className="flex-1 relative group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* IconText Component */}
            <IconText
                src={iconData.src}
                width={iconData.width}
                height={iconData.height}
                alt={iconData.alt}
                text={iconData.text}
            />

            {/* Tooltip Div */}
            {isTooltipVisible && (
                <div
                    className="absolute -top-20 bg-white p-1 rounded-full shadow-md pointer-events-auto"
                    onMouseEnter={handleMouseEnter} // Keep tooltip visible when hovering over it
                    onMouseLeave={handleMouseLeave} // Hide tooltip after 0.5 seconds when leaving
                >
                    <LikeOptionList />
                </div>
            )}
        </div>
    );
};