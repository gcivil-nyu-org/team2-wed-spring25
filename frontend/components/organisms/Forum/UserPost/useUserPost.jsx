"use client";
import { useState } from "react";

export default function useUserPost(likes_count, comments_count) {
  const [likesCount, setLikesCount] = useState(likes_count);
  const [commentsCount, setCommentsCount] = useState(comments_count);

  return {
    likesCount,
    setLikesCount,
    commentsCount,
    setCommentsCount,
  };
}
