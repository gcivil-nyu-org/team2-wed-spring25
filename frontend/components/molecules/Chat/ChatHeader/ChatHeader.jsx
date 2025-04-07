"use client";

import UserImage from "@/components/atom/UserImage/UserImage";
import { getUserFullName } from "@/utils/string";
import useChatHeader from "./useChatHeader";

const ChatHeader = ({ selectedUser, onlineUsers, listOfUsersTyping }) => {
  const { user, isUserOnline } = useChatHeader(selectedUser, onlineUsers);
  return (
    <div
      key={user.id}
      className="flex gap-3 px-4 py-3 items-center chatBackgroundDark"
    >
      <div>
        <UserImage imageUrl={user.avatar} width={40} height={40} />
      </div>
      <div className="flex flex-col justify-center">
        <h3 className="text-md font-semibold text-forum-heading truncate leading-none">
          {getUserFullName(user.first_name, user.last_name)}
        </h3>
        <p className="text-forum-subheading2 truncate text-sm">
          {isUserOnline ? (
            listOfUsersTyping.includes(user.id.toString()) ? (
              <span className="text-forum-heading">typing...</span>
            ) : (
              "Onine"
            )
          ) : (
            "Offline"
          )}
        </p>
      </div>
    </div>
  );
};

export default ChatHeader;
