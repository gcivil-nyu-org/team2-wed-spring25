import UserImage from "@/components/atom/UserImage/UserImage";
import PostFooterIconList from "@/components/molecules/PostFooterIconList/PostFooterIconList";
import LikedIconList from "@/components/molecules/LikedIconList/LikedIconList";
import UserPostCommentSection from "@/components/molecules/UserPost/UserPostBottom/UserPostCommentSection/UserPostCommentSection";
import useUserPostBottom from "./useUserPostBottom";

export default function UserPostBottom({
  user_avatar,
  likesCount,
  commentsCount,
  setLikesCount,
  setCommentsCount,
  post_id,
  user_has_liked,
  like_type,
  post_user_id,
  is_repost,
  original_post_id,
}) {
  const {
    getCommentsCount,
    getLikesCount,
    handleClickOnComment,
    showCommentSection,
  } = useUserPostBottom();
  return (
    <div className="mx-3">
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
            <UserImage imageUrl={user_avatar} width={24} height={24} />
          </div>

          <PostFooterIconList
            handleClickOnComment={handleClickOnComment}
            post_id={post_id}
            user_has_liked={user_has_liked}
            like_type={like_type}
            setLikesCount={setLikesCount}
            post_user_id={post_user_id}
            is_repost={is_repost}
            original_post_id={original_post_id}
          />
        </div>
      </div>
      {showCommentSection && (
        <div>
          <UserPostCommentSection
            post_id={post_id}
            setCommentsCount={setCommentsCount}
            is_repost={is_repost}
            original_post_id={original_post_id}
          />
        </div>
      )}
    </div>
  );
}
