import { renderHook, act } from "@testing-library/react";
import useUserPost from "@/components/organisms/Forum/UserPost/useUserPost";

describe("useUserPost", () => {
  it("initializes with provided counts", () => {
    const { result } = renderHook(() => useUserPost(5, 10));

    expect(result.current.likesCount).toBe(5);
    expect(result.current.commentsCount).toBe(10);
  });

  it("updates likes count", () => {
    const { result } = renderHook(() => useUserPost(5, 10));

    act(() => {
      result.current.setLikesCount(6);
    });

    expect(result.current.likesCount).toBe(6);
  });

  it("updates comments count", () => {
    const { result } = renderHook(() => useUserPost(5, 10));

    act(() => {
      result.current.setCommentsCount(11);
    });

    expect(result.current.commentsCount).toBe(11);
  });

  it("handles zero initial values", () => {
    const { result } = renderHook(() => useUserPost(0, 0));

    expect(result.current.likesCount).toBe(0);
    expect(result.current.commentsCount).toBe(0);
  });
});
