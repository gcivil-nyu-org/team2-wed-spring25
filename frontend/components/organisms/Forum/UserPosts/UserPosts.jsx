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

      {/* Always render the loader div, but hide it if there are no more posts */}
      <div
        ref={loaderRef}
        className={`flex justify-center items-center h-[25vh] ${
          hasMore ? "visible" : "hidden"
        }`}
      >
        {isLoadingMore && <Loader />}
      </div>
      {!hasMore && (
        <p className="text-center text-gray-500 text-lg mt-8 mb-10">
          No more posts to show
        </p>
      )}
    </div>
  );
}
