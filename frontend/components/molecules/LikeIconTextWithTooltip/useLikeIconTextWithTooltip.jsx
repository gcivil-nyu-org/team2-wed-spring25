import { apiPost } from "@/utils/fetch/fetch";
import throttle from "@/utils/throttle";
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
  // State to track if the post is liked
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

  const throttledHandleOnLike = throttle(async (like_type) => {
    try {
      console.log("like_type", like_type);
      console.log("userHasLiked", userHasLiked);
      console.log("likeType", likeType);
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

      const userString = localStorage.getItem("user"); // Retrieve the string
      let user = null;
      if (userString) {
        user = JSON.parse(userString); // Parse the string into a JSON object
        console.log(user); // Use the JSON object
      } else {
        console.log("No user data found in localStorage");
      }

      if (!user) {
        alert("Please login to like the post. User not found.");
        return;
      }

      const response = await apiPost(
        `/api/forum/posts/${is_repost ? original_post_id : post_id}/like/`,
        {
          post_id: is_repost ? original_post_id : post_id,
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
      alert("Error: Check console for details.");
      console.error("Error liking the post:", error);
    }
  }, 2000); // Debounce for 2 seconds

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
