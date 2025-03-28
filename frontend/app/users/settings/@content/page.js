import React from "react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
<<<<<<< HEAD
=======
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
>>>>>>> origin/develop

const SettingsContent = () => {
  return (
    <div className="h-full w-full">
<<<<<<< HEAD
      <div className="h-[15%] flex items-center">
        <h1 className="text-2xl text-gray-800 m-6">
          <Link href="/users/settings">Settings</Link> &gt;
          <span className="italic"> General</span>
        </h1>
      </div>
      <Separator orientation="horizontal" />
      <div className="p-6">
        <h2>Settings</h2>
        <form className="space-y-4">
          <div>
            <label>Name</label>
            <input type="text" className="border rounded p-2" />
          </div>
          <div>
            <label>Email</label>
            <input type="email" className="border rounded p-2" />
          </div>
        </form>
=======
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
>>>>>>> origin/develop
      </div>
    </div>
  );
};

export default SettingsContent;
