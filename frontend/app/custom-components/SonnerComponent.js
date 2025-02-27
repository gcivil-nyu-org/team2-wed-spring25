'use client'

import { useEffect, useRef } from 'react';
import { useAuth } from './AuthHook';
import { toast } from "sonner";
import { AlertCircle, KeyRound, Ban, Server, Info, Zap, Heart, ThumbsUp, CheckCircle } from 'lucide-react';

export default function AuthErrorSonner() {
  const { error, successMessage, clearSuccess} = useAuth();
  const lastErrorRef = useRef(null);
  const lastSuccessRef = useRef(null);
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    // Only trigger toast if error is present and different from last shown error
    if (error && (!lastErrorRef.current || lastErrorRef.current.timestamp !== error.timestamp)) {
      lastErrorRef.current = error;

      // Get icon and title based on error type
      let icon = <AlertCircle className="h-5 w-5" />;
      let title = "Authentication Error";

      if (error.type) {
        switch (error.type) {
          case 'token':
            title = "Session Error";
            icon = <KeyRound className="h-5 w-5" />;
            break;
          case 'login':
            title = "Login Failed";
            icon = <Ban className="h-5 w-5" />;
            break;
          case 'api':
            title = "API Error";
            icon = <Server className="h-5 w-5" />;
            break;
          case 'permission':
            title = "Permission Denied";
            icon = <Ban className="h-5 w-5" />;
            break;
          default:
            title = "Authentication Error";
            icon = <AlertCircle className="h-5 w-5" />;
        }
      }

      toast.error(title, {
        description: error.message,
        duration: 5000,
        icon: icon,
        className: `my-toast auth-error-toast ${error.type ? `error-${error.type}` : ''}`,
        // Display more detailed info if available
        action: error.details ? {
          label: "Details",
          onClick: () => {
            // Show detailed error in a more detailed toast
            let details = "";
            if (typeof error.details === 'string') {
              details = error.details;
            } else if (error.details instanceof Error) {
              details = error.details.message;
            } else {
              try {
                details = JSON.stringify(error.details, null, 2).substring(0, 200);
              } catch (e) {
                details = "Error details could not be displayed";
              }
            }

            toast.error("Error Details", {
              description: details,
              duration: 6000,
              icon: <Info className="h-5 w-5" />,
              className: "my-toast"
            });
          }
        } : undefined,
      });
    }
  }, [error]);
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (successMessage && (!lastSuccessRef.current || lastSuccessRef.current.timestamp !== successMessage.timestamp)) {
      lastSuccessRef.current = successMessage;

      // Choose icon based on success type
      let icon = <CheckCircle className="h-5 w-5" />;
      let title = "Success";

      if (successMessage.type) {
        switch (successMessage.type) {
          case 'login':
            title = "Login Successful";
            icon = <ThumbsUp className="h-5 w-5" />;
            break;
          case 'signup':
            title = "Registration Complete";
            icon = <Zap className="h-5 w-5" />;
            break;
          case 'profile':
            title = "Profile Updated";
            icon = <Heart className="h-5 w-5" />;
            break;
          default:
            title = "Success";
            icon = <CheckCircle className="h-5 w-5" />;
        }
      }

      toast.success(title, {
        description: successMessage.message,
        duration: 5000,
        icon: icon,
        className: `my-toast auth-success-toast ${successMessage.type ? `success-${successMessage.type}` : ''}`,
      });
    }
  }, [successMessage]);

  // This component doesn't render anything, it just shows toasts
  return (<></>);
}