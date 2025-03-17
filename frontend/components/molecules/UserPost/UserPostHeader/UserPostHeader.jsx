import Button from "@/components/atom/Button/Button";
import Icon from "@/components/atom/Icon/Icon";
import UserImage from "@/components/atom/UserImage/UserImage";
import formatDateAgo from "@/utils/datetime";
import Image from "next/image";

export default function UserPostHeader({
  user_avatar,
  user_fullname,
  date_created,
}) {
  return (
    <div className="flex flex-row px-4 pt-4">
      <UserImage imageUrl={user_avatar} width={48} height={48} />
      <div className="flex-1 flex-col justify-start pl-3 leading-none">
        <p className="text-md font-medium ">{user_fullname}</p>
        <p className="text-xs font-normal text-gray-500 ">Kingslayer</p>
        <p className="text-xs font-normal text-gray-500 leading-none">
          {formatDateAgo(date_created)}
        </p>
      </div>
      <div className="">
        <div className="flex items-start text-blue-500 font-semibold hover:bg-blue-100 pt-2 px-2 rounded-md hover:cursor-pointer hover:text-blue-800 relative -top-2">
          <p className="leading-none text-2xl font-bold relative -top-[5px]">
            +
          </p>
          <p className="leading-none">Follow</p>
        </div>
      </div>
    </div>
  );
}
