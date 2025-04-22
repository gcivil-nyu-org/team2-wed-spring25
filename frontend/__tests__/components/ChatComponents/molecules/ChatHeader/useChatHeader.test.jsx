import { renderHook } from "@testing-library/react";
import useChatHeader from "@/components/molecules/Chat/ChatHeader/useChatHeader";

describe("useChatHeader", () => {
  const mockSelectedUser = {
    user: {
      id: 1,
      first_name: "John",
      last_name: "Doe",
    },
  };

  it("should return user from selected user", () => {
    const { result } = renderHook(() => useChatHeader(mockSelectedUser, []));
    expect(result.current.user).toBe(mockSelectedUser.user);
  });

  it("should return isUserOnline as false when user is not in onlineUsers", () => {
    const { result } = renderHook(() => useChatHeader(mockSelectedUser, []));
    expect(result.current.isUserOnline).toBe(false);
  });

  it("should return isUserOnline as true when user is in onlineUsers", () => {
    const mockOnlineUsers = [{ id: 1 }];
    const { result } = renderHook(() =>
      useChatHeader(mockSelectedUser, mockOnlineUsers)
    );
    expect(result.current.isUserOnline).toBe(true);
  });
});
