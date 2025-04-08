"use client";
import { fallbackUserProfileImage } from "@/constants/imageUrls";
import Image from "next/image";

export default function UserImage({ imageUrl, width, height }) {
  return (
    <div
      className="rounded-full overflow-hidden"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <Image
        src={imageUrl ?? fallbackUserProfileImage}
        alt="avatar"
        width={width}
        height={height}
        className="object-cover w-full h-full"
      />
    </div>
  );
}
