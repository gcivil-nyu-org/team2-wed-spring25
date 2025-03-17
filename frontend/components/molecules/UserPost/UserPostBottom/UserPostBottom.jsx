import UserImage from "@/components/atom/UserImage/UserImage";
import PostFooterIconList from "@/components/molecules/PostFooterIconList/PostFooterIconList";
import LikedIconList from "@/components/molecules/LikedIconList/LikedIconList";
import UserPostCommentSection from "@/components/molecules/UserPost/UserPostBottom/UserPostCommentSection/UserPostCommentSection";
import useUserPostBottom from "./useUserPostBottom";

export default function UserPostBottom({
  user_avatar,
  comments_count,
  likes_count,
  post_id,
  user_has_liked,
  like_type,
}) {
  const {
    getCommentsCount,
    getLikesCount,
    handleClickOnComment,
    showCommentSection,
  } = useUserPostBottom(post_id);
  return (
    <div className="mx-3">
      <div>
        <div className="flex justify-between pr-2 py-2 border-b">
          <div className="flex gap-2">
            <LikedIconList />
            {getLikesCount(likes_count)}
          </div>
          {getCommentsCount(comments_count)}
        </div>
        <div className="flex justify-between ">
          <div className="flex flex-row justify-center items-center px-4 rounded-md hover:bg-slate-100 my-2">
            <UserImage imageUrl={user_avatar} width={24} height={24} />
          </div>

          <PostFooterIconList
            handleClickOnComment={handleClickOnComment}
            post_id={post_id}
            user_has_liked={user_has_liked}
            like_type={like_type}
          />
        </div>
      </div>
      {showCommentSection && (
        <div>
          <UserPostCommentSection post_id={post_id} />
        </div>
      )}
    </div>
  );
}
