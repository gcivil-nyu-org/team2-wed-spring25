import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiGet } from "@/utils/fetch/fetch";
import { useState, useEffect } from "react";

export default function usePostComments(
  post_id,
  comments,
  setComments,
  is_repost,
  original_post_id,
  is_reply,
  parent_comment_id
) {
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1); // Track the current page
  const [hasMore, setHasMore] = useState(true); // Track if more comments are available
  const { showError } = useNotification(); // Notification context to show error messages

  const fetchPostComments = async (page = 1) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user) {
        showError("Please login to view comments. User not found.");
        return;
      }

      const response = await apiGet(
        `/api/forum/posts/${
          is_repost ? original_post_id : post_id
        }/comments/?user_id=${user.id}&parent_comment_id=${
          is_reply ? parent_comment_id : 0
        }&page=${page}&limit=5` // Add pagination parameters
      );

      // Check if response contains the expected data
      if (!response || !response.comments) {
        showError("Error fetching post comments");
        return;
      }

      // If it's the first page, replace the comments
      // Otherwise, append the new comments to the existing list
      setComments((prevComments) =>
        page === 1 ? response.comments : [...prevComments, ...response.comments]
      );

      // Update hasMore based on the response
      setHasMore(response.comments.length == 5);
    } catch (error) {
      showError("Error fetching post comments");
      console.error("Error fetching post comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to load more comments
  const loadMoreComments = () => {
    if (hasMore) {
      setIsLoading(true);
      setPage((prevPage) => prevPage + 1);
      fetchPostComments(page + 1);
    }
  };

  useEffect(() => {
    fetchPostComments(page);
  }, []);

  return {
    isLoading,
    comments,
    hasMore,
    loadMoreComments,
  };
}

// "use client";

// import { useEffect, useState } from "react";
// import { apiGet } from "@/utils/fetch/fetch";
// import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";

// export default function usePostComments(
//   post_id,
//   comments,
//   setComments,
//   is_repost,
//   original_post_id,
//   is_reply,
//   parent_comment_id
// ) {
//   const [isLoading, setIsLoading] = useState(true);
//   const { showError } = useNotification(); // Notification context to show error messages

//   const fetchPostComments = async () => {
//     try {
//       const user = JSON.parse(localStorage.getItem("user"));

//       if (!user) {
//         showError("Please login to view comments. User not found.");
//         return;
//       }
//       const response = await apiGet(
//         `/api/forum/posts/${
//           is_repost ? original_post_id : post_id
//         }/comments/?user_id=${user.id}&parent_comment_id=${
//           is_reply ? parent_comment_id : 0
//         }` // Adjusted to include parent_comment_id
//       );

//       // Check if response contains the expected data
//       if (!response || !response.comments) {
//         showError("Error fetching post comments");
//         return;
//       }

//       setComments(response.comments);
//     } catch (error) {
//       showError("Error fetching post comments");
//       console.error("Error fetching post comments:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPostComments();
//   }, []);
//   return {
//     isLoading,
//     comments,
//   };
// }
