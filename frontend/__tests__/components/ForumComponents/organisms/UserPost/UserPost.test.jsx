import { render, screen } from "@testing-library/react";
import UserPost from "@/components/organisms/Forum/UserPost/UserPost";
import { fallbackUserProfileImage } from "@/constants/imageUrls";

// Mock the child components
jest.mock(
  "@/components/molecules/UserPost/UserPostBottom/UserPostBottom",
  () => {
    return function MockUserPostBottom(props) {
      return <div data-testid="user-post-bottom" {...props} />;
    };
  }
);

jest.mock(
  "@/components/molecules/UserPost/UserPostHeader/UserPostHeader",
  () => {
    return function MockUserPostHeader(props) {
      return <div data-testid="user-post-header" {...props} />;
    };
  }
);

jest.mock("@/components/molecules/UserPost/UserPostBody/UserPostBody", () => {
  return function MockUserPostBody(props) {
    return <div data-testid="user-post-body" {...props} />;
  };
});

jest.mock("@/components/atom/UserImage/UserImage", () => {
  return function MockUserImage(props) {
    return <div data-testid="user-image" {...props} />;
  };
});

describe("UserPost", () => {
  const mockPost = {
    id: 1,
    user_avatar: "avatar.jpg",
    user_fullname: "John Doe",
    date_created: "2024-01-01",
    user_id: 123,
    is_following_author: false,
    user_karma: 100,
    image_urls: ["image1.jpg"],
    content: "Test post content",
    likes_count: 5,
    comments_count: 3,
    is_repost: false,
  };

  const mockSetPosts = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders regular post correctly", () => {
    render(<UserPost post={mockPost} setPosts={mockSetPosts} />);

    expect(screen.getByTestId("user-post-header")).toBeInTheDocument();
    expect(screen.getByTestId("user-post-body")).toBeInTheDocument();
    expect(screen.getByTestId("user-post-bottom")).toBeInTheDocument();
  });

  it("renders repost with additional information", () => {
    const repostMockPost = {
      ...mockPost,
      is_repost: true,
      reposted_by: {
        first_name: "Jane",
        last_name: "Smith",
        avatar_url: "repost-avatar.jpg",
      },
      original_post_id: 456,
    };

    render(<UserPost post={repostMockPost} setPosts={mockSetPosts} />);

    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("reposted this")).toBeInTheDocument();
    expect(screen.getByTestId("user-image")).toBeInTheDocument();
  });

  it("handles missing user avatar with fallback", () => {
    const postWithoutAvatar = {
      ...mockPost,
      user_avatar: null,
    };

    render(<UserPost post={postWithoutAvatar} setPosts={mockSetPosts} />);

    expect(screen.getByTestId("user-post-header")).toHaveAttribute(
      "user_avatar",
      fallbackUserProfileImage
    );
  });

  it("handles missing repost user information", () => {
    const repostWithMissingInfo = {
      ...mockPost,
      is_repost: true,
      reposted_by: {
        first_name: null,
        last_name: null,
        avatar_url: null,
      },
    };

    render(<UserPost post={repostWithMissingInfo} setPosts={mockSetPosts} />);

    expect(screen.getByText("Unknown Unknown")).toBeInTheDocument();
    expect(screen.getByTestId("user-image")).toHaveAttribute(
      "imageUrl",
      fallbackUserProfileImage
    );
  });

  it("passes correct props to UserPostBottom", () => {
    render(<UserPost post={mockPost} setPosts={mockSetPosts} />);

    const bottomComponent = screen.getByTestId("user-post-bottom");
    expect(bottomComponent).toHaveAttribute("commentsCount", "3");
    expect(bottomComponent).toHaveAttribute("likesCount", "5");
  });

  it("passes correct props to UserPostBody", () => {
    render(<UserPost post={mockPost} setPosts={mockSetPosts} />);

    const bodyComponent = screen.getByTestId("user-post-body");
    expect(bodyComponent).toHaveAttribute("content", "Test post content");
    expect(bodyComponent).toHaveAttribute("image_urls", "image1.jpg");
  });
});
