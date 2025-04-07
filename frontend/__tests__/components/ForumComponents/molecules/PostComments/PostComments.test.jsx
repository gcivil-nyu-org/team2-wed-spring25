import { render, screen, fireEvent } from "@testing-library/react";
import PostComments from "@/components/molecules/PostComments/PostComments";
import usePostComments from "@/components/molecules/PostComments/usePostComments";
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext";

// Mock the hook
jest.mock("@/components/molecules/PostComments/usePostComments");

// Mock the PostComment component
jest.mock("@/components/molecules/PostComments/PostComment/PostComment", () => {
  return function MockPostComment({ parentComment }) {
    return (
      <div data-testid={`comment-${parentComment.id}`}>
        {parentComment.content}
      </div>
    );
  };
});

// Mock the Loader component
jest.mock("@/components/molecules/Loader/Loader", () => {
  return function MockLoader() {
    return <div data-testid="loader">Loading...</div>;
  };
});

describe("PostComments", () => {
  const mockComments = [
    { id: 1, content: "Comment 1" },
    { id: 2, content: "Comment 2" },
  ];

  const defaultProps = {
    post_id: 1,
    comments: mockComments,
    setComments: jest.fn(),
    setCommentsCount: jest.fn(),
    is_repost: false,
    original_post_id: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders comments correctly", () => {
    usePostComments.mockReturnValue({
      isLoading: false,
      hasMore: false,
      loadMoreComments: jest.fn(),
    });

    render(
      <NotificationProvider>
        <PostComments {...defaultProps} />
      </NotificationProvider>
    );

    expect(screen.getByTestId("comment-1")).toBeInTheDocument();
    expect(screen.getByTestId("comment-2")).toBeInTheDocument();
  });

  it("shows loader when loading", () => {
    usePostComments.mockReturnValue({
      isLoading: true,
      hasMore: false,
      loadMoreComments: jest.fn(),
    });

    render(
      <NotificationProvider>
        <PostComments {...defaultProps} />
      </NotificationProvider>
    );

    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("shows load more button when more comments are available", () => {
    const mockLoadMore = jest.fn();
    usePostComments.mockReturnValue({
      isLoading: false,
      hasMore: true,
      loadMoreComments: mockLoadMore,
    });

    render(
      <NotificationProvider>
        <PostComments {...defaultProps} />
      </NotificationProvider>
    );

    const loadMoreButton = screen.getByText("Load More");
    expect(loadMoreButton).toBeInTheDocument();

    fireEvent.click(loadMoreButton);
    expect(mockLoadMore).toHaveBeenCalled();
  });

  it("handles nested comments with correct level", () => {
    usePostComments.mockReturnValue({
      isLoading: false,
      hasMore: false,
      loadMoreComments: jest.fn(),
    });

    render(
      <NotificationProvider>
        <PostComments
          {...defaultProps}
          level={2}
          is_reply={true}
          parent_comment_id={1}
        />
      </NotificationProvider>
    );

    // Verify that PostComment components receive the correct level prop
    expect(usePostComments).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      true,
      1
    );
  });
});
