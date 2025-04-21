import { renderHook } from "@testing-library/react";
import useChatSidebar from "@/components/organisms/Chat/ChatSidebar/useChatSidebar";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { apiPost } from "@/utils/fetch/fetch";

// Mock dependencies
jest.mock("@/contexts/WebSocketContext");
jest.mock("@/utils/fetch/fetch");

describe("useChatSidebar", () => {
  const mockSetSelectedUser = jest.fn();
  const mockSetChatUserList = jest.fn();
  const mockHandleUserSelection = jest.fn();

  beforeEach(() => {
    useWebSocket.mockReturnValue({
      handleUserSelection: mockHandleUserSelection,
    });
    apiPost.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("handles user selection with no unread messages", async () => {
    const { result } = renderHook(() =>
      useChatSidebar({
        setSelectedUser: mockSetSelectedUser,
        setChatUserList: mockSetChatUserList,
      })
    );

    const mockChat = {
      chat_uuid: "123",
      user: { id: 1 },
      unread_count: 0,
    };

    await result.current.handleUserSelect(mockChat);

    expect(mockSetSelectedUser).toHaveBeenCalledWith(mockChat);
    expect(apiPost).not.toHaveBeenCalled();
    expect(mockHandleUserSelection).not.toHaveBeenCalled();
  });

  it("handles user selection with unread messages", async () => {
    const { result } = renderHook(() =>
      useChatSidebar({
        setSelectedUser: mockSetSelectedUser,
        setChatUserList: mockSetChatUserList,
      })
    );

    const mockChat = {
      chat_uuid: "123",
      user: { id: 1 },
      unread_count: 2,
      messages: [
        { id: 1, read: false },
        { id: 2, read: false },
      ],
    };

    await result.current.handleUserSelect(mockChat);

    expect(mockSetSelectedUser).toHaveBeenCalledWith(mockChat);
    expect(apiPost).toHaveBeenCalledWith(
      `/chats/${mockChat.chat_uuid}/read/${mockChat.user.id}/`
    );
    expect(mockSetChatUserList).toHaveBeenCalled();
    expect(mockHandleUserSelection).toHaveBeenCalledWith(
      mockChat.chat_uuid,
      mockChat.user.id
    );
  });

  it("handles API error gracefully", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    apiPost.mockRejectedValue(new Error("API Error"));

    const { result } = renderHook(() =>
      useChatSidebar({
        setSelectedUser: mockSetSelectedUser,
        setChatUserList: mockSetChatUserList,
      })
    );

    const mockChat = {
      chat_uuid: "123",
      user: { id: 1 },
      unread_count: 2,
    };

    await result.current.handleUserSelect(mockChat);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error selecting user:",
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });
});
