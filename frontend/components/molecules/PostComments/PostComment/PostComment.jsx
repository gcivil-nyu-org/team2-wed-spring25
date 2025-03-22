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
import PostCommentInput from "../../PostCommentInput/PostCommentInput";
import PostComments from "../PostComments";
export default function PostComment({
  parentComment,
  post_id,
  original_post_id,
  is_repost,
}) {
  const {
    isTooltipVisible,
    handleMouseEnter,
    handleMouseLeave,
    throttledHandleOnLikeComment,
    likesCount,
    repliesCount,
    userHasLiked,
    likeType,
    showCommentReply,
    setShowCommentReply,
    showCommentReplyInput,
    setShowCommentReplyInput,
    replies,
    setReplies,
  } = usePostComment(parentComment, post_id, original_post_id, is_repost);

  return (
    <div className="flex mb-5 flex-col">
      <div className="flex flex-1">
        <div className="flex flex-col justify-start ">
          <UserImage
            imageUrl={parentComment.user.avatar_url ?? fallbackUserProfileImage}
            width={32}
            height={32}
          />
        </div>
        <div className="flex-1 flex-col justify-start items-start mx-2">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-sm leading-none">
              {getUserFullName(
                parentComment.user.first_name,
                parentComment.user.last_name
              )}
            </h3>
            <p className="leading-none mt-1 text-xs text-slate-500 font-normal">
              {formatDateAgoShort(parentComment.date_created)}
            </p>
          </div>
          <p className="leading-none text-xs text-slate-500 font-normal">
            Kingslayer • <span>⚡{parentComment.user.user_karma} •</span>
          </p>
          <p className="mt-2 mb-1">{parentComment.content}</p>
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
            <div className="flex items-center">
              <p
                className="p-1 hover:bg-gray-100 rounded-sm text-slate-600 hover:cursor-pointer"
                onClick={() => setShowCommentReplyInput(!showCommentReplyInput)}
              >
                Reply
              </p>
              {repliesCount > 0 && <span className="text-xs">•</span>}
              {repliesCount > 0 && (
                <p
                  className="p-1 rounded-sm text-slate-400 font-semibold hover:cursor-pointer"
                  onClick={() => {
                    setShowCommentReply(!showCommentReply);
                  }}
                >
                  {repliesCount > 1 ? `${repliesCount} Replies` : "1 Reply"}
                </p>
              )}
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
      <div className="ml-8 mt-2">
        {showCommentReplyInput && (
          <PostCommentInput
            post_id={post_id}
            setCommentsCount={() => {}}
            setComments={() => {}}
            is_repost={parentComment.is_repost}
            original_post_id={original_post_id}
            is_reply={true}
            parent_comment_id={parentComment.id}
          />
        )}
        {showCommentReply && (
          <PostComments
            parentComment={parentComment}
            key={parentComment.id}
            post_id={post_id}
            original_post_id={original_post_id}
            is_reply={true}
            parent_comment_id={parentComment.id}
            comments={replies}
            setComments={setReplies}
            is_repost={is_repost}
          />
        )}
      </div>
    </div>
  );
}
