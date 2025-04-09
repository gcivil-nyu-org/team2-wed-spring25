import React from "react";
import {
  UserRound,
  Globe,
  GlobeLock,
  Flag,
  Settings,
  LogOut,
  MapPinPlus,
  MapPinCheck,
  MapPinned,
  ArrowLeft,
  ChevronRight,
  SquarePen,
  MessageSquareDiff,
  MessageSquareText,
  ThumbsUp,
  ClipboardX,
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
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getUserFullName } from "@/utils/string";
import { fallbackUserProfileImage } from "@/constants/imageUrls";
import { useNotification } from "./ToastComponent/NotificationContext";

const items = [
  {
    title: "Profile",
    url: "/users/settings/profile",
    icon: UserRound,
  },
  {
    title: "Location Settings",
    url: "/users/settings/profile#location",
    icon: Globe,
  },
  {
    title: "Privacy",
    url: "/users/settings/profile#privacy",
    icon: GlobeLock,
  },
  {
    title: "Report a Bug",
    url: "/users/settings/profile#report",
    icon: Flag,
  },
];
const routeItems = [
  {
    title: "Saved Routes",
    url: "/users/settings/routes#saved",
    icon: MapPinPlus,
  },
  {
    title: "Route Preferences",
    url: "/users/settings/routes#preferences",
    icon: MapPinCheck,
  },
  {
    title: "Route History",
    url: "/users/settings/routes#history",
    icon: MapPinned,
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
];
const SettingsSidebar = () => {
  const {
    state,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { showError } = useNotification();
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Sign out using Next-Auth
      await signOut({
        redirect: false, // Don't redirect automatically
      });
      localStorage.removeItem("user");
      // Manual redirect after signOut completes
      router.push("/login");
      router.refresh(); // Force refresh to clear any cached pages
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };
  let user = null;

  if (typeof window !== "undefined") {
    user = JSON.parse(localStorage.getItem("user")); // Retrieve the user from localStorage
  }
  // if (!user) {
  //   showError("Please login to get settings. User not found.");
  //   return null; // or handle the case when user is not found
  // }

  return (
    <Sidebar side="right" collapsible="offcanvas">
      <SidebarContent>
        {/* Header */}
        <SidebarHeader>
          <div className="relative flex justify-center items-center w-[100%]">
            <div className="absolute left-0 text-xl p-4 cursor-pointer hover:opacity-70">
              <ArrowLeft
                data-testid="arrow-left-icon"
                onClick={() =>
                  isMobile ? setOpenMobile(false) : setOpen(false)
                }
              />
            </div>
            <Image
              className="mx-0"
              src="/owl-logo.svg"
              width={24}
              height={24}
              alt="Nightwalkers Logo"
            />
            <h1 className="text-center text-xl p-4">User Settings</h1>
          </div>
        </SidebarHeader>
        {/* Banner */}
        <SidebarGroup>
          <SidebarGroupContent className="relative cursor-pointer">
            <Link href="/users/settings/profile">
              <div className="absolute top-0 left-0 flex justify-center items-center rounded-md size-full z-[10] bg-stone-800 opacity-0 hover:opacity-90 transition-opacity duration-200">
                Edit Display <SquarePen className="h-[20%] ml-2" />
              </div>
              <div className="flex flex-row justify-start items-center ml-3 gap-5 w-[80%]">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={user?.avatar || fallbackUserProfileImage}
                    alt="@shadcn"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <span>
                  {getUserFullName(
                    user?.first_name || "Unknown",
                    user?.last_name || "Unknown"
                  )}
                </span>
              </div>
            </Link>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Account */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <span className="flex items-center justify-between w-[100%]">
                        <span className="flex items-center justify-between">
                          <item.icon />
                          <span className="pl-2">{item.title}</span>
                        </span>
                        <ChevronRight className="pr-1" />
                      </span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarSeparator />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Routes */}
        <SidebarGroup>
          <SidebarGroupLabel>Route Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {routeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <span className="flex items-center justify-between w-[100%]">
                        <span className="flex items-center justify-between">
                          <item.icon />
                          <span className="pl-2">{item.title}</span>
                        </span>
                        <ChevronRight className="pr-1" />
                      </span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarSeparator />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Forum */}
        <SidebarGroup>
          <SidebarGroupLabel>Forum History </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {forumItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <span className="flex items-center justify-between w-[100%]">
                        <span className="flex items-center justify-between">
                          <item.icon />
                          <span className="pl-2">{item.title}</span>
                        </span>
                        <ChevronRight className="pr-1" />
                      </span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarSeparator />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Setting */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/users/settings">
                    <span className="flex items-center justify-between w-[100%]">
                      <span className="flex items-center justify-between">
                        <Settings />
                        <span className="pl-2">Settings</span>
                      </span>
                      <ChevronRight className="pr-1" />
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Log Out */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut />
                  <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default SettingsSidebar;
