"use client";

import React, { useState } from "react";
import * as Form from "@radix-ui/react-form";
import { authAPI } from "@/utils/fetch/fetch";
import { Info, AlertTriangle, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useUser } from "@/components/Auth/UserContextProvider";
import { useNotification } from "../ToastComponent/NotificationContext";

const ChangePasswordForm = () => {
  const { user } = useUser();
  const { showSuccess, showError } = useNotification();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if user signed in with Google
  const isGoogleUser = user?.provider === "google";

  // Password validation
  const MIN_PASSWORD_LENGTH = 8;
  const passwordHasLowerCase = /[a-z]/.test(newPassword);
  const passwordHasUpperCase = /[A-Z]/.test(newPassword);
  const passwordHasNumber = /[0-9]/.test(newPassword);
  const passwordHasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);
  
  const passwordStrength = [
    newPassword.length >= MIN_PASSWORD_LENGTH,
    passwordHasLowerCase,
    passwordHasUpperCase,
    passwordHasNumber,
    passwordHasSpecialChar
  ].filter(Boolean).length;
  
  // Check if form is valid
  const isFormValid = 
    currentPassword.length > 0 &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    newPassword === confirmPassword &&
    passwordStrength >= 3; // At least 3 criteria met
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!isFormValid || isGoogleUser) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await authAPI.authenticatedPost("/user/change-password/", {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      // Show success notification
      showSuccess("Password changed successfully", null, "profile");
      
      // Reset form fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      // Show error notification
      showError(
        error.message || "An error occurred while changing your password", 
        error.details || error,
        "api"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return "text-red-500";
    if (passwordStrength <= 3) return "text-amber-500";
    return "text-green-500";
  };

  const getPasswordStrengthText = () => {
    if (newPassword.length === 0) return "";
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
  };

  return (
    <Card className="bg-sidebar-bg border-sidebar-border text-sidebar-text">
      <CardHeader>
        <CardTitle>Password Security</CardTitle>
        <CardDescription>
          Change your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isGoogleUser && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start">
            <Lock className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" size={20} />
            <p className="text-blue-700">
              Your account is managed by Google. You cannot change your password through this form.
              Please visit your Google account settings to manage your password.
            </p>
          </div>
        )}
        
        <Form.Root className="space-y-6" onSubmit={handleSubmit}>
          {/* Current Password Field */}
          <Form.Field className="space-y-2" name="currentPassword">
            <Form.Label className="text-sm font-medium text-sidebar-labeltext">
              Current Password
            </Form.Label>
            <div className="relative">
              <Form.Control asChild>
                <input
                  className={`w-full rounded-md border border-sidebar-inputborder px-3 py-2 text-sidebar-inputtext bg-sidebar-inputbg shadow-sm focus:outline-none focus:ring-1 focus:ring-sidebar-inputfocus pr-10 ${
                    isGoogleUser ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isGoogleUser}
                  placeholder="Enter your current password"
                />
              </Form.Control>
              <button 
                type="button"
                className={`absolute inset-y-0 right-0 flex items-center pr-3 ${isGoogleUser ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={isGoogleUser}
              >
                {showCurrentPassword ? 
                  <EyeOff className="h-5 w-5 text-sidebar-text/70" /> : 
                  <Eye className="h-5 w-5 text-sidebar-text/70" />
                }
              </button>
            </div>
            <Form.Message className="text-xs text-red-500" match="valueMissing">
              Please enter your current password
            </Form.Message>
          </Form.Field>

          {/* New Password Field */}
          <Form.Field className="space-y-2" name="newPassword">
            <Form.Label className="text-sm font-medium text-sidebar-labeltext">
              New Password
            </Form.Label>
            <div className="relative">
              <Form.Control asChild>
                <input
                  className={`w-full rounded-md border border-sidebar-inputborder px-3 py-2 text-sidebar-inputtext bg-sidebar-inputbg shadow-sm focus:outline-none focus:ring-1 focus:ring-sidebar-inputfocus pr-10 ${
                    isGoogleUser ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isGoogleUser}
                  placeholder="Enter your new password"
                />
              </Form.Control>
              <button 
                type="button"
                className={`absolute inset-y-0 right-0 flex items-center pr-3 ${isGoogleUser ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isGoogleUser}
              >
                {showNewPassword ? 
                  <EyeOff className="h-5 w-5 text-sidebar-text/70" /> : 
                  <Eye className="h-5 w-5 text-sidebar-text/70" />
                }
              </button>
            </div>
            {newPassword.length > 0 && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-sidebar-text/70">Password strength:</span>
                  <span className={`text-xs font-medium ${getPasswordStrengthColor()}`}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      passwordStrength <= 2 ? "bg-red-500" : 
                      passwordStrength <= 3 ? "bg-amber-500" : 
                      "bg-green-500"
                    } rounded-full`} 
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  />
                </div>
                <ul className="mt-2 space-y-1 text-xs">
                  <li className={`flex items-center ${newPassword.length >= MIN_PASSWORD_LENGTH ? "text-green-500" : "text-sidebar-text/50"}`}>
                    <span className="mr-1">{newPassword.length >= MIN_PASSWORD_LENGTH ? "✓" : "○"}</span>
                    <span>At least {MIN_PASSWORD_LENGTH} characters</span>
                  </li>
                  <li className={`flex items-center ${passwordHasLowerCase ? "text-green-500" : "text-sidebar-text/50"}`}>
                    <span className="mr-1">{passwordHasLowerCase ? "✓" : "○"}</span>
                    <span>Lowercase letter (a-z)</span>
                  </li>
                  <li className={`flex items-center ${passwordHasUpperCase ? "text-green-500" : "text-sidebar-text/50"}`}>
                    <span className="mr-1">{passwordHasUpperCase ? "✓" : "○"}</span>
                    <span>Uppercase letter (A-Z)</span>
                  </li>
                  <li className={`flex items-center ${passwordHasNumber ? "text-green-500" : "text-sidebar-text/50"}`}>
                    <span className="mr-1">{passwordHasNumber ? "✓" : "○"}</span>
                    <span>Number (0-9)</span>
                  </li>
                  <li className={`flex items-center ${passwordHasSpecialChar ? "text-green-500" : "text-sidebar-text/50"}`}>
                    <span className="mr-1">{passwordHasSpecialChar ? "✓" : "○"}</span>
                    <span>Special character (!@#$%^&*)</span>
                  </li>
                </ul>
              </div>
            )}
            <Form.Message className="text-xs text-red-500" match="valueMissing">
              Please enter a new password
            </Form.Message>
          </Form.Field>

          {/* Confirm Password Field */}
          <Form.Field className="space-y-2" name="confirmPassword">
            <Form.Label className="text-sm font-medium text-sidebar-labeltext">
              Confirm New Password
            </Form.Label>
            <div className="relative">
              <Form.Control asChild>
                <input
                  className={`w-full rounded-md border ${
                    confirmPassword && confirmPassword !== newPassword 
                      ? "border-red-500" 
                      : "border-sidebar-inputborder"
                  } px-3 py-2 text-sidebar-inputtext bg-sidebar-inputbg shadow-sm focus:outline-none focus:ring-1 focus:ring-sidebar-inputfocus pr-10 ${
                    isGoogleUser ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isGoogleUser}
                  placeholder="Confirm your new password"
                />
              </Form.Control>
              <button 
                type="button"
                className={`absolute inset-y-0 right-0 flex items-center pr-3 ${isGoogleUser ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isGoogleUser}
              >
                {showConfirmPassword ? 
                  <EyeOff className="h-5 w-5 text-sidebar-text/70" /> : 
                  <Eye className="h-5 w-5 text-sidebar-text/70" />
                }
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <div className="flex items-center mt-1">
                <AlertCircle className="text-red-500 mr-1" size={14} />
                <p className="text-xs text-red-500">
                  Passwords do not match
                </p>
              </div>
            )}
            <Form.Message className="text-xs text-red-500" match="valueMissing">
              Please confirm your new password
            </Form.Message>
          </Form.Field>

          <div className="mt-2 flex items-start">
            <Info className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
            <p className="text-xs text-sidebar-text">
              Use a strong password that you don&apos;t use elsewhere. For the strongest protection, use a mix of letters, numbers, and symbols.
            </p>
          </div>

          <Form.Submit asChild>
            <Button
              className="w-full mt-4"
              disabled={isSubmitting || !isFormValid || isGoogleUser}
            >
              {isSubmitting ? "Changing Password..." : "Change Password"}
            </Button>
          </Form.Submit>
        </Form.Root>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordForm;