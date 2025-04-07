import { renderHook, act } from "@testing-library/react";
import { useEmojiPicker } from "@/hooks/useEmojiPicker";

describe("useEmojiPicker", () => {
  let mockRef;

  beforeEach(() => {
    mockRef = { current: document.createElement("div") };
    document.addEventListener = jest.fn();
    document.removeEventListener = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() => useEmojiPicker());
    expect(result.current.showEmojiPicker).toBe(false);
    expect(result.current.emojiPickerRef).toBeDefined();
  });

  it("toggles emoji picker visibility", () => {
    const { result } = renderHook(() => useEmojiPicker());

    act(() => {
      result.current.handleClickOnEmojiPicker();
    });
    expect(result.current.showEmojiPicker).toBe(true);

    act(() => {
      result.current.handleClickOnEmojiPicker();
    });
    expect(result.current.showEmojiPicker).toBe(false);
  });

  it("handles emoji click", () => {
    const { result } = renderHook(() => useEmojiPicker());
    const mockSetContent = jest.fn((prev) => prev + "😊");
    const mockEmoji = { emoji: "😊" };

    act(() => {
      result.current.handleOnEmojiClick(mockEmoji, mockSetContent);
    });

    expect(mockSetContent).toHaveBeenCalled();
    expect(result.current.showEmojiPicker).toBe(false);
  });

  it("handles click outside emoji picker", () => {
    const { result } = renderHook(() => useEmojiPicker());

    // Set up the ref
    result.current.emojiPickerRef.current = mockRef.current;

    // Show the emoji picker
    act(() => {
      result.current.handleClickOnEmojiPicker();
    });
    expect(result.current.showEmojiPicker).toBe(true);

    // Get the mousedown event handler
    const [[eventType, handler]] = document.addEventListener.mock.calls;
    expect(eventType).toBe("mousedown"); // Changed from 'click' to 'mousedown'

    // Simulate click outside
    act(() => {
      handler({ target: document.createElement("div") });
    });

    expect(result.current.showEmojiPicker).toBe(false);
  });

  it("cleans up event listeners on unmount", () => {
    const { unmount } = renderHook(() => useEmojiPicker());

    unmount();

    expect(document.removeEventListener).toHaveBeenCalledWith(
      "mousedown", // Changed from 'click' to 'mousedown'
      expect.any(Function)
    );
  });

  it("doesn't close picker when clicking inside", () => {
    const { result } = renderHook(() => useEmojiPicker());

    // Set up the ref
    result.current.emojiPickerRef.current = mockRef.current;

    // Show the emoji picker
    act(() => {
      result.current.handleClickOnEmojiPicker();
    });

    // Get the mousedown handler
    const [[, handler]] = document.addEventListener.mock.calls;

    // Simulate click inside the picker
    act(() => {
      handler({ target: mockRef.current });
    });

    expect(result.current.showEmojiPicker).toBe(true);
  });

  it("handles ref.current.contains check", () => {
    const { result } = renderHook(() => useEmojiPicker());

    // Set up mock ref with contains method
    const mockContains = jest.fn(() => true);
    result.current.emojiPickerRef.current = {
      contains: mockContains,
    };

    // Show picker
    act(() => {
      result.current.handleClickOnEmojiPicker();
    });

    // Get handler
    const [[, handler]] = document.addEventListener.mock.calls;

    // Simulate click
    act(() => {
      handler({ target: document.createElement("div") });
    });

    expect(mockContains).toHaveBeenCalled();
    expect(result.current.showEmojiPicker).toBe(true);
  });
});
