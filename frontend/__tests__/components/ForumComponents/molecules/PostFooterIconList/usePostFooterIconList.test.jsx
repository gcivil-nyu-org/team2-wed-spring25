import { renderHook, act } from "@testing-library/react";
import usePostFooterIconList from "@/components/molecules/PostFooterIconList/usePostFooterIconList";
import { apiPost } from "@/utils/fetch/fetch";

// Mock the fetch utility
jest.mock("@/utils/fetch/fetch", () => ({
  apiPost: jest.fn(),
}));

// Mock NotificationContext
jest.mock("@/app/custom-components/ToastComponent/NotificationContext", () => ({
  useNotification: () => ({
    showError: jest.fn(),
    showWarning: jest.fn(),
    showSuccess: jest.fn(),
  }),
}));

describe("usePostFooterIconList", () => {
  const mockPost = {
    id: 1,
    user_id: 2,
    user_has_liked: false,
    like_type: null,
    title: "Test Post",
    content: "Test Content",
    image_urls: [],
    date_created: "2024-03-20T00:00:00Z",
    user_fullname: "Test User",
    user_avatar: "avatar.jpg",
    user_karma: 100,
    comments_count: 0,
    likes_count: 0,
    is_following_author: false,
    is_repost: false,
  };

  const mockSetPosts = jest.fn();
  let mockLocalStorage;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a proper mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock window.scrollTo
    window.scrollTo = jest.fn();

    // Mock console.error
    console.error = jest.fn();
  });

  it("initializes with post values", () => {
    const { result } = renderHook(() =>
      usePostFooterIconList(mockPost, mockSetPosts)
    );

    expect(result.current.userHasLiked).toBe(mockPost.user_has_liked);
    expect(result.current.likeType).toBe(mockPost.like_type);
  });

  it("handles repost when user is not logged in", async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() =>
      usePostFooterIconList(mockPost, mockSetPosts)
    );

    await act(async () => {
      await result.current.handleRepost();
    });

    expect(apiPost).not.toHaveBeenCalled();
  });

  it("prevents reposting own post", async () => {
    const user = { id: mockPost.user_id };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(user));

    const { result } = renderHook(() =>
      usePostFooterIconList(mockPost, mockSetPosts)
    );

    await act(async () => {
      await result.current.handleRepost();
    });

    expect(apiPost).not.toHaveBeenCalled();
  });

  it("successfully reposts a post", async () => {
    const user = {
      id: 999,
      email: "test@test.com",
      first_name: "Test",
      last_name: "User",
      avatar: "avatar.jpg",
    };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(user));
    apiPost.mockResolvedValue({ status: 201 });

    const { result } = renderHook(() =>
      usePostFooterIconList(mockPost, mockSetPosts)
    );

    await act(async () => {
      await result.current.handleRepost();
    });

    expect(apiPost).toHaveBeenCalledWith("/forum/posts/repost/", {
      user_id: user.id,
      original_post_id: mockPost.id,
    });
    expect(mockSetPosts).toHaveBeenCalled();
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });

  it("handles repost API error", async () => {
    const user = { id: 999 };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(user));
    apiPost.mockRejectedValue(new Error("API Error"));

    const { result } = renderHook(() =>
      usePostFooterIconList(mockPost, mockSetPosts)
    );

    await act(async () => {
      await result.current.handleRepost();
    });

    expect(apiPost).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "Error reposting post",
      expect.any(Error)
    );
  });
});
