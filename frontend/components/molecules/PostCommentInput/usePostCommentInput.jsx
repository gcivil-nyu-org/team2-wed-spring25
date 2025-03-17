import { useEmojiPicker } from "@/hooks/useEmojiPicker";
import { useState } from "react";
import { apiPost } from "@/utils/fetch/fetch";
export default function usePostCommentInput(post_id) {
  const {
    emojiPickerRef,
    showEmojiPicker,
    handleClickOnEmojiPicker,
    handleOnEmojiClick,
  } = useEmojiPicker();
  const [commentContent, setCommentContent] = useState("");
  const handleCommentSubmit = async () => {
    if (commentContent.trim() === "" && !selectedImage) {
      alert("Please enter a comment, cannot be empty.");
      return;
    }
    // Check if the comment content exceeds the character limit
    if (commentContent.length > 400) {
      alert("Comment content exceeds the character limit of 400 characters.");
      return;
    }
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

      await apiPost(
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
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setCommentContent("");
    }

    // Reset states
  };
  return {
    handleCommentSubmit,
    commentContent,
    setCommentContent,
    emojiPickerRef,
    showEmojiPicker,
    handleClickOnEmojiPicker,
    handleOnEmojiClick,
  };
}
