import icons from "@/constants/icons";

const getIconSource = (src, user_has_liked, like_type) => {
  if (user_has_liked) {
    const icon = icons.find((icon) => icon.alt === like_type);
    return icon ? icon.src : src;
  }
  return src;
};

const getGroupHoverTextColor = (user_has_liked, like_type, theme = null) => {
  if (theme && theme === "red") {
    return "text-red-900";
  }
  if (!user_has_liked) {
    return "text-forum-heading";
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
      return "text-forum-heading";
  }
};

const getLikeTypeColor = (user_has_liked, like_type, theme = null) => {
  if (theme && theme === "red") {
    return "text-red-600";
  }
  if (!user_has_liked) {
    return "text-forum-heading2";
  }
  switch (like_type) {
    case "Like":
      return "text-blue-400";
    case "Clap":
      return "text-green-400";
    case "Support":
      return "text-purple-400";
    case "Heart":
      return "text-red-400";
    case "Bulb":
      return "text-yellow-400";
    case "Laugh":
      return "text-sky-400";
    default:
      return "text-forum-heading2";
  }
};

export { getIconSource, getGroupHoverTextColor, getLikeTypeColor };
