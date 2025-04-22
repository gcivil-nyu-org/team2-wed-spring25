"use client";
import Image from "next/image";
import { useState } from "react";

export default function Icon({
  onClick = () => {},
  src,
  width,
  height,
  alt,
  size,
  onMouseEnter = null,
  onMouseLeave = null,
  selected = null,
  tooltipText = "",
}) {
  const [isHovered, setIsHovered] = useState(false); // State to manage hover
  let data =
    "flex justify-center items-center rounded-full hover:cursor-pointer transition-all duration-200 inline-block";

  if (selected == null) {
    data = "hover:bg-gray-600 " + data;
    if (size === "sm") {
      data = "w-5 h-5 " + data;
    } else if (size === "md") {
      data = "w-7 h-7 " + data;
    } else if (size === "lg") {
      data = "w-10 h-10 " + data;
    } else if (size === "xl") {
      data = "w-14 h-14 " + data;
    } else if (size === "xl") {
      data = "w-18 h-18 " + data;
    }
  } else {
    if (selected) {
      // Only apply large size if no size is explicitly set
      if (!size) {
        data = "scale-110 z-3 w-20 h-20 " + data;
      } else {
        // use size-specific selected styles
        if (size === "md") {
          data = "scale-110 z-3 w-8 h-8 " + data;
        } else if (size === "sm") {
          data = "scale-110 z-3 w-6 h-6 " + data;
        } else {
          data = "scale-110 z-3 w-10 h-10 " + data;
        }
      }
    } else {
      data = "w-8 h-8 " + data;
    }
  }

  // Handle click safely - prevent passing the event object
  const handleClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling if needed

    // Call onClick with the alt text instead of the event
    // This ensures we pass a string not an event object
    if (onClick) {
      onClick(alt);
    }
  };

  return (
    <div
      onClick={handleClick} // Use our safe handler instead of directly passing onClick
      className={`${data} relative`} // tooltiptext positioned relative to icon
      onMouseEnter={() => {
        setIsHovered(true);
        if (onMouseEnter) {
          onMouseEnter();
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (onMouseLeave) {
          onMouseLeave();
        }
      }}
    >
      <Image
        src={src}
        width={selected != null ? (selected ? 80 : 40) : width ?? 40}
        height={selected != null ? (selected ? 80 : 40) : height ?? 40}
        alt={alt}
      />

      {/* Tooltip */}
      {isHovered && tooltipText && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-sm px-2 py-1 rounded-full whitespace-nowrap z-50 shadow-md">
          {tooltipText}
        </div>
      )}
    </div>
  );
}
