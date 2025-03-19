"use client";
import UserPost from "@/components/organisms/Forum/UserPost";
import UserImage from "@/components/atom/UserImage/UserImage";
import PostDialog from "@/components/organisms/PostDialog/PostDialog";
import useForum from "./useForum";
import Loader from "@/components/molecules/Loader/Loader";
import { fallbackUserProfileImage } from "@/constants/imageUrls";
export default function ForumsPage() {
  const {
    isLoading,
    isLoadingMore,
    isOpen,
    userPosts,
    handleClick,
    user,
    setUserPosts,
    hasMore,
    loaderRef,
  } = useForum();
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }
  return (
    <div className="flex flex-row justify-center items-start h-screen my-4">
      <div className="w-1/6 flex flex-col justify-center items-center bg-white rounded-sm h-1/2">
        <h1>User Data</h1>
      </div>
      <div className="w-2/5 flex flex-col mx-4 h-screen">
        {isOpen && (
          <PostDialog
            onClick={handleClick}
            setPosts={setUserPosts}
            posts_count={userPosts.length}
          />
        )}
        <div className="felx flex-col rounded-lg bg-white mb-4 border-[1px]">
          <div className="flex flex-row pl-4 py-3">
            <UserImage
              imageUrl={user.avatar ?? fallbackUserProfileImage}
              width={48}
              height={48}
            />
            <div
              onClick={handleClick}
              className="group flex flex-row items-center w-full border-gray-400 border-[1px] mx-3 rounded-3xl hover:bg-gray-100 hover:cursor-pointer"
            >
              <p className="ml-4 text-slate-600 text-sm font-bold group-hover:text-slate-900 ">
                Start a post
              </p>
            </div>
          </div>
        </div>
        <div>
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
        </div>
      </div>
      <div className="w-1/6 flex flex-col justify-center items-center bg-white rounded-sm h-1/2">
        <h1>Useful Links</h1>
      </div>
    </div>
  );
}
