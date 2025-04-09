import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsSidebar from "@/app/custom-components/SettingsSidebar";
import { signOut } from "next-auth/react";

// Mock localStorage with user data
const mockUser = {
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
};

const mockLocalStorage = {
  removeItem: jest.fn(),
  getItem: jest.fn(() => JSON.stringify(mockUser)),
  setItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Mock next/auth
jest.mock("next-auth/react", () => ({
  signOut: jest.fn(() => Promise.resolve({ url: "/login" })),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const mockSetOpen = jest.fn();
const mockSetOpenMobile = jest.fn();

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => <img {...props} />,
}));

jest.mock("next/link", () => {
  return ({ children, href }) => <a href={href}>{children}</a>;
});

jest.mock("@/components/ui/sidebar", () => {
  const useSidebar = () => ({
    open: true,
    setOpen: mockSetOpen,
    openMobile: false,
    setOpenMobile: mockSetOpenMobile,
    isMobile: false,
    toggleSidebar: jest.fn(),
  });

  return {
    Sidebar: ({ children, side, collapsible }) => <div>{children}</div>,
    SidebarHeader: ({ children }) => <div>{children}</div>,
    SidebarContent: ({ children }) => <div>{children}</div>,
    SidebarGroup: ({ children }) => <div>{children}</div>,
    SidebarGroupContent: ({ children, className }) => (
      <div className={className}>{children}</div>
    ),
    SidebarGroupLabel: ({ children }) => <div>{children}</div>,
    SidebarMenu: ({ children }) => <div>{children}</div>,
    SidebarMenuButton: ({ children, onClick, asChild }) => {
      if (asChild) return children;
      return <button onClick={onClick}>{children}</button>;
    },
    SidebarMenuItem: ({ children }) => <div>{children}</div>,
    SidebarSeparator: () => <hr />,
    useSidebar,
  };
});

describe("SettingsSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders heading", () => {
    render(<SettingsSidebar />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders user section", () => {
    render(<SettingsSidebar />);
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("Edit Profile")).toBeInTheDocument();
  });

  it("renders main sections correctly", () => {
    render(<SettingsSidebar />);
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Route Management")).toBeInTheDocument();
    expect(screen.getByText("Forum History")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
  });

  it("renders all navigation items with correct links", () => {
    render(<SettingsSidebar />);

    // Test account section links
    const profileLink = screen.getByText("Profile").closest("div");
    expect(profileLink).toBeInTheDocument();

    const locationLink = screen.getByText("Location Settings").closest("div");
    expect(locationLink).toBeInTheDocument();

    // Test route section links
    const savedRoutesLink = screen.getByText("Saved Routes").closest("div");
    expect(savedRoutesLink).toBeInTheDocument();

    const routePrefsLink = screen.getByText("Route Preferences").closest("div");
    expect(routePrefsLink).toBeInTheDocument();

    // Test forum section links
    const postsLink = screen.getByText("Posts").closest("div");
    expect(postsLink).toBeInTheDocument();

    const commentsLink = screen.getByText("Comments").closest("div");
    expect(commentsLink).toBeInTheDocument();
  });

  it("handles logout process correctly", async () => {
    const mockRouter = { push: jest.fn(), refresh: jest.fn() };
    jest
      .spyOn(require("next/navigation"), "useRouter")
      .mockReturnValue(mockRouter);

    render(<SettingsSidebar />);

    // Click logout button
    fireEvent.click(screen.getByText(/Logout/));

    // Verify signOut was called
    expect(signOut).toHaveBeenCalledWith({
      redirect: false,
    });

    // Wait for async operations to complete
    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user");
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  it("closes sidebar when arrow is clicked", () => {
    render(<SettingsSidebar />);
    // Find the arrow container div by its class names
    const arrowContainer = screen.getByLabelText("Close sidebar");
    fireEvent.click(arrowContainer);
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });
});
