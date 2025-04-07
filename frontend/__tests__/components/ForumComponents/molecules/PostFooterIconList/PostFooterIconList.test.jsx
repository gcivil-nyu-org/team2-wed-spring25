import { render, screen, fireEvent } from "@testing-library/react";
import PostFooterIconList from "@/components/molecules/PostFooterIconList/PostFooterIconList";
import { useNotification } from "@/app/custom-components/ToastComponent/NotificationContext";

// Add this mock before other mocks
jest.mock("@/constants/icons", () => ({
  iconsData: [
    { src: "like.svg", width: 24, height: 24, alt: "like", text: "Like" },
    {
      src: "comment.svg",
      width: 24,
      height: 24,
      alt: "comment",
      text: "Comment",
    },
    { src: "repost.svg", width: 24, height: 24, alt: "repost", text: "Repost" },
    { src: "report.svg", width: 24, height: 24, alt: "report", text: "Report" },
  ],
}));

// Mock the child components
jest.mock("@/components/molecules/IconText/IconText", () => ({
  __esModule: true,
  default: ({ text, onClick }) => (
    <div onClick={onClick} data-testid="icon-text">
      {text}
    </div>
  ),
}));

jest.mock(
  "@/components/molecules/LikeIconTextWithTooltip/LikeIconTextWithTooltip",
  () => ({
    __esModule: true,
    default: ({ userHasLiked }) => (
      <div data-testid="like-tooltip">{userHasLiked ? "Liked" : "Like"}</div>
    ),
  })
);

jest.mock("@/app/custom-components/ToastComponent/NotificationContext");

describe("PostFooterIconList", () => {
  const mockProps = {
    handleClickOnComment: jest.fn(),
    setShowReportUserDialog: jest.fn(),
    setLikesCount: jest.fn(),
    setPosts: jest.fn(),
    post: {
      id: 1,
      user_id: 2,
      user_has_liked: false,
      like_type: null,
      is_reported: false,
      is_repost: false,
    },
    isReported: false,
    setIsReported: jest.fn(),
  };

  const mockShowError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNotification.mockReturnValue({ showError: mockShowError });
  });

  it("renders all icons", () => {
    render(<PostFooterIconList {...mockProps} />);

    expect(screen.getByTestId("like-tooltip")).toBeInTheDocument();
    expect(screen.getAllByTestId("icon-text")).toHaveLength(3); // Comment, Repost, Report
  });

  it("handles comment click", () => {
    render(<PostFooterIconList {...mockProps} />);

    const commentIcon = screen.getAllByTestId("icon-text")[0];
    fireEvent.click(commentIcon);

    expect(mockProps.handleClickOnComment).toHaveBeenCalled();
  });

  it("shows error when reporting an already reported post", () => {
    const reportedProps = {
      ...mockProps,
      post: { ...mockProps.post, is_reported: true },
      isReported: true,
    };

    render(<PostFooterIconList {...reportedProps} />);

    const reportIcon = screen.getAllByTestId("icon-text")[2];
    fireEvent.click(reportIcon);

    expect(mockShowError).toHaveBeenCalledWith(
      "You have already reported this post"
    );
    expect(mockProps.setShowReportUserDialog).not.toHaveBeenCalled();
  });

  it("opens report dialog for unreported post", () => {
    render(<PostFooterIconList {...mockProps} />);

    const reportIcon = screen.getAllByTestId("icon-text")[2];
    fireEvent.click(reportIcon);

    expect(mockProps.setShowReportUserDialog).toHaveBeenCalledWith(true);
  });

  it("updates isReported when post.is_reported changes", () => {
    const { rerender } = render(<PostFooterIconList {...mockProps} />);

    const updatedProps = {
      ...mockProps,
      post: { ...mockProps.post, is_reported: true },
    };

    rerender(<PostFooterIconList {...updatedProps} />);

    expect(mockProps.setIsReported).toHaveBeenCalledWith(true);
  });
});
