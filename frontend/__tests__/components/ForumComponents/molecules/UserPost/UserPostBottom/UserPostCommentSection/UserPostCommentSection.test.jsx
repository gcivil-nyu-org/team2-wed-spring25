import { render, screen } from "@testing-library/react";
import UserPostCommentSection from "@/components/molecules/UserPost/UserPostBottom/UserPostCommentSection/UserPostCommentSection";
import useUserPostCommentSection from "@/components/molecules/UserPost/UserPostBottom/UserPostCommentSection/useUserPostCommentSection";

// Mock the hook
jest.mock(
  "@/components/molecules/UserPost/UserPostBottom/UserPostCommentSection/useUserPostCommentSection"
);

// Mock the child components
jest.mock("@/components/molecules/PostCommentInput/PostCommentInput", () => {
  return function MockPostCommentInput(props) {
    return (
      <div data-testid="comment-input" data-props={JSON.stringify(props)} />
    );
  };
});

jest.mock("@/components/molecules/PostComments/PostComments", () => {
  return function MockPostComments(props) {
    return (
      <div data-testid="comments-section" data-props={JSON.stringify(props)} />
    );
  };
});

describe("UserPostCommentSection", () => {
  const defaultProps = {
    post_id: 123,
    setCommentsCount: jest.fn(),
    is_repost: false,
    original_post_id: 456,
  };

  const mockHookReturn = {
    comments: [],
    setComments: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useUserPostCommentSection.mockReturnValue(mockHookReturn);
  });

  it("renders comment input and comments section", () => {
    render(<UserPostCommentSection {...defaultProps} />);

    expect(screen.getByTestId("comment-input")).toBeInTheDocument();
    expect(screen.getByTestId("comments-section")).toBeInTheDocument();
  });

  it("handles repost scenario correctly", () => {
    const repostProps = {
      ...defaultProps,
      is_repost: true,
      original_post_id: 789,
    };

    render(<UserPostCommentSection {...repostProps} />);

    const commentInput = screen.getByTestId("comment-input");
    const commentsSection = screen.getByTestId("comments-section");

    const inputProps = JSON.parse(commentInput.dataset.props);
    const commentsProps = JSON.parse(commentsSection.dataset.props);

    expect(inputProps.is_repost).toBe(true);
    expect(inputProps.original_post_id).toBe(789);
    expect(commentsProps.is_repost).toBe(true);
    expect(commentsProps.original_post_id).toBe(789);
  });

  it("renders with empty comments array", () => {
    useUserPostCommentSection.mockReturnValue({
      comments: [],
      setComments: jest.fn(),
    });

    render(<UserPostCommentSection {...defaultProps} />);

    const commentsSection = screen.getByTestId("comments-section");
    const props = JSON.parse(commentsSection.dataset.props);
    expect(props.comments).toEqual([]);
  });

  it("renders with populated comments array", () => {
    const mockComments = [
      { id: 1, content: "Test comment 1" },
      { id: 2, content: "Test comment 2" },
    ];

    useUserPostCommentSection.mockReturnValue({
      comments: mockComments,
      setComments: jest.fn(),
    });

    render(<UserPostCommentSection {...defaultProps} />);

    const commentsSection = screen.getByTestId("comments-section");
    const props = JSON.parse(commentsSection.dataset.props);
    expect(props.comments).toEqual(mockComments);
  });
});
