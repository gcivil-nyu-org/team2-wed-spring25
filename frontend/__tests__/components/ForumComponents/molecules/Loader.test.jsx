import { render, screen } from "@testing-library/react";
import Loader from "@/components/molecules/Loader/Loader"; // Adjust the import path
import "@testing-library/jest-dom";

describe("Loader Component", () => {
  // Store original console.error
  const originalConsoleError = console.error;

  // mock console errors so they dont pollute test output log
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  afterEach(() => {
    console.error.mockClear();
  });

  // Test 1: Ensure that the loader renders correctly.
  test("renders loader component", () => {
    render(<Loader />);
    // Get all images with alt text "Loading..."
    const images = screen.getAllByAltText("Loading...");

    // Assert that there are exactly two images in the document
    expect(images).toHaveLength(2);
    expect(images[0]).toBeInTheDocument(); // owl logo
    expect(images[1]).toBeInTheDocument(); // loader gif

    // Verify no errors were logged
    expect(console.error).not.toHaveBeenCalled();
  });
});
