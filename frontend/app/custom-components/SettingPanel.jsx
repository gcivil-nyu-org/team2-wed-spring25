import React, { useEffect, useState } from "react";
import SettingsSidebar from "./SettingsSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const SettingPanel = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    console.log(open)
  }, [open]);
  return (
    <SidebarProvider
      open={open}
      onOpenChange={setOpen}
<<<<<<< HEAD
      style={{
        "--sidebar-width": "15rem",
        "--sidebar-width-mobile": "10rem",
      }}
=======
>>>>>>> origin/develop
    >
      <SidebarTrigger />
      <SettingsSidebar />
    </SidebarProvider>
  );
};

export default SettingPanel;
