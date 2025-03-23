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
  parent_comment_id = null,
  setRepliesCount = null
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
  const { showError, showSuccess } = useNotification();

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
      console.log("commentsCount");

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
      //type of setRepliesCount check

      const newComment = {
        content: commentContent,
        date_created: new Date().toISOString(),
        id: response.id,
        post_id: post_id,
        is_reply: is_reply,
        parent_comment_id: parent_comment_id,
        user: {
          avatar_url: user.avatar,
          email: user.email,
          first_name: user.first_name,
          id: user.id,
          last_name: user.last_name,
        },
      };
      showSuccess("Comment submitted successfully");
      // Reset the comment input
      setCommentContent("");
      setComments((prev) => [newComment, ...prev]);
      if (is_reply && typeof setRepliesCount === "function") {
        setRepliesCount((prev) => prev + 1); // Increment the replies count if it's a reply
      }
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
