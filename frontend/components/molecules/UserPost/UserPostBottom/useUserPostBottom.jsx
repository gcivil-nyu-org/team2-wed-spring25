import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiPost } from "@/utils/fetch/fetch";
import { useState } from "react";

export default function useUserPostBottom(post, setPosts) {
  const [showCommentSection, setShowCommentSection] = useState(false);
  const [showReportUserDialog, setShowReportUserDialog] = useState(false);
  const { showError, showSuccess } = useNotification();
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

  const handleReportPost = async () => {
    try {
      if (post.is_reported) {
        showError("Post is already reported by you.");
        return;
      }
      const user = JSON.parse(localStorage.getItem("user"));
      console.log(post);
      if (user.id === post.user_id) {
        //show toast
        showError("You can't report your own post");
        return;
      }
      if (post.is_repost && user.id === post.reposted_by.id) {
        //show toast
        showError("You can't report your own repost");
        return;
      }

      await apiPost(
        `/api/forum/posts/${
          post.is_repost ? post.original_post_id : post.id
        }/report/`,
        {
          reporting_user_id: user.id,
          post_owner_id: post.user_id,
          repost_user_id: post.is_repost ? post.reposted_by.id : null,
        }
      );
      showSuccess("Post reported successfully");
    } catch (error) {
      showError("Error reporting post");
      console.error(error);
    } finally {
      setShowReportUserDialog(false);
    }
  };

  return {
    getCommentsCount,
    getLikesCount,
    handleClickOnComment,
    showCommentSection,
    showReportUserDialog,
    setShowReportUserDialog,
    handleReportPost,
  };
}
