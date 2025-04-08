import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsSidebar from "@/app/custom-components/SettingsSidebar";
import { signOut } from "next-auth/react";

// Mock localStorage
const mockLocalStorage = {
  removeItem: jest.fn(),
  getItem: jest.fn(),
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
    expect(screen.getByText("User Settings")).toBeInTheDocument();
  });

  it("renders user avatar section", () => {
    render(<SettingsSidebar />);
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByText("Edit Display")).toBeInTheDocument();
  });

  it("renders main sections correctly", () => {
    render(<SettingsSidebar />);
    expect(screen.getByText("User Settings")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Route Management")).toBeInTheDocument();
    expect(screen.getByText("Forum History")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("renders all navigation items with correct links", () => {
    render(<SettingsSidebar />);

    // Test account section links
    expect(screen.getByText("Profile").closest("a")).toHaveAttribute(
      "href",
      "/users/settings/profile"
    );
    expect(screen.getByText("Location Settings").closest("a")).toHaveAttribute(
      "href",
      "/users/settings/profile#location"
    );

    // Test route section links
    expect(screen.getByText("Saved Routes").closest("a")).toHaveAttribute(
      "href",
      "/users/settings/routes#saved"
    );
    expect(screen.getByText("Route Preferences").closest("a")).toHaveAttribute(
      "href",
      "/users/settings/routes#preferences"
    );

    // Test forum section links
    expect(screen.getByText("Posts").closest("a")).toHaveAttribute(
      "href",
      "/users/settings/forum/posts"
    );
    expect(screen.getByText("Comments").closest("a")).toHaveAttribute(
      "href",
      "/users/settings/forum/comments"
    );
  });

  it("handles logout process correctly", async () => {
    const mockRouter = { push: jest.fn(), refresh: jest.fn() };
    jest
      .spyOn(require("next/navigation"), "useRouter")
      .mockReturnValue(mockRouter);

    render(<SettingsSidebar />);

    // Click logout button
    fireEvent.click(screen.getByText("Logout"));

    // Verify signOut was called
    expect(signOut).toHaveBeenCalledWith({
      redirect: false,
    });

    // Verify loading state is shown
    expect(screen.getByText("Logging out...")).toBeInTheDocument();

    // Wait for async operations to complete
    await waitFor(() => {
      // Verify localStorage.removeItem was called
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user");
      // Verify router.push was called
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
      // Verify router.refresh was called
      expect(mockRouter.refresh).toHaveBeenCalled();
    });
  });

  it("closes sidebar when back arrow is clicked - desktop", () => {
    const { container } = render(<SettingsSidebar />);
    const backArrow = container.querySelector("svg"); // ArrowLeft icon
    fireEvent.click(backArrow);
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it("handles ArrowLeft click", () => {
    render(<SettingsSidebar />);
    const arrowLeftIcon = screen.getByTestId("arrow-left-icon");
    fireEvent.click(arrowLeftIcon);
  });
});
