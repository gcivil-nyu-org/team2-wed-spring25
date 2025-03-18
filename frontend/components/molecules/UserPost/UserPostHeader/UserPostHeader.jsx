import UserImage from "@/components/atom/UserImage/UserImage";
import formatDateAgo from "@/utils/datetime";
import { apiDelete, apiPost } from "@/utils/fetch/fetch";
import { getUserFullName } from "@/utils/string";
import throttle from "@/utils/throttle";
import { useState } from "react";

export default function UserPostHeader({
  user_avatar,
  user_fullname,
  date_created,
  post_user_id,
  is_following_author,
}) {
  const [isFollowingAuthor, setIsFollowingAuthor] =
    useState(is_following_author);
  const [isFollowButtonDisabled, setIsFollowButtonDisabled] = useState(false);

  const throttledHandleOnFollow = throttle(async (val) => {
    try {
      setIsFollowButtonDisabled(true);
      setIsFollowingAuthor(val);
      //set timer to 2 seconds
      const user = JSON.parse(localStorage.getItem("user"));
      console.log("user", user);

      const response = await apiPost(
        `/api/forum/posts/follow/${post_user_id}/`,
        {
          user_id: user.id,
          follow: val,
        }
      );
    } catch (e) {
      console.log(e);
    } finally {
    }
  }, 2000);

  return (
    <div className="flex flex-row px-4 pt-4">
      <UserImage imageUrl={user_avatar} width={48} height={48} />
      <div className="flex-1 flex-col justify-start pl-3 leading-none">
        <p className="text-md font-medium ">
          {getUserFullName(user_fullname, "")}
        </p>
        <p className="text-xs font-normal text-gray-500 ">Kingslayer</p>
        <p className="text-xs font-normal text-gray-500 leading-none">
          {formatDateAgo(date_created)}
        </p>
      </div>
      <div className="">
        <div className="">
          <div
            className={`flex items-start text-blue-500 font-semibold hover:bg-blue-100 ${
              !isFollowingAuthor ? "pt-2" : "py-2"
            } px-2 rounded-md hover:cursor-pointer hover:text-blue-800 relative -top-2`}
            onClick={() => {
              if (isFollowButtonDisabled) return;
              throttledHandleOnFollow(!isFollowingAuthor);
            }}
          >
            {!isFollowingAuthor ? (
              <>
                <p className="leading-none text-2xl font-bold relative -top-[5px]">
                  +
                </p>
                <p className="leading-none">Follow</p>
              </>
            ) : (
              <>
                <p className="leading-none">Following</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
