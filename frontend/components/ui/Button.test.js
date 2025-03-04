import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button2';
import React from 'react';
test('renders a button with text', () => {
  render(<Button>Click me</Button>);
  const buttonElement = screen.getByText(/click me/i);
  expect(buttonElement).toBeInTheDocument();
});

test('calls onClick handler when clicked', () => {
  const handleClick = jest.fn(); // Mock function
  render(<Button onClick={handleClick}>Click me</Button>);

  const buttonElement = screen.getByText(/click me/i);
  fireEvent.click(buttonElement); // Simulate a click event

  expect(handleClick).toHaveBeenCalledTimes(1); // Ensure the mock function was called once
});

test('disables the button when disabled prop is true', () => {
  render(<Button disabled={true}>Click me</Button>);
  const buttonElement = screen.getByText(/click me/i);

  expect(buttonElement).toBeDisabled(); // Check if the button is disabled
});