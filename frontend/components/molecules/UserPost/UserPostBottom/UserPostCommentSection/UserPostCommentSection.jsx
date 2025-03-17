import PostCommentInput from "@/components/molecules/PostCommentInput/PostCommentInput";
import PostComments from "@/components/molecules/PostComments/PostComments";

export default function UserPostCommentSection({ post_id }) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <PostCommentInput post_id={post_id} />
        <PostComments post_id={post_id} />
      </div>
    </div>
  );
}
