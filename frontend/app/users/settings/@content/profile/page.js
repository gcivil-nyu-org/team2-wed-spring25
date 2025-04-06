"use client";
import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import * as Switch from "@radix-ui/react-switch";
import * as Form from "@radix-ui/react-form";
import ReportAppIssueForm from "@/app/custom-components/ReportAppIssues/ReportAppIssueForm";
import UserReportsList from "@/app/custom-components/ReportAppIssues/UserReportList";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        <div>
          <h2 className="mb-4">Change Photo</h2>
        </div>
        <div>
          <h2 id="passsword" className="mb-4">
            Change Password
          </h2>
          <Form.Root className="bg-sidebar-bg border border-sidebar-border rounded-md text-sidebar-text">
            <Form.Field className="FormField" name="oldpass">
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                }}
              >
                <Form.Label className="FormLabel">
                  Confirm Old Password:
                </Form.Label>
                <Form.Message className="FormMessage" match="valueMissing">
                  Confirm old password
                </Form.Message>
                <Form.Message className="FormMessage" match="typeMismatch">
                  Your password does not match
                </Form.Message>
              </div>
              <Form.Control asChild>
                <input className="Input" type="oldpass" required />
              </Form.Control>
            </Form.Field>
            <Form.Field className="FormField" name="newpass">
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                }}
              >
                <Form.Label className="FormLabel">
                  New Password:
                </Form.Label>
                <Form.Message className="FormMessage" match="valueMissing">
                  Enter a new password
                </Form.Message>
                <Form.Message className="FormMessage" match="typeMismatch">
                  Your password does not match
                </Form.Message>
              </div>
              <Form.Control asChild>
                <input className="Input" type="oldpass" required />
              </Form.Control>
            </Form.Field>
            <Form.Field className="FormField" name="oldpass">
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                }}
              >
                <Form.Label className="FormLabel">
                  Confirm Old Password:
                </Form.Label>
                <Form.Message className="FormMessage" match="valueMissing">
                  Confirm old password
                </Form.Message>
                <Form.Message className="FormMessage" match="typeMismatch">
                  Your password does not match
                </Form.Message>
              </div>
              <Form.Control asChild>
                <input className="Input" type="oldpass" required />
              </Form.Control>
            </Form.Field>
            <Form.Submit asChild>
              <Button className="bg-sidebar-border" style={{ marginTop: 10 }}>
                Change Password
              </Button>
            </Form.Submit>
          </Form.Root>
        </div>
        <div>
          <h2 id="location" className="mb-4">
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
                className={`${
                  location ? "bg-indigo-600" : "bg-sidebar-border"
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <Switch.Thumb
                  className={`${
                    location ? "translate-x-6" : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch.Root>
            </CardContent>
          </Card>
        </div>
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
                id="location-switch"
                checked={location}
                onCheckedChange={setLocation}
                className={`${
                  location ? "bg-indigo-600" : "bg-sidebar-border"
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <Switch.Thumb
                  className={`${
                    location ? "translate-x-6" : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch.Root>
            </CardContent>
          </Card>
        </div>
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
