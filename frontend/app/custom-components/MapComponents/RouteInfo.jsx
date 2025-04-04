import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Navigation,
  Clock,
  CornerDownRight,
} from "lucide-react";

const RouteInfo = ({ routeDetails, activeRoute, setActiveRoute }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentRouteData, setCurrentRouteData] = useState(null);

  // Update current route data when activeRoute or routeDetails change
  useEffect(() => {
    // Handle possible undefined or missing data gracefully
    if (!routeDetails) return;

    setCurrentRouteData(routeDetails[activeRoute]);
  }, [activeRoute, routeDetails]);

  // Function to format duration from seconds to minutes/hours
  const formatDuration = (seconds) => {
    if (!seconds) return "--";
    if (seconds < 60) return `${Math.round(seconds)} sec`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} hr ${minutes} min`;
  };

  // Function to format distance in miles/feet (US units)
  const formatDistance = (meters) => {
    if (!meters) return "--";

    // Constants for conversion
    const METERS_TO_FEET = 3.28084;
    const METERS_TO_MILES = 0.000621371;

    // Convert to feet
    const feet = meters * METERS_TO_FEET;

    // If less than 1000 feet, show in feet
    if (feet < 1000) {
      return `${Math.round(feet)} ft`;
    }

    // Otherwise, convert to miles with one decimal place
    const miles = meters * METERS_TO_MILES;
    return `${miles.toFixed(1)} mi`;
  };
  // Check if we have valid data for initial and safer routes
  const hasInitialRoute = routeDetails?.initial?.distance > 0;
  const hasSaferRoute = routeDetails?.safer?.distance > 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Route Information</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={activeRoute === "initial" ? "default" : "outline"}
              className="h-8 px-3 py-1"
              onClick={() => setActiveRoute("initial")}
              disabled={!hasInitialRoute}
              style={{
                backgroundColor: activeRoute === "initial" ? "lightblue" : "transparent",
                color: activeRoute === "initial" ? "black" : "lightblue",
                border: activeRoute === "initial" ? "none" : "1px solid lightblue",
              }}                        >
              Standard Route
            </Button>
            <Button
              variant={activeRoute === "safer" ? "default" : "outline"}
              className="h-8 px-3 py-1"
              onClick={() => setActiveRoute("safer")}
              disabled={!hasSaferRoute}
              style={{
                backgroundColor: activeRoute === "safer" ? "lightgreen" : "transparent",
                color: activeRoute === "safer" ? "black" : "lightgreen",
                border: activeRoute === "safer" ? "none" : "1px solid lightgreen",
              }}            
            >
              Safer Route
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Route summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex items-center mb-1">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm font-medium">Duration</span>
              </div>
              <div className="text-lg font-semibold">
                {formatDuration(currentRouteData?.duration)}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex items-center mb-1">
                <Navigation className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm font-medium">Distance</span>
              </div>
              <div className="text-lg font-semibold">
                {formatDistance(currentRouteData?.distance)}
              </div>
            </div>
          </div>

          {/* Turn-by-turn instructions */}
          <div>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex w-full items-center justify-between p-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              <span className="font-medium">Turn-by-turn directions</span>
              {showInstructions ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {showInstructions && currentRouteData?.instructions && currentRouteData.instructions.length > 0 && (
              <div className="mt-2 border rounded-md divide-y max-h-80 overflow-y-auto">
                {currentRouteData.instructions.map((step, index) => (
                  <div
                    key={index}
                    className="p-3 flex items-start hover:bg-gray-50"
                  >
                    <CornerDownRight className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-gray-500" />
                    <div className="flex-1">
                      <div className="text-sm">{step.instruction}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDistance(step.distance)} ·{" "}
                        {formatDuration(step.duration)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showInstructions &&
              (!currentRouteData?.instructions ||
                currentRouteData.instructions.length === 0) && (
                <div className="mt-2 p-4 bg-gray-50 rounded-md text-center text-gray-500">
                  No turn-by-turn directions available for this route.
                </div>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteInfo;