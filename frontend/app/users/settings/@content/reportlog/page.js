"use client";
import React, { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import UserReportsList from "@/app/custom-components/ReportAppIssues/UserReportList";
import { ArrowLeft } from "lucide-react";

const ReportLog = () => {
  return (
    <div className="h-full w-full">
      <div className="lg:h-header h-mobileheader flex items-center ml-8">
        <Link href="/users/settings">
          <ArrowLeft />
        </Link>
        <h1 className="text-lg md:text-xl lg:text-2xl m-8">
          <Link href="/users/settings">Settings</Link> &gt;
          <span className="italic"> Report Log</span>
        </h1>
      </div>
      <Separator orientation="horizontal" />
      <div className="flex flex-col m-4">
        <div>
          <UserReportsList />
        </div>
      </div>
    </div>
  );
};

export default ReportLog;
