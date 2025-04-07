'use client'
import { UserProvider } from "@/components/Auth/UserContextProvider"
import { SidebarProvider } from "@/components/ui/sidebar"
import SettingsSidebar from "@/app/custom-components/SettingsSidebar"
import BottomNavBar from "@/components/organisms/BottomNavBar/BottomNavBar"

export default function AuthLayout({ children }) {
  return (
    <UserProvider>
      <SidebarProvider>
        <SettingsSidebar /> {/* Renders the drawer */}
        <BottomNavBar />     {/* Triggers drawer via context */}
        {children}
      </SidebarProvider>
    </UserProvider>
  );
}
