import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useChatStore } from "@/stores/useChatStore";
import { useShallow } from "zustand/shallow";

export default function useChat() {
  const { initializeConnection, connectionStatus, handleUserTyping } =
    useWebSocket();
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

  useEffect(() => {
    if (typeof window === "undefined") return; // Server-side guard

    const checkAndConnect = () => {
      try {
        const userData = localStorage.getItem("user");

        if (userData) {
          const userId = JSON.parse(userData).id;

          // Only initialize if not already connected
          if (connectionStatus !== "connected") {
            initializeConnection(userId);
          }
        }
      } catch (error) {
        console.error("Connection initialization error:", error);
      }
    };

    // Check immediately
    checkAndConnect();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
