"use client";

import Loader from "@/components/molecules/Loader/Loader";
import ChatSidebar from "@/components/organisms/Chat/ChatSidebar/ChatSidebar";
import ChatUser from "@/components/organisms/Chat/ChatUser/ChatUser";
import useChat from "./useChat";
import { useEffect } from "react";

const ChatHome = () => {
  const {
    isLoading,
    onlineUsers,
    chatUserList,
    setChatUserList,
    selectedUser,
    setSelectedUser,
    messagesEndRef,
    isSidebarOpen,
    setIsSidebarOpen,
    handleUserTyping,
    listOfUsersTyping,
  } = useChat();

  // Show sidebar by default on mobile when no user is selected
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !selectedUser) {
        setIsSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    // Listen for window resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedUser, setIsSidebarOpen]);

  // When user selection changes, on mobile view, close sidebar if a user is selected
  useEffect(() => {
    if (window.innerWidth < 768 && selectedUser) {
      setIsSidebarOpen(false);
    }
  }, [selectedUser, setIsSidebarOpen]);

  if (isLoading) {
    return (
      <main className="bg-bg-forum w-screen max-w-screen h-screen flex justify-center items-center">
        <Loader />
      </main>
    );
  }

  if (
    chatUserList === null ||
    chatUserList === undefined ||
    chatUserList.length === 0
  ) {
    return (
      <main className="bg-bg-forum w-screen max-w-screen h-screen flex justify-center items-center">
        <div className="w-full h-full max-w-4xl bg-bg-post flex justify-center items-center px-5">
          <h1 className="text-center text-2xl text-forum-subheading font-bold">
            You don&apos;t have any chats yet. You can only chat with your mutual
            followers.
          </h1>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-bg-forum w-screen max-w-screen h-screen flex justify-center">
      {isLoading ? (
        <Loader />
      ) : (
        <section className="w-full h-full max-w-4xl bg-bg-post flex relative pb-14">
          {/* Desktop Sidebar - Always visible */}
          <div className="hidden md:flex w-2/5 h-full overflow-y-auto scrollbar-hide">
            {isLoading ? (
              <Loader />
            ) : (
              <ChatSidebar
                chatUserList={chatUserList}
                setSelectedUser={setSelectedUser}
                onlineUsers={onlineUsers}
                setChatUserList={setChatUserList}
                setIsSidebarOpen={() => {
                  setIsSidebarOpen(false);
                }}
                listOfUsersTyping={listOfUsersTyping}
              />
            )}
          </div>

          {/* Mobile/Desktop Content Area */}
          <div className="w-full md:w-3/5 flex h-full">
            {/* Mobile Sidebar - Conditionally visible */}
            {isSidebarOpen ? (
              <div className="md:hidden w-full h-full overflow-y-auto scrollbar-hide">
                {isLoading ? (
                  <div className="flex-1 flex justify-center items-center">
                    <Loader />
                  </div>
                ) : (
                  <ChatSidebar
                    chatUserList={chatUserList}
                    setSelectedUser={setSelectedUser}
                    onlineUsers={onlineUsers}
                    setChatUserList={setChatUserList}
                    setIsSidebarOpen={setIsSidebarOpen}
                    listOfUsersTyping={listOfUsersTyping}
                  />
                )}
              </div>
            ) : selectedUser ? (
              /* Chat area when user is selected */
              <ChatUser
                selectedUser={selectedUser}
                setChatUserList={setChatUserList}
                messagesEndRef={messagesEndRef}
                onlineUsers={onlineUsers}
                chatUserList={chatUserList}
                setIsSidebarOpen={setIsSidebarOpen}
                handleUserTyping={handleUserTyping}
                listOfUsersTyping={listOfUsersTyping}
              />
            ) : (
              /* No user selected message - Only shown on desktop when sidebar is visible */
              <div className="hidden md:flex w-full justify-center items-center">
                <h1 className="text-center text-2xl text-forum-subheading font-bold">
                  Select a user to chat with
                </h1>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
};

export default ChatHome;
