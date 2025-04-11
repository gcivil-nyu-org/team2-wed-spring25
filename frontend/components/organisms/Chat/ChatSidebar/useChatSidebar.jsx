import { useWebSocket } from "@/contexts/WebSocketContext";
import { useChatStore } from "@/stores/useChatStore";
import { apiPost } from "@/utils/fetch/fetch";
import { useShallow } from "zustand/shallow";
export default function useChatSidebar() {
  const { handleUserSelection } = useWebSocket();
  const { setChatUserList, setSelectedUser } = useChatStore(
    useShallow((state) => ({
      setChatUserList: state.setChatUserList,
      setSelectedUser: state.setSelectedUser,
    }))
  );
  const chatUserList = useChatStore((state) => state.chatUserList);
  const handleUserSelect = async (chat) => {
    try {
      setSelectedUser(chat);
      //if unread count is greater than 0, set all messages to read
      if (chat.unread_count == 0) return;
      //set all messages to read in backend for given user, chat
      await apiPost(`/chats/${chat.chat_uuid}/read/${chat.user.id}/`);

      //update the chat user list to set unread count to 0 for the selected user
      const updatedChatUserList = chatUserList.map((chatUser) => {
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
      setChatUserList(updatedChatUserList);

      handleUserSelection(chat.chat_uuid, chat.user.id);
    } catch (error) {
      console.error("Error selecting user:", error);
    }
  };

  return { handleUserSelect, chatUserList };
}
