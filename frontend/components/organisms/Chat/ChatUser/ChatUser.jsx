import ChatHeader from "@/components/molecules/Chat/ChatHeader/ChatHeader";
import ChatMessage from "@/components/molecules/Chat/ChatMessage/ChatMessage";
import ChatInput from "@/components/molecules/Chat/ChatInput/ChatInput";
import useChatUser from "./useChatUser";
import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";

const ChatUser = ({ messagesEndRef, setIsSidebarOpen, handleUserTyping }) => {
  const {
    openSettingsId,
    setOpenSettingsId,
    messagesContainerRef,
    chatUserList,
    listOfUsersTyping,
    selectedUser,
  } = useChatUser();

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.style.overflow = openSettingsId
        ? "hidden"
        : "auto";
    }
  }, [openSettingsId]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with Back Button */}
      <div className="flex items-center bg-bg-post chatBackgroundDark">
        <button
          className="md:hidden p-1 m-1 rounded flex items-center justify-center text-forum-subheading hover:text-forum-heading transition-colors"
          onClick={() => setIsSidebarOpen(true)}
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <ChatHeader
            selectedUser={chatUserList.find(
              (user) => user.user.id === selectedUser.user.id
            )}
            listOfUsersTyping={listOfUsersTyping}
          />
        </div>
      </div>

      {/* Messages Container - Use flex-1 to take available space */}
      <div
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{
          backgroundImage: 'url("/images/topography.svg")',
          backgroundSize: "cover",
        }}
        ref={messagesContainerRef}
      >
        {chatUserList
          .find((user) => user.user.id === selectedUser.user.id)
          .messages.map((message) => {
            return (
              <ChatMessage
                key={message.id}
                message={message}
                openSettingsId={openSettingsId}
                setOpenSettingsId={setOpenSettingsId}
              />
            );
          })}
        {listOfUsersTyping.includes(selectedUser.user.id.toString()) && (
          <div className="ml-4">
            <img
              src="/icons/typing-animation.gif"
              alt="typing animation"
              width={60}
              height={60}
              className="unoptimized"
            />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container - Fixed at bottom with proper spacing for navbar */}
      <div className="mt-auto px-2 mb-4">
        <ChatInput handleUserTyping={handleUserTyping} />
      </div>
    </div>
  );
};

export default ChatUser;
