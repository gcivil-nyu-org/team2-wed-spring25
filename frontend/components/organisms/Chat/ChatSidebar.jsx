import UserImage from "@/components/atom/UserImage/UserImage";
import { getLastMessageTimeStamp } from "@/utils/datetime";

import { getUserFullName } from "@/utils/string";
import useChatSidebar from "./useChatSidebar";

const ChatSidebar = ({
  chatUserList,
  setSelectedUser,
  onlineUsers,
  setChatUserList,
  setIsSidebarOpen,
}) => {
  const { handleUserSelect } = useChatSidebar({
    setSelectedUser,
    setChatUserList,
  });
  return (
    <section className="w-full relative border-r border-gray-700 h-full">
      <div className="sticky top-0 bg-bg-post block z-10">
        <h2 className="text-xl font-normal text-forum-heading py-3 mx-4 ">
          Chats
        </h2>
      </div>
      <div className="">
        {chatUserList.map((chatUser) => {
          const user = chatUser.user;
          return (
            <div
              key={user.id}
              className="flex items-center gap-3 hover:cursor-pointer hover:bg-gray-800 rounded-lg px-4"
              onClick={() => {
                handleUserSelect(chatUser);
                setIsSidebarOpen(false);
              }}
            >
              <div className="py-3">
                <UserImage imageUrl={user.avatar} width={49} height={49} />
              </div>
              <div className="border-b border-gray-700 flex flex-col flex-1 justify-center py-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-normal text-forum-subheading truncate">
                    {getUserFullName(user.first_name, user.last_name)}
                  </h3>
                  {chatUser.messages.length > 0 && (
                    <p className="text-forum-subheading2 text-xs">
                      {getLastMessageTimeStamp(
                        chatUser.messages[chatUser.messages.length - 1]
                          .timestamp
                      )}
                    </p>
                  )}
                </div>
                <div className="relative truncate">
                  {chatUser.messages.length > 0 ? (
                    <p className="text-forum-subheading2 text-sm">
                      {chatUser.messages[chatUser.messages.length - 1].content
                        .length > 20
                        ? chatUser.messages[
                            chatUser.messages.length - 1
                          ].content.slice(0, 30) + "..."
                        : chatUser.messages[chatUser.messages.length - 1]
                            .content}{" "}
                    </p>
                  ) : (
                    <p className="text-forum-subheading2 text-sm">
                      Start conversation
                    </p>
                  )}
                  {chatUser.unread_count > 0 && (
                    <div className="absolute size-6 bg-gray-700 rounded-full -bottom-1 right-0 flex items-center justify-center">
                      <p className="text-xs text-white text-center">
                        {chatUser.unread_count > 9
                          ? "9+"
                          : chatUser.unread_count}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ChatSidebar;
