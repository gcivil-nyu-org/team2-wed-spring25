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
import Message from "@/components/molecules/Chat/ChatMessage/ChatMessage";
import useChatMessage from "@/components/molecules/Chat/ChatMessage/useChatMessage";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";

// Mock the dependencies
jest.mock("@/components/molecules/Chat/ChatMessage/useChatMessage");
jest.mock("@/app/custom-components/ToastComponent/NotificationContext");
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => <img {...props} />,
}));

// Mock WebSocket context
jest.mock("@/contexts/WebSocketContext", () => ({
  WebSocketProvider: ({ children }) => children,
  useWebSocket: () => ({
    sendMessage: jest.fn(),
    sendTypingActivity: jest.fn(),
  }),
}));

describe("ChatMessage", () => {
  // Mock localStorage
  const mockUser = { id: 123, name: "Test User" };

  beforeEach(() => {
    // Setup localStorage mock
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue(JSON.stringify(mockUser)),
      setItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  const mockMessage = {
    id: 1,
    content: "Test message",
    sender_id: 123,
    timestamp: new Date().toISOString(),
    read: true,
  };

  const mockProps = {
    message: mockMessage,
    openSettingsId: null,
    setOpenSettingsId: jest.fn(),
    setChatUserList: jest.fn(),
    selectedUser: { user: { id: 456 } },
    messagesContainerRef: { current: document.createElement("div") },
  };

  const mockHookReturn = {
    currentUserId: 123,
    isSettingsOpen: false,
    handleSettingsClick: jest.fn(),
    settingsRef: { current: null },
    handleCopy: jest.fn(),
    handleDelete: jest.fn(),
    handleEdit: jest.fn(),
    isDeleteDialogOpen: false,
    setIsDeleteDialogOpen: jest.fn(),
    deleteMessage: jest.fn(),
    settingsDivDirection: "left-bottom",
    setSettingsDivDirection: jest.fn(),
    isEditDialogOpen: false,
    setIsEditDialogOpen: jest.fn(),
  };

  beforeEach(() => {
    useChatMessage.mockReturnValue(mockHookReturn);
    useNotification.mockReturnValue({ showError: jest.fn() });
  });

  const renderMessage = (props = mockProps) => {
    return render(
      <WebSocketProvider>
        <Message {...props} />
      </WebSocketProvider>
    );
  };

  it("renders message content correctly", () => {
    renderMessage();
    expect(screen.getByText(mockMessage.content)).toBeInTheDocument();
  });

  it("shows settings menu when clicked", () => {
    const { rerender } = renderMessage();

    const settingsButton = screen.getByAltText("arrow");
    fireEvent.click(settingsButton);

    // Update mock to show settings open
    useChatMessage.mockReturnValue({
      ...mockHookReturn,
      isSettingsOpen: true,
    });

    rerender(
      <WebSocketProvider>
        <Message {...mockProps} />
      </WebSocketProvider>
    );

    expect(screen.getByText("Copy")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("shows delete dialog when delete is clicked", () => {
    useChatMessage.mockReturnValue({
      ...mockHookReturn,
      isDeleteDialogOpen: true,
    });

    renderMessage();
    expect(screen.getByText("Delete message?")).toBeInTheDocument();
  });

  it("shows edit dialog when edit is clicked", () => {
    useChatMessage.mockReturnValue({
      ...mockHookReturn,
      isEditDialogOpen: true,
    });

    renderMessage();
    expect(screen.getByText("Edit message")).toBeInTheDocument();
  });

  it("displays correct message status icon", () => {
    renderMessage();
    const statusIcon = screen.getByAltText("Message status");
    expect(statusIcon).toHaveAttribute("src", "/icons/message_seen.svg");
  });

  it("aligns message correctly based on sender", () => {
    renderMessage();
    const messageWrapper = screen.getByTestId("message-wrapper");
    expect(messageWrapper).toHaveClass("justify-end");
  });
});
