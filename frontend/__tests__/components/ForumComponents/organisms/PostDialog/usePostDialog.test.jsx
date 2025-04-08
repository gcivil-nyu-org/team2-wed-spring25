import { renderHook, act } from "@testing-library/react";
import { usePostDialog } from "@/components/organisms/PostDialog/usePostDialog";
import { apiPost } from "@/utils/fetch/fetch";
import uploadImage from "@/utils/uploadImage";

// Mock the dependencies
jest.mock("@/utils/fetch/fetch", () => ({
  apiPost: jest.fn(),
}));

jest.mock("@/utils/uploadImage", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockShowError = jest.fn();
jest.mock("@/app/custom-components/ToastComponent/NotificationContext", () => ({
  useNotification: () => ({
    showError: mockShowError,
  }),
}));

describe("usePostDialog", () => {
  const mockProps = {
    setPosts: jest.fn(),
    onClick: jest.fn(),
    is_edit: false,
    post_id: 0,
    content: "",
    setIsPostDialogOpen: jest.fn(),
    is_repost: false,
    original_post_id: 0,
  };

  const mockUser = {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    avatar: "avatar.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const mockLocalStorage = {
      getItem: jest.fn(() => JSON.stringify(mockUser)),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
    console.error = jest.fn();
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() =>
      usePostDialog(...Object.values(mockProps))
    );

    expect(result.current.postContent).toBe("");
    expect(result.current.isButtonDisabled).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("initializes with edit content when is_edit is true", () => {
    const editProps = { ...mockProps, is_edit: true, content: "Edit content" };
    const { result } = renderHook(() =>
      usePostDialog(...Object.values(editProps))
    );

    expect(result.current.postContent).toBe("Edit content");
  });

  it("updates post content", () => {
    const { result } = renderHook(() =>
      usePostDialog(...Object.values(mockProps))
    );

    act(() => {
      result.current.setPostContent("New content");
    });

    expect(result.current.postContent).toBe("New content");
  });

  it("validates empty content submission", async () => {
    const { result } = renderHook(() =>
      usePostDialog(...Object.values(mockProps))
    );

    await act(async () => {
      await result.current.handleSubmit(null, mockProps.onClick);
    });

    expect(mockShowError).toHaveBeenCalledWith(
      "Post content or image is required."
    );
  });

  it("validates content length", async () => {
    const { result } = renderHook(() =>
      usePostDialog(...Object.values(mockProps))
    );

    act(() => {
      result.current.setPostContent("a".repeat(801));
    });

    await act(async () => {
      await result.current.handleSubmit(null, mockProps.onClick);
    });

    expect(mockShowError).toHaveBeenCalledWith(
      "Post content must be less than 800 characters."
    );
  });

  it("handles missing user data", async () => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => null),
      },
      writable: true,
    });

    const { result } = renderHook(() =>
      usePostDialog(...Object.values(mockProps))
    );

    await act(async () => {
      await result.current.handleSubmit("test content", mockProps.onClick);
    });

    expect(mockShowError).toHaveBeenCalledWith("Please login to post.");
  });

  it("handles image upload for new images", async () => {
    uploadImage.mockResolvedValueOnce("uploaded-image-url");
    apiPost.mockResolvedValueOnce({ id: 1, user: { karma: 100 } });

    const { result } = renderHook(() =>
      usePostDialog(...Object.values(mockProps))
    );

    await act(async () => {
      await result.current.handleSubmit("new-image.jpg", mockProps.onClick);
    });

    expect(uploadImage).toHaveBeenCalledWith("new-image.jpg");
  });

  it("handles existing image URLs", async () => {
    apiPost.mockResolvedValueOnce({ id: 1, user: { karma: 100 } });

    const { result } = renderHook(() =>
      usePostDialog(...Object.values(mockProps))
    );

    await act(async () => {
      await result.current.handleSubmit(
        "https://example.com/image.jpg",
        mockProps.onClick
      );
    });

    expect(uploadImage).not.toHaveBeenCalled();
  });

  it("handles post editing", async () => {
    const editProps = {
      ...mockProps,
      is_edit: true,
      post_id: 123,
      content: "Original content",
    };

    apiPost.mockResolvedValueOnce({ id: 123, user: { karma: 100 } });

    const { result } = renderHook(() =>
      usePostDialog(...Object.values(editProps))
    );

    await act(async () => {
      await result.current.handleSubmit(null, editProps.onClick);
    });

    expect(apiPost).toHaveBeenCalledWith(
      "/forum/posts/create/",
      expect.objectContaining({
        is_edit: true,
        post_id: 123,
      }),
      expect.any(Object)
    );
  });

  it("handles repost submission", async () => {
    const repostProps = {
      ...mockProps,
      is_repost: true,
      original_post_id: 456,
    };

    apiPost.mockResolvedValueOnce({ id: 789, user: { karma: 100 } });

    const { result } = renderHook(() =>
      usePostDialog(...Object.values(repostProps))
    );

    act(() => {
      result.current.setPostContent("Test repost content");
    });

    await act(async () => {
      await result.current.handleSubmit("test.jpg", repostProps.onClick);
    });

    expect(apiPost).toHaveBeenCalledWith(
      "/forum/posts/create/",
      {
        content: "Test repost content",
        image_urls: [],
        is_edit: false,
        post_id: 456,
        user_id: 1,
      },
      { headers: { "Content-Type": "application/json" } }
    );
  });

  it("closes dialog after successful submission", async () => {
    apiPost.mockResolvedValueOnce({ id: 1, user: { karma: 100 } });

    const { result } = renderHook(() =>
      usePostDialog(...Object.values(mockProps))
    );

    await act(async () => {
      await result.current.handleSubmit("test content", mockProps.onClick);
    });

    expect(mockProps.setIsPostDialogOpen).toHaveBeenCalledWith(false);
  });

  it("handles API errors during submission", async () => {
    const mockError = new Error("Network error");
    apiPost.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() =>
      usePostDialog(...Object.values(mockProps))
    );

    act(() => {
      result.current.setPostContent("Test content");
    });

    await act(async () => {
      try {
        await result.current.handleSubmit("test.jpg", mockProps.onClick);
      } catch (error) {
        // Catch the error to prevent it from failing the test
      }
    });

    expect(mockShowError).toHaveBeenCalledWith(
      "Failed to submit post. Please try again."
    );
  });
});
