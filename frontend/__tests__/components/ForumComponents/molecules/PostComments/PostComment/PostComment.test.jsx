import { render, screen } from "@testing-library/react";
import PostComment from "@/components/molecules/PostComments/PostComment/PostComment";
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext";
import usePostComment from "@/components/molecules/PostComments/PostComment/usePostComment";

// Mock the hook
jest.mock("@/components/molecules/PostComments/PostComment/usePostComment");

// Simple mock components
jest.mock(
  "@/components/molecules/PostComments/PostComment/PostCommentUserImage/PostCommentUserImage",
  () => {
    return function MockUserImage({ avatar_url }) {
      return <div data-testid="user-image">{avatar_url}</div>;
    };
  }
);

jest.mock(
  "@/components/molecules/PostComments/PostComment/PostCommentUserBody/PostCommentUserBody",
  () => {
    return function MockUserBody({ userFullName }) {
      return <div data-testid="user-body">{userFullName}</div>;
    };
  }
);

jest.mock(
  "@/components/molecules/PostComments/PostComment/PostCommentOptionList/PostCommentOptionList",
  () => {
    return function MockOptionList() {
      return <div data-testid="option-list" />;
    };
  }
);

jest.mock("@/components/molecules/PostCommentInput/PostCommentInput", () => {
  return function MockCommentInput() {
    return <div data-testid="comment-input" />;
  };
});

jest.mock("@/components/organisms/ReportDialog/ReportDialog", () => {
  return function MockReportDialog() {
    return <div data-testid="report-dialog" />;
  };
});

describe("PostComment", () => {
  const mockComment = {
    id: 1,
    user: {
      id: 123,
      first_name: "John",
      last_name: "Doe",
      avatar_url: "test-avatar.jpg",
    },
    content: "Test comment",
    is_repost: false,
  };

  const defaultProps = {
    parentComment: mockComment,
    post_id: 1,
    original_post_id: 1,
    is_repost: false,
    setComments: jest.fn(),
    setCommentsCount: jest.fn(),
  };

  const mockHookValues = {
    isTooltipVisible: false,
    handleMouseEnter: jest.fn(),
    handleMouseLeave: jest.fn(),
    throttledHandleOnLikeComment: jest.fn(),
    likesCount: 0,
    userHasLiked: false,
    likeType: null,
    repliesCount: 0,
    showCommentReply: false,
    setShowCommentReply: jest.fn(),
    showCommentReplyInput: false,
    setShowCommentReplyInput: jest.fn(),
    replies: [],
    setReplies: jest.fn(),
    setRepliesCount: jest.fn(),
    isCommentOptionListVisible: false,
    setIsCommentOptionListVisible: jest.fn(),
    showReportCategoryDialog: false,
    setShowReportCategoryDialog: jest.fn(),
    reportCategorySelectedIndex: null,
    setReportCategorySelectedIndex: jest.fn(),
    dropdownRef: { current: null },
    reportCategoryDialogRef: { current: null },
    handleReportComment: jest.fn(),
    isReportedCommentLoading: false,
    isEditCommentVisible: false,
    setIsEditCommentVisible: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    usePostComment.mockReturnValue(mockHookValues);
  });

  it("renders basic comment structure", () => {
    render(
      <NotificationProvider>
        <PostComment {...defaultProps} />
      </NotificationProvider>
    );

    expect(screen.getByTestId("user-image")).toBeInTheDocument();
    expect(screen.getByTestId("user-body")).toBeInTheDocument();
    expect(screen.getByTestId("option-list")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("shows reply input when enabled", () => {
    usePostComment.mockReturnValue({
      ...mockHookValues,
      showCommentReplyInput: true,
    });

    render(
      <NotificationProvider>
        <PostComment {...defaultProps} />
      </NotificationProvider>
    );

    expect(screen.getByTestId("comment-input")).toBeInTheDocument();
  });

  it("shows report dialog when enabled", () => {
    usePostComment.mockReturnValue({
      ...mockHookValues,
      showReportCategoryDialog: true,
    });

    render(
      <NotificationProvider>
        <PostComment {...defaultProps} />
      </NotificationProvider>
    );

    expect(screen.getByTestId("report-dialog")).toBeInTheDocument();
  });
});
