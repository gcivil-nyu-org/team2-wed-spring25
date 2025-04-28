'use client';

import * as React from 'react';
import * as Form from '@radix-ui/react-form';
import { authAPI } from "@/utils/fetch/fetch";
import { Info, AlertTriangle } from 'lucide-react';
import { useNotification } from "../ToastComponent/NotificationContext"; // Updated path
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ReportAppIssueForm = () => {
  const { showSuccess, showError } = useNotification();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Character limits
  const MIN_TITLE_LENGTH = 15;
  const MAX_TITLE_LENGTH = 100;
  const MIN_DESCRIPTION_LENGTH = 50;
  const MAX_DESCRIPTION_LENGTH = 500;
  
  // Check if form is valid (for enabling/disabling submit button)
  const isFormValid = 
    title.length >= MIN_TITLE_LENGTH && 
    description.length >= MIN_DESCRIPTION_LENGTH;
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Additional validation check before submission
    if (!isFormValid) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await authAPI.authenticatedPost('/report-app-issue/', {
        title,
        description
      });
      
      // Show success notification
      showSuccess(
        "Thank you for your report! We'll look into it right away.", 
        null, 
        "report_submitted"
      );
      
      // Reset form
      setTitle('');
      setDescription('');
    } catch (error) {
      // Show error notification
      showError(
        error.message || 'An error occurred while submitting your report.', 
        error.details || error, 
        'api'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-sidebar-bg border-sidebar-border text-sidebar-text w-full mb-6">
      <CardHeader>
        <CardTitle>Report an Issue</CardTitle>
        <CardDescription>
          Help us improve by reporting any issues you encounter
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form.Root className="space-y-6" onSubmit={handleSubmit}>
          <Form.Field className="space-y-2" name="title">
            <div className="flex items-baseline justify-between">
              <Form.Label className="text-sm font-medium text-sidebar-labeltext">
                Issue Title
              </Form.Label>
              <div className={`text-xs ${
                title.length < MIN_TITLE_LENGTH 
                  ? 'text-amber-500' 
                  : title.length > MAX_TITLE_LENGTH - 20 
                    ? 'text-amber-500' 
                    : 'text-sidebar-text/70'
              }`}>
                {title.length}/{MAX_TITLE_LENGTH}
              </div>
            </div>
            <Form.Control asChild>
              <input
                className={`w-full rounded-md border ${
                  title.length > 0 && title.length < MIN_TITLE_LENGTH 
                    ? 'border-amber-500' 
                    : 'border-sidebar-inputborder'
                } px-3 py-2 text-sidebar-inputtext bg-sidebar-inputbg shadow-sm focus:outline-none focus:ring-1 focus:ring-sidebar-inputfocus placeholder:text-sidebar-inputplaceholder`}
                type="text"
                required
                maxLength={MAX_TITLE_LENGTH}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoComplete='off'
                placeholder="Brief summary of the issue"
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
              <Form.Label className="text-sm font-medium text-sidebar-labeltext">
                Description
              </Form.Label>
              <div className={`text-xs ${
                description.length < MIN_DESCRIPTION_LENGTH 
                  ? 'text-amber-500' 
                  : description.length > MAX_DESCRIPTION_LENGTH - 50 
                    ? 'text-amber-500' 
                    : 'text-sidebar-text/70'
              }`}>
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </div>
            </div>
            <Form.Control asChild>
              <textarea
                className={`w-full min-h-32 rounded-md border ${
                  description.length > 0 && description.length < MIN_DESCRIPTION_LENGTH 
                    ? 'border-amber-500' 
                    : 'border-sidebar-inputborder'
                } bg-sidebar-inputbg px-3 py-2 text-sidebar-inputtext shadow-sm focus:outline-none focus:ring-1 focus:ring-sidebar-inputfocus resize-y`}
                required
                maxLength={MAX_DESCRIPTION_LENGTH}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please be as detailed as possible. Include steps to reproduce, expected behavior, and what you observed instead."
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
              Please describe the issue you encountered
            </Form.Message>
            <div className="mt-2 flex items-start">
              <Info className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
              <p className="text-xs text-sidebar-text">
                Detailed descriptions help us fix issues faster. Please include any relevant information like browser/device details, steps to reproduce, and what you expected to happen.
              </p>
            </div>
          </Form.Field>

          <Form.Submit asChild>
            <Button
              className="w-full mt-4"
              disabled={isSubmitting || !isFormValid || !title.length || !description.length}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </Form.Submit>
        </Form.Root>
      </CardContent>
    </Card>
  );
};

export default ReportAppIssueForm;