import icons from "@/constants/icons";

const getIconSource = (src, user_has_liked, like_type) => {
  if (user_has_liked) {
    const icon = icons.find((icon) => icon.alt === like_type);
    return icon ? icon.src : src;
  }
  return src;
};

const getGroupHoverTextColor = (user_has_liked, like_type) => {
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

const getLikeTypeColor = (user_has_liked, like_type) => {
  //log before each return
  if (!user_has_liked) {
    console.log("text-slate-600");

    return "text-slate-600";
  }
  switch (like_type) {
    case "Like":
      console.log("text-blue-600");
      return "text-blue-600";
    case "Clap":
      console.log("text-green-600");
      return "text-green-600";
    case "Support":
      console.log("text-purple-600");
      return "text-purple-600";
    case "Heart":
      console.log("text-red-600");
      return "text-red-600";
    case "Bulb":
      console.log("text-yellow-600");
      return "text-yellow-600";
    case "Laugh":
      console.log("text-sky-600");
      return "text-sky-600";
    default:
      console.log("text-slate-600");
      return "text-slate-600";
  }
};

export { getIconSource, getGroupHoverTextColor, getLikeTypeColor };
