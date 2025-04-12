"use client";
import UserImage from "@/components/atom/UserImage/UserImage";
import LikedIconList from "@/components/molecules/LikedIconList/LikedIconList";
import PostFooterIconList from "@/components/molecules/PostFooterIconList/PostFooterIconList";
import { fallbackUserProfileImage } from "@/constants/imageUrls";

export default function UserPostButtons({
  likesCount,
  commentsCount,
  getLikesCount,
  getCommentsCount,
  setLikesCount,
  post,
  handleClickOnComment,
  setShowReportUserDialog,
  isReported,
  setIsReported,
}) {
  return (
    <div>
      <div className="flex justify-between mr-1 py-2">
        <div className="flex gap-2">
          <LikedIconList />
          {getLikesCount(likesCount)}
        </div>
        {getCommentsCount(commentsCount)}
      </div>
      <hr className="border-top-light mx-1"></hr>
      <div className="flex justify-between ">
        <div className="flex flex-row justify-center items-center px-4 rounded-md hover:bg-slate-100 my-2">
          <UserImage
            imageUrl={post.user_avatar ?? fallbackUserProfileImage}
            width={24}
            height={24}
          />
        </div>

        <PostFooterIconList
          handleClickOnComment={handleClickOnComment}
          setShowReportUserDialog={setShowReportUserDialog}
          setLikesCount={setLikesCount}
          post={post}
          isReported={isReported}
          setIsReported={setIsReported}
        />
      </div>
    </div>
  );
}
