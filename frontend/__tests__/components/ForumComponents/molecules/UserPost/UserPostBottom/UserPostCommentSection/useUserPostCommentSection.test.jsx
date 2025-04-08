import { renderHook, act } from "@testing-library/react";
import useUserPostCommentSection from "@/components/molecules/UserPost/UserPostBottom/UserPostCommentSection/useUserPostCommentSection";

describe("useUserPostCommentSection", () => {
  it("initializes with empty comments array", () => {
    const { result } = renderHook(() => useUserPostCommentSection());
    expect(result.current.comments).toEqual([]);
  });

  it("updates comments when setComments is called", () => {
    const { result } = renderHook(() => useUserPostCommentSection());
    const newComments = [
      { id: 1, content: "Test comment 1" },
      { id: 2, content: "Test comment 2" },
    ];

    act(() => {
      result.current.setComments(newComments);
    });

    expect(result.current.comments).toEqual(newComments);
  });

  it("handles updating comments with callback function", () => {
    const { result } = renderHook(() => useUserPostCommentSection());
    const initialComments = [{ id: 1, content: "Initial comment" }];

    act(() => {
      result.current.setComments(initialComments);
    });

    act(() => {
      result.current.setComments((prev) => [
        ...prev,
        { id: 2, content: "New comment" },
      ]);
    });

    expect(result.current.comments).toHaveLength(2);
    expect(result.current.comments[1].content).toBe("New comment");
  });
});
