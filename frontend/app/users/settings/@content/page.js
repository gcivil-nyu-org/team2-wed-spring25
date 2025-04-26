import React from "react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const SettingsContent = () => {
  return (
    <div className="h-full w-full">
      <div className="lg:h-header h-mobileheader flex items-center ml-8">
        <Link href="/users/map">
          <ArrowLeft />
        </Link>
        <h1 className="text-lg md:text-xl lg:text-2xl m-8">
          <Link href="/users/settings">Settings Menu</Link>
        </h1>
      </div>
      <Separator orientation="horizontal" />
      <div className="flex flex-col gap-4 py-8 px-4">
        <Link href="/users/settings/profile">
          <Card className="bg-sidebar-bg border-sidebar-border text-sidebar-text hover:bg-sidebar-separator">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Adjust your display photo, change password, or adjust location
                and privacy settings
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/users/settings/reportlog">
          <Card className="bg-sidebar-bg border-sidebar-border text-sidebar-text hover:bg-sidebar-separator">
            <CardHeader>
              <CardTitle>App Report History</CardTitle>
              <CardDescription>
                View reports you&apos;ve made about bugs within the app
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/users/settings/reportlog">
          <Card className="bg-sidebar-bg border-sidebar-border text-sidebar-text hover:bg-sidebar-separator">
            <CardHeader>
              <CardTitle>Safety Report History</CardTitle>
              <CardDescription>
                View safety reports you&apos;ve made
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/users/settings/routes">
          <Card className="bg-sidebar-bg border-sidebar-border text-sidebar-text hover:bg-sidebar-separator">
            <CardHeader>
              <CardTitle>Route Management</CardTitle>
              <CardDescription>
                Favorite routes, set route preferences, and view previous routes
                taken
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/users/settings/forum">
          <Card className="bg-sidebar-bg border-sidebar-border text-sidebar-text hover:bg-sidebar-separator">
            <CardHeader>
              <CardTitle>Forum History</CardTitle>
              <CardDescription>
                View previously made posts, comments, reactions, and reports
                made on the forum
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default SettingsContent;
