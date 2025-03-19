import Loader from "@/components/molecules/Loader/Loader";
import PostComment from "@/components/molecules/PostComments/PostComment/PostComment";
import usePostComments from "@/components/molecules/PostComments/usePostComments";

export default function PostComments({
  post_id,
  comments,
  setComments,
  is_repost,
  original_post_id,
}) {
  const { isLoading } = usePostComments(
    post_id,
    comments,
    setComments,
    is_repost,
    original_post_id
  );
  return (
    <div className="flex flex-col mx-1 mt-4 mb-2">
      {isLoading && <Loader />}
      {!isLoading &&
        comments.map((comment) => {
          return <PostComment comment={comment} key={comment.id} />;
        })}
    </div>
  );
}
