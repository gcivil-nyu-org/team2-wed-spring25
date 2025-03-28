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

const ForumContent = () => {
  return (
    <div className="h-full w-full">
      <div className="lg:h-header h-mobileheader flex items-center ml-8">
        <Link href="/users/settings">
          <ArrowLeft />
        </Link>
        <h1 className="text-lg md:text-xl lg:text-2xl m-8">
          <Link href="/users/settings">Settings</Link> &gt;
          <span className="italic"> Forum</span>
        </h1>
      </div>
      <Separator orientation="horizontal" />
      <div className="flex flex-col gap-4 py-8 px-4">
        <Link href="/users/settings/forum/posts">
          <Card className="bg-sidebar-bg border-sidebar-border text-sidebar-text hover:bg-sidebar-separator">
            <CardHeader>
              <CardTitle>Posts</CardTitle>
              <CardDescription>View posts you have made</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/users/settings/forum/comments">
          <Card className="bg-sidebar-bg border-sidebar-border text-sidebar-text hover:bg-sidebar-separator">
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>View comments you have made</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/users/settings/forum/reactions">
          <Card className="bg-sidebar-bg border-sidebar-border text-sidebar-text hover:bg-sidebar-separator">
            <CardHeader>
              <CardTitle>Reactions</CardTitle>
              <CardDescription>View posts you have reacted to</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/users/settings/forum/reports">
          <Card className="bg-sidebar-bg border-sidebar-border text-sidebar-text hover:bg-sidebar-separator">
            <CardHeader>
              <CardTitle>Reported Posts</CardTitle>
              <CardDescription>View posts you have reported</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default ForumContent;
