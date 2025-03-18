import { useState } from "react";

export default function useUserPostCommentSection() {
  const [comments, setComments] = useState([]);
  return {
    comments,
    setComments,
  };
}
