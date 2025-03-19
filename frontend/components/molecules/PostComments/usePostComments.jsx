import { useEffect, useState } from "react";
import { apiGet } from "@/utils/fetch/fetch";

export default function usePostComments(
  post_id,
  comments,
  setComments,
  is_repost,
  original_post_id
) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPostComments = async () => {
      try {
        const response = await apiGet(
          `/api/forum/posts/${is_repost ? original_post_id : post_id}/comments/`
        );
        console.log("response", response);

        // Check if response contains the expected data
        if (!response || !response.comments) {
          console.log("Failed to fetch comments");
          return;
        }

        setComments(response.comments);
      } catch (error) {
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
