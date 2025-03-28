import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SettingsSidebar from "@/app/custom-components/SettingsSidebar";
import { useSidebar } from "@/components/ui/sidebar";

// Mock the UI components
jest.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }) => <div data-testid="avatar">{children}</div>,
  AvatarImage: ({ src, alt }) => <img src={src} alt={alt} />,
  AvatarFallback: ({ children }) => <div>{children}</div>,
}));

jest.mock("@/components/ui/sidebar", () => ({
  useSidebar: jest.fn(),
  Sidebar: ({ children }) => <div data-testid="sidebar">{children}</div>,
  SidebarContent: ({ children }) => <div>{children}</div>,
  SidebarGroup: ({ children }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }) => <div>{children}</div>,
  SidebarMenu: ({ children }) => <div>{children}</div>,
  SidebarMenuButton: ({ children, asChild }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }) => <div>{children}</div>,
  SidebarSeparator: () => <hr />,
}));

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  UserRound: () => <img role="img" hidden alt="user" />,
  Flag: () => <img role="img" hidden alt="flag" />,
  MapPinCheck: () => <img role="img" hidden alt="map" />,
  ShieldPlus: () => <img role="img" hidden alt="shield" />,
  Settings: () => <img role="img" hidden alt="settings" />,
  LogOut: () => <img role="img" hidden alt="logout" />,
  X: () => <img role="img" hidden alt="close" />,
}));

// Navigation items
const NAVIGATION_ITEMS = [
  { text: "Profile", href: "/users/settings/profile" },
  { text: "Routes", href: "/users/settings/routes" },
  { text: "Report", href: "/users/settings/report" },
  { text: "Resources", href: "/users/resources" },
  { text: "Settings", href: "/users/settings" },
  { text: "Sign Out", href: "#" },
];

describe("SettingsSidebar", () => {
  const mockUseSidebar = {
    state: {},
    open: true,
    setOpen: jest.fn(),
    openMobile: false,
    setOpenMobile: jest.fn(),
    isMobile: false,
    toggleSidebar: jest.fn(),
  };

  beforeEach(() => {
    useSidebar.mockImplementation(() => mockUseSidebar);
  });

  it("renders the sidebar with user avatar and username", () => {
    render(<SettingsSidebar />);
    expect(screen.getByAltText("@shadcn")).toBeInTheDocument();
    expect(screen.getByText("Username")).toBeInTheDocument();
  });

  it("renders all navigation items with correct links", () => {
    render(<SettingsSidebar />);

    NAVIGATION_ITEMS.forEach(({ text, href }) => {
      const link = screen.getByText(text).closest("a");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", href);
    });
  });

  it("closes sidebar when X button is clicked on desktop", () => {
    render(<SettingsSidebar />);

    const closeButton = screen.getByRole("button", { name: /x/i });
    fireEvent.click(closeButton);

    expect(mockUseSidebar.setOpen).toHaveBeenCalledWith(false);
    expect(mockUseSidebar.setOpenMobile).not.toHaveBeenCalled();
  });

  it("closes sidebar when X button is clicked on mobile", () => {
    useSidebar.mockImplementation(() => ({
      ...mockUseSidebar,
      isMobile: true,
    }));

    render(<SettingsSidebar />);

    const closeButton = screen.getByRole("button", { name: /x/i });
    fireEvent.click(closeButton);

    expect(mockUseSidebar.setOpenMobile).toHaveBeenCalledWith(false);
  });

  it("renders navigation items with correct icons", () => {
    render(<SettingsSidebar />);
    const icons = screen.getAllByRole("img", { hidden: true });
    expect(icons.length).toBe(NAVIGATION_ITEMS.length);
  });

  it("renders the sidebar on the right side", () => {
    const { container } = render(<SettingsSidebar />);
    expect(container.firstChild).toHaveAttribute("data-side", "right");
  });
});
