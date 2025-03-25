'use client'
import React, { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import SavedRoutesList from "@/app/custom-components/RoutingComponets/SavedRoutesList";

const RoutesContent = () => {
  return (
    <div className="h-full w-full">
      <div className="h-[15%] flex items-center">
        <h1 className="text-2xl text-gray-800 m-6">
          <Link href="/users/settings">Settings</Link> &gt;
          <span className="italic"> Routes</span>
        </h1>
      </div>
      <Separator orientation="horizontal" />
      <SavedRoutesList />
    </div>
  );
};

export default RoutesContent;