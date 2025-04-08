"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useUser } from "@/components/Auth/UserContextProvider";
import { AlertCircle, Camera, User, Lock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ProfilePhotoSection = () => {
  const { user } = useUser();
  const [isHovering, setIsHovering] = useState(false);
  
  // Check if user signed in with Google
  const isGoogleUser = user?.provider === "google";
  const hasAvatar = !!(user?.avatar_url);

  return (
    <Card className="bg-sidebar-bg border-sidebar-border text-sidebar-text w-full">
      <CardHeader>
        <CardTitle>Profile Photo</CardTitle>
        <CardDescription>
          {isGoogleUser 
            ? "Your profile photo is managed by Google" 
            : "Upload or change your profile photo"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative mb-6 group">
          <div 
            className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-sidebar-border shadow-md"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {hasAvatar ? (
              <Image 
                src={user.avatar_url}
                fill
                className="object-cover"
                alt={`${user.first_name}'s profile photo`}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <User className="w-16 h-16 text-gray-400" />
              </div>
            )}
            
            {/* Hover overlay */}
            {!isGoogleUser && (
              <div 
                className={`absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-opacity duration-200 ${
                  isHovering ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Camera className="w-10 h-10 text-white" />
              </div>
            )}
          </div>
          
          {/* Badge showing status */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-200 hover:bg-gray-50 transition-colors">
                {isGoogleUser ? (
                  <Lock className="w-5 h-5 text-blue-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" side="right">
              {isGoogleUser ? (
                <div className="flex items-start">
                  <Lock className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Google Account Photo</h4>
                    <p className="text-sm text-gray-600">
                      Your profile photo is managed by Google. To change it, update your Google account photo and it will sync automatically.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Coming Soon</h4>
                    <p className="text-sm text-gray-600">
                      Profile photo customization is coming soon! You&apos;ll be able to upload and edit your profile photo in a future update.
                    </p>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Display user name under photo */}
        <h3 className="text-lg font-medium">
          {user?.first_name} {user?.last_name}
        </h3>
        <p className="text-sm text-sidebar-text/70">{user?.email}</p>
        
        {isGoogleUser ? (
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Google Account
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="mt-6 px-4 py-2 rounded-md bg-sidebar-border text-sidebar-text hover:bg-sidebar-border/80 transition-colors cursor-not-allowed opacity-70"
                  disabled
                >
                  <div className="flex items-center">
                    <Camera className="mr-2 h-4 w-4" />
                    <span>Change Photo</span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This feature is coming soon!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfilePhotoSection;