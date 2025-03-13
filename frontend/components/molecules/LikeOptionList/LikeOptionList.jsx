import React, { useState } from "react";
import Icon from "@/components/atom/Icon/Icon";

export default function LikeOptionList() {
    const [hoveredIcon, setHoveredIcon] = useState(null); // Track which icon is hovered

    // Icons data
    const icons = [
        { src: "/icons/likeli.svg", alt: "like" },
        { src: "/icons/clap.svg", alt: "clap" },
        { src: "/icons/support.svg", alt: "support" },
        { src: "/icons/heart.svg", alt: "heart" },
        { src: "/icons/bulb.svg", alt: "bulb" },
        { src: "/icons/laugh.svg", alt: "laugh" },
    ];

    return (
        <div className={`flex justify-center items-center ${hoveredIcon != null ? "max-h-12" : "max-h-14"} `}>
            {icons.map((icon, index) => (
                <Icon
                    key={index}
                    selected={hoveredIcon != null ? hoveredIcon == index : null} // Highlight the hovered icon
                    src={icon.src}
                    width={50}
                    height={50}
                    alt={icon.alt}
                    size="xl"
                    onMouseEnter={() => setHoveredIcon(index)} // Set hovered icon
                    onMouseLeave={() => setHoveredIcon(null)} // Reset hovered icon
                />
            ))}
        </div>
    );
}