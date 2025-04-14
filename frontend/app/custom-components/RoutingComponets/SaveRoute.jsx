'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";
import {
  Button
} from "@/components/ui/button";
import {
  Input
} from "@/components/ui/input";
import {
  Label
} from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  BookmarkPlus,
  Check,
  Star,
  StarHalf
} from "lucide-react";
import { authAPI } from "@/utils/fetch/fetch";
import { useNotification } from "../ToastComponent/NotificationContext";

export default function SaveRouteComponent({ departure, destination }) {
  const [routeName, setRouteName] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { showSuccess, showError } = useNotification();

  // Format coordinates for display
  const formatCoordinates = (coords) => {
    if (!coords || !Array.isArray(coords) || coords.length < 2) {
      return 'Unknown location';
    }
    // Round to 4 decimal places for display
    return `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const requestData = {
      name: routeName,
      departure_lat: departure[0],
      departure_lon: departure[1],
      destination_lat: destination[0],
      destination_lon: destination[1],
      favorite: isFavorite
    };
    try {
      const response = await authAPI.authenticatedPost('/save-route/', requestData);

      showSuccess(
        'Route saved successfully',
        `"${routeName}" has been saved to your routes.`,
        'route_saved'
      );

      // Close popover and reset form
      setOpen(false);
      setRouteName('');
      setIsFavorite(false);
    } catch (error) {
      console.error('Error saving route:', error);
      showError(
        'Could not save route',
        error.message || 'An unexpected error occurred. Please try again.',
        'route_save_error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* FIX: Don't use asChild here, use a normal trigger button */}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center bg-map-pointer border-map-bg hover:bg-map-bg hover:text-map-text"
          type="button"
        >
          <BookmarkPlus size={18} />
          Save This Route
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Save Route</CardTitle>
            <CardDescription>
              Save this route to your account for quick access later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="routeName">Route Name</Label>
                <Input
                  id="routeName"
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  required
                  placeholder="Name this route"
                  maxLength={50}
                  className="w-full"
                />
              </div>


              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>From</Label>
                  <span className="text-xs text-gray-500">
                    {departure ? formatCoordinates(departure) : 'Current location'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <Label>To</Label>
                  <span className="text-xs text-gray-500">
                    {formatCoordinates(destination)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className={`${isFavorite ? 'bg-amber-50 text-amber-600 border-amber-200' : 'text-gray-500'} p-2 h-auto`}
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  {isFavorite ? <Star size={16} /> : <StarHalf size={16} />}
                </Button>
                <span className="text-sm">
                  {isFavorite ? 'Favorite route' : 'Mark as favorite'}
                </span>
              </div>

              <CardFooter className="flex justify-end px-0 pt-4 pb-0">
                <Button
                  type="submit"
                  disabled={isLoading || !routeName}
                  className="bg-map-bg hover:bg-map-darkerbg text-white"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Check size={16} />
                      <span>Save Route</span>
                    </div>
                  )}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}