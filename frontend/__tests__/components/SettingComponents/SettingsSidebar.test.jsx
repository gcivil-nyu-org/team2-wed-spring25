import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsSidebar from "@/app/custom-components/SettingsSidebar";
import { signOut } from "next-auth/react";

// Mock localStorage with user data
const mockUser = {
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
  // Adding avatar to test that branch
  avatar: "https://example.com/avatar.jpg",
};

const mockGoogleUser = {
  first_name: "Google",
  last_name: "User",
  email: "google@example.com",
  avatar: "https://lh3.googleusercontent.com/a/example-google-avatar",
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

// Mock the useUser hook from UserContextProvider
let mockContextUser = null;

jest.mock("@/components/Auth/UserContextProvider", () => ({
  useUser: () => ({
    user: mockContextUser,
    isLoading: false,
    error: null,
    isAuthenticated: !!mockContextUser,
    refreshUserDetails: jest.fn().mockResolvedValue(true)
  })
}));

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

jest.mock("@/components/ui/avatar", () => {
  return {
    Avatar: ({ children, className }) => <div className={className} data-testid="avatar">{children}</div>,
    AvatarImage: ({ src, alt, referrerPolicy, crossOrigin, onError }) => (
      <img src={src} alt={alt} referrerPolicy={referrerPolicy} crossOrigin={crossOrigin} data-testid="avatar-image" />
    ),
    AvatarFallback: ({ children, className }) => <div className={className} data-testid="avatar-fallback">{children}</div>,
  };
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
    // Reset localStorage mock to default user
    mockLocalStorage.getItem.mockImplementation(() => JSON.stringify(mockUser));
    // Reset context user to null
    mockContextUser = null;
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

  it("uses context user when available instead of localStorage", () => {
    // Set up context user
    mockContextUser = {
      id: 1,
      first_name: "Context",
      last_name: "User",
      email: "context@example.com",
      avatar: "https://example.com/context-avatar.jpg"
    };

    render(<SettingsSidebar />);
    
    // Should use the context user data, not localStorage
    expect(screen.getByText("Context User")).toBeInTheDocument();
    expect(screen.getByText("context@example.com")).toBeInTheDocument();
  });

  it("handles Google avatar URLs correctly", () => {
    // Mock localStorage to return a Google user
    mockLocalStorage.getItem.mockImplementation(() => JSON.stringify(mockGoogleUser));
    
    render(<SettingsSidebar />);
    
    expect(screen.getByText("Google User")).toBeInTheDocument();
    expect(screen.getByText("google@example.com")).toBeInTheDocument();
    
    // Check that avatar image exists with Google URL
    const avatarImg = screen.getByAltText("Google User");
    expect(avatarImg).toBeInTheDocument();
    
    // The src should include googleusercontent.com and a timestamp parameter
    expect(avatarImg.src).toContain("googleusercontent.com");
    expect(avatarImg.src).toMatch(/[?&]t=\d+/); // Should include timestamp
  });

  it("renders user with avatar_url instead of avatar", () => {
    // Mock localStorage with user that has avatar_url instead of avatar
    const userWithAvatarUrl = {
      first_name: "Avatar",
      last_name: "Url",
      email: "avatar@example.com",
      avatar_url: "https://example.com/avatar-url.jpg"
    };
    
    mockLocalStorage.getItem.mockImplementation(() => JSON.stringify(userWithAvatarUrl));
    
    render(<SettingsSidebar />);
    
    expect(screen.getByText("Avatar Url")).toBeInTheDocument();
    
    // Check that avatar image exists with correct URL
    const avatarImg = screen.getByAltText("Avatar Url");
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg.src).toContain("avatar-url.jpg");
  });

  it("handles invalid localStorage data gracefully", () => {
    // Mock localStorage to return invalid JSON
    mockLocalStorage.getItem.mockImplementation(() => "invalid-json");
    
    // Mock console.error to avoid test output clutter
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Component should return null when no valid user is found
    const { container } = render(<SettingsSidebar />);
    expect(container).toBeEmptyDOMElement();
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});