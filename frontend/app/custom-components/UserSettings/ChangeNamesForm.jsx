"use client";

import React, { useState } from "react";
import * as Form from "@radix-ui/react-form";
import { authAPI } from "@/utils/fetch/fetch";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useUser } from "@/components/Auth/UserContextProvider";
import { useNotification } from "../ToastComponent/NotificationContext";

const ChangeNamesForm = () => {
  const { user, refreshUserDetails } = useUser();
  const { showSuccess, showError } = useNotification();
  
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user signed in with Google
  const isGoogleUser = user?.provider === "google";

  // Character limits
  const MIN_NAME_LENGTH = 2;
  const MAX_NAME_LENGTH = 50;
  
  // Check if form is valid
  const isFormValid = 
    firstName.length >= MIN_NAME_LENGTH && 
    lastName.length >= MIN_NAME_LENGTH &&
    (firstName !== user?.first_name || lastName !== user?.last_name);
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!isFormValid || isGoogleUser) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await authAPI.authenticatedPost("/user/change-names/", {
        first_name: firstName,
        last_name: lastName
      });
      
      // Show success toast notification
      showSuccess("Profile information updated successfully", null, "profile");
      
      // Refresh user details in context
      await refreshUserDetails();
    } catch (error) {
      // Show error toast notification
      showError(
        error.message || "An error occurred while updating your profile", 
        error.details || error,
        "api"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-sidebar-bg border-sidebar-border text-sidebar-text">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your name and personal details
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isGoogleUser && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start">
            <Lock className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" size={20} />
            <p className="text-blue-700">
              Your profile information is managed by Google. You cannot change your name through this form.
            </p>
          </div>
        )}
        
        <Form.Root className="space-y-6" onSubmit={handleSubmit}>
          {/* Email display (read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-sidebar-labeltext block">
              Email Address
            </label>
            <input
              className="w-full rounded-md border border-sidebar-inputborder px-3 py-2 text-sidebar-inputtext bg-sidebar-inputbg shadow-sm opacity-75 cursor-not-allowed"
              type="email"
              value={user?.email || ""}
              disabled
            />
            <p className="text-xs text-sidebar-text/70">Email cannot be changed</p>
          </div>
          
          {/* First Name Field */}
          <Form.Field className="space-y-2" name="firstName">
            <div className="flex items-baseline justify-between">
              <Form.Label className="text-sm font-medium text-sidebar-labeltext">
                First Name
              </Form.Label>
              <div className={`text-xs ${
                firstName.length < MIN_NAME_LENGTH 
                  ? "text-amber-500" 
                  : firstName.length > MAX_NAME_LENGTH - 10 
                    ? "text-amber-500" 
                    : "text-sidebar-text/70"
              }`}>
                {firstName.length}/{MAX_NAME_LENGTH}
              </div>
            </div>
            <Form.Control asChild>
              <input
                className={`w-full rounded-md border ${
                  firstName.length > 0 && firstName.length < MIN_NAME_LENGTH 
                    ? "border-amber-500" 
                    : "border-sidebar-inputborder"
                } px-3 py-2 text-sidebar-inputtext bg-sidebar-inputbg shadow-sm focus:outline-none focus:ring-1 focus:ring-sidebar-inputfocus ${
                  isGoogleUser ? "opacity-50 cursor-not-allowed" : ""
                }`}
                type="text"
                required
                maxLength={MAX_NAME_LENGTH}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isGoogleUser}
                placeholder="Your first name"
              />
            </Form.Control>
            <Form.Message className="text-xs text-red-500" match="valueMissing">
              Please enter your first name
            </Form.Message>
          </Form.Field>

          {/* Last Name Field */}
          <Form.Field className="space-y-2" name="lastName">
            <div className="flex items-baseline justify-between">
              <Form.Label className="text-sm font-medium text-sidebar-labeltext">
                Last Name
              </Form.Label>
              <div className={`text-xs ${
                lastName.length < MIN_NAME_LENGTH 
                  ? "text-amber-500" 
                  : lastName.length > MAX_NAME_LENGTH - 10 
                    ? "text-amber-500" 
                    : "text-sidebar-text/70"
              }`}>
                {lastName.length}/{MAX_NAME_LENGTH}
              </div>
            </div>
            <Form.Control asChild>
              <input
                className={`w-full rounded-md border ${
                  lastName.length > 0 && lastName.length < MIN_NAME_LENGTH 
                    ? "border-amber-500" 
                    : "border-sidebar-inputborder"
                } px-3 py-2 text-sidebar-inputtext bg-sidebar-inputbg shadow-sm focus:outline-none focus:ring-1 focus:ring-sidebar-inputfocus ${
                  isGoogleUser ? "opacity-50 cursor-not-allowed" : ""
                }`}
                type="text"
                required
                maxLength={MAX_NAME_LENGTH}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isGoogleUser}
                placeholder="Your last name"
              />
            </Form.Control>
            <Form.Message className="text-xs text-red-500" match="valueMissing">
              Please enter your last name
            </Form.Message>
          </Form.Field>

          <Form.Submit asChild>
            <Button
              className="w-full mt-4"
              disabled={isSubmitting || !isFormValid || isGoogleUser}
            >
              {isSubmitting ? "Updating..." : "Update Profile"}
            </Button>
          </Form.Submit>
        </Form.Root>
      </CardContent>
    </Card>
  );
};

export default ChangeNamesForm;