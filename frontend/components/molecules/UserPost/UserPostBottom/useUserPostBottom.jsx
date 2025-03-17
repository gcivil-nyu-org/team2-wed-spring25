import { useState } from "react";
export default function useUserPostBottom(post_id) {
  const [showCommentSection, setShowCommentSection] = useState(false);
  const getCommentsCount = (comments_count) => {
    if (comments_count === 0) {
      return <p className="text-slate-500 text-sm font-normal">No comments</p>;
    } else if (comments_count === 1) {
      return (
        <p className="text-slate-500 text-sm font-normal">
          {comments_count} comment
        </p>
      );
    } else {
      return (
        <p className="text-slate-500 text-sm font-normal">
          {comments_count} comments
        </p>
      );
    }
  };
  const getLikesCount = (likes_count) => {
    if (likes_count === 0) {
      return <p className="text-slate-500 text-sm font-normal">No likes</p>;
    } else if (likes_count === 1) {
      return (
        <p className="text-slate-500 text-sm font-normal">{likes_count} like</p>
      );
    } else {
      return (
        <p className="text-slate-500 text-sm font-normal">
          {likes_count} likes
        </p>
      );
    }
  };

  const handleClickOnComment = () => {
    setShowCommentSection(true);
  };

  return {
    getCommentsCount,
    getLikesCount,
    handleClickOnComment,
    showCommentSection,
  };
}
