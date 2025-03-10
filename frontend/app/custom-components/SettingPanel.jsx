import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SettingsSidebar from "./SettingsSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const SettingPanel = () => {
  const [open, setOpen] = useState(false);
  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <SidebarTrigger />
      {/* <Avatar className="h-24 w-24">
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar> */}
      <SettingsSidebar />
    </SidebarProvider>
  );
};

export default SettingPanel;
