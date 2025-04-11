"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SettingPanel from "@/app/custom-components/SettingPanel";
import { useUser } from "@/components/Auth/UserContextProvider";
import { authAPI } from "@/utils/fetch/fetch";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import SavedRoutesList from "@/app/custom-components/RoutingComponets/SavedRoutesList";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useAuthStore } from "@/stores/useAuthStore";

// Dashboard header component
export function DashboardHeader() {
  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-4">
          <SettingPanel />
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user, isLoading } = useUser();
  const { status } = useSession();
  const { initializeConnection, connectionStatus } = useWebSocket();

  useEffect(() => {
    if (typeof window === "undefined") return; // Server-side guard

    const checkAndConnect = () => {
      try {
        console.log("User status:", status); // Debugging line

        const userId = useAuthStore.getState().user.id;
        console.log("User ID:", userId); // Debugging line

        // Only initialize if not already connected
        if (connectionStatus !== "connected") {
          console.log("Initializing WebSocket connection..."); // Debugging line

          initializeConnection(userId);
        }
      } catch (error) {
        console.error("Connection initialization error:", error);
      }
    };

    checkAndConnect();
  }, []);
  return (
    <div className="min-h-screen text-white font-sans">
      <div className="mx-auto">
        <div className="relative h-screen w-screen flex items-center justify-center overflow-hidden">
          <div
            id="map-bgkd"
            className="absolute h-screen w-screen md:inset-0 max-md:top-1/2 max-md:left-1/2 max-md:-translate-x-1/2 max-md:-translate-y-1/2 bg-[url('/images/mapbkgd.png')] bg-cover bg-center animate-bg-pan-mobile md:animate-bg-pan"
          />
          <div
            id="bgkd-overlay"
            className="absolute inset-0 bg-black/50 backdrop-blur-[1.4px] z-10"
          />
          <Card className="relative w-[80%] md:w-[30%] z-20 px-4 py-6 gap-4 bg-gradient-to-tr from-sidebar-group to-stone-800 border-[2px] border-sidebar-border rounded-lg text-sidebar-text flex flex-col align-center items-center">
            <CardHeader className="w-full flex flex-col align-center items-center">
              <CardTitle className="text-xl text-center font-medium">
                Nightwalkers
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground text-center">
                Logged in as: {isLoading ? "Loading..." : user?.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col align-center items-center w-full">
              <Button
                className="bg-stone-900 border border-sidebar-border rounded-md p-2 mb-4 w-[60%] hover:border-stone-400 flex flex-col align-center items-center"
                asChild
              >
                <Link href="/users/map">Begin Routing</Link>
              </Button>
              <SavedRoutesList homepage={true} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
