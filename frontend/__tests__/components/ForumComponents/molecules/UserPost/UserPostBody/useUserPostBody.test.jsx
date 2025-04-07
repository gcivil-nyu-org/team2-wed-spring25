import { renderHook, act } from "@testing-library/react";
import useUserPostBody from "@/components/molecules/UserPost/UserPostBody/useUserPostBody";

describe("useUserPostBody", () => {
  it("initializes with correct default values", () => {
    const { result } = renderHook(() => useUserPostBody("test content"));
    expect(result.current.showDetailedView).toBe(false);
  });

  it("truncates content and shows more button when content exceeds maxLength", () => {
    const longContent = "This is a very long content that should be truncated";
    const maxLength = 20;
    const { result } = renderHook(() =>
      useUserPostBody(longContent, maxLength)
    );

    const content = result.current.getPostContent(longContent);

    // Content structure should be a <p> tag with two children:
    // 1. Truncated text
    // 2. Span with ...more button
    const [truncatedText, moreButton] = content.props.children;
    expect(truncatedText).toBe(longContent.substring(0, maxLength));
    expect(moreButton.props.children).toBe("...more");
  });

  it("shows full content when showDetailedView is true", () => {
    const longContent = "This is a very long content that should be truncated";
    const { result } = renderHook(() => useUserPostBody(longContent, 20));

    act(() => {
      result.current.setShowDetailedView(true);
    });

    const content = result.current.getPostContent(longContent);
    expect(content.props.children).toBe(longContent);
  });

  it("toggles detailed view when more button is clicked", () => {
    const longContent = "This is a very long content that should be truncated";
    const { result } = renderHook(() => useUserPostBody(longContent, 20));

    // Get the content and simulate clicking the more button
    const content = result.current.getPostContent(longContent);
    const moreButton = content.props.children[1]; // Get the span element

    act(() => {
      // Call the onClick handler directly
      moreButton.props.onClick();
    });

    expect(result.current.showDetailedView).toBe(true);
  });

  it("uses default maxLength when not provided", () => {
    const longContent = "A".repeat(150);
    const { result } = renderHook(() => useUserPostBody(longContent));

    const content = result.current.getPostContent(longContent);
    const [truncatedText] = content.props.children;
    expect(truncatedText).toBe(longContent.substring(0, 100)); // Default maxLength is 100
  });
});
