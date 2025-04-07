import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PostCommentInput from "@/components/molecules/PostCommentInput/PostCommentInput";
import usePostCommentInput from "@/components/molecules/PostCommentInput/usePostCommentInput";

// Mock dependencies
jest.mock("@/components/molecules/PostCommentInput/usePostCommentInput");
jest.mock("emoji-picker-react", () => () => <div data-testid="emoji-picker" />);
jest.mock("@/components/atom/Icon/Icon", () => ({
  __esModule: true,
  default: ({ onClick, alt, src, size = "md" }) => {
    // Extract icon name from src path
    const iconName = src
      ? src.split("/").pop().replace(".svg", "")
      : alt.toLowerCase();
    return (
      <button
        onClick={onClick}
        data-testid={`icon-${iconName}`}
        data-size={size}
      >
        {alt}
      </button>
    );
  },
}));

// Add this mock
jest.mock("@/components/atom/CustomTextInput/CustomeTextInput", () => ({
  __esModule: true,
  default: ({ placeholder }) => (
    <input type="text" placeholder={placeholder} data-testid="comment-input" />
  ),
}));

describe("PostCommentInput", () => {
  const mockHandleCommentSubmit = jest.fn();
  const mockSetCommentContent = jest.fn();
  const mockHandleClickOnEmojiPicker = jest.fn();
  const mockHandleOnEmojiClick = jest.fn();

  const defaultHookReturn = {
    handleCommentSubmit: mockHandleCommentSubmit,
    commentContent: "",
    setCommentContent: mockSetCommentContent,
    emojiPickerRef: { current: null },
    showEmojiPicker: false,
    handleClickOnEmojiPicker: mockHandleClickOnEmojiPicker,
    handleOnEmojiClick: mockHandleOnEmojiClick,
    isButtonDisabled: false,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    usePostCommentInput.mockImplementation(() => defaultHookReturn);
  });

  it("renders basic input form", () => {
    render(
      <PostCommentInput
        post_id="123"
        setCommentsCount={() => {}}
        setComments={() => {}}
      />
    );

    expect(screen.getByTestId("comment-input")).toBeInTheDocument();
    expect(screen.getByTestId("icon-emoji")).toBeInTheDocument();
    expect(screen.getByTestId("icon-emoji")).toHaveAttribute("data-size", "lg");
  });

  it("shows comment button when there is content", () => {
    usePostCommentInput.mockImplementation(() => ({
      ...defaultHookReturn,
      commentContent: "Test comment",
    }));

    render(
      <PostCommentInput
        post_id="123"
        setCommentsCount={() => {}}
        setComments={() => {}}
      />
    );

    expect(screen.getByText("Comment")).toBeInTheDocument();
  });

  it("shows emoji picker when clicked", () => {
    usePostCommentInput.mockImplementation(() => ({
      ...defaultHookReturn,
      showEmojiPicker: true,
    }));

    render(
      <PostCommentInput
        post_id="123"
        setCommentsCount={() => {}}
        setComments={() => {}}
      />
    );

    expect(screen.getByTestId("emoji-picker")).toBeInTheDocument();
  });

  it("shows edit mode UI when isEdit is true", () => {
    usePostCommentInput.mockImplementation(() => ({
      ...defaultHookReturn,
      commentContent: "Edit this comment",
      isEdit: true,
    }));

    render(
      <PostCommentInput
        post_id="123"
        setCommentsCount={() => {}}
        setComments={() => {}}
        isEdit={true}
        setIsInputVisible={() => {}}
      />
    );

    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("shows loading state during submission", () => {
    usePostCommentInput.mockImplementation(() => ({
      ...defaultHookReturn,
      commentContent: "Loading comment",
      isLoading: true,
    }));

    render(
      <PostCommentInput
        post_id="123"
        setCommentsCount={() => {}}
        setComments={() => {}}
      />
    );

    expect(screen.getByText("Submitting...")).toBeInTheDocument();
  });
});
