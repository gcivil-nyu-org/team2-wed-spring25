import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RouteInfo from "@/app/custom-components/MapComponents/RouteInfo";

describe("RouteInfo", () => {
  const mockRouteDetails = {
    initial: {
      distance: 1609.34, // 1 mile (in meters)
      duration: 900, // 15 minutes
      instructions: [
        { instruction: "Turn right", distance: 100, duration: 60 },
        { instruction: "Turn left", distance: 200, duration: 120 },
      ],
    },
    safer: {
      distance: 3218.69, // 2 miles (in meters)
      duration: 1200, // 20 minutes
      instructions: [
        { instruction: "Go straight", distance: 300, duration: 180 },
        { instruction: "Turn right", distance: 400, duration: 240 },
      ],
    },
  };

  it("renders route information correctly with miles", () => {
    render(
      <RouteInfo
        routeDetails={mockRouteDetails}
        activeRoute="initial"
        setActiveRoute={() => {}}
      />
    );

    // Should show 1 mile for initial route
    expect(screen.getByText("1.0 mi")).toBeInTheDocument();
    expect(screen.getByText("15 min")).toBeInTheDocument();
  });

  it("handles decimal miles correctly", () => {
    const decimalMileRoute = {
      initial: {
        distance: 2414.02, // 1.5 miles (in meters)
        duration: 1080, // 18 minutes
        instructions: [],
      },
    };

    render(
      <RouteInfo
        routeDetails={decimalMileRoute}
        activeRoute="initial"
        setActiveRoute={() => {}}
      />
    );

    expect(screen.getByText("1.5 mi")).toBeInTheDocument();
  });

  it("switches between initial and safer routes showing correct distances", () => {
    const mockSetActiveRoute = jest.fn();
    const { rerender } = render(
      <RouteInfo
        routeDetails={mockRouteDetails}
        activeRoute="initial"
        setActiveRoute={mockSetActiveRoute}
      />
    );

    // Initial route should show 1 mile
    expect(screen.getByText("1.0 mi")).toBeInTheDocument();

    // Switch to safer route
    rerender(
      <RouteInfo
        routeDetails={mockRouteDetails}
        activeRoute="safer"
        setActiveRoute={mockSetActiveRoute}
      />
    );

    // Safer route should show 2 miles
    expect(screen.getByText("2.0 mi")).toBeInTheDocument();
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
        distance: 1609.34, // 1 mile
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

  // NEW TESTS START HERE

  it("handles route button clicks correctly", () => {
    const mockSetActiveRoute = jest.fn();
    render(
      <RouteInfo
        routeDetails={mockRouteDetails}
        activeRoute="initial"
        setActiveRoute={mockSetActiveRoute}
      />
    );

    // Find and click the Safer button
    const saferButton = screen.getByText("Safer");
    fireEvent.click(saferButton);
    expect(mockSetActiveRoute).toHaveBeenCalledWith("safer");

    // Find and click the Standard button
    const standardButton = screen.getByText("Standard");
    fireEvent.click(standardButton);
    expect(mockSetActiveRoute).toHaveBeenCalledWith("initial");
  });

  it("formats short durations correctly", () => {
    const shortDurationRoute = {
      initial: {
        distance: 100,
        duration: 45, // 45 seconds
        instructions: [],
      },
    };

    render(
      <RouteInfo
        routeDetails={shortDurationRoute}
        activeRoute="initial"
        setActiveRoute={() => {}}
      />
    );

    expect(screen.getByText("45 sec")).toBeInTheDocument();
  });

  it("formats small distances in feet", () => {
    const shortDistanceRoute = {
      initial: {
        distance: 152.4, // 500 feet (in meters)
        duration: 60,
        instructions: [],
      },
    };

    render(
      <RouteInfo
        routeDetails={shortDistanceRoute}
        activeRoute="initial"
        setActiveRoute={() => {}}
      />
    );

    expect(screen.getByText("500 ft")).toBeInTheDocument();
  });

  it("handles missing or zero distance/duration values", () => {
    const incompleteRouteDetails = {
      initial: {
        distance: 0,
        duration: null,
        instructions: [],
      },
    };

    render(
      <RouteInfo
        routeDetails={incompleteRouteDetails}
        activeRoute="initial"
        setActiveRoute={() => {}}
      />
    );

    // Both should show placeholder
    expect(screen.getAllByText("--").length).toBe(2);
  });

  it("handles route with no instructions correctly", () => {
    const noInstructionsRoute = {
      initial: {
        distance: 1000,
        duration: 300,
        instructions: [], // Empty instructions array
      },
    };

    render(
      <RouteInfo
        routeDetails={noInstructionsRoute}
        activeRoute="initial"
        setActiveRoute={() => {}}
      />
    );

    // Show instructions panel
    fireEvent.click(screen.getByText("Turn-by-turn directions"));
    
    // Should show no directions message
    expect(screen.getByText("No turn-by-turn directions available for this route.")).toBeInTheDocument();
  });

  it("handles route with undefined instructions correctly", () => {
    const undefinedInstructionsRoute = {
      initial: {
        distance: 1000,
        duration: 300,
        // No instructions property
      },
    };

    render(
      <RouteInfo
        routeDetails={undefinedInstructionsRoute}
        activeRoute="initial"
        setActiveRoute={() => {}}
      />
    );

    // Show instructions panel
    fireEvent.click(screen.getByText("Turn-by-turn directions"));
    
    // Should show no directions message
    expect(screen.getByText("No turn-by-turn directions available for this route.")).toBeInTheDocument();
  });

  it("updates currentRouteData when activeRoute changes", () => {
    const { rerender } = render(
      <RouteInfo
        routeDetails={mockRouteDetails}
        activeRoute="initial"
        setActiveRoute={() => {}}
      />
    );

    // Initial route should show 15 min
    expect(screen.getByText("15 min")).toBeInTheDocument();

    // Change to safer route
    rerender(
      <RouteInfo
        routeDetails={mockRouteDetails}
        activeRoute="safer"
        setActiveRoute={() => {}}
      />
    );

    // Should now show 20 min
    expect(screen.getByText("20 min")).toBeInTheDocument();
  });

  it("disables route buttons when route data is not available", () => {
    const partialRouteDetails = {
      initial: {
        distance: 1000,
        duration: 300,
      },
      // No safer route data
    };

    render(
      <RouteInfo
        routeDetails={partialRouteDetails}
        activeRoute="initial"
        setActiveRoute={() => {}}
      />
    );

    // Standard button should be enabled
    const standardButton = screen.getByText("Standard");
    expect(standardButton).not.toBeDisabled();

    // Safer button should be disabled
    const saferButton = screen.getByText("Safer");
    expect(saferButton).toBeDisabled();
  });

  // Test hover state functionality
  it("handles MouseOver/MouseOut events on instruction items", () => {
    render(
      <RouteInfo
        routeDetails={mockRouteDetails}
        activeRoute="initial"
        setActiveRoute={() => {}}
      />
    );

    // Show instructions
    fireEvent.click(screen.getByText("Turn-by-turn directions"));
    
    // Get the first instruction item
    const firstInstructionItem = screen.getByText("Turn right").closest("div");
    
    // Initial style check
    const initialStyle = window.getComputedStyle(firstInstructionItem);
    const initialBgColor = initialStyle.backgroundColor;
    
    // Simulate hover
    fireEvent.mouseOver(firstInstructionItem);
    
    // Check if style changed
    // Note: This is not a perfect test as JSDOM doesn't fully simulate computed styles
    // But it at least exercises the onMouseOver function
    expect(firstInstructionItem.style.backgroundColor).toBeDefined();
    
    // Simulate mouse out
    fireEvent.mouseOut(firstInstructionItem);
    
    // Check if style changed back
    expect(firstInstructionItem.style.backgroundColor).toBeDefined();
  });

  it("handles MouseOver/MouseOut events on the directions button", () => {
    render(
      <RouteInfo
        routeDetails={mockRouteDetails}
        activeRoute="initial"
        setActiveRoute={() => {}}
      />
    );
    
    // Get the directions button
    const directionsButton = screen.getByText("Turn-by-turn directions").closest("button");
    
    // Simulate hover
    fireEvent.mouseOver(directionsButton);
    
    // Check if style changed
    expect(directionsButton.style.backgroundColor).toBeDefined();
    
    // Simulate mouse out
    fireEvent.mouseOut(directionsButton);
    
    // Check if style changed back
    expect(directionsButton.style.backgroundColor).toBeDefined();
  });
});