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
    id: 1,
    email: "test@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
  });

  it("initializes with correct default values", () => {
    const { result } = renderHook(() =>
      usePostComment(mockComment, 1, 1, false)
    );

    expect(result.current.userHasLiked).toBe(false);
    expect(result.current.likesCount).toBe(0);
    expect(result.current.showCommentReply).toBe(false);
    expect(result.current.isTooltipVisible).toBe(false);
  });

  it("handles like comment action", async () => {
    apiPost.mockResolvedValue({ status: 201 });

    const { result } = renderHook(() =>
      usePostComment(mockComment, 1, 1, false)
    );

    await act(async () => {
      await result.current.throttledHandleOnLikeComment("Like");
    });

    expect(result.current.userHasLiked).toBe(true);
    expect(result.current.likesCount).toBe(1);
    expect(result.current.likeType).toBe("Like");
    expect(apiPost).toHaveBeenCalledWith(
      `/forum/posts/comments/${mockComment.id}/like/`,
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("handles tooltip visibility", () => {
    const { result } = renderHook(() =>
      usePostComment(mockComment, 1, 1, false)
    );

    act(() => {
      result.current.handleMouseEnter();
    });
    expect(result.current.isTooltipVisible).toBe(true);

    act(() => {
      result.current.handleMouseLeave();
    });
    // Use fake timers to test the delayed tooltip hide
    jest.useFakeTimers();
    jest.advanceTimersByTime(100);
    expect(result.current.isTooltipVisible).toBe(false);
    jest.useRealTimers();
  });

  it("handles report comment action", async () => {
    apiPost.mockResolvedValue({ status: 200 });

    const { result } = renderHook(() =>
      usePostComment(mockComment, 1, 1, false)
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
    expect(result.current.showReportCategoryDialog).toBe(false);
    expect(result.current.reportCategorySelectedIndex).toBe(null);
  });

  it("handles error when user is not logged in", async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() =>
      usePostComment(mockComment, 1, 1, false)
    );

    await act(async () => {
      await result.current.throttledHandleOnLikeComment("Like");
    });

    expect(result.current.userHasLiked).toBe(false);
    expect(result.current.likesCount).toBe(0);
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("prevents rapid like clicks with throttling", async () => {
    const { result } = renderHook(() =>
      usePostComment(mockComment, 1, 1, false)
    );

    await act(async () => {
      await result.current.throttledHandleOnLikeComment("Like");
      await result.current.throttledHandleOnLikeComment("Like"); // Should be ignored
    });

    expect(apiPost).toHaveBeenCalledTimes(1);
  });
});
