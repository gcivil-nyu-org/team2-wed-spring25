import { useRef, useState } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useEmojiPicker } from "@/hooks/useEmojiPicker";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { useChatStore } from "@/stores/useChatStore";
import { useShallow } from "zustand/shallow";
import { useAuthStore } from "@/stores/useAuthStore";

export default function useChatInput() {
  const [rows, setRows] = useState(1);
  const [messageContent, setMessageContent] = useState("");
  const textareaRef = useRef(null);
  const { send, connectionStatus, handleUserTyping } = useWebSocket();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const { showError } = useNotification();
  const {
    emojiPickerRef,
    showEmojiPicker,
    handleClickOnEmojiPicker,
    handleOnEmojiClick,
  } = useEmojiPicker();
  const { setChatUserList, selectedUser } = useChatStore(
    useShallow((state) => ({
      setChatUserList: state.setChatUserList,
      selectedUser: state.selectedUser,
    }))
  );
  const chatUserList = useChatStore((state) => state.chatUserList);
  const user = useAuthStore((state) => state.user);
  const senderId = user?.id; // Assuming you have the sender's ID from local storage
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
    const updatedChatUserList = chatUserList.map((chat) => {
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
    setChatUserList(updatedChatUserList);

    setMessageContent("");
    handleInput(); // Reset textarea height after sending
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // or your initial height
      setRows(1);
    }
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

  const handleTypingActivity = () => {
    // If user wasn't previously typing, notify that they started
    if (!isTyping) {
      setIsTyping(true);
      handleUserTyping(selectedUser.chat_uuid, selectedUser.user.id, true);
    }

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set a new timeout to detect when typing stops
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      handleUserTyping(selectedUser.chat_uuid, selectedUser.user.id, false);
    }, 1000); // Adjust this delay as needed (1000ms = 1 second)
  };

  const handleChange = (e) => {
    if (e.target.value.length > 500) {
      showError("Message content exceeds 500 characters limit.");
      return;
    }
    setMessageContent(e.target.value);
    handleTypingActivity(); // Track typing activity

    // Call handleInput to adjust height whenever content changes
    handleInput();

    // If message is empty, reset to single row
    if (!e.target.value.trim()) {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = "auto"; // or your initial height
        setRows(1);
      }
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
    handleChange,
    isTyping,
    setIsTyping,
    typingTimeoutRef,
    handleTypingActivity,
    handleUserTyping,
    selectedUser,
  };
}
