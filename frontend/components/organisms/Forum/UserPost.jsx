'use client'

import Button from "@/components/atom/Button/Button";
import IconText from "@/components/molecules/IconText/IconText";
import UserImage from "@/components/atom/UserImage/UserImage";
import Image from "next/image";
import { useState } from "react";
import formatDateAgo from "@/utils/datetime";
import IconList from "@/components/molecules/IconList/IconList";
import UserPostBottom from "@/components/molecules/UserPost/UserPostBottom/UserPostBottom";
import UserPostHeader from "@/components/molecules/UserPost/UserPostHeader/UserPostHeader";
import UserPostBody from "@/components/molecules/UserPost/UserPostBody/UserPostBody";


export default function UserPost(
    {post}

){
    return (
    <div className="flex flex-col rounded-md w-full font-sans mb-4 bg-white">
        <UserPostHeader user_avatar={post.user_avatar} user_fullname={post.user_fullname} date_created={post.date_created}/>
        <UserPostBody image_urls={post.image_urls} content={post.content}/>
        <UserPostBottom user_avatar={post.user_avatar}/>
    </div>
    );
}