"use client";

import { useRef, useState, useEffect } from "react";
import throttle from "@/utils/throttle";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiGet, apiPost } from "@/utils/fetch/fetch";
export default function usePostComment(
  comment,
  post_id,
  original_post_id,
  is_repost
) {
  const [isTooltipVisible, setTooltipVisible] = useState(false);
  const hoverTimeoutRef2 = useRef(null);
  const [userHasLiked, setUserHasLiked] = useState(comment.user_has_liked);
  const [likeType, setLikeType] = useState(comment.like_type);
  const [likesCount, setLikesCount] = useState(comment.likes_count);
  const [showCommentReply, setShowCommentReply] = useState(false);
  const [showCommentReplyInput, setShowCommentReplyInput] = useState(false);
  const [repliesCount, setRepliesCount] = useState(comment.replies_count);
  const [replies, setReplies] = useState([]);
  const { showError } = useNotification(); // Notification context to show error messages
  // const
  const handleMouseEnter = () => {
    // Clear any existing timeout to avoid hiding the tooltip prematurely
    if (hoverTimeoutRef2.current) {
      clearTimeout(hoverTimeoutRef2.current);
    }
    setTooltipVisible(true);
  };

  const handleMouseLeave = () => {
    // Set a timeout to hide the tooltip after 0.5 seconds
    hoverTimeoutRef2.current = setTimeout(() => {
      setTooltipVisible(false);
    }, 100); // 500ms = 0.5 seconds
  };
  const throttledHandleOnLikeComment = throttle(async (like_type) => {
    try {
      // return;
      let userHasLiked2 = null;
      if (
        !userHasLiked &&
        ["Like", "Clap", "Support", "Heart", "Bulb", "Laugh"].includes(
          like_type
        )
      ) {
        setLikesCount((prevCount) => prevCount + 1);
        setUserHasLiked(true);
        userHasLiked2 = true;
        setLikeType(like_type);
      } else if (
        userHasLiked &&
        ["Like", "Clap", "Support", "Heart", "Bulb", "Laugh"].includes(
          like_type
        ) &&
        likeType !== like_type
      ) {
        setLikeType(like_type);
        userHasLiked2 = true;
      } else if (userHasLiked && likeType === like_type) {
        setLikesCount((prevCount) => prevCount - 1);
        setUserHasLiked(false);
        userHasLiked2 = false;
      }
      setTooltipVisible(false);
      let userString = null;
      if (typeof window !== "undefined") {
        userString = localStorage.getItem("user"); // Retrieve the string
      }

      let user = null;
      if (userString) {
        user = JSON.parse(userString); // Parse the string into a JSON object
        // Use the JSON object
      } else {
        showError("Please login to like the post. User not found.");
        console.error("No user data found in localStorage");
      }

      if (!user) {
        showError("Please login to like the post. User not found.");
        return;
      }

      const response = await apiPost(
        `/api/forum/posts/comments/${comment.id}/like/`,
        {
          is_liked: userHasLiked2,
          user_id: user.id,
          like_type: like_type,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 201) {
        throw new Error(response.message || "Failed to like the post");
      }
      // Hide the tooltip after liking
    } catch (error) {
      showError("Error: Check console for details.");
      console.error("Error liking the post:", error);
    }
  }, 2000); // Debounce for 2 seconds

  // Cleanup the timeout when the component unmounts
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef2.current) {
        clearTimeout(hoverTimeoutRef2.current);
      }
    };
  }, []);

  return {
    isTooltipVisible,
    handleMouseEnter,
    handleMouseLeave,
    throttledHandleOnLikeComment,
    likesCount,
    userHasLiked,
    likeType,
    repliesCount,
    showCommentReply,
    setShowCommentReply,
    replies,
    setReplies,
    showCommentReplyInput,
    setShowCommentReplyInput,
  };
}
