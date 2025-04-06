// contexts/WebSocketContext.jsx
"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const ws = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [retryCount, setRetryCount] = useState(0);
  const [userId, setUserId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]); // New state for online users
  const [chatUserList, setChatUserList] = useState([]);

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
      ws.current.close();
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

  const setupWebSocket = () => {
    if (!userId) return;

    cleanupConnection();
    const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const wsUrl = `${protocol}127.0.0.1:8001/ws/chat/${userId}/`;
    console.log("WebSocket URL:", wsUrl);

    setConnectionStatus("connecting");
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setConnectionStatus("connected");
      setRetryCount(0);
    };

    ws.current.onclose = () => {
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

        setOnlineUsers((prev) => {
          const userExists = prev.some((user) => user.id === data.user_id);
          if (data.is_online && !userExists) {
            return [...prev, { id: data.user_id }];
          } else if (!data.is_online) {
            return prev.filter((user) => user.id !== data.user_id);
          }
          return prev;
        });
      }

      if (data.type === "chat_message") {
        console.log("New chat message:", data);
        // Update UI (e.g., add message to chat window)

        setChatUserList((prev) => {
          console.log("Previous chat user list:", prev); // Debugging line

          const updatedList = prev.map((chat) => {
            if (chat.user.id == data.sender_id) {
              console.log("Updating chat for user:", chat.user.id); // Debugging line
              return {
                ...chat,
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
          return updatedList;
        });
      }

      if (data.type === "message_delivery") {
        console.log("Message delivery status:", data);
        // Update UI (e.g., mark message as delivered)
      }
    };
  };

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
        onlineUsers,
        setOnlineUsers, // Expose setOnlineUsers if needed
        chatUserList,
        setChatUserList,
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
