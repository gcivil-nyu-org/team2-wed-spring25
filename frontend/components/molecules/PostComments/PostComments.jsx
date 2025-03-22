import Loader from "@/components/molecules/Loader/Loader";
import PostComment from "@/components/molecules/PostComments/PostComment/PostComment";
import usePostComments from "@/components/molecules/PostComments/usePostComments";

export default function PostComments({
  post_id,
  comments,
  setComments,
  is_repost,
  original_post_id,
  is_reply = false,
  parent_comment_id = null,
  level = 1,
}) {
  const { isLoading, hasMore, loadMoreComments } = usePostComments(
    post_id,
    comments,
    setComments,
    is_repost,
    original_post_id,
    is_reply,
    parent_comment_id
  );

  return (
    <div className="flex flex-col mx-1 mb-2 ">
      {(!isLoading || comments.length > 0) &&
        comments.map((comment) => {
          return (
            <PostComment
              parentComment={comment}
              key={comment.id}
              post_id={post_id}
              original_post_id={original_post_id}
              is_repost={is_repost}
              level={level}
            />
          );
        })}
      {isLoading && <Loader />}
      {hasMore && !isLoading && (
        <p
          onClick={loadMoreComments}
          className="cursor-pointer text-purple-500 hover:text-purple-800"
        >
          Load More
        </p>
      )}
    </div>
  );
}
