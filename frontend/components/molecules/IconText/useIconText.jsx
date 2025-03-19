import icons from "@/constants/icons";

export default function useIconText(user_has_liked, like_type) {
  const getLikeTypeColor = () => {
    if (!user_has_liked) {
      return "text-slate-600";
    }
    switch (like_type) {
      case "Like":
        return "text-blue-600";
      case "Clap":
        return "text-green-600";
      case "Support":
        return "text-purple-600";
      case "Heart":
        return "text-red-600";
      case "Bulb":
        return "text-yellow-600";
      case "Laugh":
        return "text-sky-600";
      default:
        return "text-slate-600";
    }
  };
  const getIconSource = (src, user_has_liked, like_type) => {
    if (user_has_liked) {
      const icon = icons.find((icon) => icon.alt === like_type);
      return icon ? icon.src : src;
    }
    return src;
  };

  const getGroupHoverTextColor = () => {
    if (!user_has_liked) {
      return "text-slate-900";
    }
    switch (like_type) {
      case "Like":
        return "text-blue-900";
      case "Clap":
        return "text-green-900";
      case "Support":
        return "text-purple-900";
      case "Heart":
        return "text-red-900";
      case "Bulb":
        return "text-yellow-900";
      case "Laugh":
        return "text-sky-900";
      default:
        return "text-slate-900";
    }
  };
  const data = `w-15 h-15`;

  return { getLikeTypeColor, getIconSource, getGroupHoverTextColor, data };
}
