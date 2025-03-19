import UserImage from "@/components/atom/UserImage/UserImage";
import formatDateAgo from "@/utils/datetime";
import { apiPost } from "@/utils/fetch/fetch";
import { getUserFullName } from "@/utils/string";
import throttle from "@/utils/throttle";
import { useState } from "react";

export default function UserPostHeader({
  user_avatar,
  user_fullname,
  date_created,
  post_user_id,
  is_following_author,
  setPosts,
}) {
  const [isFollowButtonDisabled, setIsFollowButtonDisabled] = useState(false);

  const throttledHandleOnFollow = throttle(async (val) => {
    try {
      setIsFollowButtonDisabled(true);
      setPosts((prev) => {
        return prev.map((post) => {
          console.log(
            "post.user_id === post_user_id",
            post.user_id === post_user_id
          );
          console.log("val", val);
          if (post.user_id === post_user_id) {
            return { ...post, is_following_author: val };
          }
          return post;
        });
      });
      const user = JSON.parse(localStorage.getItem("user"));

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
      setIsFollowButtonDisabled(false);
    }
  }, 2000);

  return (
    <div className="flex flex-row px-4 pt-3">
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
              !is_following_author ? "pt-2" : "py-2"
            } px-2 rounded-md hover:cursor-pointer hover:text-blue-800 relative -top-2`}
            onClick={() => {
              if (isFollowButtonDisabled) return;
              throttledHandleOnFollow(!is_following_author);
            }}
          >
            {!is_following_author ? (
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
