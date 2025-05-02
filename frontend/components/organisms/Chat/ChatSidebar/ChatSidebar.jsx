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
  listOfUsersTyping,
}) => {
  const { handleUserSelect } = useChatSidebar({
    setSelectedUser,
    setChatUserList,
  });

  return (
    <section className="w-full h-full flex flex-col borderLightR">
      <div className="sticky top-0 bg-bg-post z-10 shadow-sm">
        <h2 className="text-xl font-normal text-forum-heading py-3 mx-4">
          Chats
        </h2>
      </div>

      {/* Scrollable chat list - takes remaining height */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {chatUserList.map((chatUser) => {
          const user = chatUser.user;

          return (
            <div
              key={user.id}
              className="flex items-center gap-3 hover:cursor-pointer chatSidebarHover rounded-lg px-4"
              onClick={() => {
                handleUserSelect(chatUser);
                setIsSidebarOpen(false);
              }}
            >
              <div className="py-3">
                <UserImage imageUrl={user.avatar} width={49} height={49} />
              </div>
              <div className="borderLightB flex flex-col flex-1 justify-center py-3">
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
                      {chatUser.messages[chatUser.messages.length - 1]
                        .is_deleted == "no" &&
                        (chatUser.messages[chatUser.messages.length - 1].content
                          .length > 20
                          ? chatUser.messages[
                              chatUser.messages.length - 1
                            ].content.slice(0, 30) + "..."
                          : chatUser.messages[chatUser.messages.length - 1]
                              .content)}
                      {chatUser.messages[chatUser.messages.length - 1]
                        .is_deleted != "no" && "message deleted"}
                    </p>
                  ) : (
                    <p className="text-forum-subheading2 text-sm">
                      Start conversation
                    </p>
                  )}
                  {chatUser.unread_count > 0 && (
                    <div className="absolute size-6 chatBackground rounded-full -bottom-1 right-0 flex items-center justify-center">
                      <p className="text-xs text-forum-heading text-center">
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
