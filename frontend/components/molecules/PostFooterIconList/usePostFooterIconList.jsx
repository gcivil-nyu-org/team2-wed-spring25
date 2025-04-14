"use client";

import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { useAuthStore } from "@/stores/useAuthStore";
import { useForumStore } from "@/stores/useForumStore";
import { apiPost } from "@/utils/fetch/fetch";
import { useState } from "react";
import { useShallow } from "zustand/shallow";

export default function usePostFooterIconList(post) {
  const [userHasLiked, setUserHasLiked] = useState(post.user_has_liked);
  const [likeType, setLikeType] = useState(post.like_type);
  const { showError, showWarning, showSuccess } = useNotification();
  const { userPosts, setUserPosts } = useForumStore(
    useShallow((state) => ({
      userPosts: state.userPosts,
      setUserPosts: state.setUserPosts,
    }))
  );
  const user = useAuthStore((state) => state.user);
  const handleRepost = async () => {
    if (!user) {
      showError("Please login to repost. User not found.");
      return;
    }
    if (user.id === post.user_id) {
      //show toast
      showWarning("You can't repost your own post");
      return;
    }
    // repost
    try {
      // const response

      if (!user) {
        showError("Please login to repost. User not found.");
        return;
      }
      const newRepost = {
        id: 0,
        original_post_id: post.id,
        title: post.title,
        content: post.content,
        image_urls: post.image_urls,
        date_created: new Date().toISOString(),
        user_id: post.user_id,
        user_fullname: post.user_fullname,
        user_avatar: post.user_avatar,
        user_karma: post.user_karma,
        comments_count: post.comments_count,
        likes_count: post.likes_count,
        user_has_liked: post.user_has_liked,
        like_type: post.like_type,
        is_following_author: post.is_following_author,
        is_repost: true,
        reposted_by: {
          id: user.id,
          username: user.email,
          first_name: user?.first_name || "Unknown",
          last_name: user?.last_name || "Unknown",
          avatar_url: user?.avatar ? user.avatar : null,
        },
      };
      const updatedUserPosts = userPosts.filter((p) => p.id !== post.id);
      updatedUserPosts.unshift(newRepost);
      setUserPosts(updatedUserPosts);

      // Scroll to the top of the page
      window.scrollTo({ top: 0, behavior: "smooth" });

      const response = await apiPost("/forum/posts/repost/", {
        user_id: user.id,
        original_post_id: post.is_repost ? post.original_post_id : post.id,
      });

      if (response.status === 201) {
        showSuccess("Post reposted successfully");
      }
    } catch (error) {
      showError(error.message);
      console.error("Error reposting post", error);
    }
  };

  return {
    userHasLiked,
    setUserHasLiked,
    likeType,
    setLikeType,
    handleRepost,
  };
}
