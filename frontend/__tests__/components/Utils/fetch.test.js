// Import the modules we want to test
import { enhancedFetch, apiGet, apiPost, apiPut, apiPatch, apiDelete, authAPI } from "@/utils/fetch/fetch";
import { getDjangoErrorMessage } from '@/utils/django-error-handler';
import { getSession, signOut } from 'next-auth/react';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
  signOut: jest.fn()
}));

// Mock django-error-handler
jest.mock('@/utils/django-error-handler', () => ({
  getDjangoErrorMessage: jest.fn(data => data.detail || 'Error from server')
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock AbortController globally
global.AbortController = class {
  constructor() {
    this.signal = { aborted: false };
    this.abort = jest.fn(() => {
      this.signal.aborted = true;
    });
  }
};

// Helper function to extract the path from the fetch URL
function getPathFromFetchCall() {
  // Get the first argument of the first call to fetch
  const url = fetch.mock.calls[0][0];
  // Extract the path part (everything after the domain)
  const urlObj = new URL(url.startsWith('http') ? url : `http://example.com${url}`);
  return urlObj.pathname;
}

describe('API Utilities', () => {
  // Mock session for tests
  const mockSession = {
    djangoTokens: {
      access: 'test-token'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default return value for getSession
    getSession.mockResolvedValue(mockSession);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('enhancedFetch', () => {
    it('should make a successful request', async () => {
      const mockData = { success: true, data: 'test' };
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockData)
      };

      fetch.mockResolvedValueOnce(mockResponse);

      const result = await enhancedFetch('/test-endpoint');
      const path = getPathFromFetchCall();

      // Check that the path part of the URL is correct
      expect(path).toBe('/test-endpoint');

      // Check that the options are correct
      expect(fetch.mock.calls[0][1]).toMatchObject({
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        signal: expect.any(Object)
      });

      expect(result).toEqual(mockData);
    });

    it('should handle 204 No Content responses', async () => {
      const mockResponse = {
        ok: true,
        status: 204
      };

      fetch.mockResolvedValueOnce(mockResponse);

      const result = await enhancedFetch('/test-endpoint');

      expect(result).toEqual({ success: true });
    });

    it('should throw an error for non-OK responses', async () => {
      const errorMessage = 'Invalid request';
      getDjangoErrorMessage.mockReturnValueOnce(errorMessage);

      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: 'Bad request' })
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await expect(enhancedFetch('/test-endpoint')).rejects.toThrow(errorMessage);
      expect(getDjangoErrorMessage).toHaveBeenCalled();
    });

    it('should handle 401 unauthorized with session', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({})
      };

      fetch.mockResolvedValueOnce(mockResponse);

      // Save original window and create a mock
      const originalWindow = global.window;
      // Use a try/finally pattern to ensure window is restored
      try {
        // Create minimal window object for test
        global.window = {};
        
        await expect(enhancedFetch('/test-endpoint', {}, mockSession)).rejects.toThrow('Session expired');
        expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
      } finally {
        // Restore window
        global.window = originalWindow;
      }
    });

    it('should handle request timeout', async () => {
      // Mock fetch to throw an AbortError
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      fetch.mockRejectedValueOnce(abortError);

      await expect(enhancedFetch('/test-endpoint', { timeoutMs: 100 }))
        .rejects.toThrow('Request timed out after 100ms');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network failure');
      fetch.mockRejectedValueOnce(networkError);

      await expect(enhancedFetch('/test-endpoint')).rejects.toThrow('Network failure');
    });

    it('should handle unexpected errors', async () => {
      fetch.mockRejectedValueOnce('Unexpected error format');

      await expect(enhancedFetch('/test-endpoint')).rejects.toThrow('An unexpected error occurred');
    });
  });

  describe('API verb methods', () => {
    it('should call enhancedFetch with GET method', async () => {
      const mockData = { data: 'test' };
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockData)
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await apiGet('/test-endpoint', { timeoutMs: 5000 });
      const path = getPathFromFetchCall();

      // Check the path is correct
      expect(path).toBe('/test-endpoint');

      // Check method and headers
      expect(fetch.mock.calls[0][1]).toMatchObject({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      });
    });

    it('should call enhancedFetch with POST method and data', async () => {
      const requestData = { name: 'Test' };
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ success: true })
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await apiPost('/test-endpoint', requestData);
      const path = getPathFromFetchCall();

      // Check the path is correct
      expect(path).toBe('/test-endpoint');

      // Check method, body and headers
      expect(fetch.mock.calls[0][1]).toMatchObject({
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      });
    });

    it('should call enhancedFetch with PUT method and data', async () => {
      const requestData = { name: 'Updated Test' };
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ success: true })
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await apiPut('/test-endpoint/1', requestData);
      const path = getPathFromFetchCall();

      // Check the path is correct
      expect(path).toBe('/test-endpoint/1');

      // Check method and body
      expect(fetch.mock.calls[0][1]).toMatchObject({
        method: 'PUT',
        body: JSON.stringify(requestData)
      });
    });

    it('should call enhancedFetch with PATCH method and data', async () => {
      const requestData = { name: 'Partial Update' };
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ success: true })
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await apiPatch('/test-endpoint/1', requestData);
      const path = getPathFromFetchCall();

      // Check the path is correct
      expect(path).toBe('/test-endpoint/1');

      // Check method and body
      expect(fetch.mock.calls[0][1]).toMatchObject({
        method: 'PATCH',
        body: JSON.stringify(requestData)
      });
    });

    it('should call enhancedFetch with DELETE method', async () => {
      const mockResponse = {
        ok: true,
        status: 204
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await apiDelete('/test-endpoint/1');
      const path = getPathFromFetchCall();

      // Check the path is correct
      expect(path).toBe('/test-endpoint/1');

      // Check method
      expect(fetch.mock.calls[0][1]).toMatchObject({
        method: 'DELETE'
      });
    });
  });

  describe('authAPI', () => {
    it('should get auth headers when token exists in session', async () => {
      const headers = authAPI.getAuthHeaders(mockSession);

      expect(headers).toEqual({
        Authorization: 'Bearer test-token'
      });
    });

    it('should return empty headers when token does not exist in session', async () => {
      const headers = authAPI.getAuthHeaders(null);

      expect(headers).toEqual({});
    });

    it('should call getSession', async () => {
      await authAPI.getSession();

      expect(getSession).toHaveBeenCalled();
    });

    it('should make authenticated GET request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: 'authenticated' })
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await authAPI.authenticatedGet('/protected-endpoint');
      const path = getPathFromFetchCall();

      // Check the path is correct
      expect(path).toBe('/protected-endpoint');

      // Check headers include auth token
      expect(fetch.mock.calls[0][1]).toMatchObject({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        })
      });
    });

    it('should make authenticated POST request', async () => {
      const requestData = { data: 'test' };

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ success: true })
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await authAPI.authenticatedPost('/protected-endpoint', requestData);
      const path = getPathFromFetchCall();

      // Check the path is correct
      expect(path).toBe('/protected-endpoint');

      // Check method, body and headers include auth token
      expect(fetch.mock.calls[0][1]).toMatchObject({
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      });
    });

    it('should make authenticated PUT request', async () => {
      const requestData = { data: 'update' };

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ success: true })
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await authAPI.authenticatedPut('/protected-endpoint/1', requestData);
      const path = getPathFromFetchCall();

      // Check the path is correct
      expect(path).toBe('/protected-endpoint/1');

      // Check method, body and headers include auth token
      expect(fetch.mock.calls[0][1]).toMatchObject({
        method: 'PUT',
        body: JSON.stringify(requestData),
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      });
    });
    
    it('should make authenticated PATCH request', async () => {
      const requestData = { status: 'active' };

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ success: true })
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await authAPI.authenticatedPatch('/protected-endpoint/1', requestData);
      const path = getPathFromFetchCall();

      // Check the path is correct
      expect(path).toBe('/protected-endpoint/1');

      // Check method, body and headers include auth token
      expect(fetch.mock.calls[0][1]).toMatchObject({
        method: 'PATCH',
        body: JSON.stringify(requestData),
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      });
    });

    it('should make authenticated DELETE request', async () => {
      const mockResponse = {
        ok: true,
        status: 204
      };

      fetch.mockResolvedValueOnce(mockResponse);

      await authAPI.authenticatedDelete('/protected-endpoint/1');
      const path = getPathFromFetchCall();

      // Check the path is correct
      expect(path).toBe('/protected-endpoint/1');

      // Check method and headers include auth token
      expect(fetch.mock.calls[0][1]).toMatchObject({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      });
    });
  });
});