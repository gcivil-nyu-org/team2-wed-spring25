import { render, screen, fireEvent } from "@testing-library/react";
import ChatSidebar from "@/components/organisms/Chat/ChatSidebar/ChatSidebar";
import useChatSidebar from "@/components/organisms/Chat/ChatSidebar/useChatSidebar";
import * as datetimeUtils from "@/utils/datetime";

// Mock the custom hook
jest.mock("@/components/organisms/Chat/ChatSidebar/useChatSidebar");
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => <img {...props} />,
}));

describe("ChatSidebar", () => {
  const mockHandleUserSelect = jest.fn();
  const mockSetSelectedUser = jest.fn();
  const mockSetChatUserList = jest.fn();
  const mockSetIsSidebarOpen = jest.fn();

  const mockChatUserList = [
    {
      user: {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        avatar: "/avatar.jpg",
      },
      messages: [
        {
          content: "Hello, how are you?",
          timestamp: "2024-03-20T10:00:00Z",
          is_deleted: "no",
        },
      ],
      unread_count: 2,
      chat_uuid: "123",
    },
    {
      user: {
        id: 2,
        first_name: "Jane",
        last_name: "Smith",
        avatar: "/avatar2.jpg",
      },
      messages: [],
      unread_count: 0,
      chat_uuid: "456",
    },
  ];

  beforeEach(() => {
    useChatSidebar.mockReturnValue({
      handleUserSelect: mockHandleUserSelect,
    });

    // Mock the datetime utility
    jest
      .spyOn(datetimeUtils, "getLastMessageTimeStamp")
      .mockReturnValue("10:00 AM");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders chat list correctly", () => {
    render(
      <ChatSidebar
        chatUserList={mockChatUserList}
        setSelectedUser={mockSetSelectedUser}
        onlineUsers={[]}
        setChatUserList={mockSetChatUserList}
        setIsSidebarOpen={mockSetIsSidebarOpen}
        listOfUsersTyping={[]}
      />
    );

    expect(screen.getByText("Chats")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Hello, how are you?")).toBeInTheDocument();
    expect(screen.getByText("Start conversation")).toBeInTheDocument();
  });

  it("displays unread count badge", () => {
    render(
      <ChatSidebar
        chatUserList={mockChatUserList}
        setSelectedUser={mockSetSelectedUser}
        onlineUsers={[]}
        setChatUserList={mockSetChatUserList}
        setIsSidebarOpen={mockSetIsSidebarOpen}
        listOfUsersTyping={[]}
      />
    );

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("handles user selection", () => {
    render(
      <ChatSidebar
        chatUserList={mockChatUserList}
        setSelectedUser={mockSetSelectedUser}
        onlineUsers={[]}
        setChatUserList={mockSetChatUserList}
        setIsSidebarOpen={mockSetIsSidebarOpen}
        listOfUsersTyping={[]}
      />
    );

    fireEvent.click(screen.getByText("John Doe").closest("div"));
    expect(mockHandleUserSelect).toHaveBeenCalledWith(mockChatUserList[0]);
    expect(mockSetIsSidebarOpen).toHaveBeenCalledWith(false);
  });

  it("displays deleted message text", () => {
    const chatUserListWithDeletedMessage = [
      {
        ...mockChatUserList[0],
        messages: [
          {
            content: "This message was deleted",
            timestamp: "2024-03-20T10:00:00Z",
            is_deleted: "yes",
          },
        ],
      },
    ];

    render(
      <ChatSidebar
        chatUserList={chatUserListWithDeletedMessage}
        setSelectedUser={mockSetSelectedUser}
        onlineUsers={[]}
        setChatUserList={mockSetChatUserList}
        setIsSidebarOpen={mockSetIsSidebarOpen}
        listOfUsersTyping={[]}
      />
    );

    expect(screen.getByText("message deleted")).toBeInTheDocument();
  });
});
