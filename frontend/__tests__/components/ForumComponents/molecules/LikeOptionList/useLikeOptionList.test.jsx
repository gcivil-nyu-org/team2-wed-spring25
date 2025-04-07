import { renderHook, act } from "@testing-library/react";
import useLikeOptionList from "@/components/molecules/LikeOptionList/useLikeOptionList";

describe("useLikeOptionList", () => {
  it("initializes with correct default values", () => {
    const { result } = renderHook(() => useLikeOptionList());

    expect(result.current.hoveredIcon).toBeNull();
    expect(result.current.icons).toHaveLength(6);
    expect(result.current.icons[0]).toEqual({
      src: "/icons/likeli.svg",
      alt: "Like",
    });
  });

  it("updates hoveredIcon state correctly", () => {
    const { result } = renderHook(() => useLikeOptionList());

    act(() => {
      result.current.setHoveredIcon(2);
    });
    expect(result.current.hoveredIcon).toBe(2);

    act(() => {
      result.current.setHoveredIcon(null);
    });
    expect(result.current.hoveredIcon).toBeNull();
  });

  it("provides all required icon data", () => {
    const { result } = renderHook(() => useLikeOptionList());

    const expectedIcons = [
      { src: "/icons/likeli.svg", alt: "Like" },
      { src: "/icons/clap.svg", alt: "Clap" },
      { src: "/icons/support.svg", alt: "Support" },
      { src: "/icons/heart.svg", alt: "Heart" },
      { src: "/icons/bulb.svg", alt: "Bulb" },
      { src: "/icons/laugh.svg", alt: "Laugh" },
    ];

    expect(result.current.icons).toEqual(expectedIcons);
  });
});
