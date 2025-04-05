'use client';

import * as React from 'react';
import * as Form from '@radix-ui/react-form';
import { authAPI } from "@/utils/fetch/fetch";
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const ReportAppIssueForm = () => {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formStatus, setFormStatus] = React.useState(null); // null, 'success', 'error'
  const [errorMessage, setErrorMessage] = React.useState('');

  const MAX_TITLE_LENGTH = 100;
  const MAX_DESCRIPTION_LENGTH = 500; // Increased from 250 for more detail
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormStatus(null);
    
    try {
      const response = await authAPI.authenticatedPost('/report-app-issue/', {
        title,
        description
      });
        setFormStatus('success');
        setTitle('');
        setDescription('');
    } catch (error) {
      setFormStatus('error');
      setErrorMessage(error.message || 'An error occurred while submitting your report. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Report an Issue</h2>
      
      {formStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200 flex items-center">
          <CheckCircle2 className="text-green-500 mr-2" size={20} />
          <p className="text-green-700">Thank you for your report! We'll look into it right away.</p>
        </div>
      )}
      
      {formStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 flex items-center">
          <AlertCircle className="text-red-500 mr-2" size={20} />
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}
      
      <Form.Root className="space-y-6" onSubmit={handleSubmit}>
        <Form.Field className="grid" name="title">
          <div className="flex items-baseline justify-between">
            <Form.Label className="text-sm font-medium text-gray-700 mb-1">
              Issue Title
            </Form.Label>
            <div className="text-xs text-gray-500">
              {title.length}/{MAX_TITLE_LENGTH}
            </div>
          </div>
          <Form.Control asChild>
            <input
              className="rounded-md border border-gray-300 px-3 py-2 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              type="text"
              required
              maxLength={MAX_TITLE_LENGTH}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoComplete='off'
              placeholder="Brief summary of the issue"
            />
          </Form.Control>
          <Form.Message className="text-xs text-red-500 mt-1" match="valueMissing">
            Please enter a title for your report
          </Form.Message>
        </Form.Field>

        <Form.Field className="grid" name="description">
          <div className="flex items-baseline justify-between">
            <Form.Label className="text-sm font-medium text-gray-700 mb-1">
              Description
            </Form.Label>
            <div className={`text-xs ${description.length > MAX_DESCRIPTION_LENGTH - 50 ? 'text-amber-500' : 'text-gray-500'}`}>
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </div>
          </div>
          <Form.Control asChild>
            <textarea
              className="min-h-32 rounded-md border border-gray-300 px-3 py-2 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              required
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please be as detailed as possible. Include steps to reproduce, expected behavior, and what you observed instead."
              rows={5}
            />
          </Form.Control>
          <Form.Message className="text-xs text-red-500 mt-1" match="valueMissing">
            Please describe the issue you encountered
          </Form.Message>
          <div className="mt-2 flex items-start">
            <Info className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
            <p className="text-xs text-gray-600">
              Detailed descriptions help us fix issues faster. Please include any relevant information like browser/device details, steps to reproduce, and what you expected to happen.
            </p>
          </div>
        </Form.Field>

        <Form.Submit asChild>
          <button
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </Form.Submit>
      </Form.Root>
    </div>
  );
};

export default ReportAppIssueForm;