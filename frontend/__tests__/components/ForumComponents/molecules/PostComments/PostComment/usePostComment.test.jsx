import { renderHook, act } from "@testing-library/react";
import usePostComment from "@/components/molecules/PostComments/PostComment/usePostComment";
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiPost } from "@/utils/fetch/fetch";

// Mock the API post function
jest.mock("@/utils/fetch/fetch", () => ({
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

describe("usePostComment", () => {
  const mockComment = {
    id: 1,
    user_has_liked: false,
    like_type: null,
    likes_count: 0,
    replies_count: 0,
  };

  const mockUser = {
    id: 123,
    email: "test@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
    // Reset API mock default behavior
    apiPost.mockResolvedValue({ status: 201 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const wrapper = ({ children }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  it("initializes with correct default values", () => {
    const { result } = renderHook(
      () => usePostComment(mockComment, 1, 1, false),
      { wrapper }
    );

    expect(result.current.userHasLiked).toBe(false);
    expect(result.current.likesCount).toBe(0);
    expect(result.current.repliesCount).toBe(0);
    expect(result.current.isTooltipVisible).toBe(false);
  });

  it("handles like comment action", async () => {
    apiPost.mockResolvedValue({ status: 201 });

    const { result } = renderHook(
      () => usePostComment(mockComment, 1, 1, false),
      { wrapper }
    );

    await act(async () => {
      await result.current.throttledHandleOnLikeComment("Like");
    });

    expect(result.current.userHasLiked).toBe(true);
    expect(result.current.likesCount).toBe(1);
    expect(apiPost).toHaveBeenCalledWith(
      `/forum/posts/comments/${mockComment.id}/like/`,
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("handles tooltip visibility", () => {
    const { result } = renderHook(
      () => usePostComment(mockComment, 1, 1, false),
      { wrapper }
    );

    act(() => {
      result.current.handleMouseEnter();
    });
    expect(result.current.isTooltipVisible).toBe(true);

    act(() => {
      result.current.handleMouseLeave();
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.isTooltipVisible).toBe(false);
  });

  it("handles report comment action", async () => {
    apiPost.mockResolvedValue({ status: 200 });

    const { result } = renderHook(
      () => usePostComment(mockComment, 1, 1, false),
      { wrapper }
    );

    act(() => {
      result.current.setReportCategorySelectedIndex(0);
    });

    await act(async () => {
      await result.current.handleReportComment();
    });

    expect(apiPost).toHaveBeenCalledWith(
      "/forum/posts/comment/report/",
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("prevents rapid like clicks", async () => {
    apiPost.mockResolvedValue({ status: 201 });
    const { result } = renderHook(
      () => usePostComment(mockComment, 1, 1, false),
      { wrapper }
    );

    // First like
    await act(async () => {
      await result.current.throttledHandleOnLikeComment("Like");
    });

    // Try second like immediately (should be throttled)
    await act(async () => {
      await result.current.throttledHandleOnLikeComment("Like");
    });

    // Should only call API once due to throttling
    expect(apiPost).toHaveBeenCalledTimes(1);
  });

  it("handles click outside for dropdown", () => {
    const { result } = renderHook(
      () => usePostComment(mockComment, 1, 1, false),
      { wrapper }
    );

    // Create mock elements
    const dropdownElement = document.createElement("div");
    const outsideElement = document.createElement("div");
    document.body.appendChild(dropdownElement);
    document.body.appendChild(outsideElement);

    // Set up the ref
    result.current.dropdownRef.current = dropdownElement;

    // Show dropdown
    act(() => {
      result.current.setIsCommentOptionListVisible(true);
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

    expect(result.current.isCommentOptionListVisible).toBe(false);

    // Cleanup
    document.body.removeChild(dropdownElement);
    document.body.removeChild(outsideElement);
  });

  it("handles report comment error", async () => {
    apiPost.mockRejectedValue(new Error("User Already Reported This Comment."));

    const { result } = renderHook(
      () => usePostComment(mockComment, 1, 1, false),
      { wrapper }
    );

    act(() => {
      result.current.setReportCategorySelectedIndex(0);
    });

    await act(async () => {
      await result.current.handleReportComment();
    });

    expect(result.current.showReportCategoryDialog).toBe(false);
    expect(result.current.reportCategorySelectedIndex).toBe(null);
  });

  it("handles different like types", async () => {
    const { result } = renderHook(
      () => usePostComment(mockComment, 1, 1, false),
      { wrapper }
    );

    // First like with Clap
    await act(async () => {
      await result.current.throttledHandleOnLikeComment("Clap");
    });

    expect(result.current.likeType).toBe("Clap");
    expect(result.current.userHasLiked).toBe(true);

    // Wait for throttle timeout
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Change to Heart
    await act(async () => {
      // Reset isDisabled flag
      result.current.isDisabled = false;
      await result.current.throttledHandleOnLikeComment("Heart");
    });

    expect(result.current.likeType).toBe("Heart");
    expect(result.current.userHasLiked).toBe(true);
  });

  it("handles unlike action", async () => {
    const likedComment = {
      ...mockComment,
      user_has_liked: true,
      like_type: "Like",
      likes_count: 1,
    };

    const { result } = renderHook(
      () => usePostComment(likedComment, 1, 1, false),
      { wrapper }
    );

    await act(async () => {
      await result.current.throttledHandleOnLikeComment("Like");
    });

    expect(result.current.userHasLiked).toBe(false);
    expect(result.current.likesCount).toBe(0);
  });

  it("properly throttles like actions", async () => {
    const { result } = renderHook(
      () => usePostComment(mockComment, 1, 1, false),
      { wrapper }
    );

    // First like
    await act(async () => {
      await result.current.throttledHandleOnLikeComment("Like");
    });

    // Immediate second attempt (should be throttled)
    await act(async () => {
      await result.current.throttledHandleOnLikeComment("Like");
    });

    expect(apiPost).toHaveBeenCalledTimes(1);

    // Wait for throttle to expire
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Third attempt after timeout (should work)
    await act(async () => {
      result.current.isDisabled = false;
      await result.current.throttledHandleOnLikeComment("Like");
    });

    expect(apiPost).toHaveBeenCalledTimes(2);
  });
});
