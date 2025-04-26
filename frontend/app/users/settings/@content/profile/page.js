"use client";
import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import * as Switch from "@radix-ui/react-switch";
import ReportAppIssueForm from "@/app/custom-components/ReportAppIssues/ReportAppIssueForm";
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

        {/* Report Section */}
        <div className="mb-[50px]">
          <h2 id="report" className="mb-4">
            Report a Bug
          </h2>
          <ReportAppIssueForm />
        </div>
      </div>
    </div>
  );
};

export default ProfileContent;