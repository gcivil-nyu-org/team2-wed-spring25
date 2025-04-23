"use client";
import { getUserFullName } from "@/utils/string";
import UserImage from "@/components/atom/UserImage/UserImage";
import Image from "next/image";
import { fallbackUserProfileImage } from "@/constants/imageUrls";

export default function UserData({
  isLoading,
  user,
  userHeading,
  isUserDataCardLoading,
  userSideCardData,
}) {
  return (
    <div className="text-text-forum-heading w-full ">
      <div className="relative  rounded-lg max-h-[270px] pb-4 w-full bg-bg-post">
        <div className="h-[58px] absolute left-0 top-0 w-full bg-purple-300 rounded-t-lg">
          <Image
            src={"/topography.svg"}
            alt="Community Image"
            width={225}
            height={230}
            className="object-cover h-full w-full rounded-t-xl"
          />
        </div>
        <div className="w-full pt-7 pl-4 pr-6 border-dark">
          {/* Conditional rendering: Skeleton or actual content */}
          {isLoading ? (
            // Skeleton Loader (gradient shimmer)
            <div className="animate-pulse">
              {/* Profile image placeholder */}
              <div className="relative inline-block justify-start bg-gray-600 rounded-full p-[1.5px]">
                <div className="w-[70px] h-[70px] rounded-full bg-gray-700" />
              </div>

              {/* Text placeholders (shimmer effect) */}
              <div className="mt-3 space-y-2 w-full">
                <div className="h-6 w-3/4 bg-gray-600 rounded" />
                <div className="h-4 w-1/2 bg-gray-600 rounded" />
                <div className="h-4 w-2/3 bg-gray-600 rounded" />
              </div>
            </div>
          ) : (
            // Actual content when loaded
            <>
              <div className="relative inline-block justify-start bg-white rounded-full p-[1.5px]">
                <UserImage
                  imageUrl={
                    user?.avatar ? user.avatar : fallbackUserProfileImage
                  }
                  width={70}
                  height={70}
                />
              </div>
              <h3 className="text-xl font-semibold text-forum-heading">
                {getUserFullName(user?.first_name, user?.last_name).length > 14
                  ? getUserFullName(
                      user?.first_name,
                      user?.last_name
                    ).substring(0, 14) + ".."
                  : getUserFullName(user?.first_name, user?.last_name)}
              </h3>
              <p className="text-xs font-medium pt-1 text-forum-subheading">
                {userHeading}
              </p>
              <p className="text-xs font-medium text-forum-subheading2 pt-1">
                {"Brooklyn, New York"}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col bg-bg-post w-full mt-4 rounded-lg p-4 text-xs font-semibold text-forum-subheading border-dark">
        {isUserDataCardLoading || isLoading ? (
          <div className="animate-pulse space-y-2 w-full">
            <div className="h-5 w-full bg-gray-600 rounded"></div>
            <div className="h-5 w-full bg-gray-600 rounded"></div>
            <div className="h-5 w-full bg-gray-600 rounded"></div>
            <div className="h-5 w-full bg-gray-600 rounded"></div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
