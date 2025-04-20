import { render, screen, fireEvent } from "@testing-library/react";
import ChatUser from "@/components/organisms/Chat/ChatUser/ChatUser";
import useChatUser from "@/components/organisms/Chat/ChatUser/useChatUser";

// Mock the dependencies
jest.mock("@/components/molecules/Chat/ChatHeader/ChatHeader", () => {
  return function MockChatHeader({ selectedUser }) {
    return <div data-testid="chat-header">{selectedUser.user.first_name}</div>;
  };
});

jest.mock("@/components/molecules/Chat/ChatMessage/ChatMessage", () => {
  return function MockChatMessage({ message }) {
    return <div data-testid="chat-message">{message.content}</div>;
  };
});

jest.mock("@/components/molecules/Chat/ChatInput/ChatInput", () => {
  return function MockChatInput() {
    return <div data-testid="chat-input">Chat Input</div>;
  };
});

jest.mock("@/components/organisms/Chat/ChatUser/useChatUser");

describe("ChatUser", () => {
  const mockSetChatUserList = jest.fn();
  const mockSetIsSidebarOpen = jest.fn();
  const mockHandleUserTyping = jest.fn();
  const messagesEndRef = { current: document.createElement("div") };

  const mockSelectedUser = {
    user: {
      id: 1,
      first_name: "John",
      last_name: "Doe",
    },
  };

  const mockChatUserList = [
    {
      user: {
        id: 1,
        first_name: "John",
        last_name: "Doe",
      },
      messages: [
        {
          id: 1,
          content: "Hello",
          is_deleted: "no",
          sender_id: 1,
        },
        {
          id: 2,
          content: "Deleted message",
          is_deleted: "everyone",
          sender_id: 1,
        },
        {
          id: 3,
          content: "Self deleted",
          is_deleted: "self",
          sender_id: 2,
        },
      ],
    },
  ];

  beforeEach(() => {
    useChatUser.mockReturnValue({
      openSettingsId: null,
      setOpenSettingsId: jest.fn(),
      messagesContainerRef: { current: document.createElement("div") },
    });
  });

  it("renders chat components correctly", () => {
    render(
      <ChatUser
        selectedUser={mockSelectedUser}
        setChatUserList={mockSetChatUserList}
        messagesEndRef={messagesEndRef}
        onlineUsers={[]}
        chatUserList={mockChatUserList}
        setIsSidebarOpen={mockSetIsSidebarOpen}
        handleUserTyping={mockHandleUserTyping}
        listOfUsersTyping={[]}
      />
    );

    expect(screen.getByTestId("chat-header")).toBeInTheDocument();
    expect(screen.getByTestId("chat-input")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("shows back button on mobile and handles click", () => {
    render(
      <ChatUser
        selectedUser={mockSelectedUser}
        setChatUserList={mockSetChatUserList}
        messagesEndRef={messagesEndRef}
        onlineUsers={[]}
        chatUserList={mockChatUserList}
        setIsSidebarOpen={mockSetIsSidebarOpen}
        handleUserTyping={mockHandleUserTyping}
        listOfUsersTyping={[]}
      />
    );

    const backButton = screen.getByRole("button");
    fireEvent.click(backButton);
    expect(mockSetIsSidebarOpen).toHaveBeenCalledWith(true);
  });

  it("shows typing indicator when user is typing", () => {
    render(
      <ChatUser
        selectedUser={mockSelectedUser}
        setChatUserList={mockSetChatUserList}
        messagesEndRef={messagesEndRef}
        onlineUsers={[]}
        chatUserList={mockChatUserList}
        setIsSidebarOpen={mockSetIsSidebarOpen}
        handleUserTyping={mockHandleUserTyping}
        listOfUsersTyping={["1"]}
      />
    );

    expect(screen.getByAltText("typing animation")).toBeInTheDocument();
  });

  it("filters out deleted messages correctly", () => {
    render(
      <ChatUser
        selectedUser={mockSelectedUser}
        setChatUserList={mockSetChatUserList}
        messagesEndRef={messagesEndRef}
        onlineUsers={[]}
        chatUserList={mockChatUserList}
        setIsSidebarOpen={mockSetIsSidebarOpen}
        handleUserTyping={mockHandleUserTyping}
        listOfUsersTyping={[]}
      />
    );

    expect(screen.queryByText("Deleted message")).not.toBeInTheDocument();
    expect(screen.queryByText("Self deleted")).not.toBeInTheDocument();
  });
});
