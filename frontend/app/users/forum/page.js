'use client'
import UserPost from "@/components/ui/Forum/UserPost"
import userPosts from "./data"
import UserImage from "@/components/atom/UserImage/UserImage"
import { useState } from "react"
import PostDialog from "@/components/organisms/PostDialog/PostDialog"
export default function ForumsPage(){
    const [isOpen, setIsOpen] = useState(false);
    const handleClick = () => {
        setIsOpen(!isOpen);
    }
    return (
        <div className="flex flex-row justify-center items-start bg-gray-100 h-screen py-4">
            <div className="w-1/6 flex flex-col justify-center items-center bg-white rounded-sm h-1/2">
                <h1>User Data</h1>
            </div>
            <div className="w-2/5 flex flex-col mx-4 h-screen">
                {
                    isOpen && <PostDialog onClick={handleClick}/>
                }
                <div className="felx flex-col rounded-md bg-white mb-4">
                    <div className="flex flex-row pl-4 py-3">
                        <UserImage imageUrl={"/images/user6.jpg"} width={50} height={50} />
                        <div onClick={handleClick} className="group flex flex-row items-center w-full border-gray-400 border-[1px] mx-3 rounded-3xl hover:bg-gray-100 hover:cursor-pointer">
                            <p className="ml-4 text-slate-600 text-sm font-bold group-hover:text-slate-900 ">Start a post</p>
                        </div>
                    </div>
                </div>
                <>
                    {
                        userPosts.map((post) => (
                            <UserPost key={post.id} post={post} />
                        ))
                    }
                </>
            </div>
            <div className="w-1/6 flex flex-col justify-center items-center bg-white rounded-sm h-1/2">
                <h1>Useful Links</h1>
            </div>
        </div>
    )
}