import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import PostCommentOptionList from "@/components/molecules/PostComments/PostComment/PostCommentOptionList/PostCommentOptionList";
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext";
// Keep all SVG mocks
jest.mock("@/public/icons/close-dark.svg", () => "close-dark-mock");
jest.mock("@/public/icons/emoji-dark.svg", () => "emoji-dark-mock");
jest.mock(
  "@/public/icons/image_picker_dark.svg",
  () => "image-picker-dark-mock"
);
jest.mock("@/public/icons/ellipsis-dark.svg", () => "ellipsis-dark-mock");
jest.mock("@/public/icons/like-dark.svg", () => "like-dark-mock");
jest.mock("@/public/icons/comment-dark.svg", () => "comment-dark-mock");
jest.mock("@/public/icons/repost-dark.svg", () => "repost-dark-mock");
jest.mock("@/public/icons/report-dark.svg", () => "report-dark-mock");
jest.mock("@/public/icons/edit-dark.svg", () => "edit-dark-mock");
jest.mock("@/public/icons/delete-dark.svg", () => "delete-dark-mock");

// Mock the icons module
jest.mock("@/public/icons", () => ({
  deleteDark: "delete-dark-mock",
  editDark: "edit-dark-mock",
  ellipsisDark: "ellipsis-dark-mock",
  reportDark: "report-dark-mock",
  likeDark: "like-dark-mock",
  commentDark: "comment-dark-mock",
  repostDark: "repost-dark-mock",
}));

// Update the usePostCommentOptionList mock to handle state
const mockSetShowDeleteCommentDialog = jest.fn();
let mockShowDeleteCommentDialog = false;

jest.mock(
  "@/components/molecules/PostComments/PostComment/PostCommentOptionList/usePostCommentOptionList",
  () => {
    return jest.fn(() => ({
      showDeleteCommentDialog: mockShowDeleteCommentDialog,
      setShowDeleteCommentDialog: (val) => {
        mockShowDeleteCommentDialog = val;
        mockSetShowDeleteCommentDialog(val);
      },
      disableButtons: false,
      handleCommentDelete: jest.fn(),
    }));
  }
);

// Mock the Icon component
jest.mock("@/components/atom/Icon/Icon", () => {
  return function MockIcon({ alt, onClick }) {
    return (
      <button onClick={onClick} data-testid={`icon-${alt}`}>
        {alt}
      </button>
    );
  };
});

// Mock the CustomDialogBox component
jest.mock("@/components/organisms/CustomDialogBox/CustomDialogBox", () => {
  return function MockCustomDialogBox({ onClickYes, onClickNo, showDialog }) {
    return showDialog ? (
      <div data-testid="delete-dialog">
        <button onClick={onClickYes} data-testid="yes-button">
          Yes
        </button>
        <button onClick={onClickNo} data-testid="no-button">
          No
        </button>
      </div>
    ) : null;
  };
});

// Mock localStorage
const mockUser = { id: 123 };
Storage.prototype.getItem = jest.fn(() => JSON.stringify(mockUser));

describe("PostCommentOptionList", () => {
  const defaultProps = {
    isCommentOptionListVisible: false,
    setIsCommentOptionListVisible: jest.fn(),
    setShowReportCategoryDialog: jest.fn(),
    dropdownRef: { current: document.createElement("div") },
    parentComment: {
      post_id: 1,
      id: 2,
      user: {
        id: 123, // Same as mockUser.id for owner tests
      },
    },
    setComments: jest.fn(),
    setCommentsCount: jest.fn(),
    setIsEditCommentVisible: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockShowDeleteCommentDialog = false;
  });

  const renderComponent = (props = {}) => {
    return render(
      <NotificationProvider>
        <PostCommentOptionList {...defaultProps} {...props} />
      </NotificationProvider>
    );
  };

  it("should render ellipsis button", () => {
    renderComponent();
    const ellipsisButton = screen.getByTestId("icon-...");
    expect(ellipsisButton).toBeInTheDocument();
  });

  it("should toggle options list when clicking ellipsis", () => {
    renderComponent();
    const ellipsisButton = screen.getByTestId("icon-...");
    fireEvent.click(ellipsisButton);
    expect(defaultProps.setIsCommentOptionListVisible).toHaveBeenCalledWith(
      true
    );
  });

  it("should show report option for other users' comments", () => {
    const props = {
      isCommentOptionListVisible: true,
      parentComment: {
        ...defaultProps.parentComment,
        user: { id: 456 }, // Different from mockUser.id
      },
    };

    renderComponent(props);
    const reportOption = screen.getByTestId("report-option");
    expect(reportOption).toBeInTheDocument();
    expect(screen.queryByTestId("edit-option")).not.toBeInTheDocument();
    expect(screen.queryByTestId("delete-option")).not.toBeInTheDocument();
  });

  it("should show edit and delete options for user's own comments", () => {
    renderComponent({ isCommentOptionListVisible: true });

    const editOption = screen.getByTestId("edit-option");
    const deleteOption = screen.getByTestId("delete-option");

    expect(editOption).toBeInTheDocument();
    expect(deleteOption).toBeInTheDocument();
    expect(screen.queryByTestId("report-option")).not.toBeInTheDocument();
  });

  it("should handle edit click", () => {
    renderComponent({ isCommentOptionListVisible: true });

    const editOption = screen.getByTestId("edit-option");
    fireEvent.click(editOption);

    expect(defaultProps.setIsEditCommentVisible).toHaveBeenCalledWith(true);
    expect(defaultProps.setIsCommentOptionListVisible).toHaveBeenCalledWith(
      false
    );
  });

  it("should handle report click", () => {
    const props = {
      isCommentOptionListVisible: true,
      parentComment: {
        ...defaultProps.parentComment,
        user: { id: 456 },
      },
    };

    renderComponent(props);
    const reportOption = screen.getByTestId("report-option");
    fireEvent.click(reportOption);

    expect(defaultProps.setShowReportCategoryDialog).toHaveBeenCalledWith(true);
    expect(defaultProps.setIsCommentOptionListVisible).toHaveBeenCalledWith(
      false
    );
  });

  it("should show delete dialog when clicking delete", async () => {
    renderComponent({ isCommentOptionListVisible: true });

    const deleteOption = screen.getByTestId("delete-option");
    fireEvent.click(deleteOption);

    // Verify setShowDeleteCommentDialog was called
    expect(mockSetShowDeleteCommentDialog).toHaveBeenCalledWith(true);

    // Re-render with updated state
    mockShowDeleteCommentDialog = true;
    renderComponent({ isCommentOptionListVisible: true });

    const deleteDialog = screen.getByTestId("delete-dialog");
    expect(deleteDialog).toBeInTheDocument();
  });

  it("should handle delete cancellation", async () => {
    // Start with dialog visible
    mockShowDeleteCommentDialog = true;
    renderComponent({ isCommentOptionListVisible: true });

    const noButton = screen.getByTestId("no-button");
    fireEvent.click(noButton);

    expect(mockSetShowDeleteCommentDialog).toHaveBeenCalledWith(false);
  });
});
