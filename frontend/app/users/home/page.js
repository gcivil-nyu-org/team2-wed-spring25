"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SettingPanel from "@/app/custom-components/SettingPanel";
import { useUser } from "@/components/Auth/UserContextProvider";
import { apiPost, authAPI } from "@/utils/fetch/fetch";
import EnableNotifications from "@/components/atom/EnableNotification/EnableNotification";
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

// Dashboard header component
export function DashboardHeader() {
  const { user, isLoading } = useUser();
  const testAPI = async () => {
    try {
      const response = await authAPI.authenticatedGet("users/me");
      console.log(response);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

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
  console.log(localStorage.getItem("fcm_token"));
  useEffect(() => {
    const setFCMToken = async () => {
      try {
        await apiPost(
          "/user/update-fcm-token/",
          {
            user_id: user?.id || null,
            fcm_token: localStorage.getItem("fcm_token") || null,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error("Error setting FCM token:", error);
      }
    };
    setFCMToken();
  }, []); // Empty dependency array to run only once on mount
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
          <Card className="relative w-[80%] md:w-[30%] z-20 px-4 py-6 gap-4 bg-sidebar-group border-[2px] border-sidebar-border rounded-lg text-sidebar-text flex flex-col align-center items-center">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-blue-900/10 to-blue-900/30 pointer-events-none"></div>
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
                className="bg-stone-900 border border-sidebar-border rounded-md p-2 mb-4 w-[100%] md:w-[80%] hover:border-stone-400 flex flex-col align-center items-center"
                asChild
              >
                <Link href="/users/map">Begin Routing</Link>
              </Button>
              <SavedRoutesList homepage={true} />
            </CardContent>
          </Card>
        </div>
      </div>
      {/* <EnableNotifications /> */}
    </div>
  );
}
