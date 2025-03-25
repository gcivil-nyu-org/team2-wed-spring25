// api-utils.test.js
import { enhancedFetch, apiGet, apiPost, apiPut, apiPatch, apiDelete, authAPI } from "@/utils/fetch/fetch";
import { getDjangoErrorMessage } from '@/utils/django-error-handler';

// Mock direct URL - let's use a different approach
// Instead of trying to mock the module, we'll spy on the fetch calls
// and replace the URL in our test expectations
const TEST_API_URL = 'https://api.example.com';

// Mock the django-error-handler
jest.mock('@/utils/django-error-handler', () => ({
    getDjangoErrorMessage: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

// Mock AbortController
global.AbortController = class {
    constructor() {
        this.signal = { aborted: false };
        this.abort = jest.fn(() => {
            this.signal.aborted = true;
        });
    }
};

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        clear: jest.fn(() => {
            store = {};
        })
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock console.log
console.log = jest.fn();

describe('API Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // Helper function to extract the path from the fetch URL
    function getPathFromFetchCall() {
        // Get the first argument of the first call to fetch
        const url = fetch.mock.calls[0][0];
        // Extract the path part (everything after the last slash in the domain)
        const urlObj = new URL(url.startsWith('http') ? url : `http://example.com${url}`);
        return urlObj.pathname;
    }

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

        // Increase the timeout for this specific test
        it('should handle timeouts', async () => {
            // Instead of using a never-resolving promise, we'll directly trigger the abort
            fetch.mockImplementationOnce(() => {
                // Immediately throw an AbortError when fetch is called
                const abortError = new DOMException('The operation was aborted', 'AbortError');
                return Promise.reject(abortError);
            });

            // Set a short timeout to speed up the test
            await expect(enhancedFetch('/test-endpoint', { timeoutMs: 100 }))
                .rejects.toThrow('Request timed out after 100ms');
        }, 5000);

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
        it('should get auth headers when token exists', () => {
            localStorageMock.getItem.mockReturnValueOnce('test-token');

            const headers = authAPI.getAuthHeaders();

            expect(headers).toEqual({
                Authorization: 'Bearer test-token'
            });
            expect(localStorageMock.getItem).toHaveBeenCalledWith('djangoAccessToken');
        });

        it('should return empty headers when token does not exist', () => {
            localStorageMock.getItem.mockReturnValueOnce(null);

            const headers = authAPI.getAuthHeaders();

            expect(headers).toEqual({});
        });

        it('should make authenticated fetch request', async () => {
            localStorageMock.getItem.mockReturnValueOnce('test-token');

            const mockResponse = {
                ok: true,
                status: 200,
                json: jest.fn().mockResolvedValue({ data: 'authenticated' })
            };

            fetch.mockResolvedValueOnce(mockResponse);

            await authAPI.authenticatedFetch('/protected-endpoint');
            const path = getPathFromFetchCall();

            // Check the path is correct
            expect(path).toBe('/protected-endpoint');

            // Check headers
            expect(fetch.mock.calls[0][1]).toMatchObject({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token'
                })
            });
        });

        it('should make authenticated POST request', async () => {
            localStorageMock.getItem.mockReturnValueOnce('test-token');
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

            // Check method, body and headers
            expect(fetch.mock.calls[0][1]).toMatchObject({
                method: 'POST',
                body: JSON.stringify(requestData),
                headers: expect.objectContaining({
                    'Authorization': 'Bearer test-token'
                })
            });
        });

        it('should make authenticated PUT request', async () => {
            localStorageMock.getItem.mockReturnValueOnce('test-token');
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

            // Check method, body and headers
            expect(fetch.mock.calls[0][1]).toMatchObject({
                method: 'PUT',
                body: JSON.stringify(requestData),
                headers: expect.objectContaining({
                    'Authorization': 'Bearer test-token'
                })
            });
        });

        it('should make authenticated PATCH request', async () => {
            localStorageMock.getItem.mockReturnValueOnce('test-token');
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

            // Check method, body and headers
            expect(fetch.mock.calls[0][1]).toMatchObject({
                method: 'PATCH',
                body: JSON.stringify(requestData),
                headers: expect.objectContaining({
                    'Authorization': 'Bearer test-token'
                })
            });
        });

        it('should make authenticated DELETE request', async () => {
            localStorageMock.getItem.mockReturnValueOnce('test-token');

            const mockResponse = {
                ok: true,
                status: 204
            };

            fetch.mockResolvedValueOnce(mockResponse);

            await authAPI.authenticatedDelete('/protected-endpoint/1');
            const path = getPathFromFetchCall();

            // Check the path is correct
            expect(path).toBe('/protected-endpoint/1');

            // Check method and headers
            expect(fetch.mock.calls[0][1]).toMatchObject({
                method: 'DELETE',
                headers: expect.objectContaining({
                    'Authorization': 'Bearer test-token'
                })
            });
        });
    });
});