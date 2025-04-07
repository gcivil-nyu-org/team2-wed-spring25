import { render, screen, fireEvent } from "@testing-library/react";
import UserPostBottom from "@/components/molecules/UserPost/UserPostBottom/UserPostBottom";
import useUserPostBottom from "@/components/molecules/UserPost/UserPostBottom/useUserPostBottom";
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext";

// Mock the hook
jest.mock("@/components/molecules/UserPost/UserPostBottom/useUserPostBottom");

// Mock the components
jest.mock("@/components/organisms/CustomDialogBox/CustomDialogBox", () => {
  return function MockCustomDialogBox({
    onClickYes,
    onClickNo,
    showDialog,
    title,
  }) {
    return showDialog ? (
      <div data-testid="report-dialog">
        <h2>{title}</h2>
        <button onClick={onClickYes} data-testid="confirm-report">
          Confirm
        </button>
        <button onClick={onClickNo} data-testid="cancel-report">
          Cancel
        </button>
      </div>
    ) : null;
  };
});

jest.mock(
  "@/components/molecules/UserPost/UserPostBottom/UserPostButtons/UserPostButtons",
  () => {
    return function MockUserPostButtons(props) {
      return (
        <div data-testid="post-buttons" data-props={JSON.stringify(props)} />
      );
    };
  }
);

jest.mock(
  "@/components/molecules/UserPost/UserPostBottom/UserPostCommentSection/UserPostCommentSection",
  () => {
    return function MockUserPostCommentSection(props) {
      return (
        <div data-testid="comment-section" data-props={JSON.stringify(props)} />
      );
    };
  }
);

describe("UserPostBottom", () => {
  const defaultProps = {
    likesCount: 10,
    commentsCount: 5,
    setLikesCount: jest.fn(),
    setCommentsCount: jest.fn(),
    setPosts: jest.fn(),
    post: {
      id: 1,
      is_repost: false,
      original_post_id: null,
    },
    disableYesButton: false,
  };

  const mockHookReturn = {
    getCommentsCount: jest.fn(),
    getLikesCount: jest.fn(),
    showCommentSection: false,
    showReportUserDialog: false,
    setShowReportUserDialog: jest.fn(),
    handleReportPost: jest.fn(),
    handleClickOnComment: jest.fn(),
    handleShowReportUserDialogRef: { current: null },
    isReported: false,
    setIsReported: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useUserPostBottom.mockReturnValue(mockHookReturn);
  });

  it("renders basic structure correctly", () => {
    render(
      <NotificationProvider>
        <UserPostBottom {...defaultProps} />
      </NotificationProvider>
    );

    expect(screen.getByTestId("post-buttons")).toBeInTheDocument();
  });

  it("shows comment section when enabled", () => {
    useUserPostBottom.mockReturnValue({
      ...mockHookReturn,
      showCommentSection: true,
    });

    render(
      <NotificationProvider>
        <UserPostBottom {...defaultProps} />
      </NotificationProvider>
    );

    expect(screen.getByTestId("comment-section")).toBeInTheDocument();
  });

  it("handles report dialog visibility", () => {
    useUserPostBottom.mockReturnValue({
      ...mockHookReturn,
      showReportUserDialog: true,
    });

    render(
      <NotificationProvider>
        <UserPostBottom {...defaultProps} />
      </NotificationProvider>
    );

    expect(screen.getByTestId("report-dialog")).toBeInTheDocument();
  }); 

  it("handles repost scenario correctly", () => {
    const repostProps = {
      ...defaultProps,
      post: {
        ...defaultProps.post,
        is_repost: true,
        original_post_id: 789,
      },
    };

    useUserPostBottom.mockReturnValue({
      ...mockHookReturn,
      showCommentSection: true,
    });

    render(
      <NotificationProvider>
        <UserPostBottom {...repostProps} />
      </NotificationProvider>
    );

    const commentSection = screen.getByTestId("comment-section");
    const props = JSON.parse(commentSection.dataset.props);

    expect(props.is_repost).toBe(true);
    expect(props.original_post_id).toBe(789);
  });

  it("handles report dialog actions", () => {
    useUserPostBottom.mockReturnValue({
      ...mockHookReturn,
      showReportUserDialog: true,
    });

    render(
      <NotificationProvider>
        <UserPostBottom {...defaultProps} />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByTestId("cancel-report"));
    expect(mockHookReturn.setShowReportUserDialog).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByTestId("confirm-report"));
    expect(mockHookReturn.handleReportPost).toHaveBeenCalled();
  });
});
