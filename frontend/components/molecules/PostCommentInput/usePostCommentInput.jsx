"use client";
import { useEmojiPicker } from "@/hooks/useEmojiPicker";
import { useState } from "react";
import { apiPost } from "@/utils/fetch/fetch";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { fallbackUserProfileImage } from "@/constants/imageUrls";
import { useAuthStore } from "@/stores/useAuthStore";
export default function usePostCommentInput(
  post_id,
  setCommentsCount,
  setComments,
  is_repost,
  original_post_id,
  is_reply = false,
  parent_comment_id = null,
  setRepliesCount = null,
  initialContent = "",
  isEdit = false,
  setisInputVisible = null
) {
  const {
    emojiPickerRef,
    showEmojiPicker,
    handleClickOnEmojiPicker,
    handleOnEmojiClick,
  } = useEmojiPicker();

  const [commentContent, setCommentContent] = useState(initialContent); // State for comment content
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // Disable button during API call
  const [isLoading, setIsLoading] = useState(false); // Loading state for visual feedback
  const { showError, showSuccess } = useNotification();
  const user = useAuthStore((state) => state.user);
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

      if (!user) {
        showError("Please login to comment. User not found.");
        return;
      }

      // Make the API call
      const response = await apiPost(
        `/forum/posts/${is_repost ? original_post_id : post_id}/comments/`,
        {
          content: commentContent,
          user_id: user.id,
          parent_comment_id: parent_comment_id,
          is_edit: isEdit,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      //type of setRepliesCount check

      const newComment = {
        content: commentContent,
        date_created: new Date().toISOString(),
        id: isEdit ? parent_comment_id : response.id,
        post_id: post_id,
        is_reply: is_reply,
        parent_comment_id: parent_comment_id,
        user: {
          avatar_url: user?.avatar ? user.avatar : null,
          email: user?.email || "Unknown",
          first_name: user?.first_name || "Unknown",
          id: user?.id || 0,
          last_name: user?.last_name || "Unknown",
        },
      };
      showSuccess(`Comment ${isEdit ? "edited" : "submitted"} successfully`);
      // Reset the comment input
      if (!isEdit) setCommentsCount((prev) => prev + 1); // Increment the comments count

      if (!isEdit) {
        setComments((prev) => [newComment, ...prev]);
      } else {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === parent_comment_id
              ? { ...comment, content: commentContent }
              : comment
          )
        );
      }

      setCommentContent("");
      if (is_reply && typeof setRepliesCount === "function") {
        setRepliesCount((prev) => prev + 1); // Increment the replies count if it's a reply
      }
    } catch (error) {
      console.log("Error submitting comment:", error);
      showError("Failed to submit comment. Please try again.");
    } finally {
      setIsButtonDisabled(false); // Re-enable the button
      setIsLoading(false); // Hide loading spinner
      if (isEdit) {
        setisInputVisible(false); // Hide the input after editing
      }
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
