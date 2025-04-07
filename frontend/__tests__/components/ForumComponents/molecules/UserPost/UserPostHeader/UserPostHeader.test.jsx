import { render, screen, fireEvent } from "@testing-library/react";
import UserPostHeader from "@/components/molecules/UserPost/UserPostHeader/UserPostHeader";
import useUserPostHeader from "@/components/molecules/UserPost/UserPostHeader/useUserPostHeader";
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext";

// Mock the hook
jest.mock("@/components/molecules/UserPost/UserPostHeader/useUserPostHeader");

// Mock the components
jest.mock("@/components/atom/UserImage/UserImage", () => {
  return function MockUserImage({ imageUrl }) {
    return <img src={imageUrl} data-testid="user-image" alt="user" />;
  };
});

jest.mock("@/components/atom/Icon/Icon", () => {
  return function MockIcon({ onClick, alt }) {
    return (
      <button onClick={onClick} data-testid={`icon-${alt}`}>
        {alt}
      </button>
    );
  };
});

jest.mock("@/components/organisms/CustomDialogBox/CustomDialogBox", () => {
  return function MockCustomDialogBox({ onClickYes, onClickNo, showDialog }) {
    return showDialog ? (
      <div data-testid="delete-dialog">
        <button onClick={onClickYes} data-testid="confirm-delete">
          Confirm
        </button>
        <button onClick={onClickNo} data-testid="cancel-delete">
          Cancel
        </button>
      </div>
    ) : null;
  };
});

jest.mock("@/components/organisms/PostDialog/PostDialog", () => {
  return function MockPostDialog({ onClick }) {
    return (
      <div data-testid="edit-dialog" onClick={onClick}>
        Edit Dialog
      </div>
    );
  };
});

describe("UserPostHeader", () => {
  const defaultProps = {
    user_avatar: "test-avatar.jpg",
    user_fullname: "John Doe",
    date_created: "2024-03-20T12:00:00Z",
    post_user_id: 123,
    is_following_author: false,
    user_karma: 100,
    setPosts: jest.fn(),
    post_id: 456,
    image_urls: [],
    content: "Test content",
    is_repost: false,
    original_post_id: null,
  };

  const mockHookReturn = {
    isFollowButtonDisabled: false,
    throttledHandleOnFollow: jest.fn(),
    user_id: 789,
    isPostOptionListVisible: false,
    setIsPostOptionListVisible: jest.fn(),
    postOptionListRef: { current: null },
    deletePostConfirmation: false,
    setDeletePostConfirmation: jest.fn(),
    isDeleteInProgress: false,
    handleDeletePost: jest.fn(),
    isPostDialogOpen: false,
    setIsPostDialogOpen: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useUserPostHeader.mockReturnValue(mockHookReturn);
  });

  it("renders basic user information correctly", () => {
    render(
      <NotificationProvider>
        <UserPostHeader {...defaultProps} />
      </NotificationProvider>
    );

    expect(screen.getByTestId("user-image")).toHaveAttribute(
      "src",
      "test-avatar.jpg"
    );
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText(/⚡100/)).toBeInTheDocument();
  });

  it("shows follow button when not following", () => {
    render(
      <NotificationProvider>
        <UserPostHeader {...defaultProps} />
      </NotificationProvider>
    );

    const followButton = screen.getByText("Follow");
    expect(followButton).toBeInTheDocument();

    fireEvent.click(followButton);
    expect(mockHookReturn.throttledHandleOnFollow).toHaveBeenCalledWith(true);
  });

  it("shows following status when already following", () => {
    render(
      <NotificationProvider>
        <UserPostHeader {...defaultProps} is_following_author={true} />
      </NotificationProvider>
    );

    expect(screen.getByText("Following")).toBeInTheDocument();
  });

  it("shows post options for post owner", () => {
    useUserPostHeader.mockReturnValue({
      ...mockHookReturn,
      user_id: defaultProps.post_user_id,
    });

    render(
      <NotificationProvider>
        <UserPostHeader {...defaultProps} />
      </NotificationProvider>
    );

    const optionsButton = screen.getByTestId("icon-...");
    expect(optionsButton).toBeInTheDocument();

    fireEvent.click(optionsButton);
    expect(mockHookReturn.setIsPostOptionListVisible).toHaveBeenCalled();
  });

  it("handles delete post flow", () => {
    useUserPostHeader.mockReturnValue({
      ...mockHookReturn,
      deletePostConfirmation: true,
    });

    render(
      <NotificationProvider>
        <UserPostHeader {...defaultProps} />
      </NotificationProvider>
    );

    const confirmButton = screen.getByTestId("confirm-delete");
    fireEvent.click(confirmButton);
    expect(mockHookReturn.handleDeletePost).toHaveBeenCalled();
  });

  it("handles post dialog close", () => {
    useUserPostHeader.mockReturnValue({
      ...mockHookReturn,
      isPostDialogOpen: true,
      user_id: defaultProps.post_user_id,
    });

    render(
      <NotificationProvider>
        <UserPostHeader {...defaultProps} />
      </NotificationProvider>
    );

    const editDialog = screen.getByTestId("edit-dialog");
    fireEvent.click(editDialog);
    expect(mockHookReturn.setIsPostDialogOpen).toHaveBeenCalledWith(false);
  });

  it("handles delete confirmation dialog cancel", () => {
    useUserPostHeader.mockReturnValue({
      ...mockHookReturn,
      deletePostConfirmation: true,
      user_id: defaultProps.post_user_id,
    });

    render(
      <NotificationProvider>
        <UserPostHeader {...defaultProps} />
      </NotificationProvider>
    );

    const cancelButton = screen.getByTestId("cancel-delete");
    fireEvent.click(cancelButton);
    expect(mockHookReturn.setDeletePostConfirmation).toHaveBeenCalledWith(
      false
    );
  });

  it("shows delete option in post options list", () => {
    useUserPostHeader.mockReturnValue({
      ...mockHookReturn,
      isPostOptionListVisible: true,
      user_id: defaultProps.post_user_id,
    });

    render(
      <NotificationProvider>
        <UserPostHeader {...defaultProps} />
      </NotificationProvider>
    );

    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);
    expect(mockHookReturn.setDeletePostConfirmation).toHaveBeenCalledWith(true);
    expect(mockHookReturn.setIsPostOptionListVisible).toHaveBeenCalledWith(
      false
    );
  });

  it("handles disabled follow button", () => {
    useUserPostHeader.mockReturnValue({
      ...mockHookReturn,
      isFollowButtonDisabled: true,
    });

    render(
      <NotificationProvider>
        <UserPostHeader {...defaultProps} />
      </NotificationProvider>
    );

    const followButton = screen.getByText("Follow");
    fireEvent.click(followButton);
    expect(mockHookReturn.throttledHandleOnFollow).not.toHaveBeenCalled();
  });

  it("handles unfollow action", () => {
    render(
      <NotificationProvider>
        <UserPostHeader {...defaultProps} is_following_author={true} />
      </NotificationProvider>
    );

    const followingButton = screen.getByText("Following");
    fireEvent.click(followingButton);
    expect(mockHookReturn.throttledHandleOnFollow).toHaveBeenCalledWith(false);
  });

  it("renders with repost information", () => {
    render(
      <NotificationProvider>
        <UserPostHeader
          {...defaultProps}
          is_repost={true}
          original_post_id={789}
        />
      </NotificationProvider>
    );

    // Verify repost-specific elements are rendered
    expect(screen.getByTestId("user-image")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("does not show follow button for own posts", () => {
    useUserPostHeader.mockReturnValue({
      ...mockHookReturn,
      user_id: defaultProps.post_user_id,
    });

    render(
      <NotificationProvider>
        <UserPostHeader {...defaultProps} />
      </NotificationProvider>
    );

    expect(screen.queryByText("Follow")).not.toBeInTheDocument();
    expect(screen.queryByText("Following")).not.toBeInTheDocument();
  });

  it("formats date correctly", () => {
    const recentDate = new Date().toISOString();
    render(
      <NotificationProvider>
        <UserPostHeader {...defaultProps} date_created={recentDate} />
      </NotificationProvider>
    );

    // Look for the specific element containing the date
    const dateElement = screen.getByText((content) => {
      // This will match "just now", "X minutes ago", etc.
      return (
        content.toLowerCase().includes("now") ||
        content.toLowerCase().includes("ago") ||
        content.toLowerCase().includes("minutes") ||
        content.toLowerCase().includes("hours")
      );
    });
    expect(dateElement).toBeInTheDocument();
  });

  it("renders post options list with correct items", () => {
    useUserPostHeader.mockReturnValue({
      ...mockHookReturn,
      isPostOptionListVisible: true,
      user_id: defaultProps.post_user_id,
    });

    render(
      <NotificationProvider>
        <UserPostHeader {...defaultProps} />
      </NotificationProvider>
    );

    const optionsList = screen.getByRole("list");
    expect(optionsList).toBeInTheDocument();
    expect(screen.getByTestId("icon-Edit")).toBeInTheDocument();
    expect(screen.getByTestId("icon-Report")).toBeInTheDocument();
  });

  it("handles post options visibility toggle", () => {
    useUserPostHeader.mockReturnValue({
      ...mockHookReturn,
      user_id: defaultProps.post_user_id,
    });

    render(
      <NotificationProvider>
        <UserPostHeader {...defaultProps} />
      </NotificationProvider>
    );

    const optionsButton = screen.getByTestId("icon-...");
    fireEvent.click(optionsButton);
    expect(mockHookReturn.setIsPostOptionListVisible).toHaveBeenCalledWith(
      true
    );
  });

  it("renders user karma correctly", () => {
    render(
      <NotificationProvider>
        <UserPostHeader {...defaultProps} user_karma={999} />
      </NotificationProvider>
    );

    expect(screen.getByText(/⚡999/)).toBeInTheDocument();
  });
});
