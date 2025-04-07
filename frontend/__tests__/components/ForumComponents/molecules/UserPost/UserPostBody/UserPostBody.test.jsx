import { render, screen, fireEvent } from "@testing-library/react";
import UserPostBody from "@/components/molecules/UserPost/UserPostBody/UserPostBody";
import useUserPostBody from "@/components/molecules/UserPost/UserPostBody/useUserPostBody";

// Mock the Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: function Image({ src, alt, className }) {
    return (
      <img src={src} alt={alt} className={className} data-testid="post-image" />
    );
  },
}));

// Mock the hook
jest.mock(
  "@/components/molecules/UserPost/UserPostBody/useUserPostBody",
  () => {
    return jest.fn(() => ({
      getPostContent: jest.fn((content) => <p>{content}</p>),
      showDetailedView: false,
      setShowDetailedView: jest.fn(),
    }));
  }
);

describe("UserPostBody", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders content correctly", () => {
    const props = {
      content: "Test content",
      image_urls: [],
    };

    render(<UserPostBody {...props} />);
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders image when image_urls is provided", () => {
    const props = {
      content: "Test content",
      image_urls: ["test-image.jpg"],
    };

    render(<UserPostBody {...props} />);
    const image = screen.getByTestId("post-image");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "test-image.jpg");
  });

  it("does not render image when image_urls is empty", () => {
    const props = {
      content: "Test content",
      image_urls: [],
    };

    render(<UserPostBody {...props} />);
    expect(screen.queryByTestId("post-image")).not.toBeInTheDocument();
  });

  it("calls useUserPostBody with correct parameters", () => {
    const props = {
      content: "Test content",
      image_urls: [],
    };

    render(<UserPostBody {...props} />);
    expect(useUserPostBody).toHaveBeenCalledWith("Test content", 70);
  });

  it("handles long content with show more functionality", () => {
    // Mock the hook implementation for this specific test
    useUserPostBody.mockImplementationOnce(() => ({
      getPostContent: (content) => (
        <p>
          {content.substring(0, 70)}
          <span data-testid="show-more">...more</span>
        </p>
      ),
      showDetailedView: false,
      setShowDetailedView: jest.fn(),
    }));

    const props = {
      content: "A".repeat(100), // Content longer than 70 characters
      image_urls: [],
    };

    render(<UserPostBody {...props} />);
    expect(screen.getByTestId("show-more")).toBeInTheDocument();
  });

  it("handles null or undefined image_urls", () => {
    const props = {
      content: "Test content",
      image_urls: [null, undefined],
    };

    render(<UserPostBody {...props} />);
    expect(screen.queryByTestId("post-image")).not.toBeInTheDocument();
  });
});
