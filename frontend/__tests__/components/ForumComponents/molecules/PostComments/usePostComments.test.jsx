import { renderHook, act } from "@testing-library/react";
import usePostComments from "@/components/molecules/PostComments/usePostComments";
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext";
import { apiGet } from "@/utils/fetch/fetch";

// Mock the API get function
jest.mock("@/utils/fetch/fetch", () => ({
  apiGet: jest.fn(),
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

describe("usePostComments", () => {
  const mockUser = {
    id: 123,
    email: "test@example.com",
  };

  const mockComments = [
    { id: 1, content: "Comment 1" },
    { id: 2, content: "Comment 2" },
    { id: 3, content: "Comment 3" },
    { id: 4, content: "Comment 4" },
    { id: 5, content: "Comment 5" },
  ];

  const setComments = jest.fn();
  const setCommentsCount = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));
    apiGet.mockResolvedValue({ comments: mockComments });
  });

  const wrapper = ({ children }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  it("initializes with correct default values", async () => {
    const { result } = renderHook(
      () =>
        usePostComments(
          1,
          [],
          setComments,
          setCommentsCount,
          false,
          1,
          false,
          null
        ),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasMore).toBe(true);
  });

  it("handles load more comments", async () => {
    const { result } = renderHook(
      () =>
        usePostComments(
          1,
          [],
          setComments,
          setCommentsCount,
          false,
          1,
          false,
          null
        ),
      { wrapper }
    );

    await act(async () => {
      result.current.loadMoreComments();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(apiGet).toHaveBeenCalledWith(expect.stringContaining("page=2"));
  });

  it("handles error when user is not logged in", async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(
      () =>
        usePostComments(
          1,
          [],
          setComments,
          setCommentsCount,
          false,
          1,
          false,
          null
        ),
      { wrapper }
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(setComments).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("handles API error", async () => {
    apiGet.mockRejectedValue(new Error("API Error"));

    const { result } = renderHook(
      () =>
        usePostComments(
          1,
          [],
          setComments,
          setCommentsCount,
          false,
          1,
          false,
          null
        ),
      { wrapper }
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(setComments).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});
