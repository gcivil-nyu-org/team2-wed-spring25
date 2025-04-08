import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChangeNamesForm from '@/app/custom-components/UserSettings/ChangeNamesForm';
import { useUser } from '@/components/Auth/UserContextProvider';
import { useNotification } from '@/app/custom-components/ToastComponent/NotificationContext';
import { authAPI } from '@/utils/fetch/fetch';

// Mock the dependencies
jest.mock('@/components/Auth/UserContextProvider', () => ({
    useUser: jest.fn(),
}));

jest.mock('@/app/custom-components/ToastComponent/NotificationContext', () => ({
    useNotification: jest.fn(),
}));

jest.mock('@/utils/fetch/fetch', () => ({
    authAPI: {
        authenticatedPost: jest.fn(),
    }
}));

describe('ChangeNamesForm', () => {
    // Set up default mocks
    const mockRefreshUserDetails = jest.fn();
    const mockShowSuccess = jest.fn();
    const mockShowError = jest.fn();

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Set up mock implementations
        useUser.mockImplementation(() => ({
            user: {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                provider: 'email'
            },
            refreshUserDetails: mockRefreshUserDetails,
        }));

        useNotification.mockImplementation(() => ({
            showSuccess: mockShowSuccess,
            showError: mockShowError,
        }));

        authAPI.authenticatedPost.mockResolvedValue({});
    });

    test('renders correctly for email users', () => {
        render(<ChangeNamesForm />);

        // Check if form elements are present
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
        expect(screen.getByText('Update your name and personal details')).toBeInTheDocument();

        // Check if input fields are pre-filled with user data
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument();

        // Check that Google warning is not present
        expect(screen.queryByText(/Your profile information is managed by Google/i)).not.toBeInTheDocument();

        // Button should be disabled initially (no changes made)
        expect(screen.getByRole('button', { name: /update profile/i })).toBeDisabled();
    });

    test('renders correctly for Google users', () => {
        useUser.mockImplementation(() => ({
            user: {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@gmail.com',
                provider: 'google'
            },
            refreshUserDetails: mockRefreshUserDetails,
        }));

        render(<ChangeNamesForm />);

        // Check that Google warning is present
        expect(screen.getByText(/Your profile information is managed by Google/i)).toBeInTheDocument();

        // Input fields should be disabled
        const firstNameInput = screen.getByPlaceholderText('Your first name');
        const lastNameInput = screen.getByPlaceholderText('Your last name');

        expect(firstNameInput).toBeDisabled();
        expect(lastNameInput).toBeDisabled();

        // Button should be disabled
        expect(screen.getByRole('button', { name: /update profile/i })).toBeDisabled();
    });

    test('validates input fields - minimum length', async () => {
        render(<ChangeNamesForm />);

        const firstNameInput = screen.getByPlaceholderText('Your first name');
        const lastNameInput = screen.getByPlaceholderText('Your last name');

        // Clear and type a single character in first name field
        await userEvent.clear(firstNameInput);
        await userEvent.type(firstNameInput, 'J');

        // Check that the border color changes (we can't directly test CSS, but we can check for class)
        expect(firstNameInput).toHaveClass('border-amber-500');

        // Clear and type a single character in last name field
        await userEvent.clear(lastNameInput);
        await userEvent.type(lastNameInput, 'D');

        // Check that border changes for last name too
        expect(lastNameInput).toHaveClass('border-amber-500');

        // Button should remain disabled
        expect(screen.getByRole('button', { name: /update profile/i })).toBeDisabled();
    });

    test('enables submit button when valid changes are made', async () => {
        render(<ChangeNamesForm />);

        const firstNameInput = screen.getByPlaceholderText('Your first name');

        // Change first name to something different but valid
        await userEvent.clear(firstNameInput);
        await userEvent.type(firstNameInput, 'Jonathan');

        // Button should be enabled now
        expect(screen.getByRole('button', { name: /update profile/i })).toBeEnabled();
    });

    test('submits form data and shows success message', async () => {
        render(<ChangeNamesForm />);

        const firstNameInput = screen.getByPlaceholderText('Your first name');
        const submitButton = screen.getByRole('button', { name: /update profile/i });

        // Change first name to something different
        await userEvent.clear(firstNameInput);
        await userEvent.type(firstNameInput, 'Jonathan');

        // Submit the form
        await userEvent.click(submitButton);

        // Check that API was called with correct data
        expect(authAPI.authenticatedPost).toHaveBeenCalledWith('/user/change-names/', {
            first_name: 'Jonathan',
            last_name: 'Doe'
        });

        // Check that success notification was shown
        await waitFor(() => {
            expect(mockShowSuccess).toHaveBeenCalledWith(
                'Profile information updated successfully',
                null,
                'profile'
            );
        });

        // Check that user details were refreshed
        expect(mockRefreshUserDetails).toHaveBeenCalled();
    });

    test('handles API errors', async () => {
        // Make the API call fail
        const errorMessage = 'API error occurred';
        authAPI.authenticatedPost.mockRejectedValueOnce(new Error(errorMessage));

        render(<ChangeNamesForm />);

        const firstNameInput = screen.getByPlaceholderText('Your first name');
        const submitButton = screen.getByRole('button', { name: /update profile/i });

        // Change first name to something different
        await userEvent.clear(firstNameInput);
        await userEvent.type(firstNameInput, 'Jonathan');

        // Submit the form
        await userEvent.click(submitButton);

        // Check that error notification was shown
        await waitFor(() => {
            expect(mockShowError).toHaveBeenCalledWith(
                errorMessage,
                expect.any(Error),
                'api'
            );
        });
    });

    test('does not submit if form is invalid', async () => {
        render(<ChangeNamesForm />);

        const firstNameInput = screen.getByPlaceholderText('Your first name');

        // Enter an invalid first name (too short)
        await userEvent.clear(firstNameInput);
        await userEvent.type(firstNameInput, 'J');

        // Submit button should be disabled
        expect(screen.getByRole('button', { name: /update profile/i })).toBeDisabled();

        // API should not be called
        expect(authAPI.authenticatedPost).not.toHaveBeenCalled();
    });

    test('shows loading state during submission', async () => {
        // Delay the API response to test loading state
        authAPI.authenticatedPost.mockImplementationOnce(() => new Promise(resolve => {
            setTimeout(() => resolve({}), 100);
        }));

        render(<ChangeNamesForm />);

        const firstNameInput = screen.getByPlaceholderText('Your first name');
        const submitButton = screen.getByRole('button', { name: /update profile/i });

        // Change first name to something different
        await userEvent.clear(firstNameInput);
        await userEvent.type(firstNameInput, 'Jonathan');

        // Submit the form
        await userEvent.click(submitButton);

        // Button should show loading state
        expect(screen.getByText('Updating...')).toBeInTheDocument();

        // Wait for submission to complete
        await waitFor(() => {
            expect(screen.getByText('Update Profile')).toBeInTheDocument();
        });
    });

    // Additional tests to improve function and branch coverage

    test('reacts to last name changes', async () => {
        render(<ChangeNamesForm />);

        const lastNameInput = screen.getByPlaceholderText('Your last name');

        // Change last name to something different but valid
        await userEvent.clear(lastNameInput);
        await userEvent.type(lastNameInput, 'Smith');

        // Button should be enabled now
        expect(screen.getByRole('button', { name: /update profile/i })).toBeEnabled();
    });

    test('disables button when name is the same as original', async () => {
        render(<ChangeNamesForm />);

        const firstNameInput = screen.getByPlaceholderText('Your first name');
        const lastNameInput = screen.getByPlaceholderText('Your last name');

        // Change name then change back to original
        await userEvent.clear(firstNameInput);
        await userEvent.type(firstNameInput, 'Jonathan');
        expect(screen.getByRole('button', { name: /update profile/i })).toBeEnabled();

        await userEvent.clear(firstNameInput);
        await userEvent.type(firstNameInput, 'John');

        await userEvent.clear(lastNameInput);
        await userEvent.type(lastNameInput, 'Doe');

        // Button should be disabled again since no actual changes
        expect(screen.getByRole('button', { name: /update profile/i })).toBeDisabled();
    });

    test('handles form submission for Google users correctly', async () => {
        // Set up Google user
        useUser.mockImplementation(() => ({
            user: {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@gmail.com',
                provider: 'google'
            },
            refreshUserDetails: mockRefreshUserDetails,
        }));

        render(<ChangeNamesForm />);

        // Select the form element directly instead of using role
        const form = screen.getByText('Update Profile').closest('form');
        expect(form).toBeInTheDocument();

        // Try to submit the form (this should never happen in the UI, but we need to test the branch)
        fireEvent.submit(form);

        // API should not be called
        expect(authAPI.authenticatedPost).not.toHaveBeenCalled();
    });

    test('handles null user data gracefully', () => {
        // Mock null user data
        useUser.mockImplementation(() => ({
            user: null,
            refreshUserDetails: mockRefreshUserDetails,
        }));

        render(<ChangeNamesForm />);

        // Form should still render without crashing
        expect(screen.getByText('Profile Information')).toBeInTheDocument();

        // Input fields should be empty
        const firstNameInput = screen.getByPlaceholderText('Your first name');
        const lastNameInput = screen.getByPlaceholderText('Your last name');
        expect(firstNameInput).toHaveValue('');
        expect(lastNameInput).toHaveValue('');
    });

    test('handles missing user fields gracefully', () => {
        // Mock partial user data (missing names)
        useUser.mockImplementation(() => ({
            user: {
                email: 'john.doe@example.com',
                provider: 'email'
                // first_name and last_name are intentionally missing
            },
            refreshUserDetails: mockRefreshUserDetails,
        }));

        render(<ChangeNamesForm />);

        // Input fields should be empty but present
        const firstNameInput = screen.getByPlaceholderText('Your first name');
        const lastNameInput = screen.getByPlaceholderText('Your last name');
        expect(firstNameInput).toHaveValue('');
        expect(lastNameInput).toHaveValue('');
    });

    test('validates names that are exactly at minimum length', async () => {
        render(<ChangeNamesForm />);

        const firstNameInput = screen.getByPlaceholderText('Your first name');
        const lastNameInput = screen.getByPlaceholderText('Your last name');

        // Type names that are exactly at minimum length but different from original
        await userEvent.clear(firstNameInput);
        await userEvent.type(firstNameInput, 'Jo'); // 2 chars, minimum length

        await userEvent.clear(lastNameInput);
        await userEvent.type(lastNameInput, 'Do'); // 2 chars, minimum length

        // Border should not be amber (validation passes)
        expect(firstNameInput).not.toHaveClass('border-amber-500');
        expect(lastNameInput).not.toHaveClass('border-amber-500');

        // Button should be enabled since values are valid and different
        expect(screen.getByRole('button', { name: /update profile/i })).toBeEnabled();
    });
});