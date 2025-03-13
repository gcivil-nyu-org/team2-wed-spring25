import React from "react";
import {
  UserRound,
  Flag,
  MapPinCheck,
  ShieldPlus,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
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

const items = [
  {
    title: "Profile",
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
  },
  {
    title: "Sign Out",
    url: "#",
    icon: LogOut,
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

  return (
    <Sidebar side="right" collapsible="offcanvas">
      <SidebarContent>
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
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <span>Username</span>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        {/* Links */}
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarSeparator />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default SettingsSidebar;
