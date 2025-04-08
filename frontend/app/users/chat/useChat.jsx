import { apiGet } from "@/utils/fetch/fetch";
import React, { useEffect, useRef, useState } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";

export default function useChat() {
  const [isLoading, setIsLoading] = useState(true);
  const {
    initializeConnection,
    connectionStatus,
    onlineUsers,
    chatUserList,
    setChatUserList,
    selectedUser,
    setSelectedUser,
    listOfUsersTyping,
    handleUserTyping,
  } = useWebSocket();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  useEffect(() => {
    const fetchChatUserList = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));

        const response = await apiGet(`/chats/${user.id}`);

        setChatUserList(response.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChatUserList();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    onlineUsers,
    chatUserList,
    setChatUserList,
    selectedUser,
    setSelectedUser,
    messagesEndRef,
    isSidebarOpen,
    setIsSidebarOpen,
    listOfUsersTyping,
    handleUserTyping,
  };
}
