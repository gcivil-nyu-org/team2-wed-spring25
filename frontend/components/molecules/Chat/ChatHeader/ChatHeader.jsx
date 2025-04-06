"use client";

import UserImage from "@/components/atom/UserImage/UserImage";
import { getUserFullName } from "@/utils/string";

const ChatHeader = ({ selectedUser, onlineUsers }) => {
  const user = selectedUser.user;
  let isUserOnline = false;
  onlineUsers.forEach((onlineUser) => {
    if (onlineUser.id == user.id) {
      isUserOnline = true;
    }
  });
  return (
    <div
      key={user.id}
      className="flex gap-3 px-4 py-3 items-center bg-gray-700"
    >
      <div>
        <UserImage imageUrl={user.avatar} width={40} height={40} />
      </div>
      <div className="flex flex-col justify-center">
        <h3 className="text-md font-semibold text-forum-heading truncate leading-none">
          {getUserFullName(user.first_name, user.last_name)}
        </h3>
        <p className="text-forum-subheading2 truncate text-sm">
          {isUserOnline ? "Online" : "Offline"}
        </p>
      </div>
    </div>
  );
};

export default ChatHeader;
