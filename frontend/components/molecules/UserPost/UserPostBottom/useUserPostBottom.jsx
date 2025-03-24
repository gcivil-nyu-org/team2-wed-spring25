"use client";

import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiPost } from "@/utils/fetch/fetch";
import { useEffect, useRef, useState } from "react";

export default function useUserPostBottom(post, setPosts) {
  const [showCommentSection, setShowCommentSection] = useState(false);
  const [showReportUserDialog, setShowReportUserDialog] = useState(false);
  const [disableYesButton, setDisableYesButton] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const { showError, showSuccess } = useNotification();
  const handleShowReportUserDialogRef = useRef(null);

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
      if (disableYesButton) return; // Prevent multiple clicks if button is already disabled
      setDisableYesButton(true);
      if (post.is_reported) {
        showError("Post is already reported by you.");
        return;
      }
      let user = null;
      if (typeof window !== "undefined") {
        user = JSON.parse(localStorage.getItem("user"));
      }
      if (!user) {
        showError("Please login to report a post. User not found.");
        return;
      }
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
      setIsReported(true);
      showSuccess("Post reported successfully");
    } catch (error) {
      if (error.message === "Error: You have already reported this post") {
        setIsReported(true);
        showError("You have already reported this post.");
        return;
      }
      showError("Error reporting post");
      console.error(error);
    } finally {
      setShowReportUserDialog(false);
      setDisableYesButton(false);
    }
  };

  // Function to close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        handleShowReportUserDialogRef.current &&
        !handleShowReportUserDialogRef.current.contains(event.target)
      ) {
        setShowReportUserDialog(false);
      }
    };

    // Add event listener when the component mounts
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return {
    getCommentsCount,
    getLikesCount,
    handleClickOnComment,
    showCommentSection,
    showReportUserDialog,
    setShowReportUserDialog,
    handleReportPost,
    handleShowReportUserDialogRef,
    disableYesButton,
    setDisableYesButton,
    isReported,
    setIsReported,
  };
}
