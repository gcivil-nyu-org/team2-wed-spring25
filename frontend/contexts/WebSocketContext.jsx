// contexts/WebSocketContext.jsx
"use client";
import { useChatStore } from "@/stores/useChatStore";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const ws = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [retryCount, setRetryCount] = useState(0);
  const [userId, setUserId] = useState(null);
  const {
    setChatUserList,
    setOnlineUsers,
    setListOfUsersTyping,
    selectedUser,
  } = useChatStore(
    useShallow((state) => ({
      setChatUserList: state.setChatUserList,
      setOnlineUsers: state.setOnlineUsers,
      setListOfUsersTyping: state.setListOfUsersTyping,
      selectedUser: state.selectedUser,
    }))
  );
  const selectedUserRef = useRef(selectedUser);

  const initializeConnection = (newUserId) => {
    console.log("Initializing connection with userId:", newUserId);

    if (!newUserId || connectionStatus === "connected") return;
    setUserId(newUserId);
  };

  const send = (message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const cleanupConnection = () => {
    if (ws.current) {
      // Remove all event listeners to prevent memory leaks
      ws.current.onopen = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onmessage = null;

      // Close if not already closed
      if (
        [WebSocket.CONNECTING, WebSocket.OPEN].includes(ws.current.readyState)
      ) {
        ws.current.close();
      }
      ws.current = null;
    }
  };

  const attemptReconnect = () => {
    if (retryCount < 3 && userId) {
      const delay = Math.min(1000 * 2 ** retryCount, 10000);
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setupWebSocket();
      }, delay);
    }
  };

  const handleUserTyping = (chat_uuid, recipient_id, is_typing) => {
    try {
      if (!chat_uuid || !recipient_id) return;

      send({
        type: "typing_status",
        is_typing: is_typing,
        recipient_id: recipient_id,
        chat_uuid: chat_uuid,
      });
    } catch (error) {
      console.error("Error sending typing status:", error);
    }
  };

  const handleUserSelection = (chat_uuid, sender_id) => {
    try {
      if (!chat_uuid || !sender_id) return;

      send({
        type: "mark_messages_read",
        sender_id: sender_id, // The user whose messages we're viewing
        chat_uuid: chat_uuid,
        current_user_id: userId,
      });
    } catch (error) {
      console.error("Error selecting user:", error);
    }
  };

  const disconnectWebSocket = () => {
    try {
      if (ws.current?.readyState === WebSocket.OPEN) {
        // Send a graceful disconnect message if needed
        send({
          type: "user_disconnect",
          user_id: userId,
          timestamp: new Date().toISOString(),
        });

        // Close the connection properly
        ws.current.close(1000, "User logged out"); // 1000 = normal closure
      }
      cleanupConnection();
      setConnectionStatus("disconnected");
      setUserId(null);
      console.log("WebSocket disconnected gracefully");
    } catch (error) {
      console.error("Error during WebSocket disconnect:", error);
    }
  };

  const setupWebSocket = () => {
    if (!userId) return;

    cleanupConnection();
    const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    // const wsUrl = `${protocol}localhost:8001/ws/chat/${userId}/`;
    const wsUrl = `${protocol}${process.env.NEXT_PUBLIC_WEB_SOCKET}/ws/chat/${userId}/`;
    console.log("WebSocket URL:", wsUrl);

    setConnectionStatus("connecting");
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setConnectionStatus("connected");
      setRetryCount(0);
    };

    ws.current.onclose = (event) => {
      console.log("Close code:", event.code, "Reason:", event.reason);
      setConnectionStatus("disconnected");
      attemptReconnect();
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("disconnected");
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "user_list") {
        const newdata = data.users.map((i) => ({ id: i }));
        setOnlineUsers(newdata); // Update online users list
      }

      if (data.type === "status") {
        // Update single user status
        const onlineUsers = useChatStore.getState().onlineUsers;
        const userExists = onlineUsers.some((user) => user.id === data.user_id);
        if (data.is_online && !userExists) {
          setOnlineUsers([...onlineUsers, { id: data.user_id }]);
        } else if (!data.is_online) {
          setOnlineUsers(
            onlineUsers.filter((user) => user.id !== data.user_id)
          );
        }
      }

      if (data.type === "chat_message") {
        // Update UI (e.g., add message to chat window)
        const chatUserList = useChatStore.getState().chatUserList;
        const updatedChatUserList = chatUserList.map((chat) => {
          if (chat.user.id == data.sender_id) {
            const isSelected =
              selectedUserRef.current?.user?.id == data.sender_id;

            // if the current user is selected, mark the messages as read immediately
            if (isSelected) {
              send({
                type: "mark_messages_read",
                sender_id: data.sender_id,
                chat_uuid: chat.chat_uuid,
                current_user_id: userId,
              });
            }
            return {
              ...chat,
              unread_count: !isSelected ? chat.unread_count + 1 : 0,
              messages: [
                ...chat.messages,
                {
                  id: data.message_id,
                  sender_id: data.sender_id,
                  content: data.message,
                  timestamp: data.timestamp,
                  read: false,
                },
              ],
            };
          }
          return chat;
        });

        setChatUserList(updatedChatUserList);
      }

      if (data.type === "message_delivery") {
        console.log("Message delivery status:", data);
        //helpful for image delivery status
      }

      if (data.type === "messages_read") {
        const { chat_uuid, reader_id } = data;
        const chatUserList = useChatStore.getState().chatUserList;
        const updatedChatUserList = chatUserList.map((chat) => {
          if (chat.chat_uuid == chat_uuid) {
            return {
              ...chat,
              messages: chat.messages.map((message) => {
                if (message.sender_id != reader_id) {
                  return { ...message, read: true };
                }
                return message;
              }),
            };
          }
          return chat;
        });
        console.log(
          "Updated chat user list after messages read:",
          updatedChatUserList
        );

        setChatUserList(updatedChatUserList);
      }

      if (data.type === "typing") {
        const { sender_id, is_typing, chat_uuid } = data;
        const listOfUsersTyping = useChatStore.getState().listOfUsersTyping;
        const newSet = new Set(listOfUsersTyping);
        if (is_typing) {
          newSet.add(sender_id);
        } else {
          newSet.delete(sender_id);
        }
        setListOfUsersTyping(Array.from(newSet));
      }
    };
  };

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Setup WebSocket when userId changes
  useEffect(() => {
    if (userId) {
      setupWebSocket();
    }
    return cleanupConnection;
  }, [userId]);

  return (
    <WebSocketContext.Provider
      value={{
        initializeConnection,
        connectionStatus,
        send,
        handleUserSelection,
        handleUserTyping,
        disconnectWebSocket,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
