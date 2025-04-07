import { renderHook, act } from "@testing-library/react";
import useUserPostBottom from "@/components/molecules/UserPost/UserPostBottom/useUserPostBottom";
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiPost } from "@/utils/fetch/fetch";

// Mock the API functions
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

describe("useUserPostBottom", () => {
  const mockPost = {
    id: 1,
    user_id: 123,
    is_repost: false,
    is_reported: false,
  };

  const mockSetPosts = jest.fn();
  const mockUser = { id: 456 };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
  });

  const wrapper = ({ children }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  it("initializes with correct default values", () => {
    const { result } = renderHook(
      () => useUserPostBottom(mockPost, mockSetPosts),
      {
        wrapper,
      }
    );

    expect(result.current.showCommentSection).toBe(false);
    expect(result.current.showReportUserDialog).toBe(false);
    expect(result.current.disableYesButton).toBe(false);
    expect(result.current.isReported).toBe(false);
  });

  it("formats comments count correctly", () => {
    const { result } = renderHook(
      () => useUserPostBottom(mockPost, mockSetPosts),
      { wrapper }
    );

    const noComments = result.current.getCommentsCount(0);
    const oneComment = result.current.getCommentsCount(1);
    const multipleComments = result.current.getCommentsCount(2);

    // Check the text content of the paragraph elements
    expect(noComments.props.children).toBe("No comments");
    expect(oneComment.props.children).toEqual([1, " comment"]);
    expect(multipleComments.props.children).toEqual([2, " comments"]);
  });

  it("formats likes count correctly", () => {
    const { result } = renderHook(
      () => useUserPostBottom(mockPost, mockSetPosts),
      { wrapper }
    );

    const noLikes = result.current.getLikesCount(0);
    const oneLike = result.current.getLikesCount(1);
    const multipleLikes = result.current.getLikesCount(2);

    expect(noLikes.props.children).toBe("No likes");
    expect(oneLike.props.children).toEqual([1, " like"]);
    expect(multipleLikes.props.children).toEqual([2, " likes"]);
  });

  it("handles comment section toggle", () => {
    const { result } = renderHook(
      () => useUserPostBottom(mockPost, mockSetPosts),
      {
        wrapper,
      }
    );

    act(() => {
      result.current.handleClickOnComment();
    });

    expect(result.current.showCommentSection).toBe(true);
  });

  it("handles report post successfully", async () => {
    apiPost.mockResolvedValueOnce({ status: 200 });

    const { result } = renderHook(
      () => useUserPostBottom(mockPost, mockSetPosts),
      {
        wrapper,
      }
    );

    await act(async () => {
      await result.current.handleReportPost();
    });

    expect(apiPost).toHaveBeenCalledWith(
      `/forum/posts/${mockPost.id}/report/`,
      expect.any(Object)
    );
    expect(result.current.isReported).toBe(true);
  });

  it("prevents reporting own post", async () => {
    const ownPost = { ...mockPost, user_id: mockUser.id };

    const { result } = renderHook(
      () => useUserPostBottom(ownPost, mockSetPosts),
      {
        wrapper,
      }
    );

    await act(async () => {
      await result.current.handleReportPost();
    });

    expect(apiPost).not.toHaveBeenCalled();
  });

  it("handles click outside report dialog", () => {
    const { result } = renderHook(
      () => useUserPostBottom(mockPost, mockSetPosts),
      { wrapper }
    );

    // Create mock elements
    const dialogElement = document.createElement("div");
    const outsideElement = document.createElement("div");
    document.body.appendChild(dialogElement);
    document.body.appendChild(outsideElement);

    // Set up the ref
    result.current.handleShowReportUserDialogRef.current = dialogElement;

    act(() => {
      result.current.setShowReportUserDialog(true);
    });

    // Simulate click outside
    act(() => {
      const event = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, "target", { value: outsideElement });
      document.dispatchEvent(event);
    });

    expect(result.current.showReportUserDialog).toBe(false);

    // Cleanup
    document.body.removeChild(dialogElement);
    document.body.removeChild(outsideElement);
  });
});
