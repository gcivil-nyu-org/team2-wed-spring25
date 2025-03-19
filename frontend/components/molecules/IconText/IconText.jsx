import Image from "next/image";
import useIconText from "./useIconText";
import {
  getLikeTypeColor,
  getIconSource,
  getGroupHoverTextColor,
} from "@/utils/icons";
export default function IconText({
  src,
  width,
  height,
  alt,
  text,
  onClick = null,
  user_has_liked = false,
  like_type = null,
}) {
  const { data } = useIconText();
  return (
    <div
      className="flex flex-1 p-2 my-3 mx-1 space-x-1 justify-center items-center rounded-md hover:bg-slate-100 hover:cursor-pointer"
      onClick={onClick}
    >
      <div className={data}>
        <Image
          src={getIconSource(src, user_has_liked, like_type)}
          width={user_has_liked ? 16 : width}
          height={user_has_liked ? 16 : height}
          alt={alt}
          className="object-fill "
        />
      </div>
      <p
        className={`${getLikeTypeColor()} text-sm font-semibold group-hover:${getGroupHoverTextColor()}`}
      >
        {user_has_liked ? like_type : text}
      </p>
    </div>
  );
}
