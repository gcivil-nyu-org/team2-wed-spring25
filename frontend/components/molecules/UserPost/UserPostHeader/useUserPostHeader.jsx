"use client";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiPost } from "@/utils/fetch/fetch";
import throttle from "@/utils/throttle";
import { useState } from "react";

export default function useUserPostHeader(post_user_id, setPosts) {
  const [isFollowButtonDisabled, setIsFollowButtonDisabled] = useState(false);
  const { showError } = useNotification();

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

  return {
    isFollowButtonDisabled,
    throttledHandleOnFollow,
    user_id,
  };
}
