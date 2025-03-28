<<<<<<< HEAD
import React from "react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
=======
'use client'
import React, { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import SavedRoutesList from "@/app/custom-components/RoutingComponets/SavedRoutesList";
import { ArrowLeft } from "lucide-react";
>>>>>>> origin/develop

const RoutesContent = () => {
  return (
    <div className="h-full w-full">
<<<<<<< HEAD
      <div className="h-[15%] flex items-center">
        <h1 className="text-2xl text-gray-800 m-6">
=======
      <div className="lg:h-header h-mobileheader flex items-center ml-8">
        <Link href="/users/settings">
          <ArrowLeft />
        </Link>
        <h1 className="text-lg md:text-xl lg:text-2xl m-8">
>>>>>>> origin/develop
          <Link href="/users/settings">Settings</Link> &gt;
          <span className="italic"> Routes</span>
        </h1>
      </div>
      <Separator orientation="horizontal" />
<<<<<<< HEAD
      <div className="p-6">
        <h2>Routes</h2>
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
      <div className="flex flex-col m-4">
        <div>
          <h2 id="saved">Saved Routes</h2>
          <SavedRoutesList />
        </div>
        <div>
          <h2 id="preferences">Route Preferences</h2>
        </div>
        <div>
          <h2 id="history">Route History</h2>
        </div>
>>>>>>> origin/develop
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default RoutesContent;
=======
export default RoutesContent;
>>>>>>> origin/develop
