import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import LikeIconTextWithTooltip from "@/components/molecules/LikeIconTextWithTooltip/LikeIconTextWithTooltip";
import { NotificationProvider } from "@/app/custom-components/ToastComponent/NotificationContext";

// Mock the sub-components
jest.mock("@/components/molecules/IconText/IconText", () => {
  return function MockIconText({ onClick }) {
    return (
      <button data-testid="icon-text" onClick={onClick}>
        Like
      </button>
    );
  };
});

jest.mock("@/components/molecules/LikeOptionList/LikeOptionList", () => {
  return function MockLikeOptionList({ onClick }) {
    return (
      <div data-testid="like-options">
        <button onClick={() => onClick("Heart")}>Heart</button>
        <button onClick={() => onClick("Clap")}>Clap</button>
      </div>
    );
  };
});

describe("LikeIconTextWithTooltip", () => {
  const defaultProps = {
    iconData: {
      src: "/like-icon.svg",
      width: 20,
      height: 20,
      alt: "Like",
      text: "Like",
    },
    post_id: "123",
    userHasLiked: false,
    setUserHasLiked: jest.fn(),
    likeType: null,
    setLikeType: jest.fn(),
    setLikesCount: jest.fn(),
    is_repost: false,
    original_post_id: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with basic props", () => {
    render(
      <NotificationProvider>
        <LikeIconTextWithTooltip {...defaultProps} />
      </NotificationProvider>
    );

    expect(screen.getByTestId("icon-text")).toBeInTheDocument();
  });

  it("shows tooltip on hover", async () => {
    render(
      <NotificationProvider>
        <LikeIconTextWithTooltip {...defaultProps} />
      </NotificationProvider>
    );

    await act(async () => {
      const container = screen.getByTestId("icon-text").parentElement;
      fireEvent.mouseEnter(container);
    });

    expect(screen.getByTestId("like-options")).toBeInTheDocument();
  });

  it("hides tooltip on mouse leave after delay", async () => {
    jest.useFakeTimers();

    render(
      <NotificationProvider>
        <LikeIconTextWithTooltip {...defaultProps} />
      </NotificationProvider>
    );

    const container = screen.getByTestId("icon-text").parentElement;

    // Show tooltip
    fireEvent.mouseEnter(container);
    expect(screen.getByTestId("like-options")).toBeInTheDocument();

    // Hide tooltip
    fireEvent.mouseLeave(container);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.queryByTestId("like-options")).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it("handles like action when icon is clicked", async () => {
    render(
      <NotificationProvider>
        <LikeIconTextWithTooltip {...defaultProps} />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByTestId("icon-text"));

    expect(defaultProps.setUserHasLiked).toHaveBeenCalled();
    expect(defaultProps.setLikeType).toHaveBeenCalled();
  });
});
