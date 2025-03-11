'use client'

import { useEffect, useRef } from 'react';
import { toast } from "sonner";
import { useNotification } from './NotificationContext';
import {
  AlertCircle, KeyRound, Ban, Server, Info, Zap, Heart, ThumbsUp,
  CheckCircle, AlertTriangle, MapPin, Navigation, Map
} from 'lucide-react';

export default function ToastNotifications() {
  const { error, warning, success } = useNotification();
  const lastErrorRef = useRef(null);
  const lastWarningRef = useRef(null);
  const lastSuccessRef = useRef(null);

  // Handle errors
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Only trigger toast if error is present and different from last shown error
    if (error && (!lastErrorRef.current || lastErrorRef.current.timestamp !== error.timestamp)) {
      lastErrorRef.current = error;

      // Get icon and title based on error type
      let icon = <AlertCircle className="h-5 w-5" />;
      let title = "Error";

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
          case 'map_initialization_error':
            title = "Map Error";
            icon = <Map className="h-5 w-5" />;
            break;
          case 'route_fetch_error':
            title = "Routing Error";
            icon = <Navigation className="h-5 w-5" />;
            break;
          default:
            title = "Error";
            icon = <AlertCircle className="h-5 w-5" />;
        }
      }

      toast.error(title, {
        description: error.message,
        duration: 5000,
        icon: icon,
        className: `my-toast error-toast ${error.type ? `error-${error.type}` : ''}`,
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

  // Handle warnings
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Only trigger toast if warning is present and different from last shown warning
    if (warning && (!lastWarningRef.current || lastWarningRef.current.timestamp !== warning.timestamp)) {
      lastWarningRef.current = warning;

      // Get icon and title based on warning type
      let icon = <AlertTriangle className="h-5 w-5" />;
      let title = "Warning";

      if (warning.type) {
        switch (warning.type) {
          case 'location_outside_nyc':
            title = "Location Warning";
            icon = <MapPin className="h-5 w-5" />;
            break;
          case 'location_permission_denied':
            title = "Location Access Denied";
            icon = <MapPin className="h-5 w-5" />;
            break;
          case 'routing_issue':
            title = "Routing Issue";
            icon = <Navigation className="h-5 w-5" />;
            break;
          case 'map_data':
            title = "Map Data Issue";
            icon = <Map className="h-5 w-5" />;
            break;
          default:
            title = "Warning";
            icon = <AlertTriangle className="h-5 w-5" />;
        }
      }

      toast.warning(title, {
        description: warning.message,
        duration: 5000,
        icon: icon,
        className: `my-toast warning-toast ${warning.type ? `warning-${warning.type}` : ''}`,
        // Display more detailed info if available
        action: warning.details ? {
          label: "Details",
          onClick: () => {
            // Show detailed warning in a more detailed toast
            let details = "";
            if (typeof warning.details === 'string') {
              details = warning.details;
            } else if (warning.details instanceof Error) {
              details = warning.details.message;
            } else {
              try {
                details = JSON.stringify(warning.details, null, 2).substring(0, 200);
              } catch (e) {
                details = "Warning details could not be displayed";
              }
            }

            toast.warning("Warning Details", {
              description: details,
              duration: 6000,
              icon: <Info className="h-5 w-5" />,
              className: "my-toast"
            });
          }
        } : undefined,
      });
    }
  }, [warning]);

  // Handle success messages
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (success && (!lastSuccessRef.current || lastSuccessRef.current.timestamp !== success.timestamp)) {
      lastSuccessRef.current = success;

      // Choose icon based on success type
      let icon = <CheckCircle className="h-5 w-5" />;
      let title = "Success";

      if (success.type) {
        switch (success.type) {
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
          case 'route_found':
            title = "Route Found";
            icon = <Navigation className="h-5 w-5" />;
            break;
          default:
            title = "Success";
            icon = <CheckCircle className="h-5 w-5" />;
        }
      }

      toast.success(title, {
        description: success.message,
        duration: 5000,
        icon: icon,
        className: `my-toast success-toast ${success.type ? `success-${success.type}` : ''}`,
      });
    }
  }, [success]);

  // This component doesn't render anything, it just shows toasts
  return (<></>);
}