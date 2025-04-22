import { render, screen } from "@testing-library/react";
import ChatHeader from "@/components/molecules/Chat/ChatHeader/ChatHeader";

// Mock the custom hook
jest.mock("@/components/molecules/Chat/ChatHeader/useChatHeader", () => ({
  __esModule: true,
  default: jest.fn((selectedUser, onlineUsers) => ({
    user: selectedUser.user,
    isUserOnline: onlineUsers.some((u) => u.id === selectedUser.user.id),
  })),
}));

// Mock the UserImage component
jest.mock("@/components/atom/UserImage/UserImage", () => {
  return function MockUserImage({ imageUrl, width, height }) {
    return (
      <img
        src={imageUrl}
        width={width}
        height={height}
        alt="user avatar"
        data-testid="user-image"
      />
    );
  };
});

describe("ChatHeader", () => {
  const mockSelectedUser = {
    user: {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      avatar: "https://example.com/avatar.jpg",
    },
  };

  it("renders user name correctly", () => {
    render(
      <ChatHeader
        selectedUser={mockSelectedUser}
        onlineUsers={[]}
        listOfUsersTyping={[]}
      />
    );
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("shows offline status when user is not online", () => {
    render(
      <ChatHeader
        selectedUser={mockSelectedUser}
        onlineUsers={[]}
        listOfUsersTyping={[]}
      />
    );
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("shows online status when user is online", () => {
    render(
      <ChatHeader
        selectedUser={mockSelectedUser}
        onlineUsers={[{ id: 1 }]}
        listOfUsersTyping={[]}
      />
    );
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("shows typing status when user is typing", () => {
    render(
      <ChatHeader
        selectedUser={mockSelectedUser}
        onlineUsers={[{ id: 1 }]}
        listOfUsersTyping={["1"]}
      />
    );
    expect(screen.getByText("typing...")).toBeInTheDocument();
  });

  it("renders UserImage component with correct props", () => {
    render(
      <ChatHeader
        selectedUser={mockSelectedUser}
        onlineUsers={[]}
        listOfUsersTyping={[]}
      />
    );
    const image = screen.getByTestId("user-image");
    expect(image).toHaveAttribute("src", mockSelectedUser.user.avatar);
    expect(image).toHaveAttribute("width", "40");
    expect(image).toHaveAttribute("height", "40");
  });
});
