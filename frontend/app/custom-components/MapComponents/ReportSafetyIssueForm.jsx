"use client";
import * as React from 'react';
import * as Form from '@radix-ui/react-form';
import { useRoute } from "./RouteContext";
import { AlertTriangle, Check, MapPin, Info } from "lucide-react";
import { useNotification } from "../ToastComponent/NotificationContext";
import { authAPI } from "@/utils/fetch/fetch";

// Import shadcn components
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

const ReportSafetyIssueComponent = () => {
    // State for popover and form
    const [open, setOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [locationAddress, setLocationAddress] = React.useState("Loading address...");
    const [addressFetched, setAddressFetched] = React.useState(false);
    const [isFetchingAddress, setIsFetchingAddress] = React.useState(false);

    // Character limits (matching your existing form validation)
    const MIN_TITLE_LENGTH = 15;
    const MAX_TITLE_LENGTH = 100;
    const MIN_DESCRIPTION_LENGTH = 50;
    const MAX_DESCRIPTION_LENGTH = 700;

    // Check if form is valid
    const isFormValid =
        title.length >= MIN_TITLE_LENGTH &&
        description.length >= MIN_DESCRIPTION_LENGTH;

    // Get state from context
    const { userLocation, canUseCurrentLocation, formatCoords } = useRoute();
    const { showSuccess, showError, showWarning } = useNotification();

    // Function to convert coordinates to address using OpenRouteService
    const fetchAddress = async () => {
        if (!userLocation || isFetchingAddress) return;

        setIsFetchingAddress(true);

        try {
            // Use OpenRouteService API for reverse geocoding
            const API_KEY = process.env.NEXT_PUBLIC_ORS_TOKEN;

            if (!API_KEY) {
                console.error("OpenRouteService API key is missing");
                setLocationAddress(formatCoords(userLocation));
                setAddressFetched(true);
                return;
            }

            const [lat, lon] = userLocation;

            // Call the OpenRouteService API
            const response = await fetch(
                `https://api.openrouteservice.org/geocode/reverse?api_key=${API_KEY}&point.lon=${lon}&point.lat=${lat}`,
                { method: 'GET' }
            );

            if (!response.ok) {
                throw new Error(`Geocoding failed: ${response.status}`);
            }

            const data = await response.json();

            // Extract the most relevant address from the response
            if (data.features && data.features.length > 0) {
                // Give preference to address features over venues when available
                const addressFeatures = data.features.filter(f => f.properties.layer === 'address');
                const featureToUse = addressFeatures.length > 0 ? addressFeatures[0] : data.features[0];
                const addressResult = featureToUse.properties;

                // Use the pre-formatted label if available, otherwise build our own
                if (addressResult.label) {
                    // The label is already nicely formatted, but we may want to modify it slightly
                    // to highlight NYC-specific information

                    // Extract parts from the label (typically formatted as "Address, City, State, Country")
                    const labelParts = addressResult.label.split(', ');

                    if (labelParts.length >= 3 && addressResult.postalcode) {
                        // Add postal code to the city part if it's not already there
                        if (!labelParts[1].includes(addressResult.postalcode)) {
                            labelParts[1] = `${labelParts[1]} ${addressResult.postalcode}`;
                        }
                    }

                    // If we have borough information, insert it after the address but before city
                    if (addressResult.borough && !labelParts[0].includes(addressResult.borough)) {
                        labelParts.splice(1, 0, addressResult.borough);
                    }

                    setLocationAddress(labelParts.join(', '));
                } else {
                    // Build our own formatted address
                    const addressParts = [];

                    // Street address
                    if (addressResult.housenumber && addressResult.street) {
                        addressParts.push(`${addressResult.housenumber} ${addressResult.street}`);
                    } else if (addressResult.street) {
                        addressParts.push(addressResult.street);
                    } else if (addressResult.name) {
                        addressParts.push(addressResult.name);
                    }

                    // NYC-specific: Add borough information
                    if (addressResult.borough) {
                        addressParts.push(addressResult.borough);
                    } else if (addressResult.neighbourhood) {
                        addressParts.push(addressResult.neighbourhood);
                    }

                    // Add city and postal code
                    if (addressResult.locality) {
                        const cityPart = addressResult.postalcode
                            ? `${addressResult.locality} ${addressResult.postalcode}`
                            : addressResult.locality;
                        addressParts.push(cityPart);
                    } else if (addressResult.postalcode) {
                        // Just postal code if no city
                        addressParts.push(`NYC ${addressResult.postalcode}`);
                    }

                    // State
                    if (addressResult.region_a) {
                        addressParts.push(addressResult.region_a);
                    }

                    const formattedAddress = addressParts.join(', ');

                    if (formattedAddress) {
                        setLocationAddress(formattedAddress);
                    } else {
                        // Fallback to coordinates if no meaningful address was found
                        setLocationAddress(formatCoords(userLocation));
                    }
                }
            } else {
                // No results found - use coordinates
                setLocationAddress(formatCoords(userLocation));
            }

            setAddressFetched(true);
        } catch (error) {
            console.error("Error fetching address:", error);
            // Fallback to coordinates on error
            setLocationAddress(formatCoords(userLocation));
            setAddressFetched(true);
        } finally {
            setIsFetchingAddress(false);
        }
    };

    // Call fetchAddress when popover opens or when form becomes valid
    const handleOpenChange = (newOpen) => {
        setOpen(newOpen);
        if (newOpen) {
            // Reset address fetch status when reopening
            setAddressFetched(false);
            // Initial fetch when opening the popover
            fetchAddress();
        }
    };

    // Watch for form validity changes to trigger address fetch if needed
    React.useEffect(() => {
        if (open && isFormValid && !addressFetched && !isFetchingAddress) {
            fetchAddress();
        }
    }, [isFormValid, open, addressFetched, isFetchingAddress]);

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();

        // Additional validation check before submission
        if (!isFormValid) {
            return;
        }

        setIsSubmitting(true);

        try {
            const [lat, lon] = userLocation;
            const response = await authAPI.authenticatedPost("/user/create-safety-report/", {
                title: title,
                description: description,
                latitude: lat,
                longitude: lon,
                location_str: locationAddress,
            });

            // Success notification
            showSuccess(
                "Thank you for your report!! It will be available for review immediately. "+
                "Your safety concern has been reported. We appreciate your contribution to other user's safety.",
                "safety_report_submitted"
            );

            // Reset form and close popover
            setTitle("");
            setDescription("");
            setOpen(false);
        } catch (error) {
            showError(
                "Failed to submit report",
                error.message || "Please try again later.",
                "safety_report_error"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Don't render if user location is invalid or unavailable
    if (!canUseCurrentLocation || !userLocation) {
        return null;
    }

    return (
        <div className="absolute top-5 right-4 z-[999]">
            <Popover open={open} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="flex items-center justify-center bg-yellow-600 border-none hover:bg-yellow-700 hover:text-map-text shadow-lg md:px-4 md:py-2 p-2 md:h-auto h-12 w-12 md:w-auto rounded-full md:rounded-md"
                        type="button"
                    >
                        <AlertTriangle size={20} className="md:mr-2 md:size-5 size-6" />
                        <span className="hidden md:inline">Report Safety Issue</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0 bg-[#1f2937] text-white" align="end">
                    <Card className="border-0 shadow-none bg-[#1f2937] text-white">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-bold">Report Safety Issue</CardTitle>
                            <CardDescription>
                                Report a safety concern at your current location
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form.Root className="space-y-6" onSubmit={handleSubmit}>
                                <Form.Field className="space-y-2" name="title">
                                    <div className="flex items-baseline justify-between">
                                        <Form.Label className="text-sm font-medium text-gray-300">
                                            Issue Title
                                        </Form.Label>
                                        <div className={`text-xs ${title.length < MIN_TITLE_LENGTH
                                                ? 'text-amber-500'
                                                : title.length > MAX_TITLE_LENGTH - 20
                                                    ? 'text-amber-500'
                                                    : 'text-gray-400'
                                            }`}>
                                            {title.length}/{MAX_TITLE_LENGTH}
                                        </div>
                                    </div>
                                    <Form.Control asChild>
                                        <input
                                            className={`w-full rounded-md border ${title.length > 0 && title.length < MIN_TITLE_LENGTH
                                                    ? 'border-amber-500'
                                                    : 'border-gray-700'
                                                } px-3 py-2 text-white bg-gray-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-500`}
                                            type="text"
                                            required
                                            maxLength={MAX_TITLE_LENGTH}
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            autoComplete='off'
                                            placeholder="Brief summary of the safety issue"
                                        />
                                    </Form.Control>
                                    {title.length > 0 && title.length < MIN_TITLE_LENGTH && (
                                        <div className="flex items-center mt-1">
                                            <AlertTriangle className="text-amber-500 mr-1" size={14} />
                                            <p className="text-xs text-amber-500">
                                                Please enter at least {MIN_TITLE_LENGTH} characters (currently {title.length})
                                            </p>
                                        </div>
                                    )}
                                    <Form.Message className="text-xs text-red-500 mt-1" match="valueMissing">
                                        Please enter a title for your report
                                    </Form.Message>
                                </Form.Field>

                                <Form.Field className="space-y-2" name="description">
                                    <div className="flex items-baseline justify-between">
                                        <Form.Label className="text-sm font-medium text-gray-300">
                                            Description
                                        </Form.Label>
                                        <div className={`text-xs ${description.length < MIN_DESCRIPTION_LENGTH
                                                ? 'text-amber-500'
                                                : description.length > MAX_DESCRIPTION_LENGTH - 50
                                                    ? 'text-amber-500'
                                                    : 'text-gray-400'
                                            }`}>
                                            {description.length}/{MAX_DESCRIPTION_LENGTH}
                                        </div>
                                    </div>
                                    <Form.Control asChild>
                                        <textarea
                                            className={`w-full min-h-32 rounded-md border ${description.length > 0 && description.length < MIN_DESCRIPTION_LENGTH
                                                    ? 'border-amber-500'
                                                    : 'border-gray-700'
                                                } bg-gray-800 px-3 py-2 text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-gray-500 resize-y`}
                                            required
                                            maxLength={MAX_DESCRIPTION_LENGTH}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Please describe the safety issue in detail. What hazards exist? When did you notice them? Is this an ongoing problem?"
                                            rows={5}
                                        />
                                    </Form.Control>
                                    {description.length > 0 && description.length < MIN_DESCRIPTION_LENGTH && (
                                        <div className="flex items-center mt-1">
                                            <AlertTriangle className="text-amber-500 mr-1" size={14} />
                                            <p className="text-xs text-amber-500">
                                                Please enter at least {MIN_DESCRIPTION_LENGTH} characters (currently {description.length})
                                            </p>
                                        </div>
                                    )}
                                    <Form.Message className="text-xs text-red-500 mt-1" match="valueMissing">
                                        Please describe the safety issue you encountered
                                    </Form.Message>
                                </Form.Field>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-gray-300">Near</label>
                                        {isFetchingAddress && (
                                            <span className="text-xs text-blue-400 flex items-center">
                                                <div className="h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                                                Fetching address...
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center p-2 bg-gray-800 border border-gray-700 rounded-md text-sm">
                                        <MapPin size={14} className="mr-2 text-red-400" />
                                        <span>{locationAddress}</span>
                                    </div>
                                    <div className="mt-2 flex items-start">
                                        <Info className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                                        <p className="text-xs text-gray-400">
                                            If this is an emergency call 911 !!!. Your current location will be used to pinpoint the safety issue and upon review it will be added to the map data. Please be descriptive and respectful.
                                        </p>
                                    </div>
                                </div>

                                <Form.Submit asChild>
                                    <Button
                                        className="w-full mt-4 bg-map-bg hover:bg-map-darkerbg text-white"
                                        disabled={isSubmitting || !isFormValid || !title.length || !description.length}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Submitting...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Check size={16} />
                                                <span>Submit Report</span>
                                            </div>
                                        )}
                                    </Button>
                                </Form.Submit>
                            </Form.Root>
                        </CardContent>
                    </Card>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default ReportSafetyIssueComponent;