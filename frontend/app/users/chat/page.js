"use client";

import ChatHeader from "@/components/molecules/Chat/ChatHeader/ChatHeader";
import ChatInput from "@/components/molecules/Chat/ChatInput/ChatInput";
import ChatMessage from "@/components/molecules/Chat/ChatMessage/ChatMessage";
import Loader from "@/components/molecules/Loader/Loader";
import ChatSidebar from "@/components/organisms/Chat/ChatSidebar";
import { apiGet } from "@/utils/fetch/fetch";
import React, { useEffect, useRef, useState } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";

const ChatHome = () => {
  const [isLoading, setIsLoading] = useState(true);
  const {
    initializeConnection,
    connectionStatus,
    onlineUsers,
    chatUserList,
    setChatUserList,
    selectedUser,
    setSelectedUser,
  } = useWebSocket();
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
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatUserList, selectedUser]); // Re-run when these change

  return (
    <main className="bg-bg-forum w-screen max-w-screen h-screen max-h-screen flex justify-center items-center">
      <section className="w-full h-full max-w-4xl bg-bg-post flex divide-x divide-gray-700">
        <div className="w-2/5  max-h-screen overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <Loader />
          ) : (
            <ChatSidebar
              chatUserList={chatUserList}
              setSelectedUser={setSelectedUser}
              onlineUsers={onlineUsers}
              setChatUserList={setChatUserList}
            />
          )}
        </div>
        {selectedUser && (
          <div className="w-3/5 flex flex-col">
            <ChatHeader
              selectedUser={chatUserList.find(
                (user) => user.user.id === selectedUser.user.id
              )}
              onlineUsers={onlineUsers}
            />
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {chatUserList
                .find((user) => user.user.id === selectedUser.user.id)
                .messages.map((message) => {
                  return <ChatMessage key={message.id} message={message} />;
                })}
              <div ref={messagesEndRef} />
            </div>
            <div className="mt-4">
              <ChatInput
                selectedUser={selectedUser}
                setChatUserList={setChatUserList}
              />
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default ChatHome;
