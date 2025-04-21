import { renderHook, act } from "@testing-library/react";
import useChatMessage from "@/components/molecules/Chat/ChatMessage/useChatMessage";
import { apiPost } from "@/utils/fetch/fetch";

// Mock the fetch utility
jest.mock("@/utils/fetch/fetch", () => ({
  apiPost: jest.fn(),
}));

describe("useChatMessage", () => {
  const mockMessage = {
    id: 1,
    content: "Test message",
    sender_id: 123,
    timestamp: new Date().toISOString(),
  };

  const mockSelectedUser = {
    user: { id: 456 },
  };

  const mockSetOpenSettingsId = jest.fn();
  const mockSetChatUserList = jest.fn();

  beforeEach(() => {
    // Mock localStorage
    const mockUser = { id: 123 };
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => JSON.stringify(mockUser)),
        setItem: jest.fn(),
      },
      writable: true,
    });

    // Mock clipboard API
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: jest.fn(),
      },
      writable: true,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  it("initializes with correct default values", () => {
    const { result } = renderHook(() =>
      useChatMessage(
        mockMessage,
        null,
        mockSetOpenSettingsId,
        mockSetChatUserList,
        mockSelectedUser
      )
    );

    expect(result.current.isSettingsOpen).toBe(false);
    expect(result.current.isEditDialogOpen).toBe(false);
    expect(result.current.isDeleteDialogOpen).toBe(false);
    expect(result.current.settingsDivDirection).toBe("left-bottom");
  });

  it("handles copy message", async () => {
    const { result } = renderHook(() =>
      useChatMessage(
        mockMessage,
        null,
        mockSetOpenSettingsId,
        mockSetChatUserList,
        mockSelectedUser
      )
    );

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      mockMessage.content
    );
  });

  it("handles delete message", async () => {
    const { result } = renderHook(() =>
      useChatMessage(
        mockMessage,
        null,
        mockSetOpenSettingsId,
        mockSetChatUserList,
        mockSelectedUser
      )
    );

    await act(async () => {
      await result.current.deleteMessage("self");
    });

    expect(apiPost).toHaveBeenCalledWith(
      `/chats/chat/${mockMessage.id}/delete/`,
      {
        delete_type: "self",
      }
    );
    expect(mockSetChatUserList).toHaveBeenCalled();
  });

  it("toggles settings visibility", () => {
    const { result } = renderHook(() =>
      useChatMessage(
        mockMessage,
        null,
        mockSetOpenSettingsId,
        mockSetChatUserList,
        mockSelectedUser
      )
    );

    act(() => {
      result.current.handleSettingsClick();
    });

    expect(mockSetOpenSettingsId).toHaveBeenCalledWith(mockMessage.id);
  });
});
