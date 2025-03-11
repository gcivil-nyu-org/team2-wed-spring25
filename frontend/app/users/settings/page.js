"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const SettingsPage = () => {
  const [currentTab, setCurrentTab] = useState("General"); // Default tab

  return (
    <>
      {/* Container */}
      <div className="flex flex-row font-mono h-screen w-full">
        {/* Column 1 */}
        {/* Column Container */}
        <div className="flex flex-col justify-start items-center h-full w-[15%] gap-8">
          <div className="flex flex-col items-center h-[15%] mt-2 w-full">
            <Link
              href="/users/home"
              className="flex flex-col items-center gap-2"
            >
              <Image
                className="mx-auto lg:mx-0 h-auto"
                src="/owl-logo.svg"
                width={64}
                height={64}
                alt="Nightwalkers Logo"
              />
              <span>Nightwalkers</span>
            </Link>
            {/* children */}
          </div>
        </div>
        <Separator orientation="vertical" />
        {/* Column 2 */}
        <div className="h-full w-full">
          <div className="h-[15%] flex items-center">
            <h1 className="text-2xl text-gray-800 m-6">User Settings</h1>
          </div>
          <Separator orientation="horizontal" />
          {/* children */}
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
