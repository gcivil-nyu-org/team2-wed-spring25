"use client";
import UserPost from "@/components/organisms/Forum/UserPost";
import UserImage from "@/components/atom/UserImage/UserImage";
import PostDialog from "@/components/organisms/PostDialog/PostDialog";
import useForum from "./useForum";
import Loader from "@/components/molecules/Loader/Loader";
import { fallbackUserProfileImage } from "@/constants/imageUrls";
import Image from "next/image";
import { getUserFullName } from "@/utils/string";
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
    userHeading,
    isUserDataCardLoading,
    userSideCardData,
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
      <div className="flex-col hidden  xsm:flex lg:w-2/6 xl:flex xl:flex-col xl:items-center max-w-[225px]">
        <div className="relative bg-white  rounded-lg max-h-[210px] pb-4 w-full">
          <div className="h-[58px] absolute left-0 top-0 w-full bg-purple-300 rounded-t-lg">
            <Image
              src={"/topography.svg"}
              alt="Community Image"
              width={225}
              height={230}
              className="object-cover h-full w-full rounded-t-xl"
            />
          </div>
          <div className="w-full pt-7 pl-4 pr-6">
            <div className="relative inline-block justify-start bg-white rounded-full p-[2px]">
              <UserImage
                imageUrl={user.avatar ?? fallbackUserProfileImage}
                width={70}
                height={70}
              />
            </div>
            <h3 className="text-xl font-semibold">
              {/* take 18 characters of the name */}
              {getUserFullName(user.first_name, user.last_name).length > 14
                ? getUserFullName(user.first_name, user.last_name).substring(
                    0,
                    14
                  ) + ".."
                : getUserFullName(user.first_name, user.last_name)}
            </h3>
            {/* show random heading */}
            <p className="text-xs font-medium pt-1">{userHeading}</p>
            <p className="text-xs font-medium text-slate-500 pt-1">
              {"Brooklyn, New York"}
            </p>
          </div>
        </div>
        <div className="flex flex-col bg-white w-full mt-4 rounded-lg p-4 text-xs font-semibold text-gray-700">
          {isUserDataCardLoading ?? <Loader />}
          <div className="flex justify-between mt-1">
            <p>Saved Routes</p>
            <p>{userSideCardData.total_saved_routes}</p>
          </div>
          <div className="flex justify-between mt-1">
            <p>Total Posts</p>
            <p>{userSideCardData.total_posts}</p>
          </div>
          <div className="flex justify-between mt-1">
            <p>Followers</p>
            <p>{userSideCardData.total_followers}</p>
          </div>
          <div className="flex justify-between mt-1">
            <p>Karma</p>
            <p>{userSideCardData.user_karma}</p>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-4/6 xl:2/5 flex flex-col md:mx-2 lg:mx-4 h-screen max-w-[555px]">
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
      <div className="bg-white rounded-sm h-1/2 hidden xlg:flex xlg:flex-col xlg:justify-center xlg:items-center w-[225px] max-w-[225px] max-h-[210px]">
        <h1>Useful Links</h1>
      </div>
    </div>
  );
}
