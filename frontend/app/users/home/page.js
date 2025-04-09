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
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <SettingPanel />
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user, isLoading } = useUser();
  return (
    <div className="min-h-screen text-white font-sans">
      <div className="mx-auto">
        <div class="relative h-screen w-screen flex items-center justify-center overflow-hidden">
          <div
            id="map-bgkd"
            class="absolute h-screen w-screen md:inset-0 max-md:top-1/2 max-md:left-1/2 max-md:-translate-x-1/2 max-md:-translate-y-1/2 bg-[url('/images/mapbkgd.png')] bg-cover bg-center animate-bg-pan-mobile md:animate-bg-pan"
          />
          <div
            id="bgkd-overlay"
            class="absolute inset-0 bg-black/50 backdrop-blur-[1.4px] z-10"
          />
          <Card class="relative w-[80%] md:w-[30%] z-20 px-4 py-6 gap-4 bg-gradient-to-tr from-sidebar-group to-stone-800 border-[2px] border-sidebar-border rounded-lg text-sidebar-text flex flex-col align-center items-center">
            <CardHeader class="w-full flex flex-col align-center items-center">
              <CardTitle class="text-xl text-center font-medium">
                Nightwalkers
              </CardTitle>
              <CardDescription class="text-sm text-muted-foreground text-center">
                Logged in as: {isLoading ? "Loading..." : user?.email}
              </CardDescription>
            </CardHeader>
            <CardContent class="flex flex-col align-center items-center w-full">
              <Button
                class="bg-stone-900 border border-sidebar-border rounded-md p-2 mb-4 w-[60%] hover:border-stone-400 flex flex-col align-center items-center"
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
