"use client";

import ChatHeader from "@/components/molecules/Chat/ChatHeader/ChatHeader";
import ChatInput from "@/components/molecules/Chat/ChatInput/ChatInput";
import ChatMessage from "@/components/molecules/Chat/ChatMessage/ChatMessage";
import Loader from "@/components/molecules/Loader/Loader";
import ChatSidebar from "@/components/organisms/Chat/ChatSidebar";
import { apiGet } from "@/utils/fetch/fetch";
import React, { useEffect, useState } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";

const ChatHome = () => {
  const [isLoading, setIsLoading] = useState(true);
  const {
    initializeConnection,
    connectionStatus,
    onlineUsers,
    chatUserList,
    setChatUserList,
  } = useWebSocket();
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchChatUserList = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));

        const response = await apiGet(`/chats/${user.id}`);
        console.log("Chat user list response:", response.data); // Debugging line

        setChatUserList(response.data);
        console.log(response.data);
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

  useEffect(() => {
    console.log("chat user list is updated", chatUserList);
  }, [chatUserList]);

  useEffect(() => {
    console.log("Online users:", onlineUsers);
  }, [onlineUsers]);

  return (
    <main className="bg-bg-forum w-screen max-w-screen h-screen max-h-screen flex justify-center items-center">
      <section className="w-full h-full max-w-4xl bg-bg-post flex divide-x divide-gray-700">
        <div className="w-1/3">
          {isLoading ? (
            <Loader />
          ) : (
            <ChatSidebar
              chatUserList={chatUserList}
              setSelectedUser={setSelectedUser}
              onlineUsers={onlineUsers}
            />
          )}
        </div>
        {selectedUser && (
          <div className="w-2/3 flex flex-col">
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
