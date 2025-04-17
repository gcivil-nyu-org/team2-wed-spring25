import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePhotoSection from '@/app/custom-components/UserSettings/ProfilePhotoSection';
import { useUser } from '@/components/Auth/UserContextProvider';
import { within } from '@testing-library/react';
import { uploadImage } from "@/utils/uploadImage";
import { authAPI } from "@/utils/fetch/fetch";

// Mock next/image for test environments
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props) => {
        // eslint-disable-next-line jsx-a11y/alt-text
        return <img {...props} />;
    },
}));

// Mock UserContext
jest.mock('@/components/Auth/UserContextProvider', () => ({
    useUser: jest.fn(),
}));

//Mock uploadImage function
jest.mock('@/utils/uploadImage', () => ({
    uploadImage: jest.fn(),
}));

//Mock authAPI
jest.mock('@/utils/fetch/fetch', () => ({
    authAPI: {
        authenticatedPost: jest.fn(),
    },
}));

describe('ProfilePhotoSection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders correctly for Google user with avatar', () => {
        useUser.mockReturnValue({
            user: {
                provider: 'google',
                avatar_url: 'https://example.com/avatar.jpg',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
            },
        });

        render(<ProfilePhotoSection />);

        expect(screen.getByText('Your profile photo is managed by Google')).toBeInTheDocument();
        // expect(screen.getByText('Google Account')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();

        const avatar = screen.getByAltText("John's profile photo");
        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');

        expect(screen.queryByText('Change Photo')).not.toBeInTheDocument();
    });

    test('renders correctly for non-Google user without avatar', () => {
        useUser.mockReturnValue({
            user: {
                provider: 'credentials',
                avatar_url: null,
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane.smith@example.com',
            },
        });

        render(<ProfilePhotoSection />);

        expect(screen.getByText('Upload or change your profile photo')).toBeInTheDocument();
        // expect(screen.queryByText('Google Account')).not.toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();

        const placeholder = screen.getByText('', { selector: 'svg.lucide-user' });
        expect(placeholder).toBeInTheDocument();

        // const changePhotoButton = screen.getByText('Change Photo').closest('button');
        // expect(changePhotoButton).toBeDisabled();
    });

    test('shows hover overlay effect for non-Google users', () => {
        useUser.mockReturnValue({
            user: {
                provider: 'credentials',
                avatar_url: 'https://example.com/avatar.jpg',
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane.smith@example.com',
            },
        });

        render(<ProfilePhotoSection />);

        const hoverContainer = screen.getByAltText("Jane's profile photo").closest('div');
        const overlay = hoverContainer.querySelector('div.absolute.inset-0');

        // Initially hidden
        expect(overlay).toHaveClass('opacity-0');

        fireEvent.mouseEnter(hoverContainer);
        expect(overlay).toHaveClass('opacity-100');

        fireEvent.mouseLeave(hoverContainer);
        expect(overlay).toHaveClass('opacity-0');
    });

    test('does not show hover effect for Google users', () => {
        useUser.mockReturnValue({
            user: {
                provider: 'google',
                avatar_url: 'https://example.com/avatar.jpg',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
            },
        });

        render(<ProfilePhotoSection />);

        const overlay = document.querySelector('div.absolute.inset-0.bg-black');
        expect(overlay).not.toBeInTheDocument();
    });

    test('shows correct popover content for Google users', async () => {
        useUser.mockReturnValue({
            user: {
                provider: 'google',
                avatar_url: 'https://example.com/avatar.jpg',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
            },
        });

        render(<ProfilePhotoSection />);

        const popoverTrigger = screen.getAllByRole('button').find(btn =>
            btn.querySelector('svg.lucide-lock')
        );
        fireEvent.click(popoverTrigger);

        // Wait for popover content to appear
        const popover = await screen.findByRole('dialog');

        // Use `within` to limit scope
        expect(within(popover).getByText('Google Account Photo')).toBeInTheDocument();
        expect(
            within(popover).getByText(
                /Your profile photo is managed by Google.*sync automatically/i
            )
        ).toBeInTheDocument();
    });


    test('handles case when user data is not available', () => {
        useUser.mockReturnValue({ user: null });

        expect(() => render(<ProfilePhotoSection />)).not.toThrow();
    });
});
