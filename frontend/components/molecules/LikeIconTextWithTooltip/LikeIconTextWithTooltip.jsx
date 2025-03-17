import IconText from "@/components/molecules/IconText/IconText";
import LikeOptionList from "@/components/molecules/LikeOptionList/LikeOptionList";
import useLikeIconTextWithTooltip from "./useLikeIconTextWithTooltip";

export default function LikeIconTextWithTooltip({ iconData, post_id }) {
  const {
    isTooltipVisible,
    handleMouseEnter,
    handleMouseLeave,
    isLiked,
    setIsLiked,
    handleOnLike,
  } = useLikeIconTextWithTooltip(post_id);

  return (
    <div
      className="flex-1 relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleOnLike}
    >
      {/* IconText Component */}
      <IconText
        src={iconData.src}
        width={iconData.width}
        height={iconData.height}
        alt={iconData.alt}
        text={iconData.text}
      />

      {/* Tooltip Div */}
      {isTooltipVisible && (
        <div
          className="absolute -top-20 bg-white p-1 rounded-full shadow-md pointer-events-auto"
          onMouseEnter={handleMouseEnter} // Keep tooltip visible when hovering over it
          onMouseLeave={handleMouseLeave} // Hide tooltip after 0.5 seconds when leaving
        >
          <LikeOptionList />
        </div>
      )}
    </div>
  );
}
