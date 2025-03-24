import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiDelete } from "@/utils/fetch/fetch";
import { useState } from "react";

export default function usePostCommentOptionList(
  post_id,
  comment_id,
  setComments,
  setCommentsCount
) {
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false);
  const [disableButtons, setDisableButtons] = useState(false);
  const { showError, showSuccess } = useNotification();

  const handleCommentDelete = async () => {
    try {
      if (disableButtons) return;
      setDisableButtons(true);
      // Call the API to delete the comment
      const response = await apiDelete(
        `/api/forum/posts/${post_id}/comments/${comment_id}/delete/`
      );
      // Update the comments state in the parent component
      setComments((prevComments) =>
        prevComments.filter((comment) => comment.id !== comment_id)
      );
      setCommentsCount((prevCount) => prevCount - response.total_deleted); // Decrement the comments count
      showSuccess("Comment deleted successfully");

      // Optionally, you can also close the dropdown
    } catch (error) {
      showError("Error deleting comment");
      console.log("Error deleting comment:", error);
    } finally {
      setShowDeleteCommentDialog(false); // Close the dropdown after deletion
      setDisableButtons(false);
    }
  };

  return {
    showDeleteCommentDialog,
    setShowDeleteCommentDialog,
    disableButtons,
    handleCommentDelete,
  };
}
