import { getUserFullName } from "@/utils/string";
import Loader from "../Loader/Loader";
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
    <div className="text-text-forum-heading">
      <div className="relative  rounded-lg max-h-[210px] pb-4 w-full bg-bg-post">
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
          <div className="relative inline-block justify-start bg-white rounded-full p-[1.5px]">
            <UserImage
              imageUrl={user.avatar ?? fallbackUserProfileImage}
              width={70}
              height={70}
            />
          </div>
          <h3 className="text-xl font-semibold text-forum-heading">
            {/* take 18 characters of the name */}
            {getUserFullName(user.first_name, user.last_name).length > 14
              ? getUserFullName(user.first_name, user.last_name).substring(
                  0,
                  14
                ) + ".."
              : getUserFullName(user.first_name, user.last_name)}
          </h3>
          {/* show random heading */}
          <p className="text-xs font-medium pt-1 text-forum-subheading">
            {userHeading}
          </p>
          <p className="text-xs font-medium text-forum-subheading2 pt-1">
            {"Brooklyn, New York"}
          </p>
        </div>
      </div>
      <div className="flex flex-col bg-bg-post w-full mt-4 rounded-lg p-4 text-xs font-semibold text-forum-subheading border-dark">
        {isUserDataCardLoading ?? <Loader />}
        <div className="flex justify-between mt-1">
          <p>Saved Routes</p>
          <p>{userSideCardData?.total_saved_routes}</p>
          {!isLoading ? (
            <p>{userSideCardData.total_saved_routes}</p>
          ) : (
            <p>...</p>
          )}
        </div>
        <div className="flex justify-between mt-1">
          <p>Total Posts</p>
          {!isLoading ? <p>{userSideCardData.total_posts}</p> : <p>...</p>}
        </div>
        <div className="flex justify-between mt-1">
          <p>Followers</p>
          {!isLoading ? <p>{userSideCardData.total_followers}</p> : <p>...</p>}
        </div>
        <div className="flex justify-between mt-1">
          <p>Karma</p>
          {!isLoading ? <p>{userSideCardData.user_karma}</p> : <p>...</p>}
        </div>
      </div>
    </div>
  );
}
