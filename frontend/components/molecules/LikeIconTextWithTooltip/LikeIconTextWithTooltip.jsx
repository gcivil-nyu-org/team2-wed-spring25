import IconText from "@/components/molecules/IconText/IconText";
import LikeOptionList from "@/components/molecules/LikeOptionList/LikeOptionList";
import useLikeIconTextWithTooltip from "./useLikeIconTextWithTooltip";

export default function LikeIconTextWithTooltip({
  iconData,
  post_id,
  user_has_liked,
  like_type,
}) {
  const {
    isTooltipVisible,
    handleMouseEnter,
    handleMouseLeave,
    isLiked,
    setIsLiked,
    debouncedHandleOnLike,
  } = useLikeIconTextWithTooltip(post_id, user_has_liked, like_type);

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
        user_has_liked={user_has_liked} // Pass the liked state to IconText
        like_type={like_type} // Pass the like type to IconText
        onClick={() => {
          debouncedHandleOnLike("Like"); // Handle like action
        }} // Handle like action
      />

      {/* Tooltip Div */}
      {isTooltipVisible && (
        <div
          className="absolute -top-20 bg-white p-1 rounded-full shadow-md pointer-events-auto"
          onMouseEnter={handleMouseEnter} // Keep tooltip visible when hovering over it
          onMouseLeave={handleMouseLeave} // Hide tooltip after 0.5 seconds when leaving
        >
          <LikeOptionList onClick={debouncedHandleOnLike} />
        </div>
      )}
    </div>
  );
}
