import { render, screen, fireEvent } from "@testing-library/react";
import Forum from "@/components/organisms/Forum/Forum";
import useForum from "@/components/organisms/Forum/useForum";

// Mock the custom hook
jest.mock("@/components/organisms/Forum/useForum");

// Mock child components
jest.mock("@/components/molecules/Loader/Loader", () => () => (
  <div data-testid="loader">Loading...</div>
));
jest.mock("@/components/molecules/UserData/UserData", () => ({ user }) => (
  <div data-testid="user-data">{user?.name}</div>
));
jest.mock("@/components/molecules/PostInput/PostInput", () => () => (
  <div data-testid="post-input">Post Input</div>
));
jest.mock("@/components/organisms/Forum/UserPosts/UserPosts", () => () => (
  <div data-testid="user-posts">Posts</div>
));

describe("Forum", () => {
  const mockHookReturn = {
    isLoading: false,
    isLoadingMore: false,
    isOpen: false,
    userPosts: [],
    handleClick: jest.fn(),
    user: { name: "Test User" },
    setUserPosts: jest.fn(),
    hasMore: true,
    loaderRef: { current: null },
    userHeading: "Test Heading",
    isUserDataCardLoading: false,
    userSideCardData: {},
  };

  beforeEach(() => {
    useForum.mockReturnValue(mockHookReturn);
  });

  it("renders main forum components", () => {
    render(<Forum />);

    expect(screen.getByTestId("user-data")).toBeInTheDocument();
    expect(screen.getByTestId("post-input")).toBeInTheDocument();
    expect(screen.getByTestId("user-posts")).toBeInTheDocument();
  });

  it("shows loader when loading", () => {
    useForum.mockReturnValue({
      ...mockHookReturn,
      isLoading: true,
    });

    render(<Forum />);

    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("shows no more posts message when hasMore is false", () => {
    useForum.mockReturnValue({
      ...mockHookReturn,
      hasMore: false,
    });

    render(<Forum />);

    expect(screen.getByText("No more posts to show")).toBeInTheDocument();
  });

  it("renders settings view without user data and post input", () => {
    render(<Forum settingsType="some-setting" />);

    expect(screen.queryByTestId("user-data")).not.toBeInTheDocument();
    expect(screen.queryByTestId("post-input")).not.toBeInTheDocument();
    expect(screen.getByTestId("user-posts")).toBeInTheDocument();
  });

  it("shows recommendations section in xlg viewport", () => {
    render(<Forum />);

    expect(screen.getByText("Recommendations")).toBeInTheDocument();
  });
});
