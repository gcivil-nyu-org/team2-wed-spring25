"use client";

import React, { useState } from "react";
import {
  UserRound,
  Globe,
  GlobeLock,
  Flag,
  Settings,
  LogOut,
  MapPinPlus,
  NotebookPen,
  ArrowRight,
  ChevronRight,
  SquarePen,
  MessageSquareDiff,
  MessageSquareText,
  ThumbsUp,
  ClipboardX,
  TriangleAlert
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useUser } from "@/components/Auth/UserContextProvider";

const items = [
  { title: "Profile", url: "/users/settings/profile", icon: UserRound },
  {
    title: "Location Settings",
    url: "/users/settings/profile#location",
    icon: Globe,
  },
  { title: "Report a Bug", url: "/users/settings/profile#report", icon: Flag },
];

const routeItems = [
  {
    title: "Saved Routes",
    url: "/users/settings/routes#saved",
    icon: MapPinPlus,
  },
];

const forumItems = [
  {
    title: "Posts",
    url: "/users/settings/forum/posts",
    icon: MessageSquareDiff,
  },
  {
    title: "Comments",
    url: "/users/settings/forum/comments",
    icon: MessageSquareText,
  },
  {
    title: "Reactions",
    url: "/users/settings/forum/reactions",
    icon: ThumbsUp,
  },
  {
    title: "Reported Posts",
    url: "/users/settings/forum/reports",
    icon: ClipboardX,
  },
  {
    title: "Flagged Posts",
    url: "/users/settings/forum/flagged_posts",
    icon: ClipboardX,
  },
];

const SettingsSidebar = () => {
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  
  const userContext = useUser();
  
  const contextUser = userContext?.user || null;
  
  // Log if context is not available
  if (!contextUser) {
    console.log("User context not available, falling back to localStorage");
  }

  const handleNavigate = (url) => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
    // Small timeout to ensure the navigation happens after sidebar starts closing
    setTimeout(() => {
      router.push(url);
    }, 50);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({ redirect: false });
      localStorage.removeItem("user");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Try to get user from context first, then fall back to localStorage
  let user = contextUser;

  if (!user && typeof window !== "undefined") {
    try {
      user = JSON.parse(localStorage.getItem("user"));
    } catch (error) {
      console.error("Error parsing user from localStorage", error);
    }
  }

  if (!user) return null;

  // Simplified name display - no need for the getUserFullName function
  const displayName =
    `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown User";

  // Get avatar URL with proper fallbacks - handle Google profile URLs specially
  let avatarUrl = null;
  
  // Debug what avatar values are available
  // console.log("Avatar data:", {
  //   contextAvatar: user.avatar,
  //   contextAvatarUrl: user.avatar_url,
  //   userObject: user
  // });
  
  // Check if it's a Google avatar URL
  const isGoogleAvatar = (url) => {
    return url && typeof url === 'string' && url.includes('googleusercontent.com');
  };
  
  // First try the direct avatar properties
  if (user.avatar && typeof user.avatar === 'string') {
    avatarUrl = user.avatar;
  } else if (user.avatar_url && typeof user.avatar_url === 'string') {
    avatarUrl = user.avatar_url;
  } 
  // If we have no avatar yet, and we're using localStorage user
  else if (!contextUser && typeof window !== "undefined") {
    // Try to extract avatar from localStorage user if needed
    try {
      const localUser = JSON.parse(localStorage.getItem("user"));
      if (localUser && localUser.avatar) {
        avatarUrl = localUser.avatar;
      } else if (localUser && localUser.avatar_url) {
        avatarUrl = localUser.avatar_url;
      }
    } catch (error) {
      console.error("Error parsing user avatar from localStorage", error);
    }
  }
  
  // For Google profile pictures, ensure they work by adding parameters
  if (isGoogleAvatar(avatarUrl)) {
    // Add a cache-busting parameter to force reload
    avatarUrl = `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
  }
  
  // console.log("Final avatar URL:", avatarUrl);

  const renderMenuGroup = (label, menuItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-labeltext text-opacity-90 font-bold text-sidebar-text pb-2 text-md">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent className="p-0 overflow-hidden">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title} className="p-0">
              <SidebarMenuButton
                onClick={() => handleNavigate(item.url)}
                className="rounded-md hover:bg-sidebar-hover transition-all duration-100 w-full py-5 text-left"
              >
                <div className="flex items-center justify-between w-full text-sidebar-text">
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{item.title}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 opacity-60" />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar
      side="right"
      collapsible="offcanvas"
      className="border-l border-sidebar-border overflow-y-auto"
    >
      <SidebarContent className="bg-sidebar-group p-0">
        {/* Header */}
        <SidebarHeader className="border-b border-sidebar-border border-opacity-30 shadow-sm sticky top-0 z-50">
          <div className="relative flex justify-center items-center py-0">
            <div
              className="absolute left-4 cursor-pointer text-sidebar-text hover:text-white transition-colors duration-200"
              onClick={() => (isMobile ? setOpenMobile(false) : setOpen(false))}
              aria-label="Close sidebar"
            >
              <ArrowRight className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <Image src="/owl-logo.svg" width={26} height={26} alt="Logo" />
              <h1 className="text-xl font-medium text-sidebar-text">
                Settings
              </h1>
            </div>
          </div>
        </SidebarHeader>

        {/* User Banner - Fixed to use a div instead of SidebarGroup/SidebarMenuButton */}
        <div className="mt-4 mb-1 mx-3">
          <div
            className="w-full relative border border-sidebar-border border-opacity-30 rounded-lg p-3 cursor-pointer hover:bg-sidebar-hover transition-colors"
            onClick={() => handleNavigate("/users/settings/profile")}
          >
            <div className="absolute inset-0 flex justify-center items-center rounded-lg z-10 bg-sidebar-bg opacity-0 hover:opacity-90 transition-opacity duration-300">
              <span className="flex items-center text-white font-medium">
                Edit Profile <SquarePen className="h-4 w-4 ml-2" />
              </span>
            </div>

            <div className="relative z-0 flex items-center gap-3">
              <Avatar className="h-14 w-14 border border-sidebar-border border-opacity-50">
                {avatarUrl ? (
                  <AvatarImage
                    src={avatarUrl}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error("Avatar image failed to load", e);
                      console.log("Failed avatar URL:", avatarUrl);
                      // Hide the image and show fallback
                      e.target.style.display = "none";
                      // Try to find the parent Avatar element and add a class
                      const avatarParent = e.target.closest(".h-14");
                      if (avatarParent) {
                        avatarParent.classList.add("avatar-fallback-active");
                      }
                    }}
                  />
                ) : (
                  <AvatarFallback className="bg-sidebar-bg text-sidebar-text flex items-center justify-center">
                    <UserRound className="h-6 w-6" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-sidebar-text">
                  {displayName}
                </span>
                <span className="text-sm text-sidebar-text opacity-70 truncate whitespace-nowrap overflow-hidden max-w-[150px]">
                  {user.email || ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        {renderMenuGroup("Account", items)}
        {renderMenuGroup("Report History", [
          {
            title: "App Bug Reports",
            url: "/users/settings/reportlog",
            icon: NotebookPen,
          },
          {
            title: "Safety Reports",
            url: "/users/settings/safety-reports",
            icon: TriangleAlert,
          },
        ])}
        {renderMenuGroup("Route Management", routeItems)}
        {renderMenuGroup("Forum History", forumItems)}
        {renderMenuGroup("General", [
          { title: "General Settings", url: "/users/settings", icon: Settings },
        ])}

        {/* Logout */}
        <div className="px-2 mx-0 mt-4 mb-6">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`rounded-md py-3 px-4 bg-red-600 hover:bg-red-800 transition-colors duration-100 text-white w-full ${
                  isLoggingOut ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex items-center justify-center">
                  <LogOut className="h-5 w-5 mr-3" />
                  <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export default SettingsSidebar;