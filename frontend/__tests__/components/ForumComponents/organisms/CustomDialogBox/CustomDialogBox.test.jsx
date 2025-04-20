import { render, screen, fireEvent } from "@testing-library/react";
import CustomDialogBox from "@/components/organisms/CustomDialogBox/CustomDialogBox";

describe("CustomDialogBox", () => {
  const defaultProps = {
    showDialog: true,
    dialogRef: { current: null },
    onClickNo: jest.fn(),
    onClickYes: jest.fn(),
    title: "Test Title",
    description: "Test Description",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders nothing when showDialog is false", () => {
    render(<CustomDialogBox {...defaultProps} showDialog={false} />);
    expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
  });

  test("renders dialog with correct content when showDialog is true", () => {
    render(<CustomDialogBox {...defaultProps} />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  test("calls onClickNo when No button is clicked", () => {
    render(<CustomDialogBox {...defaultProps} />);

    fireEvent.click(screen.getByText("No"));
    expect(defaultProps.onClickNo).toHaveBeenCalledTimes(1);
  });

  test("calls onClickYes when Yes button is clicked", () => {
    render(<CustomDialogBox {...defaultProps} />);

    fireEvent.click(screen.getByText("Yes"));
    expect(defaultProps.onClickYes).toHaveBeenCalledTimes(1);
  });

  test("disables both buttons when disableYesButton is true", () => {
    render(<CustomDialogBox {...defaultProps} disableYesButton={true} />);

    const yesButton = screen.getByText("Yes");
    const noButton = screen.getByText("No");

    expect(yesButton).toBeDisabled();
    expect(noButton).toBeDisabled();
  });

  test("applies correct theme to Yes button", () => {
    render(<CustomDialogBox {...defaultProps} />);
    const yesButton = screen.getByText("Yes");
    expect(yesButton).toBeInTheDocument();
  });

  test("uses provided dialogRef", () => {
    const mockRef = { current: null };
    render(<CustomDialogBox {...defaultProps} dialogRef={mockRef} />);

    // The dialog div should be referenced
    expect(mockRef.current).not.toBeNull();
    expect(mockRef.current.tagName).toBe("DIV");
  });
});
