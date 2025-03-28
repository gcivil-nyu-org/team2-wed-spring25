import React from "react";
import {
  UserRound,
<<<<<<< HEAD
  Flag,
  MapPinCheck,
  ShieldPlus,
  Settings,
  LogOut,
  X,
=======
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
>>>>>>> origin/develop
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
<<<<<<< HEAD
=======
  SidebarHeader,
>>>>>>> origin/develop
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
import { useAuth } from "./AuthHook";
<<<<<<< HEAD
=======
import Image from "next/image";
>>>>>>> origin/develop

const items = [
  {
    title: "Profile",
<<<<<<< HEAD
    url: "/users/settings/profile",
    icon: UserRound,
  },
  {
    title: "Routes",
    url: "/users/settings/routes",
    icon: MapPinCheck,
  },
  {
    title: "Report",
    url: "/users/settings/report",
    icon: Flag,
  },
  {
    title: "Resources",
    url: "/users/resources",
    icon: ShieldPlus,
  },
  {
    title: "Settings",
    url: "/users/settings",
    icon: Settings,
=======
    url: "/users/settings/profile#password",
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
  }
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
>>>>>>> origin/develop
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
  const { logout } = useAuth();

  return (
    <Sidebar side="right" collapsible="offcanvas">
      <SidebarContent>
<<<<<<< HEAD
        {/* Banner */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="w-full">
              <div className="flex justify-between">
                <div className="flex-1" /> {/* Spacer */}
                <div className="p-2 cursor-pointer hover:opacity-70">
                  <X
                    onClick={() =>
                      isMobile ? setOpenMobile(false) : setOpen(false)
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col items-center gap-5">
                <Avatar className="h-24 w-24">
=======
        {/* Header */}
        <SidebarHeader>
          <div className="relative flex justify-center items-center w-[100%]">
            <div className="absolute left-0 text-xl p-4 cursor-pointer hover:opacity-70">
              <ArrowLeft
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
>>>>>>> origin/develop
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <span>Username</span>
              </div>
<<<<<<< HEAD
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        {/* Links */}
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
=======
            </Link>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Account */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
>>>>>>> origin/develop
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
<<<<<<< HEAD
                      <item.icon />
                      <span>{item.title}</span>
=======
                      <span className="flex items-center justify-between w-[100%]">
                        <span className="flex items-center justify-between">
                          <item.icon />
                          <span className="pl-2">{item.title}</span>
                        </span>
                        <ChevronRight className="pr-1" />
                      </span>
>>>>>>> origin/develop
                    </Link>
                  </SidebarMenuButton>
                  <SidebarSeparator />
                </SidebarMenuItem>
              ))}
<<<<<<< HEAD
              {/* Log Out */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout}>
                  <LogOut />
                  <span>Log Out</span>
=======
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
                <SidebarMenuButton onClick={logout}>
                  <LogOut />
                  <span>Sign Out</span>
>>>>>>> origin/develop
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
