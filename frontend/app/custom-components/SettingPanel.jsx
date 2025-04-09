import React, { useEffect, useState } from "react";
import SettingsSidebar from "./SettingsSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import BottomNavBar from "@/components/organisms/BottomNavBar/BottomNavBar"; 

const SettingPanel = () => {
  const [open, setOpen] = useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      {/* <SidebarTrigger /> Removed the default SidebarTrigger */}
      <SettingsSidebar />
      <BottomNavBar /> 
    </SidebarProvider>
  );
};

export default SettingPanel;
