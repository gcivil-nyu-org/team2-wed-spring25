import React, { useState, useRef } from "react";
import Image from "next/image";
import { useUser } from "@/components/Auth/UserContextProvider"; // Using the useUser hook
import { AlertCircle, Camera, User, Lock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { authAPI } from "@/utils/fetch/fetch";
import uploadImage from "@/utils/uploadImage";
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
  const { user, setUser, refreshUserDetails } = useUser(); // Destructure refreshUserDetails from useUser
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef(null);

  // Check if user signed in with Google
  const isGoogleUser = user?.provider === "google";
  const hasAvatar = !!user?.avatar_url;

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // 1. Upload image to Cloudinary
      const imageUrl = await uploadImage(file);

      // 2. Send Cloudinary URL to Django
      const res = await authAPI.authenticatedPost("/user/change-profile-picture/", {
        avatar_url: imageUrl, // backend expects this now
      });

      // 3. Refresh the user data (this will fetch the updated user details)
      await refreshUserDetails(); // This will re-fetch user details including the avatar URL

    } catch (error) {
      console.error("Upload error:", error);
    }
  };

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
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
            data-testid="profile-photo-input" // Add a data-testid for testing
          />
          <div
            data-testid="profile-photo-div" // Add a data-testid to the clickable div
            className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-sidebar-border shadow-md"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => {
              if (!isGoogleUser && fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
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
                  isHovering ? "opacity-100" : "opacity-0"
                }`}
              >
                <Camera className="w-10 h-10 text-white" />
              </div>
            )}
          </div>
      {/* No profile change for Google users */}
      {isGoogleUser && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-200 hover:bg-gray-50 transition-colors">
              <Lock className="w-5 h-5 text-blue-500" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="max-w-xs w-full p-4 sm:max-w-md sm:w-auto sm:px-3 sm:py-2"
            side="right"
            align="start"
          >
            <div className="flex items-start">
              <Lock className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">Google Account Photo</h4>
                <p className="text-sm text-gray-600">
                  Your profile photo is managed by Google. To change it, update your Google account photo and it will sync automatically.
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
        </div>
        {/* Display user name under photo */}
        <h3 className="text-lg font-medium">
          {user?.first_name} {user?.last_name}
        </h3>
        <p className="text-sm text-sidebar-text/70">{user?.email}</p>
      </CardContent>
    </Card>
  );
};

export default ProfilePhotoSection;
