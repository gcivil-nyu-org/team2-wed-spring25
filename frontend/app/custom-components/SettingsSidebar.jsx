import React from "react";
import {
  UserRound,
  Flag,
  MapPinCheck,
  ShieldPlus,
  Settings,
  LogOut,
  ArrowLeft,
  ChevronRight,
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
import { useAuth } from "./AuthHook";
import Image from "next/image";

const items = [
  {
    title: "Profile",
    url: "/users/settings/profile",
    icon: UserRound,
  },
  {
    title: "Saved Routes",
    url: "/users/settings/routes",
    icon: MapPinCheck,
  },
  {
    title: "Report a Bug",
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
            <h1 className="text-center text-xl p-4">Nightwalkers</h1>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        {/* Banner */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex flex-row justify-start items-center ml-3 gap-5 w-[80%]">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <span>Username</span>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        {/* Links */}
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
        {/* Log Out */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout}>
                  <LogOut />
                  <span>Sign Out</span>
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
