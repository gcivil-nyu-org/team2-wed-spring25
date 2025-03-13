import Icon from "@/components/atom/Icon/Icon";
import useLikeOptionList from "./useLikeOptionList";

export default function LikeOptionList() {
    const {
        hoveredIcon,
        setHoveredIcon,
        icons
    } = useLikeOptionList(); // Custom hook to manage state and icons

    return (
        <div className={`flex justify-center items-center ${hoveredIcon != null ? "max-h-12" : "max-h-14"} `}>
            {icons.map((icon, index) => (
                <Icon
                    key={index}
                    selected={hoveredIcon != null ? hoveredIcon == index : null} // Highlight the hovered icon
                    src={icon.src}
                    width={50}
                    height={50}
                    alt={icon.alt}
                    size="xl"
                    onMouseEnter={() => setHoveredIcon(index)} // Set hovered icon
                    onMouseLeave={() => setHoveredIcon(null)} // Reset hovered icon
                    tooltipText={icon.alt} // Tooltip text
                />
            ))}
        </div>
    );
}