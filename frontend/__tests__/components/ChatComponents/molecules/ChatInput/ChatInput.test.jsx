jest.mock("bad-words", () => {
  class MockFilter {
    constructor() {
      this.clean = jest.fn((text) => text);
    }
  }

  return {
    Filter: MockFilter,
  };
});

import { render, screen, fireEvent } from "@testing-library/react";
import ChatInput from "@/components/molecules/Chat/ChatInput/ChatInput";
import useChatInput from "@/components/molecules/Chat/ChatInput/useChatInput";

// Mock the custom hook
jest.mock("@/components/molecules/Chat/ChatInput/useChatInput");
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => <img {...props} />,
}));
jest.mock("emoji-picker-react", () => ({
  __esModule: true,
  default: ({ onEmojiClick }) => (
    <div
      data-testid="emoji-picker"
      onClick={() => onEmojiClick({ emoji: "😊" })}
    >
      Emoji Picker
    </div>
  ),
}));

describe("ChatInput", () => {
  const mockHandleSend = jest.fn();
  const mockHandleChange = jest.fn();
  const mockHandleTypingActivity = jest.fn();

  const mockProps = {
    selectedUser: { user: { id: 1 } },
    setChatUserList: jest.fn(),
  };

  const mockHookReturn = {
    messageContent: "",
    setMessageContent: jest.fn(),
    handleSend: mockHandleSend,
    handleOnEmojiClick: jest.fn(),
    handleClickOnEmojiPicker: jest.fn(),
    showEmojiPicker: false,
    textareaRef: { current: null },
    handleInput: jest.fn(),
    rows: 1,
    emojiPickerRef: { current: null },
    handleChange: mockHandleChange,
    isTyping: false,
    setIsTyping: jest.fn(),
    typingTimeoutRef: { current: null },
    handleTypingActivity: mockHandleTypingActivity,
    handleUserTyping: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useChatInput.mockReturnValue(mockHookReturn);
  });

  it("renders the chat input component", () => {
    render(<ChatInput {...mockProps} />);
    expect(
      screen.getByPlaceholderText("Write a message...")
    ).toBeInTheDocument();
    expect(screen.getByAltText("Send")).toBeInTheDocument();
    expect(screen.getByAltText("Image Picker")).toBeInTheDocument();
  });

  it("shows emoji picker when button is clicked", () => {
    const mockWithEmojiPicker = {
      ...mockHookReturn,
      showEmojiPicker: true,
    };
    useChatInput.mockReturnValue(mockWithEmojiPicker);

    render(<ChatInput {...mockProps} />);
    expect(screen.getByTestId("emoji-picker")).toBeInTheDocument();
  });

  it("handles text input", () => {
    render(<ChatInput {...mockProps} />);
    const textarea = screen.getByPlaceholderText("Write a message...");

    fireEvent.change(textarea, { target: { value: "Hello" } });
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it("handles send button click with non-empty message", () => {
    const mockHookReturnWithMessage = {
      ...mockHookReturn,
      messageContent: "Hello",
    };
    useChatInput.mockReturnValue(mockHookReturnWithMessage);

    render(<ChatInput {...mockProps} />);
    const sendButton = screen.getByAltText("Send");

    fireEvent.click(sendButton);
    expect(mockHandleSend).toHaveBeenCalled();
  });

  it("disables send button when message is empty", () => {
    render(<ChatInput {...mockProps} />);
    const sendButton = screen.getByAltText("Send");
    expect(sendButton.parentElement).toBeDisabled();
  });

  it("handles typing activity", () => {
    render(<ChatInput {...mockProps} />);
    const textarea = screen.getByPlaceholderText("Write a message...");

    fireEvent.keyDown(textarea);
    expect(mockHandleTypingActivity).toHaveBeenCalled();
  });
});
