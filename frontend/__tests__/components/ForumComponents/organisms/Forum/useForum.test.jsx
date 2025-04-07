import { renderHook, act } from "@testing-library/react";
import useForum from "@/components/organisms/Forum/useForum";
import { apiGet } from "@/utils/fetch/fetch";

// Mock the fetch utility
jest.mock("@/utils/fetch/fetch", () => ({
  apiGet: jest.fn(),
}));

// Mock NotificationContext
jest.mock("@/app/custom-components/ToastComponent/NotificationContext", () => ({
  useNotification: () => ({
    showError: jest.fn(),
    showSuccess: jest.fn(),
  }),
}));

describe("useForum", () => {
  const mockUser = {
    id: 1,
    name: "Test User",
  };

  const mockPosts = {
    posts: [
      { id: 1, title: "Post 1" },
      { id: 2, title: "Post 2" },
    ],
    has_more: true,
  };

  const mockUserData = {
    karma: 100,
    posts_count: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    const mockLocalStorage = {
      getItem: jest.fn(() => JSON.stringify(mockUser)),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });
    // Mock console methods
    console.error = jest.fn();
    console.log = jest.fn();
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() => useForum());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.userPosts).toEqual([]);
    expect(result.current.hasMore).toBe(true);
  });

  it("fetches initial posts successfully", async () => {
    apiGet.mockResolvedValueOnce(mockPosts);

    const { result } = renderHook(() => useForum());

    expect(apiGet).toHaveBeenCalledWith(
      expect.stringContaining("/forum/posts?user_id=1&offset=0&limit=10")
    );
  });

  it("toggles post input visibility", () => {
    const { result } = renderHook(() => useForum());

    act(() => {
      result.current.handleClick();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.handleClick();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("fetches user data successfully", async () => {
    apiGet.mockResolvedValueOnce(mockPosts).mockResolvedValueOnce(mockUserData);

    const { result } = renderHook(() => useForum());

    expect(apiGet).toHaveBeenCalledWith(
      expect.stringContaining("/forum/posts")
    );
  });

  it("handles no user in localStorage", () => {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => null),
      },
      writable: true,
    });

    const { result } = renderHook(() => useForum());
    expect(result.current.user).toBeNull();
  });

  it("handles settings type parameter", () => {
    apiGet.mockResolvedValueOnce(mockPosts);

    const { result } = renderHook(() => useForum("test-setting"));

    expect(apiGet).toHaveBeenCalledWith(
      expect.stringContaining("settings_type=test-setting")
    );
  });

  it("handles userHeading initialization", () => {
    const { result } = renderHook(() => useForum());
    expect(result.current.userHeading).toBeDefined();
  });
});
