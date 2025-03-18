import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SettingPanel from "@/app/custom-components/SettingPanel";

// Mock SidebarProvider
jest.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children, open, onOpenChange }) => (
    <div
      data-testid="sidebar-provider"
      data-open={open}
      onClick={() => onOpenChange(!open)}
    >
      {children}
    </div>
  ),
  SidebarTrigger: () => <button data-testid="sidebar-trigger">Toggle</button>,
}));

// Mock SettingsSidebar
jest.mock("@/app/custom-components/SettingsSidebar", () => {
  return function MockSettingsSidebar() {
    return <div data-testid="settings-sidebar">Sidebar Content</div>;
  };
});

describe("SettingPanel", () => {
  it("renders all required components", () => {
    render(<SettingPanel />);

    expect(screen.getByTestId("sidebar-provider")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("settings-sidebar")).toBeInTheDocument();
  });

  it("starts with sidebar closed", () => {
    render(<SettingPanel />);

    expect(screen.getByTestId("sidebar-provider")).toHaveAttribute(
      "data-open",
      "false"
    );
  });

  it("toggles sidebar state when trigger is clicked", () => {
    render(<SettingPanel />);

    const trigger = screen.getByTestId("sidebar-trigger");
    fireEvent.click(trigger);

    expect(screen.getByTestId("sidebar-provider")).toHaveAttribute(
      "data-open",
      "true"
    );
  });

  it("matches snapshot", () => {
    const { container } = render(<SettingPanel />);
    expect(container).toMatchSnapshot();
  });
});
