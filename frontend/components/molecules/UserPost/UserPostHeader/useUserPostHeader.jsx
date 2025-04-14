"use client";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { useAuthStore } from "@/stores/useAuthStore";
import { useForumStore } from "@/stores/useForumStore";
import { apiDelete, apiPost } from "@/utils/fetch/fetch";
import throttle from "@/utils/throttle";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";

export default function useUserPostHeader(post_user_id, post_id) {
  const [isFollowButtonDisabled, setIsFollowButtonDisabled] = useState(false);
  const [isPostOptionListVisible, setIsPostOptionListVisible] = useState(false);
  const [deletePostConfirmation, setDeletePostConfirmation] = useState(false);
  const [isDeleteInProgress, setIsDeleteInProgress] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const postOptionListRef = useRef(null);
  const { showError, showSuccess } = useNotification();
  const { setUserPosts, userPosts } = useForumStore(
    useShallow((state) => ({
      setUserPosts: state.setUserPosts,
      userPosts: state.userPosts,
    }))
  );
  const user = useAuthStore((state) => state.user);
  // Move user retrieval inside the effect or handler functions
  // instead of at the top level with early returns
  const [userId, setUserId] = useState(null);

  // Use an effect to load the user ID once on mount
  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, []);

  const throttledHandleOnFollow = throttle(async (val) => {
    try {
      if (!user) {
        showError("Please login to follow a user. User not found.");
        return;
      }

      setIsFollowButtonDisabled(true);
      const updatedUserPosts = userPosts.map((post) => {
        if (post.user_id === post_user_id) {
          return { ...post, is_following_author: val };
        }
        return post;
      });
      setUserPosts(updatedUserPosts);

      await apiPost(`/forum/posts/follow/${post_user_id}/`, {
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
      await apiDelete(`/forum/posts/${post_id}/delete/`);
      const updatedPosts = userPosts.filter((post) => post.id !== post_id);
      setUserPosts(updatedPosts);
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
    user_id: userId, // Return the state variable
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
