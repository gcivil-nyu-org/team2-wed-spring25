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

  // New color scheme constants
  const COLORS = {
    standard: {
      active: "#3B82F6", // bright blue
      text: "#4dabf7", // bright blue
      hover: "rgba(77, 171, 247, 0.15)", // transparent blue
    },
    safer: {
      active: "#40c057", // bright green
      text: "#40c057", // bright green
      hover: "rgba(64, 192, 87, 0.15)", // transparent green
    },
    darkBg: "#2c3440", // darker than parent background
    mediumBg: "#3a4250", // medium darkness
    lightText: "#e9ecef", // off-white
    mutedText: "#adb5bd", // medium gray
    accent: "#495057", // darker gray for hover states
  };

  return (
    <Card className="w-full border-0 shadow-none" style={{ backgroundColor: 'transparent' }}>
      <CardHeader className="px-1 py-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg sm:text-md md:text-base" style={{ color: COLORS.lightText }}>
            Route Information
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 px-3 py-1 transition-all duration-200"
              onClick={() => setActiveRoute("initial")}
              disabled={!hasInitialRoute}
              style={{
                backgroundColor: activeRoute === "initial" ? COLORS.standard.active : "transparent",
                color: activeRoute === "initial" ? "#f5f5f5" : COLORS.standard.text,
                border: `1px solid ${COLORS.standard.active}`,
                boxShadow: activeRoute === "initial" ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
              }}
            >
              Standard
            </Button>
            <Button
              variant="outline"
              className="h-8 px-3 py-1 transition-all duration-200"
              onClick={() => setActiveRoute("safer")}
              disabled={!hasSaferRoute}
              style={{
                backgroundColor: activeRoute === "safer" ? COLORS.safer.active : "transparent",
                color: activeRoute === "safer" ? "#f5f5f5" : COLORS.safer.text,
                border: `1px solid ${COLORS.safer.text}`,
                boxShadow: activeRoute === "safer" ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
              }}
            >
              Safer
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-1">
        <div className="space-y-4">
          {/* Route summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-md" style={{ backgroundColor: COLORS.darkBg }}>
              <div className="flex items-center mb-1">
                <Clock className="h-4 w-4 mr-2" style={{ color: COLORS.mutedText }} />
                <span className="text-sm font-medium" style={{ color: COLORS.mutedText }}>Duration</span>
              </div>
              <div className="text-lg sm:text-md font-semibold" style={{ color: COLORS.lightText }}>
                {formatDuration(currentRouteData?.duration)}
              </div>
            </div>
            <div className="p-3 rounded-md" style={{ backgroundColor: COLORS.darkBg }}>
              <div className="flex items-center mb-1">
                <Navigation className="h-4 w-4 mr-2" style={{ color: COLORS.mutedText }} />
                <span className="text-sm font-medium" style={{ color: COLORS.mutedText }}>Distance</span>
              </div>
              <div className="text-lg sm:text-md font-semibold" style={{ color: COLORS.lightText }}>
                {formatDistance(currentRouteData?.distance)}
              </div>
            </div>
          </div>

          {/* Turn-by-turn instructions */}
          <div>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex w-full items-center justify-between p-2 rounded transition-colors"
              style={{ 
                backgroundColor: COLORS.mediumBg,
                color: COLORS.lightText,
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = COLORS.accent}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = COLORS.mediumBg}
            >
              <span className="font-medium">Turn-by-turn directions</span>
              {showInstructions ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {showInstructions && currentRouteData?.instructions && currentRouteData.instructions.length > 0 && (
              <>
                <style>
                  {`
                    .custom-scrollbar::-webkit-scrollbar {
                      width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                      background: ${COLORS.darkBg};
                      border-radius: 3px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                      background: ${COLORS.accent};
                      border-radius: 3px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: ${COLORS.mutedText};
                    }
                    .custom-scrollbar {
                      scrollbar-width: thin;
                      scrollbar-color: ${COLORS.accent} ${COLORS.darkBg};
                    }
                  `}
                </style>
                <div 
                  className="mt-2 rounded-md divide-y max-h-80 overflow-y-auto custom-scrollbar" 
                  style={{ 
                    borderColor: COLORS.accent,
                    backgroundColor: COLORS.darkBg,
                    border: `1px solid ${COLORS.accent}`,
                  }}
                >
                  {currentRouteData.instructions.map((step, index) => (
                    <div
                      key={index}
                      className="p-3 flex items-start"
                      style={{ 
                        backgroundColor: COLORS.darkBg,
                        borderColor: COLORS.accent,
                        borderTop: index > 0 ? `1px solid ${COLORS.accent}` : 'none',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = COLORS.mediumBg}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = COLORS.darkBg}
                    >
                      <CornerDownRight className="h-4 w-4 mr-2 mt-1 flex-shrink-0" style={{ color: COLORS.mutedText }} />
                      <div className="flex-1">
                        <div className="text-sm" style={{ color: COLORS.lightText }}>{step.instruction}</div>
                        <div className="text-xs mt-1" style={{ color: COLORS.mutedText }}>
                          {formatDistance(step.distance)} · {formatDuration(step.duration)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {showInstructions &&
              (!currentRouteData?.instructions ||
                currentRouteData.instructions.length === 0) && (
                <div className="mt-2 p-4 rounded-md text-center" 
                  style={{ backgroundColor: COLORS.darkBg, color: COLORS.mutedText }}>
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