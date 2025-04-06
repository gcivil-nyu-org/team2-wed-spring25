import UserImage from "@/components/atom/UserImage/UserImage";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { apiPost } from "@/utils/fetch/fetch";
import { getUserFullName } from "@/utils/string";

const ChatSidebar = ({
  chatUserList,
  setSelectedUser,
  onlineUsers,
  setChatUserList,
}) => {
  const { handleUserSelection } = useWebSocket();

  const getLastMessageTimeStamp = (timestamp) => {
    const now = new Date();
    const messageDate = new Date(timestamp);

    // Check if it's today
    if (
      messageDate.getDate() === now.getDate() &&
      messageDate.getMonth() === now.getMonth() &&
      messageDate.getFullYear() === now.getFullYear()
    ) {
      // Return time in 12-hour format (e.g., "2:30 PM")
      const hours = messageDate.getHours();
      const minutes = messageDate.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = parseInt(hours % 12 || 12).toString();
      const formattedMinutes = minutes.toString().padStart(2, "0");
      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    }

    // Check if it's within the last 6 days
    const sixDaysAgo = new Date(now);
    sixDaysAgo.setDate(now.getDate() - 6);

    if (messageDate > sixDaysAgo) {
      // Return day name (e.g., "Monday")
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      return days[messageDate.getDay()];
    }

    // For older dates, return formatted date (e.g., "4/5/2025")
    const month = messageDate.getMonth() + 1;
    const day = messageDate.getDate();
    const year = messageDate.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleUserSelect = async (chat) => {
    try {
      setSelectedUser(chat);
      //if unread count is greater than 0, set all messages to read
      if (chat.unread_count == 0) return;
      //set all messages to read in backend for given user, chat
      await apiPost(`/chats/${chat.chat_uuid}/read/${chat.user.id}/`);

      //update the chat user list to set unread count to 0 for the selected user
      setChatUserList((prev) => {
        return prev.map((chatUser) => {
          if (chatUser.user.id == chat.user.id) {
            return {
              ...chatUser,
              unread_count: 0,
              messages: chatUser.messages.map((message) => {
                return { ...message, read: true };
              }),
            };
          }
          return chatUser;
        });
      });

      handleUserSelection(chat.chat_uuid, chat.user.id);
    } catch (error) {
      console.error("Error selecting user:", error);
    }
  };
  return (
    <section className="relative border-r border-gray-700 h-full">
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
                <div className="relative">
                  {chatUser.messages.length > 0 ? (
                    <p className="text-forum-subheading2 text-sm">
                      {chatUser.messages[chatUser.messages.length - 1].content}
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
