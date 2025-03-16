import { useState } from "react";
const useLikeOptionList = () => {
    const [hoveredIcon, setHoveredIcon] = useState(null); // Track which icon is hovered
    
        // Icons data
    const icons = [
        { src: "/icons/likeli.svg", alt: "Like" },
        { src: "/icons/clap.svg", alt: "Clap" },
        { src: "/icons/support.svg", alt: "Support" },
        { src: "/icons/heart.svg", alt: "Heart" },
        { src: "/icons/bulb.svg", alt: "Bulb" },
        { src: "/icons/laugh.svg", alt: "Laugh" },
    ];

    return {
        hoveredIcon,
        setHoveredIcon,
        icons
    };
}

export default useLikeOptionList; // Ensure it's exported as default