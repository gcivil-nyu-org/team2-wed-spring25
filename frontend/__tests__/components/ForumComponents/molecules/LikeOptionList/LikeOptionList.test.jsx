import { render, screen, fireEvent } from "@testing-library/react";
import LikeOptionList from "@/components/molecules/LikeOptionList/LikeOptionList";

// Mock the Icon component at the module level
jest.mock("@/components/atom/Icon/Icon", () => {
  return function MockIcon({ alt, onClick, onMouseEnter, onMouseLeave }) {
    return (
      <button
        data-testid={`icon-${alt.toLowerCase()}`}
        onClick={() => onClick(alt)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {alt}
      </button>
    );
  };
});

describe("LikeOptionList", () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders all reaction icons", () => {
      render(<LikeOptionList onClick={mockOnClick} />);

      const expectedIcons = [
        "like",
        "clap",
        "support",
        "heart",
        "bulb",
        "laugh",
      ];
      expectedIcons.forEach((icon) => {
        expect(screen.getByTestId(`icon-${icon}`)).toBeInTheDocument();
      });
    });
  });

  describe("interactions", () => {
    it("calls onClick with correct reaction type when icon is clicked", () => {
      render(<LikeOptionList onClick={mockOnClick} />);

      fireEvent.click(screen.getByTestId("icon-like"));
      expect(mockOnClick).toHaveBeenCalledWith("Like");

      fireEvent.click(screen.getByTestId("icon-heart"));
      expect(mockOnClick).toHaveBeenCalledWith("Heart");
    });
  });

  describe("hover behavior", () => {
    it("updates hover state when mouse enters and leaves", () => {
      render(<LikeOptionList onClick={mockOnClick} />);
      const container = screen.getByTestId("icon-like").parentElement;

      // Check initial state
      expect(container.className).toMatch(/max-h-14/);

      // Mouse enter
      fireEvent.mouseEnter(screen.getByTestId("icon-like"));
      expect(container.className).toMatch(/max-h-12/);

      // Mouse leave
      fireEvent.mouseLeave(screen.getByTestId("icon-like"));
      expect(container.className).toMatch(/max-h-14/);
    });
  });
});
