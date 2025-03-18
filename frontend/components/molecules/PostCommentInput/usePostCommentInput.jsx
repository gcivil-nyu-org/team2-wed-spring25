import { useEmojiPicker } from "@/hooks/useEmojiPicker";
import { useState } from "react";
import { apiPost } from "@/utils/fetch/fetch";
export default function usePostCommentInput(
  post_id,
  setCommentsCount,
  setComments
) {
  const {
    emojiPickerRef,
    showEmojiPicker,
    handleClickOnEmojiPicker,
    handleOnEmojiClick,
  } = useEmojiPicker();

  const [commentContent, setCommentContent] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // Disable button during API call
  const [isLoading, setIsLoading] = useState(false); // Loading state for visual feedback

  const handleCommentSubmit = async () => {
    // Input validation
    if (commentContent.trim() === "") {
      alert("Please enter a comment, cannot be empty.");
      return;
    }

    if (commentContent.length > 400) {
      alert("Comment content exceeds the character limit of 400 characters.");
      return;
    }

    try {
      setIsButtonDisabled(true); // Disable the button
      setIsLoading(true); // Show loading spinner
      setCommentsCount((prev) => prev + 1); // Increment the comments count
      const userString = localStorage.getItem("user"); // Retrieve the user from localStorage
      let user = null;
      if (userString) {
        user = JSON.parse(userString); // Parse the user object
      } else {
        console.log("No user data found in localStorage");
      }

      if (!user) {
        alert("Please login to comment. User not found.");
        return;
      }
      const curUser = JSON.parse(localStorage.getItem("user"));
      const newComment = {
        content: commentContent,
        date_created: new Date().toISOString(),
        id: 0,
        post_id: post_id,
        user: {
          avatar_url: curUser.avatar,
          email: curUser.email,
          first_name: curUser.first_name,
          id: curUser.id,
          last_name: curUser.last_name,
        },
      };
      // Make the API call
      const response = await apiPost(
        `/api/forum/posts/${post_id}/comments/`,
        {
          content: commentContent,
          user_id: user.id,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 201) {
        throw new Error(response.message || "Failed to submit comment.");
      }

      // Reset the comment input
      setCommentContent("");
      setComments((prev) => [newComment, ...prev]);
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Failed to submit comment. Please try again.");
    } finally {
      setIsButtonDisabled(false); // Re-enable the button
      setIsLoading(false); // Hide loading spinner
    }
  };

  return {
    handleCommentSubmit,
    commentContent,
    setCommentContent,
    emojiPickerRef,
    showEmojiPicker,
    handleClickOnEmojiPicker,
    handleOnEmojiClick,
    isButtonDisabled, // Expose the button disabled state
    isLoading, //
  };
}
