import PostCommentInput from "@/components/molecules/PostCommentInput/PostCommentInput";
import PostComments from "@/components/molecules/PostComments/PostComments";
import useUserPostCommentSection from "@/components/molecules/UserPost/UserPostBottom/UserPostCommentSection/useUserPostCommentSection";

export default function UserPostCommentSection({ post_id, setCommentsCount }) {
  const { comments, setComments } = useUserPostCommentSection();

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <PostCommentInput
          post_id={post_id}
          setCommentsCount={setCommentsCount}
          setComments={setComments}
        />
        <PostComments
          post_id={post_id}
          comments={comments}
          setComments={setComments}
        />
      </div>
    </div>
  );
}
