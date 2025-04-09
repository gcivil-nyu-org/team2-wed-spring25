"use client";
import UserImage from "@/components/atom/UserImage/UserImage";
import PostDialog from "@/components/organisms/PostDialog/PostDialog";
import { fallbackUserProfileImage } from "@/constants/imageUrls";

export default function PostInput({
  isOpen,
  handleClick,
  userPosts,
  setUserPosts,
  user,
}) {
  return (
    <div>
      {isOpen && (
        <PostDialog
          onClick={handleClick}
          setPosts={setUserPosts}
          posts_count={userPosts.length}
        />
      )}
      <div className="flex flex-col rounded-lg bg-bg-post mb-4 border-dark">
        <div className="flex flex-row pl-4 py-3">
          <UserImage
            imageUrl={user?.avatar ? user.avatar : fallbackUserProfileImage}
            width={48}
            height={48}
          />
          <div
            onClick={handleClick}
            className="group flex flex-row items-center w-full border-light mx-3 hover:bg-bg-forum hover:bg-opacity-50 rounded-3xl hover:cursor-pointer"
          >
            <p className="ml-4 text-forum-heading2 text-sm font-semibold group-hover:text-white ">
              Start a post
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
