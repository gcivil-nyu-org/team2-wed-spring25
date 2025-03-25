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
    </div>
  );
}
