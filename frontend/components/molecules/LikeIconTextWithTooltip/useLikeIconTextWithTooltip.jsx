import { apiPost } from "@/utils/fetch/fetch";
import { useState, useEffect, useRef } from "react";

export default function useLikeIconTextWithTooltip(post_id) {
  const [isTooltipVisible, setTooltipVisible] = useState(false);
  const [isLiked, setIsLiked] = useState(false); // State to track if the post is liked
  const hoverTimeoutRef = useRef(null); // Ref to store the timeout ID

  const handleMouseEnter = () => {
    // Clear any existing timeout to avoid hiding the tooltip prematurely
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setTooltipVisible(true);
  };

  const handleMouseLeave = () => {
    // Set a timeout to hide the tooltip after 0.5 seconds
    hoverTimeoutRef.current = setTimeout(() => {
      setTooltipVisible(false);
    }, 100); // 500ms = 0.5 seconds
  };

  const handleOnLike = () => {
    try {
      const userString = localStorage.getItem("user"); // Retrieve the string
      let user = null;
      if (userString) {
        user = JSON.parse(userString); // Parse the string into a JSON object
        console.log(user); // Use the JSON object
      } else {
        console.log("No user data found in localStorage");
      }

      if (!user) {
        alert("Please login to comment. or user not found.");
        return;
      }
      const postLike = async () => {
        const response = await apiPost(
          `/api/forum/posts/${post_id}/like/`,
          {
            post_id: post_id,
            is_liked: !isLiked,
            user_id: user.id,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log(response);

        if (response.status !== 201) {
          throw new Error(response.message || "Failed to like the post");
        }
      };
      postLike();
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error liking the post:", error);
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
    isLiked,
    setIsLiked,
    isTooltipVisible,
    handleMouseEnter,
    handleMouseLeave,
    handleOnLike,
  };
}
