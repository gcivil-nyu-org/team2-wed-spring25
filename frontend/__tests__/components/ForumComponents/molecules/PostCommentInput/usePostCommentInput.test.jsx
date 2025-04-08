import { renderHook, act } from "@testing-library/react";
import usePostCommentInput from "@/components/molecules/PostCommentInput/usePostCommentInput";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiPost } from "@/utils/fetch/fetch";

// Mock dependencies
jest.mock("@/utils/fetch/fetch", () => ({
  apiPost: jest.fn(),
}));

jest.mock("@/app/custom-components/ToastComponent/NotificationContext", () => ({
  useNotification: jest.fn(),
}));

describe("usePostCommentInput", () => {
  const mockSetCommentsCount = jest.fn();
  const mockSetComments = jest.fn();
  const mockSetRepliesCount = jest.fn();
  const mockSetIsInputVisible = jest.fn();
  const mockShowError = jest.fn();
  const mockShowSuccess = jest.fn();

  const defaultProps = {
    post_id: "123",
    setCommentsCount: mockSetCommentsCount,
    setComments: mockSetComments,
    is_repost: false,
    original_post_id: null,
    is_reply: false,
    parent_comment_id: null,
    setRepliesCount: mockSetRepliesCount,
    initialContent: "",
    isEdit: false,
    setIsInputVisible: mockSetIsInputVisible,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useNotification.mockImplementation(() => ({
      showError: mockShowError,
      showSuccess: mockShowSuccess,
    }));

    // Mock localStorage
    const mockUser = {
      id: 1,
      first_name: "Test",
      last_name: "User",
      email: "test@example.com",
    };
    Storage.prototype.getItem = jest.fn(() => JSON.stringify(mockUser));
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() => usePostCommentInput(defaultProps));

    expect(result.current.commentContent).toBe("");
    expect(result.current.isButtonDisabled).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.showEmojiPicker).toBe(false);
  });

  it("updates comment content", () => {
    const { result } = renderHook(() => usePostCommentInput(defaultProps));

    act(() => {
      result.current.setCommentContent("New comment");
    });

    expect(result.current.commentContent).toBe("New comment");
  });

  it("handles empty comment submission", async () => {
    const { result } = renderHook(() => usePostCommentInput(defaultProps));

    await act(async () => {
      await result.current.handleCommentSubmit();
    });

    expect(mockShowError).toHaveBeenCalledWith(
      "Please enter a comment, cannot be empty."
    );
    expect(apiPost).not.toHaveBeenCalled();
  });

  it("handles successful comment submission", async () => {
    apiPost.mockResolvedValueOnce({ id: "456" });
    const { result } = renderHook(() =>
      usePostCommentInput(
        "123", // post_id
        mockSetCommentsCount,
        mockSetComments,
        false, // is_repost
        null, // original_post_id
        false, // is_reply
        null, // parent_comment_id
        mockSetRepliesCount,
        "", // initialContent
        false, // isEdit
        mockSetIsInputVisible
      )
    );

    act(() => {
      result.current.setCommentContent("Valid comment");
    });

    await act(async () => {
      await result.current.handleCommentSubmit();
    });

    expect(mockShowSuccess).toHaveBeenCalledWith(
      "Comment submitted successfully"
    );
    expect(mockSetCommentsCount).toHaveBeenCalledWith(expect.any(Function));
    expect(mockSetComments).toHaveBeenCalledWith(expect.any(Function));
    expect(result.current.commentContent).toBe("");
  });

  it("handles comment editing", async () => {
    apiPost.mockResolvedValueOnce({ id: "789" });
    const { result } = renderHook(() =>
      usePostCommentInput(
        "123", // post_id
        mockSetCommentsCount,
        mockSetComments,
        false, // is_repost
        null, // original_post_id
        false, // is_reply
        "789", // parent_comment_id
        null, // setRepliesCount
        "Original", // initialContent
        true, // isEdit
        mockSetIsInputVisible
      )
    );

    act(() => {
      result.current.setCommentContent("Edited comment");
    });

    await act(async () => {
      await result.current.handleCommentSubmit();
    });

    expect(mockShowSuccess).toHaveBeenCalledWith("Comment edited successfully");
    expect(mockSetIsInputVisible).toHaveBeenCalledWith(false);
    expect(mockSetComments).toHaveBeenCalledWith(expect.any(Function));
    // Don't expect setCommentsCount to be called during edit
    expect(mockSetCommentsCount).not.toHaveBeenCalled();
  });

  it("handles API errors", async () => {
    apiPost.mockRejectedValueOnce(new Error("API Error"));
    const { result } = renderHook(() => usePostCommentInput(defaultProps));

    act(() => {
      result.current.setCommentContent("Valid comment");
    });

    await act(async () => {
      await result.current.handleCommentSubmit();
    });

    expect(mockShowError).toHaveBeenCalledWith(
      "Failed to submit comment. Please try again."
    );
  });
});
