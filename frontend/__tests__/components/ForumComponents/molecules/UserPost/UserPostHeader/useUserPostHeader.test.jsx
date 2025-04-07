import { renderHook, act } from "@testing-library/react";
import useUserPostHeader from "@/components/molecules/UserPost/UserPostHeader/useUserPostHeader";
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiDelete, apiPost } from "@/utils/fetch/fetch";

// Mock the API functions
jest.mock("@/utils/fetch/fetch", () => ({
  apiDelete: jest.fn(),
  apiPost: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("useUserPostHeader", () => {
  const mockUser = { id: 123 };
  const mockSetPosts = jest.fn();
  const post_user_id = 456;
  const post_id = 789;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
  });

  const wrapper = ({ children }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  it("initializes with correct default values", () => {
    const { result } = renderHook(
      () => useUserPostHeader(post_user_id, mockSetPosts, post_id),
      { wrapper }
    );

    expect(result.current.isFollowButtonDisabled).toBe(false);
    expect(result.current.isPostOptionListVisible).toBe(false);
    expect(result.current.deletePostConfirmation).toBe(false);
    expect(result.current.isDeleteInProgress).toBe(false);
    expect(result.current.isPostDialogOpen).toBe(false);
  });

  it("loads user ID from localStorage on mount", async () => {
    const { result } = renderHook(
      () => useUserPostHeader(post_user_id, mockSetPosts, post_id),
      { wrapper }
    );

    expect(result.current.user_id).toBe(mockUser.id);
  });

  it("handles follow action successfully", async () => {
    const { result } = renderHook(
      () => useUserPostHeader(post_user_id, mockSetPosts, post_id),
      { wrapper }
    );

    apiPost.mockResolvedValueOnce({ status: 200 });

    await act(async () => {
      await result.current.throttledHandleOnFollow(true);
    });

    expect(apiPost).toHaveBeenCalledWith(
      `/forum/posts/follow/${post_user_id}/`,
      expect.any(Object)
    );
    expect(mockSetPosts).toHaveBeenCalled();
  });

  it("handles delete post action successfully", async () => {
    const { result } = renderHook(
      () => useUserPostHeader(post_user_id, mockSetPosts, post_id),
      { wrapper }
    );

    apiDelete.mockResolvedValueOnce({ status: 200 });

    await act(async () => {
      await result.current.handleDeletePost();
    });

    expect(apiDelete).toHaveBeenCalledWith(`/forum/posts/${post_id}/delete/`);
    expect(mockSetPosts).toHaveBeenCalled();
    expect(result.current.isDeleteInProgress).toBe(false);
    expect(result.current.deletePostConfirmation).toBe(false);
  });

  it("handles click outside for post options", () => {
    const { result } = renderHook(
      () => useUserPostHeader(post_user_id, mockSetPosts, post_id),
      { wrapper }
    );

    // Create mock elements
    const optionsElement = document.createElement("div");
    const outsideElement = document.createElement("div");
    document.body.appendChild(optionsElement);
    document.body.appendChild(outsideElement);

    // Set up the ref
    result.current.postOptionListRef.current = optionsElement;

    // Show options
    act(() => {
      result.current.setIsPostOptionListVisible(true);
    });

    // Click outside
    act(() => {
      const event = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, "target", { value: outsideElement });
      document.dispatchEvent(event);
    });

    expect(result.current.isPostOptionListVisible).toBe(false);

    // Cleanup
    document.body.removeChild(optionsElement);
    document.body.removeChild(outsideElement);
  });
});
