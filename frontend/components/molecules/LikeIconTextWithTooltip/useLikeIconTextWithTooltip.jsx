"use client";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiPost } from "@/utils/fetch/fetch";
import { useState, useEffect, useRef } from "react";

export default function useLikeIconTextWithTooltip(
  post_id,
  userHasLiked,
  likeType,
  setUserHasLiked,
  setLikeType,
  setLikesCount,
  is_repost,
  original_post_id
) {
  const [isTooltipVisible, setTooltipVisible] = useState(false);
  const { showError } = useNotification(); // Notification context to show error messages
  const hoverTimeoutRef = useRef(null); // Ref to store the timeout ID
  const [isDisabled, setIsDisabled] = useState(false); // State to track if the button is disabled

  const handleMouseEnter = () => {
    // Clear any existing timeout to avoid hiding the tooltip prematurely
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setTooltipVisible(true);
  };

  const handleMouseLeave = () => {
    // Set a timeout to hide the tooltip after 0.1 seconds
    hoverTimeoutRef.current = setTimeout(() => {
      setTooltipVisible(false);
    }, 100);
  };

  const throttledHandleOnLike = async (like_type) => {
    // Ensure like_type is a string, not a DOM element or event
    if (typeof like_type !== "string") {
      console.error("Invalid like_type:", like_type);
      showError("Invalid like type");
      return;
    }

    // Check if the button is disabled
    if (isDisabled) {
      showError("Please wait before liking again.");
      return;
    }

    // Disable the button for 2 seconds
    setIsDisabled(true);

    let userHasLiked2 = null; // Moved outside try block

    try {

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
        try {
          user = JSON.parse(userString); // Parse the string into a JSON object
        } catch (e) {
          console.error("Failed to parse user data:", e);
          showError("Invalid user data. Please log in again.");
          return;
        }
      } else {
        showError("Please login to like the post. User not found.");
        console.error("No user data found in localStorage");
        return;
      }

      if (!user || !user.id) {
        showError("Please login to like the post. User not found.");
        return;
      }

      // Ensure we're only sending primitive values
      const postIdToUse = is_repost ? original_post_id : post_id;

      // Create a simple payload with only primitive values
      const payload = {
        post_id: String(postIdToUse), // Ensure it's a string
        is_liked: Boolean(userHasLiked2), // Ensure it's a boolean
        user_id: String(user.id), // Ensure it's a string
        like_type: String(like_type), // Ensure it's a string
      };

      const response = await apiPost(
        `/forum/posts/${postIdToUse}/like/`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 201) {
        throw new Error(response.message || "Failed to like the post");
      }
    } catch (error) {
      showError("Error: Check console for details.");
      console.error("Error liking the post:", error);

      if (!userHasLiked2) {
        setLikesCount((prevCount) => prevCount + 1);
        setUserHasLiked(true);
      } else {
        setLikesCount((prevCount) => prevCount - 1);
        setUserHasLiked(false);
      }
    } finally {
      // Re-enable the button after 2 seconds
      setTimeout(() => {
        setIsDisabled(false);
      }, 2000);
    }
  };

  // Cleanup the timeout when the component unmounts
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return {
    userHasLiked,
    setUserHasLiked,
    setTooltipVisible,
    isTooltipVisible,
    handleMouseEnter,
    handleMouseLeave,
    throttledHandleOnLike,
  };
}
