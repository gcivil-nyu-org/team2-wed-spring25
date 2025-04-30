import { useRef, useState } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useEmojiPicker } from "@/hooks/useEmojiPicker";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiPost } from "@/utils/fetch/fetch";

export default function useChatInput(
  selectedUser,
  setChatUserList,
  isEdit,
  messageId,
  initialContent,
  closeEditDialog
) {
  const [rows, setRows] = useState(1);
  const [messageContent, setMessageContent] = useState(initialContent || "");
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
  const user = JSON.parse(localStorage.getItem("user"));
  const senderId = user.id; // Assuming you have the sender's ID from local storage
  const handleSend = async () => {
    if (isEdit) {
      if (initialContent.trim() === messageContent.trim()) {
        closeEditDialog(); // Close edit dialog if content is unchanged
        return;
      }
      try {
        // If editing, send the edit message request
        setChatUserList((prev) => {
          return prev.map((chat) => {
            if (chat.user.id == selectedUser.user.id) {
              return {
                ...chat,
                messages: chat.messages.map((msg) => {
                  if (msg.id === messageId) {
                    return {
                      ...msg,
                      content: messageContent.trim(),
                      is_deleted: "no", // Reset deletion status on edit
                    };
                  }
                  return msg;
                }),
              };
            }
            return chat;
          });
        });
        closeEditDialog(); // Close the edit dialog after sending
        const data = await apiPost(`/chats/chat/message/${messageId}/`, {
          content: messageContent.trim(),
        });
        console.log("Message edited successfully:", data);
      } catch (error) {
        console.error("Error editing message:", error);
        showError("Failed", "Failed to edit message", "edit_message_error");
      }
      return;
    }
    if (!messageContent.trim()) return;

    const message_id = Date.now(); // Generate a unique message ID based on timestamp
    // Create the message object
    const chatMessage = {
      type: "chat_message",
      chat_uuid: selectedUser.chat_uuid,
      recipient_id: selectedUser.user.id,
      content: messageContent.trim(),
      timestamp: new Date().toISOString(),
      message_id: message_id,
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
                id: message_id,
                sender_id: senderId,
                content: chatMessage.content,
                timestamp: chatMessage.timestamp,
                read: false,
                is_deleted: "no", // Default to "no" for new messages
              },
            ],
          };
        }
        return chat;
      });
    });

    try {
      console.log(selectedUser.user);

      await apiPost(`/notifications/send/`, {
        user_id: selectedUser.user.id,
        title: "New message",
        body: "You have a new message from " + selectedUser.user.first_name,
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      showError(
        "Failed",
        "Failed to send notification",
        "send_notification_error"
      );
    }

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
  };
}
