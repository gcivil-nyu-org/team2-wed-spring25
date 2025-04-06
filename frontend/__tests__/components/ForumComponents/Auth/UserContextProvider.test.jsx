import { render, screen, act, waitFor } from "@testing-library/react";
import { UserProvider, useUser } from "@/components/Auth/UserContextProvider";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/utils/fetch/fetch";

// Mock next-auth
jest.mock("next-auth/react");

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock fetch utilities
jest.mock("@/utils/fetch/fetch", () => ({
  authAPI: {
    authenticatedGet: jest.fn(),
  },
}));

// Mock router
const mockPush = jest.fn();
const mockRouter = { push: mockPush };

// Test component to access context
function TestComponent() {
  const { user, isLoading, error, isAuthenticated } = useUser();
  return (
    <div>
      {isLoading && <div data-testid="loading">Loading...</div>}
      {error && <div data-testid="error">{error}</div>}
      {user && <div data-testid="user">{user.email}</div>}
      <div data-testid="auth-status">
        {isAuthenticated ? "Authenticated" : "Not authenticated"}
      </div>
    </div>
  );
}

describe("UserProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue(mockRouter);
    localStorage.clear();
  });

  it("shows loading state initially", () => {
    useSession.mockReturnValue({
      status: "loading",
      data: null,
    });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    // Update to check for the actual loading message from LoadingSpinner
    expect(screen.getByText("Initializing session...")).toBeInTheDocument();
  });

  it("redirects to login when unauthenticated", async () => {
    useSession.mockReturnValue({
      status: "unauthenticated",
      data: null,
    });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("loads user data successfully", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
    };

    // Mock the API response to match expected format
    authAPI.authenticatedGet.mockResolvedValue({ user: mockUser });

    useSession.mockReturnValue({
      status: "authenticated",
      data: {
        djangoTokens: { access: "token" },
        djangoUser: mockUser,
      },
    });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
      expect(screen.getByTestId("auth-status")).toHaveTextContent(
        "Authenticated"
      );
    });
  });

  it("handles API errors appropriately", async () => {
    useSession.mockReturnValue({
      status: "authenticated",
      data: {
        djangoTokens: { access: "token" },
      },
    });

    authAPI.authenticatedGet.mockRejectedValue(new Error("API Error"));

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login?error=fetchFailed");
    });
  });

  it("performs background refresh when enabled", async () => {
    const initialUser = {
      id: 1,
      email: "initial@example.com",
    };

    const updatedUser = {
      id: 1,
      email: "updated@example.com",
    };

    useSession.mockReturnValue({
      status: "authenticated",
      data: {
        djangoTokens: { access: "token" },
        djangoUser: initialUser,
      },
    });

    // Mock the API response to match expected format
    authAPI.authenticatedGet.mockResolvedValue({ user: updatedUser });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent(
        "updated@example.com"
      );
    });
  });

  it("disables background refresh when specified", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
    };

    useSession.mockReturnValue({
      status: "authenticated",
      data: {
        djangoTokens: { access: "token" },
        djangoUser: mockUser,
      },
    });

    render(
      <UserProvider disableBackgroundRefresh={true}>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(authAPI.authenticatedGet).not.toHaveBeenCalled();
    });
  });

  it("handles session errors", async () => {
    useSession.mockReturnValue({
      status: "authenticated",
      data: {
        djangoTokens: { access: "token" },
        error: "Session expired",
      },
    });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login?error=Session%20expired");
    });
  });

  it("updates loading message during long loads", async () => {
    useSession.mockReturnValue({
      status: "authenticated",
      data: {
        djangoTokens: { access: "token" },
      },
    });

    // Mock API to never resolve to simulate long loading
    authAPI.authenticatedGet.mockImplementation(() => new Promise(() => {}));

    jest.useFakeTimers();

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    // Check initial loading message
    expect(screen.getByText("Fetching user details...")).toBeInTheDocument();

    // Advance timer and check updated message
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    // Look for the message that's actually set in the component
    expect(
      screen.getByText("Taking longer than expected...")
    ).toBeInTheDocument();

    jest.useRealTimers();
  });

  it("handles timeout gracefully", async () => {
    useSession.mockReturnValue({
      status: "authenticated",
      data: {
        djangoTokens: { access: "token" },
      },
    });

    // Mock the timer
    jest.useFakeTimers();

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    // Advance timer past MAX_LOADING_TIME + 5000ms
    await act(async () => {
      jest.advanceTimersByTime(15000);
    });

    // Check that we redirected to login with timeout error
    expect(mockPush).toHaveBeenCalledWith("/login?error=timeout");

    // Clean up
    jest.useRealTimers();
  });
});
