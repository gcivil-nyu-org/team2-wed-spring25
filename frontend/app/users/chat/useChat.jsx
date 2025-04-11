import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useChatStore } from "@/stores/useChatStore";
import { useShallow } from "zustand/shallow";

export default function useChat() {
  const { handleUserTyping } = useWebSocket();
  const { isLoading } = useChatStore(
    useShallow((state) => ({
      isLoading: state.isLoading,
    }))
  );
  const { chatUserList, selectedUser } = useChatStore(
    useShallow((state) => ({
      chatUserList: state.chatUserList,
      selectedUser: state.selectedUser,
    }))
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatUserList, selectedUser]);

  return {
    isLoading,
    selectedUser,
    messagesEndRef,
    isSidebarOpen,
    setIsSidebarOpen,

    handleUserTyping,
    chatUserList,
  };
}
