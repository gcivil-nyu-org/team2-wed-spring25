import { renderHook, act } from "@testing-library/react";
import useLikeIconTextWithTooltip from "@/components/molecules/LikeIconTextWithTooltip/useLikeIconTextWithTooltip";
import { apiPost } from "@/utils/fetch/fetch";

// Mock the API post function
jest.mock("@/utils/fetch/fetch", () => ({
  apiPost: jest.fn(),
}));

// Mock the notification context
jest.mock("@/app/custom-components/ToastComponent/NotificationContext", () => ({
  useNotification: () => ({
    showError: jest.fn(),
    showSuccess: jest.fn(),
  }),
}));

describe("useLikeIconTextWithTooltip", () => {
  const mockSetUserHasLiked = jest.fn();
  const mockSetLikeType = jest.fn();
  const mockSetLikesCount = jest.fn();

  const defaultProps = {
    post_id: "123",
    userHasLiked: false,
    likeType: null,
    setUserHasLiked: mockSetUserHasLiked,
    setLikeType: mockSetLikeType,
    setLikesCount: mockSetLikesCount,
    is_repost: false,
    original_post_id: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    const mockUser = { id: "user123" };
    Storage.prototype.getItem = jest.fn(() => JSON.stringify(mockUser));
  });

  it("initializes with correct default values", () => {
    const { result } = renderHook(() =>
      useLikeIconTextWithTooltip(...Object.values(defaultProps))
    );

    expect(result.current.isTooltipVisible).toBe(false);
    expect(result.current.userHasLiked).toBe(false);
  });

  it("handles mouse enter and leave", async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() =>
      useLikeIconTextWithTooltip(...Object.values(defaultProps))
    );

    act(() => {
      result.current.handleMouseEnter();
    });
    expect(result.current.isTooltipVisible).toBe(true);

    act(() => {
      result.current.handleMouseLeave();
      // Need to wrap the timer in act
      jest.runAllTimers();
    });

    expect(result.current.isTooltipVisible).toBe(false);

    jest.useRealTimers();
  });

  it("handles successful like action", async () => {
    apiPost.mockResolvedValueOnce({ status: 201 });

    const { result } = renderHook(() =>
      useLikeIconTextWithTooltip(...Object.values(defaultProps))
    );

    await act(async () => {
      await result.current.throttledHandleOnLike("Like");
    });

    expect(mockSetUserHasLiked).toHaveBeenCalledWith(true);
    expect(mockSetLikeType).toHaveBeenCalledWith("Like");
    expect(mockSetLikesCount).toHaveBeenCalled();
  });

  it("handles like type change", async () => {
    apiPost.mockResolvedValueOnce({ status: 201 });

    const { result } = renderHook(() =>
      useLikeIconTextWithTooltip(
        "123",
        true,
        "Like",
        mockSetUserHasLiked,
        mockSetLikeType,
        mockSetLikesCount,
        false,
        null
      )
    );

    await act(async () => {
      await result.current.throttledHandleOnLike("Heart");
    });

    expect(mockSetLikeType).toHaveBeenCalledWith("Heart");
  });

  it("handles unlike action", async () => {
    apiPost.mockResolvedValueOnce({ status: 201 });

    const { result } = renderHook(() =>
      useLikeIconTextWithTooltip(
        "123",
        true,
        "Like",
        mockSetUserHasLiked,
        mockSetLikeType,
        mockSetLikesCount,
        false,
        null
      )
    );

    await act(async () => {
      await result.current.throttledHandleOnLike("Like");
    });

    expect(mockSetUserHasLiked).toHaveBeenCalledWith(false);
    expect(mockSetLikesCount).toHaveBeenCalled();
  });

  it("handles error when user is not logged in", async () => {
    Storage.prototype.getItem = jest.fn(() => null);

    const { result } = renderHook(() =>
      useLikeIconTextWithTooltip(...Object.values(defaultProps))
    );

    await act(async () => {
      await result.current.throttledHandleOnLike("Like");
    });

    // The function returns early when user is not found
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("prevents rapid like clicks with throttling", async () => {
    const mockUser = { id: 1 };
    Storage.prototype.getItem = jest.fn(() => JSON.stringify(mockUser));
    apiPost.mockResolvedValueOnce({ status: 201 });

    const { result } = renderHook(() =>
      useLikeIconTextWithTooltip(...Object.values(defaultProps))
    );

    await act(async () => {
      await result.current.throttledHandleOnLike("Like");
    });

    expect(apiPost).toHaveBeenCalledTimes(1);

    // Try second click immediately
    await act(async () => {
      await result.current.throttledHandleOnLike("Like");
    });

    // Should still only be called once due to throttling
    expect(apiPost).toHaveBeenCalledTimes(1);
  });

  it("handles API errors", async () => {
    // Mock localStorage with valid user
    const mockUser = { id: 1 };
    Storage.prototype.getItem = jest.fn(() => JSON.stringify(mockUser));

    // Mock API to fail
    apiPost.mockRejectedValueOnce(new Error("API Error"));

    const { result } = renderHook(() =>
      useLikeIconTextWithTooltip(
        "123",
        false,
        null,
        mockSetUserHasLiked,
        mockSetLikeType,
        mockSetLikesCount,
        false,
        null
      )
    );

    // Trigger the like action
    await act(async () => {
      await result.current.throttledHandleOnLike("Like");
    });

    // Just verify that the API was called and some state updates happened
    expect(apiPost).toHaveBeenCalled();
    expect(mockSetLikesCount).toHaveBeenCalled();
    expect(mockSetUserHasLiked).toHaveBeenCalled();
  });
});
