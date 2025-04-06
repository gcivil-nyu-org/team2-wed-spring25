"use client";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useEmojiPicker } from "@/hooks/useEmojiPicker";
import EmojiPicker from "emoji-picker-react";
import Image from "next/image";
import { useRef, useState } from "react";

const ChatInput = ({ selectedUser, setChatUserList }) => {
  const [rows, setRows] = useState(1);
  const [messageContent, setMessageContent] = useState("");
  const textareaRef = useRef(null);
  const { send, connectionStatus } = useWebSocket();
  const {
    emojiPickerRef,
    showEmojiPicker,
    handleClickOnEmojiPicker,
    handleOnEmojiClick,
  } = useEmojiPicker();
  const user = JSON.parse(localStorage.getItem("user"));
  const senderId = user.id; // Assuming you have the sender's ID from local storage
  const handleSend = () => {
    if (!messageContent.trim()) return;

    // Create the message object
    const chatMessage = {
      type: "chat_message",
      chat_uuid: selectedUser.chat_uuid,
      recipient_id: selectedUser.user.id,
      content: messageContent.trim(),
      timestamp: new Date().toISOString(),
    };

    // Send via WebSocket
    send(chatMessage);

    //also add the message to the chat user list
    setChatUserList((prev) => {
      return prev.map((chat) => {
        if (chat.user.id == selectedUser.user.id) {
          return {
            ...chat,
            messages: [
              ...chat.messages,
              {
                id: Date.now(),
                sender_id: senderId,
                content: chatMessage.content,
                timestamp: chatMessage.timestamp,
                read: false,
              },
            ],
          };
        }
        return chat;
      });
    });
    // Optimistic UI update could be done here
    setMessageContent("");
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    //to get the scroll height of the textarea
    textarea.style.height = "auto";

    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
    const scrollHeight = textarea.scrollHeight;
    const newRows = Math.min(3, Math.floor(scrollHeight / lineHeight));
    setRows(newRows);

    if (newRows === 3) {
      textarea.style.height = `${lineHeight * 3}px`;
    } else {
      textarea.style.height = `${scrollHeight}px`;
    }
  };
  return (
    <div className="flex border-t-2 border-gray-700">
      <div className="bg-gray-600 flex-1 flex rounded-lg m-2 relative">
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-0" ref={emojiPickerRef}>
            <EmojiPicker
              height={400}
              onEmojiClick={(emojiObject) =>
                handleOnEmojiClick(emojiObject, setMessageContent)
              }
              theme="dark"
            />
          </div>
        )}
        <button onClick={handleClickOnEmojiPicker} className="pl-2">
          <Image
            src={"/icons/emoji-white.svg"}
            width={20}
            height={20}
            alt="Image Picker"
            size={"lg"}
          />
        </button>
        <textarea
          ref={textareaRef}
          className="flex-1 bg-transparent outline-none resize-none text-forum-heading py-2 px-4 
        overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent"
          placeholder="Write a message..."
          rows={rows}
          onInput={handleInput}
          style={{
            minHeight: "1.5rem", // Adjust this value based on your font size
            maxHeight: "4.5rem", // Approximately 3 rows, adjust as needed
          }}
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
        />
      </div>
      <button onClick={handleSend} disabled={!messageContent.trim()}>
        <Image
          src="/icons/send3.svg"
          alt="Send"
          width={24}
          height={24}
          className="cursor-pointer mr-2"
        />
      </button>
    </div>
  );
};

export default ChatInput;
