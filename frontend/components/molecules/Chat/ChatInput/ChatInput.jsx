"use client";
import EmojiPicker from "emoji-picker-react";
import Image from "next/image";
import useChatInput from "./useChatInput";

const ChatInput = ({
  selectedUser,
  setChatUserList,
  isEdit = false,
  messageId = "",
  initialContent = "",
  closeEditDialog = () => {},
}) => {
  const {
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
  } = useChatInput(
    selectedUser,
    setChatUserList,
    isEdit,
    messageId,
    initialContent,
    closeEditDialog
  );
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
            minHeight: "1.5rem",
            maxHeight: "4.5rem",
          }}
          value={messageContent}
          onChange={handleChange} // Updated to use the new handler
          onKeyDown={handleTypingActivity} // Also track key presses
          onBlur={() => {
            // When textarea loses focus, immediately stop typing indication
            if (isTyping) {
              clearTimeout(typingTimeoutRef.current);
              setIsTyping(false);
              handleUserTyping(
                selectedUser.chat_uuid,
                selectedUser.user.id,
                false
              );
            }
          }}
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
