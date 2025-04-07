import ChatHeader from "@/components/molecules/Chat/ChatHeader/ChatHeader";
import ChatMessage from "@/components/molecules/Chat/ChatMessage/ChatMessage";
import ChatInput from "@/components/molecules/Chat/ChatInput/ChatInput";
import Image from "next/image";
import useChatUser from "./useChatUser";

const ChatUser = ({
  selectedUser,
  setChatUserList,
  messagesEndRef,
  onlineUsers,
  chatUserList,
  handleUserTyping,
  listOfUsersTyping,
}) => {
  const { openSettingsId, setOpenSettingsId, messagesContainerRef } =
    useChatUser();
  return (
    <div className="w-full md:w-3/5 flex flex-col">
      <ChatHeader
        selectedUser={chatUserList.find(
          (user) => user.user.id === selectedUser.user.id
        )}
        onlineUsers={onlineUsers}
        listOfUsersTyping={listOfUsersTyping}
      />
      <div
        className={`flex-1 overflow-y-auto scrollbar-hide`}
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
            <Image
              src={"/icons/typing-animation.gif"}
              alt="typing animation"
              width={60}
              height={60}
              unoptimized={true}
            />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-4">
        <ChatInput
          selectedUser={selectedUser}
          setChatUserList={setChatUserList}
          handleUserTyping={handleUserTyping}
        />
      </div>
    </div>
  );
};

export default ChatUser;
