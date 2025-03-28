import { getDjangoErrorMessage } from "@/utils/django-error-handler";

describe('getDjangoErrorMessage', () => {
  // Basic scenarios
  describe('basic error formats', () => {
    it('should handle string errors directly', () => {
      const error = 'This is a direct error message';
      expect(getDjangoErrorMessage(error)).toBe('This is a direct error message');
    });

    it('should handle null or undefined errors', () => {
      expect(getDjangoErrorMessage(null)).toBe('An error occurred');
      expect(getDjangoErrorMessage(undefined)).toBe('An error occurred');
    });

    it('should handle empty objects', () => {
      expect(getDjangoErrorMessage({})).toBe('An unexpected error occurred');
    });
  });

  // Detail field errors
  describe('detail field errors', () => {
    it('should extract error message from detail field string', () => {
      const error = { detail: 'Authentication credentials were not provided.' };
      expect(getDjangoErrorMessage(error)).toBe('Authentication credentials were not provided.');
    });

    it('should extract error messages from detail field array', () => {
      const error = { detail: ['Error 1', 'Error 2'] };
      expect(getDjangoErrorMessage(error)).toBe('Error 1, Error 2');
    });
  });

  // Non-field errors
  describe('non-field errors', () => {
    it('should extract error message from non_field_errors string', () => {
      const error = { non_field_errors: 'User already exists.' };
      expect(getDjangoErrorMessage(error)).toBe('User already exists.');
    });

    it('should extract error messages from non_field_errors array', () => {
      const error = { non_field_errors: ['Invalid credentials.', 'User is inactive.'] };
      expect(getDjangoErrorMessage(error)).toBe('Invalid credentials., User is inactive.');
    });
  });

  // Field-specific errors
  describe('field-specific errors', () => {
    it('should format single field error', () => {
      const error = { username: 'This field is required.' };
      expect(getDjangoErrorMessage(error)).toBe('Username: This field is required.');
    });

    it('should format field error with array of messages', () => {
      const error = { email: ['Enter a valid email address.', 'This field cannot be blank.'] };
      expect(getDjangoErrorMessage(error)).toBe('Email: Enter a valid email address., This field cannot be blank.');
    });

    it('should format multiple field errors', () => {
      const error = {
        username: 'Username already taken.',
        password: 'Password is too short.',
      };
      // Testing with \n since the function joins with newlines
      expect(getDjangoErrorMessage(error)).toBe('Username: Username already taken.\nPassword: Password is too short.');
    });

    it('should properly format snake_case field names', () => {
      const error = {
        first_name: 'This field is required.',
        last_name: 'This field is required.',
      };
      expect(getDjangoErrorMessage(error)).toBe('First Name: This field is required.\nLast Name: This field is required.');
    });
  });

  // Nested errors
  describe('nested errors', () => {
    it('should handle simple nested errors', () => {
      const error = {
        user: {
          email: 'Enter a valid email address.',
          name: 'This field is required.',
        },
      };
      expect(getDjangoErrorMessage(error)).toBe('User.Email: Enter a valid email address.\nUser.Name: This field is required.');
    });

    it('should handle array values in nested errors', () => {
      const error = {
        address: {
          street: ['This field is required.', 'Must be a valid street name.'],
        },
      };
      expect(getDjangoErrorMessage(error)).toBe('Address.Street: This field is required., Must be a valid street name.');
    });

    it('should handle deeply nested errors', () => {
      const error = {
        user: {
          profile: {
            address: {
              zipcode: 'Invalid zip code.',
            },
          },
        },
      };
      expect(getDjangoErrorMessage(error)).toBe('User.Profile.Address.Zipcode: Invalid zip code.');
    });
  });

  // Mixed scenarios
  describe('mixed error scenarios', () => {
    it('should prioritize detail over field errors', () => {
      const error = {
        detail: 'Authentication failed.',
        username: 'Invalid username.',
      };
      expect(getDjangoErrorMessage(error)).toBe('Authentication failed.');
    });

    it('should prioritize non_field_errors over field errors', () => {
      const error = {
        non_field_errors: 'Form is invalid.',
        email: 'Invalid email.',
      };
      expect(getDjangoErrorMessage(error)).toBe('Form is invalid.');
    });

    it('should handle mix of regular fields and nested fields', () => {
      const error = {
        username: 'Username is taken.',
        profile: {
          bio: 'Too long.',
        },
      };
      expect(getDjangoErrorMessage(error)).toBe('Username: Username is taken.\nProfile.Bio: Too long.');
    });
  });

  // Edge cases and complex scenarios
  describe('edge cases', () => {
    it('should handle errors with numeric values', () => {
      const error = { status_code: 404 };
      // Since this function seems to only extract string values, numeric values might be ignored
      expect(getDjangoErrorMessage(error)).toBe('Status Code: 404');
    });

    it('should handle errors with boolean values', () => {
      const error = { is_active: false };
      expect(getDjangoErrorMessage(error)).toBe('Is Active: false');
    });

    it('should handle complex nested mixed-type errors', () => {
      const error = {
        detail: ['Multiple issues found'],
        user: {
          email: ['Invalid format', 'Already registered'],
          profile: {
            age: 'Must be over 18',
            preferences: {
              theme: 'Invalid choice',
            },
          },
        },
        items: [{ name: 'Required' }], // This is a tricky case - arrays of objects
      };
      // Since 'detail' exists, it should prioritize this
      expect(getDjangoErrorMessage(error)).toBe('Multiple issues found');
    });
  });
});