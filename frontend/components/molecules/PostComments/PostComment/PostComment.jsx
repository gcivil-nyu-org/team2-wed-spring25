import Icon from "@/components/atom/Icon/Icon";
import UserImage from "@/components/atom/UserImage/UserImage";
import { fallbackUserProfileImage } from "@/constants/imageUrls";
import { formatDateAgoShort } from "@/utils/datetime";
import { getUserFullName } from "@/utils/string";
import LikeOptionList from "@/components/molecules/LikeOptionList/LikeOptionList";
import icons from "@/constants/icons";
import usePostComment from "./usePostComment";

import {
  getIconSource,
  getLikeTypeColor,
  getGroupHoverTextColor,
} from "@/utils/icons";
export default function PostComment({ comment }) {
  const {
    isTooltipVisible,
    handleMouseEnter,
    handleMouseLeave,
    throttledHandleOnLikeComment,
    likesCount,
    userHasLiked,
    likeType,
  } = usePostComment(comment);

  return (
    <div className="flex mb-5">
      <div className="flex flex-col justify-start ">
        <UserImage
          imageUrl={comment.user.avatar_url ?? fallbackUserProfileImage}
          width={32}
          height={32}
        />
      </div>
      <div className="flex-1 flex-col justify-start items-start mx-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-sm leading-none">
            {getUserFullName(comment.user.first_name, comment.user.last_name)}
          </h3>
          <p className="leading-none mt-1 text-xs text-slate-500 font-normal">
            {formatDateAgoShort(comment.date_created)}
          </p>
        </div>
        <p className="leading-none text-xs text-slate-500 font-normal">
          Kingslayer • <span>⚡{comment.user.user_karma} •</span>
        </p>
        <p className="mt-2 mb-1">{comment.content}</p>
        <div className="flex items-center text-xs text-gray-500 font-semibold relative -left-1">
          <div className="relative flex items-center">
            {isTooltipVisible && (
              <div
                className="absolute -top-[4.9rem] bg-white p-1 rounded-full shadow-md pointer-events-auto"
                onMouseEnter={handleMouseEnter} // Keep tooltip visible when hovering over it
                onMouseLeave={handleMouseLeave} // Hide tooltip after 0.5 seconds when leaving
              >
                <LikeOptionList onClick={throttledHandleOnLikeComment} />
              </div>
            )}
            <p
              className={`p-1 hover:bg-gray-100 rounded-sm hover:cursor-pointer ${getLikeTypeColor(
                userHasLiked,
                likeType
              )} font-semibold group-hover:${getGroupHoverTextColor(
                userHasLiked,
                likeType
              )}`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={() => {
                throttledHandleOnLikeComment("Like");
              }}
            >
              {likeType ?? "Like"}
            </p>
            {likesCount > 0 && <span className="text-xs">•</span>}
            {likesCount > 0 && (
              <Icon
                src={getIconSource(
                  icons[Math.floor(Math.random() * 6)].src,
                  userHasLiked,
                  likeType
                )}
                size={"md"}
                width={16}
                height={16}
                alt={"Like"}
              />
            )}
            {likesCount > 0 && <p className="pr-1">{likesCount}</p>}
          </div>
          <p className="mx-1 font-thin">|</p>
          <div>
            <p className="p-1 hover:bg-gray-100 rounded-sm hover:cursor-pointer">
              Reply
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-start items-center relative bottom-1">
        <Icon
          src={"/icons/more-options.svg"}
          size={"md"}
          width={30}
          height={30}
          alt={"..."}
        />
      </div>
    </div>
  );
}
