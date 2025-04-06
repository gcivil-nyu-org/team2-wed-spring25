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
    <div key={user.id} className="flex gap-2">
      <div>
        <UserImage imageUrl={user.avatar} width={50} height={50} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-forum-heading truncate">
          {getUserFullName(user.first_name, user.last_name)}
        </h3>
        <p className="text-forum-subheading2 truncate">
          {isUserOnline ? "Online" : "Offline"}
        </p>
      </div>
    </div>
  );
};

export default ChatHeader;
