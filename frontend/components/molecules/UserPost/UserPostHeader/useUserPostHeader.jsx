"use client";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiDelete, apiPost } from "@/utils/fetch/fetch";
import throttle from "@/utils/throttle";
import { useEffect, useRef, useState } from "react";

export default function useUserPostHeader(post_user_id, setPosts, post_id) {
  const [isFollowButtonDisabled, setIsFollowButtonDisabled] = useState(false);
  const [isPostOptionListVisible, setIsPostOptionListVisible] = useState(false);
  const [deletePostConfirmation, setDeletePostConfirmation] = useState(false);
  const [isDeleteInProgress, setIsDeleteInProgress] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const postOptionListRef = useRef(null);
  const { showError, showSuccess } = useNotification();

  let user = null;
  if (typeof window !== "undefined") {
    user = JSON.parse(localStorage.getItem("user")); // Retrieve the user from localStorage
  }

  if (!user) {
    showError("Please login to follow a user. User not found.");
    return;
  }

  const user_id = user.id;
  const throttledHandleOnFollow = throttle(async (val) => {
    try {
      setIsFollowButtonDisabled(true);
      setPosts((prev) => {
        return prev.map((post) => {
          if (post.user_id === post_user_id) {
            return { ...post, is_following_author: val };
          }
          return post;
        });
      });
      user = null;
      if (typeof window !== "undefined") {
        user = JSON.parse(localStorage.getItem("user"));
      }
      if (!user) {
        showError("Please login to follow a user. User not found.");
        return;
      }
      await apiPost(`/api/forum/posts/follow/${post_user_id}/`, {
        user_id: user.id,
        follow: val,
      });
    } catch (e) {
      showError("Error following user");
      console.log(e);
    } finally {
      setIsFollowButtonDisabled(false);
    }
  }, 2000);

  const handleDeletePost = async () => {
    try {
      if (isDeleteInProgress) {
        showError("Delete in progress. Please wait.");
        return;
      }
      setIsDeleteInProgress(true);
      await apiDelete(`/api/forum/posts/${post_id}/delete/`);
      setPosts((prev) => prev.filter((post) => post.id !== post_id));
      showSuccess("Post deleted successfully");
    } catch (e) {
      showError("Error deleting post");
      console.log(e);
    } finally {
      setIsDeleteInProgress(false);
      setDeletePostConfirmation(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        postOptionListRef.current &&
        !postOptionListRef.current.contains(event.target)
      ) {
        setIsPostOptionListVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return {
    isFollowButtonDisabled,
    throttledHandleOnFollow,
    user_id,
    isPostOptionListVisible,
    setIsPostOptionListVisible,
    postOptionListRef,
    deletePostConfirmation,
    setDeletePostConfirmation,
    isDeleteInProgress,
    setIsDeleteInProgress,
    handleDeletePost,
    isPostDialogOpen,
    setIsPostDialogOpen,
  };
}
