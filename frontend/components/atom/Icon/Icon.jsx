import Image from "next/image";
import { useState } from "react";

export default function Icon({
  onClick = () => { },
  src,
  width,
  height,
  alt,
  size,
  key = null,
  onMouseEnter = null,
  onMouseLeave = null,
  selected = null,
  tooltipText = "",
}) {
  const [isHovered, setIsHovered] = useState(false); // State to manage hover
  let data =
    "flex justify-center items-center rounded-full hover:cursor-pointer transition-all duration-200 inline-block";

  if (selected == null) {
    data = "hover:bg-gray-200 " + data;
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
      data = "scale-110 z-3 w-20 h-20 " + data;
    } else {
      data = "w-11 h-11 " + data;
    }
  }


  return (
    <div
      onClick={onClick}
      className={data}
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
        width={selected != null ? selected ? 80 : 40 : width}
        height={selected != null ? selected ? 80 : 40 : height}
        alt={alt}
      />
      {/* Tooltip */}
      {isHovered && tooltipText && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-sm px-2 py-1 rounded-full whitespace-nowrap">
          {tooltipText}
        </div>
      )}
    </div>
  )
}
    