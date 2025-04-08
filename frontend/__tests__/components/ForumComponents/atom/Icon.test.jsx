import { render, fireEvent, screen } from "@testing-library/react";
import Icon from "@/components/atom/Icon/Icon";

// Mock next/image since it's not available in the test environment
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => <img {...props} />, // eslint-disable-line
}));

describe("Icon Component", () => {
  const defaultProps = {
    src: "/test-image.png",
    alt: "test icon",
  };

  it("renders with default props", () => {
    render(<Icon {...defaultProps} />);
    const img = screen.getByRole("img", { name: "test icon" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("width", "40");
    expect(img).toHaveAttribute("height", "40");
  });

  describe("size variants", () => {
    it("renders small size", () => {
      render(<Icon {...defaultProps} size="sm" />);
      const container = screen.getByRole("img").parentElement;
      expect(container).toHaveClass("w-5 h-5");
    });

    it("renders medium size", () => {
      render(<Icon {...defaultProps} size="md" />);
      const container = screen.getByRole("img").parentElement;
      expect(container).toHaveClass("w-7 h-7");
    });

    it("renders large size", () => {
      render(<Icon {...defaultProps} size="lg" />);
      const container = screen.getByRole("img").parentElement;
      expect(container).toHaveClass("w-10 h-10");
    });

    it("renders extra large size", () => {
      render(<Icon {...defaultProps} size="xl" />);
      const container = screen.getByRole("img").parentElement;
      expect(container).toHaveClass("w-14 h-14");
    });
  });

  describe("selected state", () => {
    it("renders selected state with default size", () => {
      render(<Icon {...defaultProps} selected={true} />);
      const container = screen.getByRole("img").parentElement;
      expect(container).toHaveClass("scale-110 z-3 w-20 h-20");
    });

    it("renders selected state with medium size", () => {
      render(<Icon {...defaultProps} selected={true} size="md" />);
      const container = screen.getByRole("img").parentElement;
      expect(container).toHaveClass("scale-110 z-3 w-8 h-8");
    });

    it("renders selected state with small size", () => {
      render(<Icon {...defaultProps} selected={true} size="sm" />);
      const container = screen.getByRole("img").parentElement;
      expect(container).toHaveClass("scale-110 z-3 w-6 h-6");
    });

    it("renders unselected state", () => {
      render(<Icon {...defaultProps} selected={false} />);
      const container = screen.getByRole("img").parentElement;
      expect(container).toHaveClass("w-8 h-8");
    });
  });

  describe("interactions", () => {
    it("handles click events", () => {
      const onClick = jest.fn();
      render(<Icon {...defaultProps} onClick={onClick} />);
      fireEvent.click(screen.getByRole("img").parentElement);
      expect(onClick).toHaveBeenCalledWith("test icon");
    });

    it("handles mouse enter and leave events", () => {
      const onMouseEnter = jest.fn();
      const onMouseLeave = jest.fn();
      render(
        <Icon
          {...defaultProps}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      );
      const container = screen.getByRole("img").parentElement;

      fireEvent.mouseEnter(container);
      expect(onMouseEnter).toHaveBeenCalled();

      fireEvent.mouseLeave(container);
      expect(onMouseLeave).toHaveBeenCalled();
    });
  });

  describe("tooltip", () => {
    it("shows tooltip on hover when tooltipText is provided", () => {
      render(<Icon {...defaultProps} tooltipText="Test Tooltip" />);
      const container = screen.getByRole("img").parentElement;

      fireEvent.mouseEnter(container);
      expect(screen.getByText("Test Tooltip")).toBeInTheDocument();

      fireEvent.mouseLeave(container);
      expect(screen.queryByText("Test Tooltip")).not.toBeInTheDocument();
    });

    it("doesn't show tooltip when tooltipText is empty", () => {
      render(<Icon {...defaultProps} />);
      const container = screen.getByRole("img").parentElement;

      fireEvent.mouseEnter(container);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("custom dimensions", () => {
    it("accepts custom width and height", () => {
      render(<Icon {...defaultProps} width={60} height={60} />);
      const img = screen.getByRole("img", { name: "test icon" });
      expect(img).toHaveAttribute("width", "60");
      expect(img).toHaveAttribute("height", "60");
    });
  });
});
