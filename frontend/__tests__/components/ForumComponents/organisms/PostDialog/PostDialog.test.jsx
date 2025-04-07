import { render, screen } from "@testing-library/react";
import PostDialog from "@/components/organisms/PostDialog/PostDialog";
import { useEmojiPicker } from "@/hooks/useEmojiPicker";
import { useFileUpload } from "@/hooks/useFileUpload";
import { usePostDialog } from "@/components/organisms/PostDialog/usePostDialog";

// Mock the hooks
jest.mock("@/hooks/useEmojiPicker");
jest.mock("@/hooks/useFileUpload");
jest.mock("@/components/organisms/PostDialog/usePostDialog");

// Mock SVG imports
jest.mock("@/public/icons", () => ({
  closeDark: "close-dark.svg",
  emojiDark: "emoji-dark.svg",
  imagePickerDark: "image-picker-dark.svg",
}));

// Mock child components
jest.mock("@/components/atom/Button/Button", () => ({
  __esModule: true,
  default: ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} data-testid="post-button">
      {children}
    </button>
  ),
}));

jest.mock("@/components/atom/Icon/Icon", () => ({
  __esModule: true,
  default: ({ onClick, alt }) => (
    <button onClick={onClick} data-testid={`icon-${alt.toLowerCase()}`}>
      {alt}
    </button>
  ),
}));

jest.mock("@/components/atom/UserImage/UserImage", () => ({
  __esModule: true,
  default: () => <div data-testid="user-image">User Image</div>,
}));

jest.mock("emoji-picker-react", () => ({
  __esModule: true,
  default: () => <div data-testid="emoji-picker">Emoji Picker</div>,
}));

// Mock NotificationContext
jest.mock("@/app/custom-components/ToastComponent/NotificationContext", () => ({
  useNotification: () => ({
    showError: jest.fn(),
  }),
}));

describe("PostDialog", () => {
  const mockProps = {
    onClick: jest.fn(),
    setPosts: jest.fn(),
    posts_count: 0,
  };

  const mockUser = {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    avatar: "avatar.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock localStorage
    const mockLocalStorage = {
      getItem: jest.fn(() => JSON.stringify(mockUser)),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock hook returns
    useEmojiPicker.mockReturnValue({
      emojiPickerRef: { current: null },
      showEmojiPicker: false,
      handleClickOnEmojiPicker: jest.fn(),
      handleOnEmojiClick: jest.fn(),
    });

    useFileUpload.mockReturnValue({
      fileInputRef: { current: null },
      selectedImage: null,
      selectedImageName: "",
      handleOpenImageSelector: jest.fn(),
      handleRemoveImage: jest.fn(),
      handleFileChange: jest.fn(),
    });

    usePostDialog.mockReturnValue({
      postContent: "",
      setPostContent: jest.fn(),
      handleSubmit: jest.fn(),
      isButtonDisabled: false,
      isLoading: false,
      postDialogRef: { current: null },
    });
  });

  it("renders the dialog with user information", () => {
    render(<PostDialog {...mockProps} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Post to Anyone")).toBeInTheDocument();
    expect(screen.getByTestId("user-image")).toBeInTheDocument();
  });

  it("shows emoji picker when emoji button is clicked", () => {
    useEmojiPicker.mockReturnValue({
      emojiPickerRef: { current: null },
      showEmojiPicker: true,
      handleClickOnEmojiPicker: jest.fn(),
      handleOnEmojiClick: jest.fn(),
    });

    render(<PostDialog {...mockProps} />);
    expect(screen.getByTestId("emoji-picker")).toBeInTheDocument();
  });

  it("shows loading state when submitting", () => {
    usePostDialog.mockReturnValue({
      postContent: "",
      setPostContent: jest.fn(),
      handleSubmit: jest.fn(),
      isButtonDisabled: true,
      isLoading: true,
      postDialogRef: { current: null },
    });

    render(<PostDialog {...mockProps} />);
    expect(screen.getByText("Posting...")).toBeInTheDocument();
  });

  it("handles image selection", () => {
    useFileUpload.mockReturnValue({
      fileInputRef: { current: null },
      selectedImage: "test.jpg",
      selectedImageName: "test.jpg",
      handleOpenImageSelector: jest.fn(),
      handleRemoveImage: jest.fn(),
      handleFileChange: jest.fn(),
    });

    render(<PostDialog {...mockProps} />);
    expect(screen.getByText("test.jpg")).toBeInTheDocument();
  });

  it("renders in edit mode", () => {
    const editProps = {
      ...mockProps,
      is_edit: true,
      content: "Edit this post",
      post_id: 1,
    };

    usePostDialog.mockReturnValue({
      postContent: "Edit this post",
      setPostContent: jest.fn(),
      handleSubmit: jest.fn(),
      isButtonDisabled: false,
      isLoading: false,
      postDialogRef: { current: null },
    });

    render(<PostDialog {...editProps} />);
    expect(screen.getByText("Edit this post")).toBeInTheDocument();
  });
});
