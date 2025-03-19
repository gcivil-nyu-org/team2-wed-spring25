import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiPost } from "@/utils/fetch/fetch";
import throttle from "@/utils/throttle";
import { useState } from "react";

export default function useUserPostHeader(post_user_id, setPosts) {
  const [isFollowButtonDisabled, setIsFollowButtonDisabled] = useState(false);
  const { showError } = useNotification();
  const throttledHandleOnFollow = throttle(async (val) => {
    try {
      setIsFollowButtonDisabled(true);
      setPosts((prev) => {
        return prev.map((post) => {
          if (post.user_id === post_user_id) {
            return { ...post, is_following_author: val };
          }
          return post;
        });
      });
      const user = JSON.parse(localStorage.getItem("user"));
      await apiPost(`/api/forum/posts/follow/${post_user_id}/`, {
        user_id: user.id,
        follow: val,
      });
    } catch (e) {
      showError("Error following user");
      console.log(e);
    } finally {
      setIsFollowButtonDisabled(false);
    }
  }, 2000);

  return {
    isFollowButtonDisabled,
    throttledHandleOnFollow,
  };
}
