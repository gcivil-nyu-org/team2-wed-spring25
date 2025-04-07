import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PostComment from "@/components/molecules/PostComments/PostComment/PostComment";
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext";

// Mock the sub-components
jest.mock(
  "@/components/molecules/PostComments/PostComment/PostCommentUserImage",
  () => {
    return function MockUserImage() {
      return <div data-testid="user-image" />;
    };
  }
);

jest.mock(
  "@/components/molecules/PostComments/PostComment/PostCommentUserBody",
  () => {
    return function MockUserBody() {
      return <div data-testid="user-body" />;
    };
  }
);

jest.mock(
  "@/components/molecules/PostComments/PostComment/PostCommentOptionList",
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

const mockComment = {
  id: 1,
  user: {
    first_name: "John",
    last_name: "Doe",
    avatar_url: "https://example.com/avatar.jpg",
  },
  user_has_liked: false,
  like_type: null,
  likes_count: 0,
  replies_count: 0,
  content: "Test comment",
  is_repost: false,
};

describe("PostComment", () => {
  const defaultProps = {
    parentComment: mockComment,
    post_id: 1,
    original_post_id: 1,
    is_repost: false,
    setComments: jest.fn(),
    setCommentsCount: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the comment with all main components", () => {
    render(
      <NotificationProvider>
        <PostComment {...defaultProps} />
      </NotificationProvider>
    );

    expect(screen.getByTestId("user-image")).toBeInTheDocument();
    expect(screen.getByTestId("user-body")).toBeInTheDocument();
    expect(screen.getByTestId("option-list")).toBeInTheDocument();
  });

  it("shows reply input when showCommentReplyInput is true", async () => {
    render(
      <NotificationProvider>
        <PostComment {...defaultProps} />
      </NotificationProvider>
    );

    // Trigger reply input visibility (you'll need to expose this functionality)
    const replyButton = screen.getByTestId("reply-button");
    fireEvent.click(replyButton);

    await waitFor(() => {
      expect(screen.getByTestId("comment-input")).toBeInTheDocument();
    });
  });
});
