import { useRef, useState } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useEmojiPicker } from "@/hooks/useEmojiPicker";

export default function useChatInput(selectedUser, setChatUserList) {
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

  return {
    messageContent,
    setMessageContent,
    handleSend,
    handleOnEmojiClick,
    handleClickOnEmojiPicker,
    showEmojiPicker,
    textareaRef,
    handleInput,
    rows,
    emojiPickerRef,
  };
}
