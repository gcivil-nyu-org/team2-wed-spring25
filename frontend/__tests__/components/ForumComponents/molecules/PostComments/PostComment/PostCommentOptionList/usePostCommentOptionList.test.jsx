import { renderHook, act } from "@testing-library/react";
import usePostCommentOptionList from "@/components/molecules/PostComments/PostComment/PostCommentOptionList/usePostCommentOptionList";
import { apiDelete } from "@/utils/fetch/fetch";
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext";

// Mock the entire PostCommentOptionList component to avoid SVG imports
jest.mock(
  "@/components/molecules/PostComments/PostComment/PostCommentOptionList/PostCommentOptionList",
  () => ({
    __esModule: true,
    default: () => null,
  })
);

// Mock the API
jest.mock("@/utils/fetch/fetch", () => ({
  apiDelete: jest.fn(),
}));

describe("usePostCommentOptionList", () => {
  const mockProps = {
    post_id: 1,
    comment_id: 2,
    setComments: jest.fn(),
    setCommentsCount: jest.fn(),
  };

  const wrapper = ({ children }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initializes with default values", () => {
    const { result } = renderHook(
      () => usePostCommentOptionList(...Object.values(mockProps)),
      { wrapper }
    );

    expect(result.current.showDeleteCommentDialog).toBe(false);
    expect(result.current.disableButtons).toBe(false);
  });

  it("handles successful comment deletion", async () => {
    apiDelete.mockResolvedValueOnce({ total_deleted: 1 });

    const { result } = renderHook(
      () => usePostCommentOptionList(...Object.values(mockProps)),
      { wrapper }
    );

    await act(async () => {
      const deletePromise = result.current.handleCommentDelete();
      await deletePromise;
    });

    expect(apiDelete).toHaveBeenCalledWith(`/forum/posts/1/comments/2/delete/`);
    expect(mockProps.setComments).toHaveBeenCalled();
    expect(mockProps.setCommentsCount).toHaveBeenCalled();
    expect(result.current.showDeleteCommentDialog).toBe(false);
    expect(result.current.disableButtons).toBe(false);
  });

  it("handles failed comment deletion", async () => {
    apiDelete.mockRejectedValueOnce(new Error("Failed to delete"));

    const { result } = renderHook(
      () => usePostCommentOptionList(...Object.values(mockProps)),
      { wrapper }
    );

    await act(async () => {
      const deletePromise = result.current.handleCommentDelete();
      await deletePromise;
    });

    expect(result.current.showDeleteCommentDialog).toBe(false);
    expect(result.current.disableButtons).toBe(false);
  });

  it("prevents multiple delete requests while processing", async () => {
    // Setup a controlled promise for the API call
    let resolveApi;
    apiDelete.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveApi = () => resolve({ total_deleted: 1 });
        })
    );

    const { result } = renderHook(
      () => usePostCommentOptionList(...Object.values(mockProps)),
      { wrapper }
    );

    // Start first deletion
    let firstDeletePromise;
    await act(async () => {
      firstDeletePromise = result.current.handleCommentDelete();
    });

    // Attempt second deletion while first is in progress
    await act(async () => {
      const secondDeletePromise = result.current.handleCommentDelete();

      // Now resolve the first API call
      resolveApi();

      // Wait for both operations
      await Promise.all([firstDeletePromise, secondDeletePromise]);
    });

    // Should only be called once
    expect(apiDelete).toHaveBeenCalledTimes(1);
  });

  it("toggles delete dialog visibility", async () => {
    const { result } = renderHook(
      () => usePostCommentOptionList(...Object.values(mockProps)),
      { wrapper }
    );

    await act(async () => {
      result.current.setShowDeleteCommentDialog(true);
    });

    expect(result.current.showDeleteCommentDialog).toBe(true);

    await act(async () => {
      result.current.setShowDeleteCommentDialog(false);
    });

    expect(result.current.showDeleteCommentDialog).toBe(false);
  });
});
