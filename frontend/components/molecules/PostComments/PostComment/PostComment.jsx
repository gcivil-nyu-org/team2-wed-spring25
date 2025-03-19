import Icon from "@/components/atom/Icon/Icon";
import UserImage from "@/components/atom/UserImage/UserImage";
import { fallbackUserProfileImage } from "@/constants/imageUrls";
import { formatDateAgoShort } from "@/utils/datetime";
import { getUserFullName } from "@/utils/string";

export default function PostComment({ comment }) {
  return (
    <div className="flex mb-5">
      <div className="flex flex-col justify-start ">
        <UserImage
          imageUrl={comment.user.avatar_url ?? fallbackUserProfileImage}
          width={32}
          height={32}
        />
      </div>
      <div className="flex-1 flex-col justify-start items-start mx-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-sm leading-none">
            {getUserFullName(comment.user.first_name, comment.user.last_name)}
          </h3>
          <p className="leading-none mt-1 text-xs text-slate-500 font-normal">
            {formatDateAgoShort(comment.date_created)}
          </p>
        </div>
        <p className="leading-none text-xs text-slate-500 font-normal">
          {"Kingslayer"}
        </p>
        <p className="mt-2 mb-1">{comment.content}</p>
        <div className="flex items-center text-xs text-gray-500 font-semibold relative -left-1">
          <p className="p-1 hover:bg-gray-100 rounded-sm hover:cursor-pointer">
            Like
          </p>
          <p className="mx-1 font-thin">|</p>
          <p className="p-1 hover:bg-gray-100 rounded-sm hover:cursor-pointer">
            Reply
          </p>
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
  );
}
