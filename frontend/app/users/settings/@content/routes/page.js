'use client'
import React, { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import SavedRoutesList from "@/app/custom-components/RoutingComponets/SavedRoutesList";
import { ArrowLeft } from "lucide-react";

const RoutesContent = () => {
  return (
    <div className="h-full w-full">
      <div className="lg:h-header h-mobileheader flex items-center ml-8">
        <Link href="/users/settings">
          <ArrowLeft />
        </Link>
        <h1 className="text-lg md:text-xl lg:text-2xl m-8">
          <Link href="/users/settings">Settings</Link> &gt;
          <span className="italic"> Routes</span>
        </h1>
      </div>
      <Separator orientation="horizontal" />
      <div className="flex flex-col m-4">
        <div>
          <h2 id="saved">Saved Routes</h2>
          <SavedRoutesList />
        </div>
        {/* <div>
          <h2 id="preferences">Route Preferences</h2>
        </div>
        <div>
          <h2 id="history">Route History</h2>
        </div> */}
      </div>
    </div>
  );
};

export default RoutesContent;