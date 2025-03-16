import UserImage from "@/components/atom/UserImage/UserImage";
import PostFooterIconList from "@/components/molecules/PostFooterIconList/PostFooterIconList";
import LikedIconList from "@/components/molecules/LikedIconList/LikedIconList";
import UserPostCommentSection from "@/components/molecules/UserPost/UserPostBottom/UserPostCommentSection/UserPostCommentSection";
import { useState } from "react";

export default function UserPostBottom({ user_avatar, comments_count, likes_count }) {
    const [showCommentSection, setShowCommentSection] = useState(false);
    const getCommentsCount = (comments_count) => {
        if (comments_count === 0) {
            return (
                <p className="text-slate-500 text-sm font-normal">No comments</p>
            );
        } else if (comments_count === 1) {
            return (
                <p className="text-slate-500 text-sm font-normal">{comments_count} comment</p>
            );
        } else {
            return (
                <p className="text-slate-500 text-sm font-normal">{comments_count} comments</p>
            );
        }
    }
    const getLikesCount = (likes_count) => {
        if (likes_count === 0) {
            return (
                <p className="text-slate-500 text-sm font-normal">No likes</p>
            );
        } else if (likes_count === 1) {
            return (
                <p className="text-slate-500 text-sm font-normal">{likes_count} like</p>
            );
        } else {
            return (
                <p className="text-slate-500 text-sm font-normal">{likes_count} likes</p>
            );
        }
    }

    const handleClickOnComment = () => {
        setShowCommentSection(true);
    }

    return (
        <div className="mx-3">
            <div>
                <div className="flex justify-between px-2 py-2 border-b">
                    <div className="flex gap-2">
                        <LikedIconList />
                        {getLikesCount(likes_count)}
                    </div>
                    {getCommentsCount(comments_count)}
                </div>
                <div className="flex justify-between ">
                    <div className="flex flex-row justify-center items-center px-4 rounded-md hover:bg-slate-100 my-2">
                        <UserImage
                            imageUrl={user_avatar}
                            width={30}
                            height={30}
                        />
                    </div>

                    <PostFooterIconList handleClickOnComment={handleClickOnComment}/>
                </div>
            </div>
            {
                showCommentSection && (
                    <div>
                        <UserPostCommentSection />
                    </div>
                )
            }
        </div>
    );
}