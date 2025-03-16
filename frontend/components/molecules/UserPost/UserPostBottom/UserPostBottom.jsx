import UserImage from "@/components/atom/UserImage/UserImage";
import PostFooterIconList from "@/components/molecules/PostFooterIconList/PostFooterIconList";
import LikedIconList from "@/components/molecules/LikedIconList/LikedIconList";
import UserPostCommentSection from "@/components/molecules/UserPost/UserPostBottom/UserPostCommentSection/UserPostCommentSection";
<<<<<<< HEAD
import useUserPostBottom from "./useUserPostBottom";
import { fallbackUserProfileImage } from "@/constants/imageUrls";
import CustomDialogBox from "@/components/organisms/CustomDialogBox/CustomDialogBox";

export default function UserPostBottom({
  likesCount,
  commentsCount,
  setLikesCount,
  setCommentsCount,
  setPosts,
  post,
  disableYesButton,
}) {
  const {
    getCommentsCount,
    getLikesCount,
    showCommentSection,
    showReportUserDialog,
    setShowReportUserDialog,
    handleReportPost,
    handleClickOnComment,
    handleShowReportUserDialogRef,
    isReported,
    setIsReported,
  } = useUserPostBottom(post, setPosts);
  return (
    <div className="mx-3">
      <CustomDialogBox
        showDialog={showReportUserDialog}
        dialogRef={handleShowReportUserDialogRef}
        onClickNo={() => {
          setShowReportUserDialog(false);
        }}
        onClickYes={handleReportPost}
        title={"Report User"}
        description={
          "Are you sure you want to report this user?. This action cannot be undone"
        }
        disableYesButton={disableYesButton}
      />
      <div>
        <div className="flex justify-between mr-1 py-2">
          <div className="flex gap-2">
            <LikedIconList />
            {getLikesCount(likesCount)}
          </div>
          {getCommentsCount(commentsCount)}
=======
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
>>>>>>> 9dc5cd8 (Complete UI for add comment input button, user post)
        </div>
        <hr className="border-gray-200 mx-1"></hr>
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
            setPosts={setPosts}
            post={post}
            isReported={isReported}
            setIsReported={setIsReported}
          />
        </div>
      </div>
      {showCommentSection && (
        <div>
          <UserPostCommentSection
            post_id={post.id}
            setCommentsCount={setCommentsCount}
            is_repost={post.is_repost}
            original_post_id={post.is_repost ? post.original_post_id : null}
          />
        </div>
      )}
    </div>
  );
}
