"use client";

import Loader from "@/components/molecules/Loader/Loader";
import ChatSidebar from "@/components/organisms/Chat/ChatSidebar/ChatSidebar";
import ChatUser from "@/components/organisms/Chat/ChatUser/ChatUser";
import useChat from "./useChat";
import Image from "next/image";

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

  return (
    <main className="bg-bg-forum w-screen max-w-screen h-screen max-h-screen flex justify-center items-center">
      {isLoading ? (
        <Loader />
      ) : (
        <section className="w-full h-full max-w-4xl bg-bg-post flex">
          <div className="hidden md:flex w-2/5 max-h-screen overflow-y-auto scrollbar-hide justify-end items-center">
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
          <div className="flex flex-col justify-end md:hidden bg-bg-forum h-screen max-h-screen max-w-10">
            <button
              className="bg-map-bg  p-1 m-1 rounded mb-2"
              onClick={() => {
                setIsSidebarOpen(!isSidebarOpen);
              }}
            >
              <Image
                src={
                  isSidebarOpen
                    ? "/icons/arrow-left.svg"
                    : "/icons/arrow-right.svg"
                }
                alt={"message icon"}
                width={24}
                height={24}
              />
            </button>
          </div>

          {isSidebarOpen ? (
            <div className="md:hidden w-full flex justify-start max-h-screen overflow-y-auto scrollbar-hide items-center">
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
          ) : null}
          {!isSidebarOpen ? (
            selectedUser ? (
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
              <div className="w-full md:w-3/5 flex justify-center items-center">
                <h1 className="text-center text-2xl text-forum-subheading font-bold">
                  Select a user to chat with
                </h1>
              </div>
            )
          ) : null}
        </section>
      )}
    </main>
  );
};

export default ChatHome;
