import Icon from "@/components/atom/Icon/Icon";
import useLikeOptionList from "./useLikeOptionList";

export default function LikeOptionList({ onClick }) {
  const { hoveredIcon, setHoveredIcon, icons } = useLikeOptionList();

  // Create a handler that ensures we pass the correct like type
  const handleIconClick = (likeType) => {
    // If likeType is an event object (e.g., SyntheticBaseEvent),
    // extract the alt text from the clicked element
    if (
      likeType &&
      typeof likeType === "object" &&
      likeType._reactName === "onClick"
    ) {
      // This is a backup measure in case the Icon component passes the event
      console.warn("Received event object instead of like type string");
      return;
    }

    // Otherwise, assume likeType is already a string (from our fixed Icon component)
    if (typeof likeType === "string") {
      onClick(likeType);
    }
  };

  return (
    <div
      className={`flex bg-bg-post rounded-full justify-center items-center ${
        hoveredIcon != null ? "max-h-12" : "max-h-14"
      } `}
    >
      {icons.map((icon, index) => (
        <Icon
          key={index}
          selected={hoveredIcon != null ? hoveredIcon == index : null}
          src={icon.src}
          width={50}
          height={50}
          alt={icon.alt}
          size="xl"
          onMouseEnter={() => setHoveredIcon(index)}
          onMouseLeave={() => setHoveredIcon(null)}
          tooltipText={icon.alt}
          onClick={handleIconClick} // Use our safe handler
        />
      ))}
    </div>
  );
}
