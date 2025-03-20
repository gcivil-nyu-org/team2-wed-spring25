import UserImage from "@/components/atom/UserImage/UserImage";
import PostFooterIconList from "@/components/molecules/PostFooterIconList/PostFooterIconList";
import LikedIconList from "@/components/molecules/LikedIconList/LikedIconList";
import UserPostCommentSection from "@/components/molecules/UserPost/UserPostBottom/UserPostCommentSection/UserPostCommentSection";
import useUserPostBottom from "./useUserPostBottom";
import { fallbackUserProfileImage } from "@/constants/imageUrls";
import CustomButton from "@/components/atom/CustomButton/CustomButton";

export default function UserPostBottom({
  likesCount,
  commentsCount,
  setLikesCount,
  setCommentsCount,
  setPosts,
  post,
}) {
  const {
    getCommentsCount,
    getLikesCount,
    showCommentSection,
    showReportUserDialog,
    setShowReportUserDialog,
    handleReportPost,
    handleClickOnComment,
  } = useUserPostBottom(post, setPosts);
  return (
    <div className="mx-3">
      {showReportUserDialog && (
        <div className="flex fixed top-0 left-0 h-full w-full bg-black bg-opacity-5 justify-center items-center z-10">
          <div className="flex flex-col bg-white p-4 rounded-xl">
            <p>Are you sure you want to report this post?</p>
            <div className="flex mt-2 justify-end gap-2">
              <CustomButton
                onClick={() => {
                  setShowReportUserDialog(false);
                }}
              >
                No
              </CustomButton>
              <CustomButton theme="red" onClick={handleReportPost}>
                Yes
              </CustomButton>
            </div>
          </div>
        </div>
      )}
      <div>
        <div className="flex justify-between mr-1 py-2">
          <div className="flex gap-2">
            <LikedIconList />
            {getLikesCount(likesCount)}
          </div>
          {getCommentsCount(commentsCount)}
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
