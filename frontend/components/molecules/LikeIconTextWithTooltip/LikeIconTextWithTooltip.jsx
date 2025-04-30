"use client";
import IconText from "@/components/molecules/IconText/IconText";
import LikeOptionList from "@/components/molecules/LikeOptionList/LikeOptionList";
import useLikeIconTextWithTooltip from "./useLikeIconTextWithTooltip";

export default function LikeIconTextWithTooltip({
  iconData,
  post_id,
  userHasLiked,
  setUserHasLiked,
  likeType,
  setLikeType,
  setLikesCount,
  is_repost,
  original_post_id,
  showIcon = true,
}) {
  const {
    isTooltipVisible,
    handleMouseEnter,
    handleMouseLeave,
    throttledHandleOnLike,
  } = useLikeIconTextWithTooltip(
    post_id,
    userHasLiked,
    likeType,
    setUserHasLiked,
    setLikeType,
    setLikesCount,
    is_repost,
    original_post_id
  );

  return (
    <div
      className="flex-1 relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* IconText Component */}
      <IconText
        src={iconData.src}
        width={iconData.width}
        height={iconData.height}
        alt={iconData.alt}
        text={iconData.text}
        user_has_liked={userHasLiked} // Pass the liked state to IconText
        like_type={likeType} // Pass the like type to IconText
        onClick={() => {
          throttledHandleOnLike("Like"); // Handle like action
        }} // Handle like action
      />

      {/* Tooltip Div */}
      {isTooltipVisible && (
        <div
          className="absolute -top-20 bg-bg-post p-1 rounded-full shadow-md pointer-events-auto border border-gray-500 -left-12 sm:left-0"
          onMouseEnter={handleMouseEnter} // Keep tooltip visible when hovering over it
          onMouseLeave={handleMouseLeave} // Hide tooltip after 0.5 seconds when leaving
        >
          <LikeOptionList onClick={throttledHandleOnLike} />
        </div>
      )}
    </div>
  );
}
