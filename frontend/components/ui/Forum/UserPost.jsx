'use client'

import Button from "@/components/atom/Button/Button";
import IconText from "@/components/molecules/IconText/IconText";
import UserImage from "@/components/atom/UserImage/UserImage";
import Image from "next/image";
import { useState } from "react";
import formatDateAgo from "@/utils/datetime";


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
        <div className="flex justify-between mx-3">
            <div className="flex flex-row justify-center items-center px-4 rounded-md hover:bg-slate-100 my-2">
                <UserImage 
                    imageUrl={"/images/user6.jpg"}
                    width={30}
                    height={30}
                />
            </div>

            <IconText
                src={"/icons/like.svg"}
                width={12}
                height={12}
                alt="Likes"
                text={"Likes"} />
            <IconText
                src={"/icons/comment.svg"}
                width={20}
                height={20}
                alt="Comments"
                text={"Comments"} />
            <IconText
                src={"/icons/repost.svg"}
                width={15}
                height={15}
                alt="Reposts"
                text={"Reposts"} />
            <IconText
                src={"/icons/send.svg"}
                width={12}
                height={12}
                alt="Send"
                text={"Send"} />
        </div>
    </div>
    );
}