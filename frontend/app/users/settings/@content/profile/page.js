"use client";
import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import * as Switch from "@radix-ui/react-switch";
import ReportAppIssueForm from "@/app/custom-components/ReportAppIssues/ReportAppIssueForm";
import UserReportsList from "@/app/custom-components/ReportAppIssues/UserReportList";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import ChangeNamesForm from "@/app/custom-components/UserSettings/ChangeNamesForm";
import ChangePasswordForm from "@/app/custom-components/UserSettings/ChangePasswordForm";
import ProfilePhotoSection from "@/app/custom-components/UserSettings/ProfilePhotoSection";

const ProfileContent = () => {
  const [location, setLocation] = useState(true);

  return (
    <div className="h-auto w-full mb-12 overflow-y-scroll">
      <div className="lg:h-header h-mobileheader flex items-center ml-8">
        <Link href="/users/settings">
          <ArrowLeft />
        </Link>
        <h1 className="text-lg md:text-xl lg:text-2xl m-8">
          <Link href="/users/settings">Settings</Link> &gt;
          <span className="italic"> Account</span>
        </h1>
      </div>
      <Separator orientation="horizontal" />
      <div className="p-6 size-full flex flex-col gap-6">
        {/* Profile Photo Section */}
        <div>
          <h2 id="display" className="mb-4">Profile Photo</h2>
          <ProfilePhotoSection />
        </div>

        {/* Profile Names Section */}
        <div>
          <h2 id="profile" className="mb-4">
            Profile Information
          </h2>
          <ChangeNamesForm />
        </div>

        {/* Password Section */}
        <div>
          <h2 id="password" className="mb-4">
            Change Password
          </h2>
          <ChangePasswordForm />
        </div>

        {/* Location Section */}
        <div>
          <h2 id="locationsettings" className="mb-4">
            Location
          </h2>
          <Card className="bg-sidebar-bg border-sidebar-border text-sidebar-text">
            <CardHeader>
              <CardTitle>Enable/Disable Location</CardTitle>
              <CardDescription>
                Enable the use of your current location or disable to use manual
                navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Switch.Root
                id="location-switch"
                checked={location}
                onCheckedChange={setLocation}
                className={`${location ? "bg-indigo-600" : "bg-sidebar-border"
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <Switch.Thumb
                  className={`${location ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch.Root>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Section */}
        <div>
          <h2 id="privacy" className="mb-4">
            Privacy
          </h2>
          <Card className="bg-sidebar-bg border-sidebar-border text-sidebar-text">
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Allow/disallow sharing your route history that would help
                improve the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Switch.Root
                id="privacy-switch"
                checked={location} // You might want to use a separate state variable for this
                onCheckedChange={setLocation}
                className={`${location ? "bg-indigo-600" : "bg-sidebar-border"
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <Switch.Thumb
                  className={`${location ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch.Root>
            </CardContent>
          </Card>
        </div>

        {/* Report Section */}
        <div>
          <h2 id="report" className="mb-4">
            Report a Bug
          </h2>
          <ReportAppIssueForm />
          <UserReportsList />
        </div>
      </div>
    </div>
  );
};

export default ProfileContent;