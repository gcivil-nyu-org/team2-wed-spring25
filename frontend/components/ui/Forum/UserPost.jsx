'use client'

import Button from "@/components/atom/Button/Button";
import UserImage from "@/components/atom/UserImage/UserImage";
import Image from "next/image";
import { useState } from "react";

function formatDateAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000); // Difference in seconds
  
    // Define time intervals in seconds
    const intervals = {
      year: 31536000,
      month: 2592000,
      day: 86400,
      hour: 3600,
      minute: 60,
    };
  
    // Calculate the difference in years, months, days, etc.
    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < intervals.day) {
      const hours = Math.floor(diffInSeconds / intervals.hour);
      return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    } else if (diffInSeconds < intervals.month) {
      const days = Math.floor(diffInSeconds / intervals.day);
      if (days === 1) return "yesterday";
      return days === 0 ? "today" : `${days} days ago`;
    } else if (diffInSeconds < intervals.year) {
      const months = Math.floor(diffInSeconds / intervals.month);
      return months === 1 ? "1 month ago" : `${months} months ago`;
    } else {
      const years = Math.floor(diffInSeconds / intervals.year);
      return years === 1 ? "1 year ago" : `${years} years ago`;
    }
  }

export default function UserPost(
    {post}

){
    const [showDetailedView, setShowDetailedView] = useState(false);
    const handleShowDetailedView = () => {
        setShowDetailedView(true);
    }
        
    const getPostContent = (content) => {
        
        if (showDetailedView){
            return <p>{content}</p>
        }
        return (
            <p >
                {content.substring(0, 78)}
                <span 
                    className="text-gray-500 hover:text-blue-900 hover:underline hover:cursor-pointer" 
                    onClick={handleShowDetailedView}>
                    ...more
                </span>
            </p>
        );
    }


    return (
    <div className="flex flex-col rounded-md w-full font-sans mb-4 bg-white">
        <div className="flex flex-row px-4 pt-4">
            <UserImage imageUrl={post.avatar_url} width={50} height={50}></UserImage>
            <div className="flex-1 flex-col justify-start items-start pl-2">
                <p className="text-lg font-medium leading-none">
                    {post.first_name} {post.last_name}
                </p>
                <p className="text-sm font-thin text-gray-500 leading-none">
                    {post.username}
                </p>
                <p className="text-sm font-thin top-10 text-gray-500 leading-none">
                    {formatDateAgo(post.date_created)}
                </p>
            </div>
            <div>
                <Button>+ Follow</Button>
            </div>
        </div>
        <div className="px-4 mt-2">
            {getPostContent(post.content)}        
        </div>
        <div className="mt-2 h-[25rem]">
            <Image src={post.image_urls[0]} width={650} height={650} alt="Post Image" className="h-full w-full object-fill"></Image>
        </div>
    </div>
    );
}