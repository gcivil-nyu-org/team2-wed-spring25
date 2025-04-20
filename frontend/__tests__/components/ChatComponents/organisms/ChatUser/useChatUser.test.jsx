import { renderHook } from "@testing-library/react";
import useChatUser from "@/components/organisms/Chat/ChatUser/useChatUser";
import { act } from "@testing-library/react";

describe("useChatUser", () => {
  it("initializes with correct default values", () => {
    const { result } = renderHook(() => useChatUser());

    expect(result.current.openSettingsId).toBeNull();
    expect(typeof result.current.setOpenSettingsId).toBe("function");
    expect(result.current.messagesContainerRef.current).toBeNull();
  });

  it("updates overflow style when openSettingsId changes", () => {
    const { result } = renderHook(() => useChatUser());

    // Set up the ref manually after initialization
    result.current.messagesContainerRef.current = document.createElement("div");
    result.current.messagesContainerRef.current.style.overflow = "auto";

    act(() => {
      result.current.setOpenSettingsId(1);
    });

    expect(result.current.messagesContainerRef.current.style.overflow).toBe(
      "hidden"
    );

    act(() => {
      result.current.setOpenSettingsId(null);
    });

    expect(result.current.messagesContainerRef.current.style.overflow).toBe(
      "auto"
    );
  });

  it("maintains ref when component rerenders", () => {
    const { result, rerender } = renderHook(() => useChatUser());
    const initialRef = result.current.messagesContainerRef;

    rerender();

    expect(result.current.messagesContainerRef).toBe(initialRef);
  });
});
