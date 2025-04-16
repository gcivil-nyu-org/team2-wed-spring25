import { renderHook, act } from "@testing-library/react";
import useChatInput from "@/components/molecules/Chat/ChatInput/useChatInput";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";

// Mock the dependencies
jest.mock("@/contexts/WebSocketContext");
jest.mock("@/app/custom-components/ToastComponent/NotificationContext");
jest.mock("@/hooks/useEmojiPicker", () => ({
  useEmojiPicker: () => ({
    emojiPickerRef: { current: null },
    showEmojiPicker: false,
    handleClickOnEmojiPicker: jest.fn(),
    handleOnEmojiClick: jest.fn(),
  }),
}));

describe("useChatInput", () => {
  const mockSelectedUser = {
    chat_uuid: "123",
    user: { id: 1 },
  };
  const mockSetChatUserList = jest.fn();
  const mockShowError = jest.fn();
  const mockSend = jest.fn();
  const mockHandleUserTyping = jest.fn();

  beforeEach(() => {
    // Mock localStorage with user data
    const mockUser = { id: 2, name: "Test User" };
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => JSON.stringify(mockUser)),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock WebSocket context
    useWebSocket.mockImplementation(() => ({
      send: mockSend,
      connectionStatus: "connected",
      handleUserTyping: mockHandleUserTyping,
    }));

    // Mock Notification context
    useNotification.mockImplementation(() => ({
      showError: mockShowError,
    }));

    // Clear mocks between tests
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    jest.resetAllMocks();
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() =>
      useChatInput(mockSelectedUser, mockSetChatUserList)
    );

    expect(result.current.messageContent).toBe("");
    expect(result.current.rows).toBe(1);
    expect(result.current.isTyping).toBe(false);
  });

  it("handles message content changes", () => {
    const { result } = renderHook(() =>
      useChatInput(mockSelectedUser, mockSetChatUserList)
    );

    act(() => {
      result.current.handleChange({ target: { value: "Hello" } });
    });

    expect(result.current.messageContent).toBe("Hello");
  });

  it("prevents messages longer than 500 characters", () => {
    const { result } = renderHook(() =>
      useChatInput(mockSelectedUser, mockSetChatUserList)
    );
    const longMessage = "a".repeat(501);

    act(() => {
      result.current.handleChange({ target: { value: longMessage } });
    });

    expect(mockShowError).toHaveBeenCalledWith(
      "Message content exceeds 500 characters limit."
    );
  });

  it("handles sending messages", () => {
    const { result } = renderHook(() =>
      useChatInput(mockSelectedUser, mockSetChatUserList)
    );

    // Set message content first
    act(() => {
      result.current.setMessageContent("Hello");
    });

    // Verify message content is set
    expect(result.current.messageContent).toBe("Hello");

    // Mock Date.now() for consistent ID generation
    const mockDate = new Date("2024-01-01");
    jest.spyOn(global, "Date").mockImplementation(() => mockDate);

    // Call handleSend
    act(() => {
      result.current.handleSend();
    });

    // Verify the message was sent with correct data
    expect(mockSend).toHaveBeenCalledWith({
      type: "chat_message",
      chat_uuid: mockSelectedUser.chat_uuid,
      recipient_id: mockSelectedUser.user.id,
      content: "Hello",
      timestamp: mockDate.toISOString(),
    });

    // Verify chat list was updated
    expect(mockSetChatUserList).toHaveBeenCalled();

    // Verify message content was cleared
    expect(result.current.messageContent).toBe("");

    // Clean up Date mock
    global.Date.mockRestore();
  });

  it("handles typing activity", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() =>
      useChatInput(mockSelectedUser, mockSetChatUserList)
    );

    act(() => {
      result.current.handleTypingActivity();
    });

    expect(result.current.isTyping).toBe(true);
    expect(mockHandleUserTyping).toHaveBeenCalledWith(
      mockSelectedUser.chat_uuid,
      mockSelectedUser.user.id,
      true
    );

    // Advance timers to test timeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockHandleUserTyping).toHaveBeenCalledWith(
      mockSelectedUser.chat_uuid,
      mockSelectedUser.user.id,
      false
    );

    jest.useRealTimers();
  });
});
