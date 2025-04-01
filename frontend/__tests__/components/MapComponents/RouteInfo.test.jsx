import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RouteInfo from "@/app/custom-components/MapComponents/RouteInfo";

describe("RouteInfo", () => {
  const mockRouteDetails = {
    initial: {
      distance: 1500, // 1.5km
      duration: 900, // 15 minutes
      instructions: [
        { instruction: "Turn right", distance: 100, duration: 60 },
        { instruction: "Turn left", distance: 200, duration: 120 },
      ],
    },
    safer: {
      distance: 2000, // 2km
      duration: 1200, // 20 minutes
      instructions: [
        { instruction: "Go straight", distance: 300, duration: 180 },
        { instruction: "Turn right", distance: 400, duration: 240 },
      ],
    },
  };

  it("renders route information correctly", () => {
    render(
      <RouteInfo
        routeDetails={mockRouteDetails}
        activeRoute="initial"
        setActiveRoute={() => {}}
      />
    );

    expect(screen.getByText("1.5 km")).toBeInTheDocument();
    expect(screen.getByText("15 min")).toBeInTheDocument();
  });

  it("switches between initial and safer routes", () => {
    const mockSetActiveRoute = jest.fn();
    render(
      <RouteInfo
        routeDetails={mockRouteDetails}
        activeRoute="initial"
        setActiveRoute={mockSetActiveRoute}
      />
    );

    fireEvent.click(screen.getByText("Safer Route"));
    expect(mockSetActiveRoute).toHaveBeenCalledWith("safer");
  });

  it("toggles turn-by-turn instructions visibility", () => {
    render(
      <RouteInfo
        routeDetails={mockRouteDetails}
        activeRoute="initial"
        setActiveRoute={() => {}}
      />
    );

    // Instructions should be hidden initially
    expect(screen.queryByText("Turn right")).not.toBeInTheDocument();

    // Click to show instructions
    fireEvent.click(screen.getByText("Turn-by-turn directions"));
    expect(screen.getByText("Turn right")).toBeInTheDocument();
    expect(screen.getByText("Turn left")).toBeInTheDocument();
  });

  it("handles missing route data gracefully", () => {
    render(
      <RouteInfo
        routeDetails={null}
        activeRoute="initial"
        setActiveRoute={() => {}}
      />
    );

    // Find the duration and distance elements by their labels and check their values
    const durationSection = screen
      .getByText("Duration")
      .closest("div").parentElement;
    const distanceSection = screen
      .getByText("Distance")
      .closest("div").parentElement;

    expect(durationSection.querySelector(".text-lg")).toHaveTextContent("--");
    expect(distanceSection.querySelector(".text-lg")).toHaveTextContent("--");
  });

  it("formats duration correctly", () => {
    const routeWithLongDuration = {
      initial: {
        distance: 1500,
        duration: 3660, // 1 hour and 1 minute
        instructions: [],
      },
    };

    render(
      <RouteInfo
        routeDetails={routeWithLongDuration}
        activeRoute="initial"
        setActiveRoute={() => {}}
      />
    );

    expect(screen.getByText("1 hr 1 min")).toBeInTheDocument();
  });
});
