import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportAppIssueForm from '@/app/custom-components/ReportAppIssues/ReportAppIssueForm';
import { authAPI } from '@/utils/fetch/fetch';
import { useNotification } from '@/app/custom-components/ToastComponent/NotificationContext';

// Mock dependencies
jest.mock('@/utils/fetch/fetch', () => ({
  authAPI: {
    authenticatedPost: jest.fn(),
  }
}));

jest.mock('@/app/custom-components/ToastComponent/NotificationContext', () => ({
  useNotification: jest.fn(),
}));

describe('ReportAppIssueForm', () => {
  // Mock notification functions
  const mockShowSuccess = jest.fn();
  const mockShowError = jest.fn();
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup useNotification mock
    useNotification.mockReturnValue({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
    });
  });

  test('renders form correctly', () => {
    render(<ReportAppIssueForm />);
    
    // Check for form elements
    expect(screen.getByText('Report an Issue')).toBeInTheDocument();
    expect(screen.getByText('Issue Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit report/i })).toBeInTheDocument();
    
    // Check initial character counters
    expect(screen.getByText('0/100')).toBeInTheDocument();
    expect(screen.getByText('0/500')).toBeInTheDocument();
    
    // Button should be disabled initially
    expect(screen.getByRole('button', { name: /submit report/i })).toBeDisabled();
  });

  test('validates title and description minimum length', () => {
    render(<ReportAppIssueForm />);
    
    // Get input elements
    const titleInput = screen.getByPlaceholderText('Brief summary of the issue');
    const descriptionInput = screen.getByPlaceholderText(/Please be as detailed as possible/);
    
    // Enter too short text
    fireEvent.change(titleInput, { target: { value: 'Short title' } });
    fireEvent.change(descriptionInput, { target: { value: 'Short description' } });
    
    // Check for validation messages
    expect(screen.getByText(/Please enter at least 15 characters/)).toBeInTheDocument();
    expect(screen.getByText(/Please enter at least 50 characters/)).toBeInTheDocument();
    
    // Check that submit button is disabled
    expect(screen.getByRole('button', { name: /submit report/i })).toBeDisabled();
  });

  test('enables submit button when form is valid', () => {
    render(<ReportAppIssueForm />);
    
    // Get input elements
    const titleInput = screen.getByPlaceholderText('Brief summary of the issue');
    const descriptionInput = screen.getByPlaceholderText(/Please be as detailed as possible/);
    
    // Enter valid text
    fireEvent.change(titleInput, { target: { value: 'This is a valid title for the report' } });
    fireEvent.change(descriptionInput, { target: { value: 'This is a very detailed description of the issue that meets the minimum character requirement. It includes all the steps to reproduce the issue and what the expected behavior should be.' } });
    
    // Check that submit button is enabled
    expect(screen.getByRole('button', { name: /submit report/i })).not.toBeDisabled();
  });

  test('shows character count for title and description', () => {
    render(<ReportAppIssueForm />);
    
    // Get input elements
    const titleInput = screen.getByPlaceholderText('Brief summary of the issue');
    const descriptionInput = screen.getByPlaceholderText(/Please be as detailed as possible/);
    
    // Initial count should be 0/MAX
    expect(screen.getByText('0/100')).toBeInTheDocument(); // Title max length
    expect(screen.getByText('0/500')).toBeInTheDocument(); // Description max length
    
    // Enter text
    fireEvent.change(titleInput, { target: { value: 'Test title' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    
    // Count should update
    expect(screen.getByText('10/100')).toBeInTheDocument();
    expect(screen.getByText('16/500')).toBeInTheDocument();
  });

  test('shows loading state during submission', async () => {
    // Setup delayed API response
    authAPI.authenticatedPost.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({}), 100);
      });
    });
    
    render(<ReportAppIssueForm />);
    
    // Get input elements
    const titleInput = screen.getByPlaceholderText('Brief summary of the issue');
    const descriptionInput = screen.getByPlaceholderText(/Please be as detailed as possible/);
    
    // Enter valid text
    fireEvent.change(titleInput, { target: { value: 'This is a valid title for the report' } });
    fireEvent.change(descriptionInput, { target: { value: 'This is a very detailed description of the issue that meets the minimum character requirement. It includes all the steps to reproduce the issue and what the expected behavior should be.' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    
    // Button should show loading state
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.queryByText('Submitting...')).not.toBeInTheDocument();
    });
  });

  test('handles successful form submission', async () => {
    // Setup successful API response
    authAPI.authenticatedPost.mockResolvedValue({});
    
    render(<ReportAppIssueForm />);
    
    // Get input elements
    const titleInput = screen.getByPlaceholderText('Brief summary of the issue');
    const descriptionInput = screen.getByPlaceholderText(/Please be as detailed as possible/);
    
    // Enter valid text
    fireEvent.change(titleInput, { target: { value: 'This is a valid title for the report' } });
    fireEvent.change(descriptionInput, { target: { value: 'This is a very detailed description of the issue that meets the minimum character requirement. It includes all the steps to reproduce the issue and what the expected behavior should be.' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    
    // Wait for submission to complete
    await waitFor(() => {
      // Check that API was called with correct data
      expect(authAPI.authenticatedPost).toHaveBeenCalledWith('/report-app-issue/', {
        title: 'This is a valid title for the report',
        description: 'This is a very detailed description of the issue that meets the minimum character requirement. It includes all the steps to reproduce the issue and what the expected behavior should be.'
      });
      
      // Check success notification was shown
      expect(mockShowSuccess).toHaveBeenCalledWith(
        "Thank you for your report! We'll look into it right away.", 
        null, 
        "report_submitted"
      );
    });
    
    // Check form was reset
    expect(titleInput.value).toBe('');
    expect(descriptionInput.value).toBe('');
  });

  test('handles form submission errors', async () => {
    // Setup error API response
    const errorMessage = 'Server error occurred';
    authAPI.authenticatedPost.mockRejectedValue(new Error(errorMessage));
    
    render(<ReportAppIssueForm />);
    
    // Get input elements
    const titleInput = screen.getByPlaceholderText('Brief summary of the issue');
    const descriptionInput = screen.getByPlaceholderText(/Please be as detailed as possible/);
    
    // Enter valid text
    fireEvent.change(titleInput, { target: { value: 'This is a valid title for the report' } });
    fireEvent.change(descriptionInput, { target: { value: 'This is a very detailed description of the issue that meets the minimum character requirement. It includes all the steps to reproduce the issue and what the expected behavior should be.' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    
    // Wait for submission to complete
    await waitFor(() => {
      // Check error notification was shown
      expect(mockShowError).toHaveBeenCalledWith(
        errorMessage, 
        expect.any(Error), 
        'api'
      );
    });
    
    // Form should not be reset on error
    expect(titleInput.value).not.toBe('');
    expect(descriptionInput.value).not.toBe('');
  });

  test('handles exact minimum character lengths', () => {
    render(<ReportAppIssueForm />);
    
    // Get input elements
    const titleInput = screen.getByPlaceholderText('Brief summary of the issue');
    const descriptionInput = screen.getByPlaceholderText(/Please be as detailed as possible/);
    
    // Enter text with exactly minimum required characters
    const exactMinTitle = 'A'.repeat(15); // Exactly 15 characters
    const exactMinDescription = 'B'.repeat(50); // Exactly 50 characters
    
    fireEvent.change(titleInput, { target: { value: exactMinTitle } });
    fireEvent.change(descriptionInput, { target: { value: exactMinDescription } });
    
    // Validation messages should not appear
    expect(screen.queryByText(/Please enter at least 15 characters/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Please enter at least 50 characters/)).not.toBeInTheDocument();
    
    // Button should be enabled
    expect(screen.getByRole('button', { name: /submit report/i })).not.toBeDisabled();
  });

  test('handles approaching maximum character lengths with color changes', () => {
    render(<ReportAppIssueForm />);
    
    // Get input elements
    const titleInput = screen.getByPlaceholderText('Brief summary of the issue');
    const descriptionInput = screen.getByPlaceholderText(/Please be as detailed as possible/);
    
    // Enter text that's close to max length (will trigger amber color)
    const nearMaxTitle = 'A'.repeat(85); // 85 characters (near 100 max)
    const nearMaxDescription = 'B'.repeat(460); // 460 characters (near 500 max)
    
    fireEvent.change(titleInput, { target: { value: nearMaxTitle } });
    fireEvent.change(descriptionInput, { target: { value: nearMaxDescription } });
    
    // Check character counters show up in amber
    const titleCounter = screen.getByText('85/100');
    const descCounter = screen.getByText('460/500');
    
    // These assertion methods will vary based on your implementation
    // We're checking if the counter elements have the amber text class
    expect(titleCounter.className).toContain('text-amber-500');
    expect(descCounter.className).toContain('text-amber-500');
  });

  test('handles form becoming invalid after being valid', () => {
    render(<ReportAppIssueForm />);
    
    // Get input elements
    const titleInput = screen.getByPlaceholderText('Brief summary of the issue');
    const descriptionInput = screen.getByPlaceholderText(/Please be as detailed as possible/);
    
    // First, make the form valid
    fireEvent.change(titleInput, { target: { value: 'This is a valid title for the report' } });
    fireEvent.change(descriptionInput, { target: { value: 'This is a very detailed description that meets requirements. More text to reach the limit.' } });
    
    // Button should be enabled
    expect(screen.getByRole('button', { name: /submit report/i })).not.toBeDisabled();
    
    // Now make the form invalid again by clearing the description
    fireEvent.change(descriptionInput, { target: { value: 'Too short' } });
    
    // Button should be disabled again
    expect(screen.getByRole('button', { name: /submit report/i })).toBeDisabled();
    expect(screen.getByText(/Please enter at least 50 characters/)).toBeInTheDocument();
  });

  test('attempts form submission with insufficient character length', async () => {
    // This test tries to submit the form programmatically despite validation
    render(<ReportAppIssueForm />);
    
    // Get input elements and submit button
    const titleInput = screen.getByPlaceholderText('Brief summary of the issue');
    const descriptionInput = screen.getByPlaceholderText(/Please be as detailed as possible/);
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    
    // Enter text that's longer than 0 but less than minimum
    fireEvent.change(titleInput, { target: { value: 'Short title' } });
    fireEvent.change(descriptionInput, { target: { value: 'Short description' } });
    
    // Try to submit by clicking button (should be disabled)
    expect(submitButton).toBeDisabled();
    
    // Try to simulate a submit event directly on a form by finding the form element
    const form = document.querySelector('form');
    fireEvent.submit(form);
    
    // Check that the API was not called
    expect(authAPI.authenticatedPost).not.toHaveBeenCalled();
    
    // Check that validation errors are still shown
    expect(screen.getByText(/Please enter at least 15 characters/)).toBeInTheDocument();
    expect(screen.getByText(/Please enter at least 50 characters/)).toBeInTheDocument();
  });

  test('submits form with exactly max character lengths', async () => {
    // Setup successful API response
    authAPI.authenticatedPost.mockResolvedValue({});
    
    render(<ReportAppIssueForm />);
    
    // Get input elements
    const titleInput = screen.getByPlaceholderText('Brief summary of the issue');
    const descriptionInput = screen.getByPlaceholderText(/Please be as detailed as possible/);
    
    // Enter text with exactly maximum allowed characters
    const exactMaxTitle = 'A'.repeat(100);
    const exactMaxDescription = 'B'.repeat(500);
    
    fireEvent.change(titleInput, { target: { value: exactMaxTitle } });
    fireEvent.change(descriptionInput, { target: { value: exactMaxDescription } });
    
    // Verify character count is at max
    expect(screen.getByText('100/100')).toBeInTheDocument();
    expect(screen.getByText('500/500')).toBeInTheDocument();
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    
    // Wait for submission to complete
    await waitFor(() => {
      // Check that API was called with correct data
      expect(authAPI.authenticatedPost).toHaveBeenCalledWith('/report-app-issue/', {
        title: exactMaxTitle,
        description: exactMaxDescription
      });
    });
  });

  test('tests maxLength attribute behavior in inputs', () => {
    render(<ReportAppIssueForm />);
    
    // Get input elements
    const titleInput = screen.getByPlaceholderText('Brief summary of the issue');
    const descriptionInput = screen.getByPlaceholderText(/Please be as detailed as possible/);
    
    // Verify maxLength attributes are set correctly
    expect(titleInput).toHaveAttribute('maxlength', '100');
    expect(descriptionInput).toHaveAttribute('maxlength', '500');
    
    // Enter some text
    fireEvent.change(titleInput, { target: { value: 'Test title' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    
    // Ensure the component correctly accepts the input
    expect(titleInput.value).toBe('Test title');
    expect(descriptionInput.value).toBe('Test description');
  });
  
  // TARGETED TESTS FOR REMAINING BRANCHES
  
  test('handles empty form submission attempt', () => {
    render(<ReportAppIssueForm />);
    
    // Get form element without entering any data
    const form = document.querySelector('form');
    
    // Try to submit the empty form
    fireEvent.submit(form);
    
    // API should not be called
    expect(authAPI.authenticatedPost).not.toHaveBeenCalled();
    
    // Submit button should be disabled
    expect(screen.getByRole('button', { name: /submit report/i })).toBeDisabled();
  });
  
  test('handles error with empty message', async () => {
    // Setup error API response with empty message
    authAPI.authenticatedPost.mockRejectedValue(new Error());
    
    render(<ReportAppIssueForm />);
    
    // Get input elements
    const titleInput = screen.getByPlaceholderText('Brief summary of the issue');
    const descriptionInput = screen.getByPlaceholderText(/Please be as detailed as possible/);
    
    // Enter valid text
    fireEvent.change(titleInput, { target: { value: 'This is a valid title for the report' } });
    fireEvent.change(descriptionInput, { target: { value: 'This is a very detailed description of the issue that meets the minimum character requirement. It includes all the steps to reproduce the issue and what the expected behavior should be.' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    
    // Wait for submission to complete
    await waitFor(() => {
      // Check error notification was shown with default message
      expect(mockShowError).toHaveBeenCalledWith(
        'An error occurred while submitting your report.', 
        expect.any(Error), 
        'api'
      );
    });
  });
  
  test('handles description with mixed length content', () => {
    render(<ReportAppIssueForm />);
    
    // Get input elements
    const titleInput = screen.getByPlaceholderText('Brief summary of the issue');
    const descriptionInput = screen.getByPlaceholderText(/Please be as detailed as possible/);
    
    // Valid title but description between 0 and MIN_LENGTH
    fireEvent.change(titleInput, { target: { value: 'This is a valid title for the report' } });
    fireEvent.change(descriptionInput, { target: { value: '' } });
    
    // Check validation - button should be disabled
    expect(screen.getByRole('button', { name: /submit report/i })).toBeDisabled();
    
    // Add some text but still too short
    fireEvent.change(descriptionInput, { target: { value: 'Some text' } });
    
    // Should show the validation message
    expect(screen.getByText(/Please enter at least 50 characters/)).toBeInTheDocument();
    
    // Button should still be disabled
    expect(screen.getByRole('button', { name: /submit report/i })).toBeDisabled();
  });
  
  test('handles form field labels and info text rendering', () => {
    render(<ReportAppIssueForm />);
    
    // Check for the info text
    const infoText = screen.getByText(/Detailed descriptions help us fix issues faster/);
    expect(infoText).toBeInTheDocument();
    
    // Check for the Info icon
    const infoIcon = screen.getByText(/Detailed descriptions/).previousSibling;
    expect(infoIcon).toBeInTheDocument();
    expect(infoIcon.tagName.toLowerCase()).toBe('svg');
    
    // Test that form labels are correctly linked to inputs
    const titleLabel = screen.getByText('Issue Title');
    const descriptionLabel = screen.getByText('Description');
    
    expect(titleLabel).toBeInTheDocument();
    expect(descriptionLabel).toBeInTheDocument();
  });
});