import Loader from "@/components/molecules/Loader/Loader";
import UserPost from "../UserPost/UserPost";

export default function UserPosts({
  userPosts,
  setUserPosts,
  hasMore,
  loaderRef,
  isLoadingMore,
}) {
  return (
    <div>
      {userPosts.map((post) => (
        <UserPost key={post.id} post={post} setPosts={setUserPosts} />
      ))}
    </div>
  );
}
