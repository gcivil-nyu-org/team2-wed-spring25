"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/utils/fetch/fetch";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";

export default function usePostComments(
  post_id,
  comments,
  setComments,
  is_repost,
  original_post_id
) {
  const [isLoading, setIsLoading] = useState(true);
  const { showError } = useNotification(); // Notification context to show error messages
  useEffect(() => {
    const fetchPostComments = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));

        if (!user) {
          showError("Please login to view comments. User not found.");
          return;
        }
        const response = await apiGet(
          `/api/forum/posts/${
            is_repost ? original_post_id : post_id
          }/comments/?user_id=${user.id}`
        );

        // Check if response contains the expected data
        if (!response || !response.comments) {
          showError("Error fetching post comments");
          return;
        }

        setComments(response.comments);
      } catch (error) {
        showError("Error fetching post comments");
        console.error("Error fetching post comments:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPostComments();
  }, []);
  return {
    isLoading,
    comments,
  };
}
