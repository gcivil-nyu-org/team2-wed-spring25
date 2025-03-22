"use client";
import { useEmojiPicker } from "@/hooks/useEmojiPicker";
import { useState } from "react";
import { apiPost } from "@/utils/fetch/fetch";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
export default function usePostCommentInput(
  post_id,
  setCommentsCount,
  setComments,
  is_repost,
  original_post_id,
  is_reply = false,
  parent_comment_id = null
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
  const { showError } = useNotification();

  const handleCommentSubmit = async () => {
    // Input validation

    if (commentContent.trim() === "") {
      showError("Please enter a comment, cannot be empty.");
      return;
    }

    if (commentContent.length > 400) {
      showError(
        "Comment content exceeds the character limit of 400 characters."
      );
      return;
    }

    try {
      setIsButtonDisabled(true); // Disable the button
      setIsLoading(true); // Show loading spinner
      setCommentsCount((prev) => prev + 1); // Increment the comments count
      let userString = null;
      if (typeof window !== "undefined") {
        userString = localStorage.getItem("user"); // Retrieve the user from localStorage
      }
      let user = null;
      if (userString) {
        user = JSON.parse(userString); // Parse the user object
      } else {
        showError("Please login to comment. User not found.");
      }

      if (!user) {
        showError("Please login to comment. User not found.");
        return;
      }
      let curUser = null;
      if (typeof window !== "undefined") {
        curUser = JSON.parse(localStorage.getItem("user"));
      }
      if (!curUser) {
        showError("Please login to comment. User not found.");
        return;
      }
      const newComment = {
        content: commentContent,
        date_created: new Date().toISOString(),
        id: 0,
        post_id: post_id,
        is_reply: is_reply,
        parent_comment_id: parent_comment_id,
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
        `/api/forum/posts/${is_repost ? original_post_id : post_id}/comments/`,
        {
          content: commentContent,
          user_id: user.id,
          parent_comment_id: parent_comment_id,
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
      showError("Failed to submit comment. Please try again.");
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
