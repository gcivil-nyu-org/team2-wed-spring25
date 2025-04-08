import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Slot } from "@radix-ui/react-slot";

// Mock the Slot component from Radix
jest.mock('@radix-ui/react-slot', () => ({
    Slot: jest.fn(({ children, ...props }) => (
        <div data-testid="slot" {...props}>
            {children}
        </div>
    )),
}));

describe('Button', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders as a button by default', () => {
        render(<Button>Click me</Button>);

        const button = screen.getByRole('button', { name: 'Click me' });
        expect(button).toBeInTheDocument();
        expect(button.tagName).toBe('BUTTON');
    });

    test('applies default variant and size classes', () => {
        render(<Button>Click me</Button>);

        const button = screen.getByRole('button', { name: 'Click me' });

        // Check for default variant classes (using partial class matching)
        expect(button).toHaveClass('bg-primary');
        expect(button).toHaveClass('text-primary-foreground');

        // Check for default size classes
        expect(button).toHaveClass('h-9');
        expect(button).toHaveClass('px-4');
        expect(button).toHaveClass('py-2');
    });

    test('applies variant="destructive" classes', () => {
        render(<Button variant="destructive">Delete</Button>);

        const button = screen.getByRole('button', { name: 'Delete' });

        expect(button).toHaveClass('bg-destructive');
        expect(button).toHaveClass('text-white');
    });

    test('applies variant="outline" classes', () => {
        render(<Button variant="outline">Outline</Button>);

        const button = screen.getByRole('button', { name: 'Outline' });

        expect(button).toHaveClass('border');
        expect(button).toHaveClass('border-input');
        expect(button).toHaveClass('bg-background');
    });

    test('applies variant="secondary" classes', () => {
        render(<Button variant="secondary">Secondary</Button>);

        const button = screen.getByRole('button', { name: 'Secondary' });

        expect(button).toHaveClass('bg-secondary');
        expect(button).toHaveClass('text-secondary-foreground');
    });

    test('applies variant="ghost" classes', () => {
        render(<Button variant="ghost">Ghost</Button>);

        const button = screen.getByRole('button', { name: 'Ghost' });

        expect(button).toHaveClass('hover:bg-accent');
        expect(button).toHaveClass('hover:text-accent-foreground');
    });

    test('applies variant="link" classes', () => {
        render(<Button variant="link">Link Button</Button>);

        const button = screen.getByRole('button', { name: 'Link Button' });

        expect(button).toHaveClass('text-primary');
        expect(button).toHaveClass('hover:underline');
    });

    test('applies size="sm" classes', () => {
        render(<Button size="sm">Small</Button>);

        const button = screen.getByRole('button', { name: 'Small' });

        expect(button).toHaveClass('h-8');
        expect(button).toHaveClass('rounded-md');
        expect(button).toHaveClass('px-3');
    });

    test('applies size="lg" classes', () => {
        render(<Button size="lg">Large</Button>);

        const button = screen.getByRole('button', { name: 'Large' });

        expect(button).toHaveClass('h-10');
        expect(button).toHaveClass('rounded-md');
        expect(button).toHaveClass('px-6');
    });

    test('applies size="icon" classes', () => {
        render(<Button size="icon">Icon</Button>);

        const button = screen.getByRole('button', { name: 'Icon' });

        expect(button).toHaveClass('size-9');
    });

    test('applies custom className', () => {
        render(<Button className="my-custom-class">Custom</Button>);

        const button = screen.getByRole('button', { name: 'Custom' });

        expect(button).toHaveClass('my-custom-class');
    });

    test('renders as a different element when asChild is true', () => {
        render(
            <Button asChild>
                <a href="#">Link</a>
            </Button>
        );

        expect(Slot).toHaveBeenCalled();
        const slot = screen.getByTestId('slot');
        expect(slot).toBeInTheDocument();

        // The Slot component should have received the link child
        const link = screen.getByText('Link');
        expect(link).toBeInTheDocument();
    });

    test('renders a disabled button', () => {
        render(<Button disabled>Disabled</Button>);

        const button = screen.getByRole('button', { name: 'Disabled' });
        expect(button).toBeDisabled();
        expect(button).toHaveClass('disabled:opacity-50');
    });

    test('forwards ref to button element', () => {
        const ref = React.createRef();
        render(<Button ref={ref}>Ref Button</Button>);

        expect(ref.current).not.toBeNull();
        expect(ref.current.tagName).toBe('BUTTON');
        expect(ref.current.textContent).toBe('Ref Button');
    });

    test('passes additional props to button element', () => {
        render(<Button data-testid="test-button" aria-label="Test Button">Props</Button>);

        const button = screen.getByTestId('test-button');
        expect(button).toHaveAttribute('aria-label', 'Test Button');
    });

    test('adds data-slot attribute', () => {
        render(<Button>Button</Button>);

        const button = screen.getByRole('button', { name: 'Button' });
        expect(button).toHaveAttribute('data-slot', 'button');
    });

    test('buttonVariants function returns expected class string', () => {
        // Test with default variants
        const defaultClasses = buttonVariants({});
        expect(defaultClasses).toContain('bg-primary');
        expect(defaultClasses).toContain('text-primary-foreground');
        expect(defaultClasses).toContain('h-9');

        // Test with custom variants
        const customClasses = buttonVariants({ variant: 'destructive', size: 'lg' });
        expect(customClasses).toContain('bg-destructive');
        expect(customClasses).toContain('text-white');
        expect(customClasses).toContain('h-10');

        // Test with custom className
        const withCustomClass = buttonVariants({ className: 'my-custom-class' });
        expect(withCustomClass).toContain('my-custom-class');
    });
});