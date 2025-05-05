"use client";
import React, { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SafetyReportsList from "@/app/custom-components/SafetyReport/SafetyReportList";

const SafetyReports = () => {
  return (
    <div className="h-full w-full overflow-scroll custom-scrollbar">
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
          <SafetyReportsList />
        </div>
      </div>
    </div>
  );
};

export default SafetyReports;
