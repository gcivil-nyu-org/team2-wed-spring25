import ChatHeader from "@/components/molecules/Chat/ChatHeader/ChatHeader";
import ChatMessage from "@/components/molecules/Chat/ChatMessage/ChatMessage";
import ChatInput from "@/components/molecules/Chat/ChatInput/ChatInput";

const ChatUser = ({
  selectedUser,
  setChatUserList,
  messagesEndRef,
  onlineUsers,
  chatUserList,
}) => {
  return (
    <div className="w-full md:w-3/5 flex flex-col">
      <ChatHeader
        selectedUser={chatUserList.find(
          (user) => user.user.id === selectedUser.user.id
        )}
        onlineUsers={onlineUsers}
      />
      <div
        className={`flex-1 overflow-y-auto scrollbar-hide`}
        style={{
          backgroundImage: 'url("/images/topography.svg")',
          backgroundSize: "cover",
        }}
      >
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
  );
};

export default ChatUser;
