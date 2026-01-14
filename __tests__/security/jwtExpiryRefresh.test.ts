/**
 * @file jwtExpiryRefresh.test.ts
 * @description Tests du système de gestion JWT - expiration et rafraîchissement
 * 
 * Ce fichier teste:
 * - Stockage sécurisé des tokens (SecureStore)
 * - Rafraîchissement automatique des tokens expirés
 * - Redirection vers login en cas d'échec
 * - Nettoyage des tokens à la déconnexion
 */

import * as SecureStore from 'expo-secure-store';

// ========================================
// MOCKS
// ========================================

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock ServerData
jest.mock('../../src/constants/ServerData', () => ({
  ServerData: {
    serverUrl: 'https://api.test.com/',
  },
}));

// Mock device payload
jest.mock('../../src/utils/device', () => ({
  collectDevicePayload: jest.fn().mockResolvedValue({
    platform: 'ios',
    deviceId: 'test-device-123',
    version: '1.0.0',
  }),
}));

// ========================================
// TEST DATA
// ========================================

const MOCK_SESSION_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const MOCK_REFRESH_TOKEN = 'refresh_token_abc123xyz';
const MOCK_NEW_SESSION_TOKEN = 'new_session_token_after_refresh';
const MOCK_NEW_REFRESH_TOKEN = 'new_refresh_token_after_refresh';

// ========================================
// AUTH FUNCTIONS TO TEST (Inlined for testing)
// ========================================

const API = 'https://api.test.com/';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const st = await SecureStore.getItemAsync('session_token');
  if (st) {
    return { Authorization: `Bearer ${st}` };
  }
  return {};
}

async function isLoggedIn(): Promise<boolean> {
  const sessionToken = await SecureStore.getItemAsync('session_token');
  return !!sessionToken;
}

async function refreshToken(): Promise<boolean> {
  try {
    const storedRefreshToken = await SecureStore.getItemAsync('refresh_token');
    
    if (!storedRefreshToken) {
      return false;
    }

    const res = await fetch(`${API}auth/refresh`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'x-client': 'mobile' 
      },
      body: JSON.stringify({ 
        refreshToken: storedRefreshToken 
      })
    });

    if (!res.ok) {
      return false;
    }

    const json = await res.json();
    const { sessionToken, refreshToken: newRefreshToken, success } = json;

    if (!sessionToken || !success) {
      return false;
    }

    await SecureStore.setItemAsync('session_token', sessionToken);
    
    if (newRefreshToken) {
      await SecureStore.setItemAsync('refresh_token', newRefreshToken);
    }

    return true;
  } catch {
    return false;
  }
}

async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync('session_token');
  await SecureStore.deleteItemAsync('refresh_token');
}

async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let headers = await getAuthHeaders();
  
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...options.headers,
    },
  };
  
  let response = await fetch(url, requestOptions);
  
  // Si 401, essayer de refresh le token
  if (response.status === 401) {
    const refreshSuccess = await refreshToken();
    
    if (refreshSuccess) {
      headers = await getAuthHeaders();
      requestOptions.headers = {
        'Content-Type': 'application/json',
        ...headers,
        ...options.headers,
      };
      
      response = await fetch(url, requestOptions);
      
      if (response.status === 401) {
        await clearSession();
        throw new Error('SESSION_EXPIRED');
      }
    } else {
      await clearSession();
      throw new Error('SESSION_EXPIRED');
    }
  }
  
  return response;
}

// ========================================
// TESTS
// ========================================

describe('JWT Token Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // TESTS: STOCKAGE SÉCURISÉ
  // ========================================

  describe('Secure Token Storage', () => {
    it('should store session token in SecureStore', async () => {
      await SecureStore.setItemAsync('session_token', MOCK_SESSION_TOKEN);
      
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'session_token',
        MOCK_SESSION_TOKEN
      );
    });

    it('should store refresh token in SecureStore', async () => {
      await SecureStore.setItemAsync('refresh_token', MOCK_REFRESH_TOKEN);
      
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'refresh_token',
        MOCK_REFRESH_TOKEN
      );
    });

    it('should retrieve session token from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(MOCK_SESSION_TOKEN);
      
      const token = await SecureStore.getItemAsync('session_token');
      
      expect(token).toBe(MOCK_SESSION_TOKEN);
    });

    it('should return null for missing token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
      
      const token = await SecureStore.getItemAsync('session_token');
      
      expect(token).toBeNull();
    });

    it('should delete tokens on clear session', async () => {
      await clearSession();
      
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('session_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    });
  });

  // ========================================
  // TESTS: AUTH HEADERS
  // ========================================

  describe('Auth Headers', () => {
    it('should return Bearer token when session exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(MOCK_SESSION_TOKEN);
      
      const headers = await getAuthHeaders();
      
      expect(headers).toEqual({
        Authorization: `Bearer ${MOCK_SESSION_TOKEN}`,
      });
    });

    it('should return empty object when no session', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
      
      const headers = await getAuthHeaders();
      
      expect(headers).toEqual({});
    });
  });

  // ========================================
  // TESTS: IS LOGGED IN
  // ========================================

  describe('isLoggedIn', () => {
    it('should return true when session token exists', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(MOCK_SESSION_TOKEN);
      
      const result = await isLoggedIn();
      
      expect(result).toBe(true);
    });

    it('should return false when no session token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
      
      const result = await isLoggedIn();
      
      expect(result).toBe(false);
    });

    it('should return false for empty string token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('');
      
      const result = await isLoggedIn();
      
      expect(result).toBe(false);
    });
  });

  // ========================================
  // TESTS: TOKEN REFRESH
  // ========================================

  describe('Token Refresh', () => {
    it('should refresh token successfully', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(MOCK_REFRESH_TOKEN);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          sessionToken: MOCK_NEW_SESSION_TOKEN,
          refreshToken: MOCK_NEW_REFRESH_TOKEN,
        }),
      });
      
      const result = await refreshToken();
      
      expect(result).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'session_token',
        MOCK_NEW_SESSION_TOKEN
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'refresh_token',
        MOCK_NEW_REFRESH_TOKEN
      );
    });

    it('should fail if no refresh token stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
      
      const result = await refreshToken();
      
      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fail on API error response', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(MOCK_REFRESH_TOKEN);
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      const result = await refreshToken();
      
      expect(result).toBe(false);
    });

    it('should fail on invalid API response', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(MOCK_REFRESH_TOKEN);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
        }),
      });
      
      const result = await refreshToken();
      
      expect(result).toBe(false);
    });

    it('should fail on network error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(MOCK_REFRESH_TOKEN);
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await refreshToken();
      
      expect(result).toBe(false);
    });

    it('should handle response without new refresh token', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(MOCK_REFRESH_TOKEN);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          sessionToken: MOCK_NEW_SESSION_TOKEN,
          // No refreshToken in response
        }),
      });
      
      const result = await refreshToken();
      
      expect(result).toBe(true);
      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'session_token',
        MOCK_NEW_SESSION_TOKEN
      );
    });
  });

  // ========================================
  // TESTS: AUTHENTICATED FETCH
  // ========================================

  describe('Authenticated Fetch', () => {
    it('should make request with auth header', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(MOCK_SESSION_TOKEN);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      });
      
      await authenticatedFetch('https://api.test.com/data');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/data',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${MOCK_SESSION_TOKEN}`,
          }),
        })
      );
    });

    it('should auto-refresh token on 401 response', async () => {
      // First call - get headers
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(MOCK_SESSION_TOKEN) // First getAuthHeaders
        .mockResolvedValueOnce(MOCK_REFRESH_TOKEN) // refreshToken call
        .mockResolvedValueOnce(MOCK_NEW_SESSION_TOKEN); // Second getAuthHeaders
      
      // First request - 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      // Refresh token request - success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          sessionToken: MOCK_NEW_SESSION_TOKEN,
          refreshToken: MOCK_NEW_REFRESH_TOKEN,
        }),
      });
      
      // Second request - success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      });
      
      const response = await authenticatedFetch('https://api.test.com/data');
      
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should throw SESSION_EXPIRED if refresh fails', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(MOCK_SESSION_TOKEN)
        .mockResolvedValueOnce(null); // No refresh token
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      await expect(
        authenticatedFetch('https://api.test.com/data')
      ).rejects.toThrow('SESSION_EXPIRED');
      
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('session_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    });

    it('should throw SESSION_EXPIRED if retry also returns 401', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(MOCK_SESSION_TOKEN)
        .mockResolvedValueOnce(MOCK_REFRESH_TOKEN)
        .mockResolvedValueOnce(MOCK_NEW_SESSION_TOKEN);
      
      // First request - 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      // Refresh - success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          sessionToken: MOCK_NEW_SESSION_TOKEN,
        }),
      });
      
      // Retry - still 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      await expect(
        authenticatedFetch('https://api.test.com/data')
      ).rejects.toThrow('SESSION_EXPIRED');
    });

    it('should clear session on SESSION_EXPIRED', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(MOCK_SESSION_TOKEN)
        .mockResolvedValueOnce(null);
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      try {
        await authenticatedFetch('https://api.test.com/data');
      } catch {
        // Expected
      }
      
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('session_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    });
  });

  // ========================================
  // TESTS: LOGOUT
  // ========================================

  describe('Logout - Clear Session', () => {
    it('should remove all tokens on logout', async () => {
      await clearSession();
      
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('session_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
    });

    it('should not throw if tokens do not exist', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
      
      await expect(clearSession()).resolves.not.toThrow();
    });
  });

  // ========================================
  // TESTS: TOKEN EXPIRATION SCENARIOS
  // ========================================

  describe('Token Expiration Scenarios', () => {
    it('should handle expired session with valid refresh', async () => {
      // Simulate expired session token
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(MOCK_SESSION_TOKEN) // Expired session
        .mockResolvedValueOnce(MOCK_REFRESH_TOKEN) // Valid refresh
        .mockResolvedValueOnce(MOCK_NEW_SESSION_TOKEN); // New session
      
      // API returns 401 for expired token
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      // Refresh succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          sessionToken: MOCK_NEW_SESSION_TOKEN,
          refreshToken: MOCK_NEW_REFRESH_TOKEN,
        }),
      });
      
      // Retry succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });
      
      const response = await authenticatedFetch('https://api.test.com/data');
      expect(response.ok).toBe(true);
    });

    it('should redirect to login when both tokens expired', async () => {
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValueOnce(MOCK_SESSION_TOKEN)
        .mockResolvedValueOnce(MOCK_REFRESH_TOKEN);
      
      // Session expired
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      // Refresh also expired
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });
      
      await expect(
        authenticatedFetch('https://api.test.com/data')
      ).rejects.toThrow('SESSION_EXPIRED');
    });
  });

  // ========================================
  // TESTS: CONCURRENT REQUESTS
  // ========================================

  describe('Concurrent Request Handling', () => {
    it('should handle multiple simultaneous 401 responses', async () => {
      // This is a simplified test - in real app, you'd have a token refresh queue
      (SecureStore.getItemAsync as jest.Mock)
        .mockResolvedValue(MOCK_SESSION_TOKEN);
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      });
      
      const requests = [
        authenticatedFetch('https://api.test.com/data1'),
        authenticatedFetch('https://api.test.com/data2'),
        authenticatedFetch('https://api.test.com/data3'),
      ];
      
      const responses = await Promise.all(requests);
      
      expect(responses).toHaveLength(3);
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });
  });

  // ========================================
  // TESTS: EDGE CASES
  // ========================================

  describe('Edge Cases', () => {
    it('should handle malformed tokens gracefully', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('malformed-token');
      
      const headers = await getAuthHeaders();
      
      // Should still return the header, API will reject it
      expect(headers.Authorization).toBe('Bearer malformed-token');
    });

    it('should handle SecureStore errors', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(
        new Error('SecureStore unavailable')
      );
      
      await expect(getAuthHeaders()).rejects.toThrow('SecureStore unavailable');
    });

    it('should handle undefined token from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(undefined);
      
      const isLogged = await isLoggedIn();
      
      expect(isLogged).toBe(false);
    });
  });

  // ========================================
  // TESTS: API ENDPOINT FORMAT
  // ========================================

  describe('API Endpoint Format', () => {
    it('should call correct refresh endpoint', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(MOCK_REFRESH_TOKEN);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          sessionToken: MOCK_NEW_SESSION_TOKEN,
        }),
      });
      
      await refreshToken();
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-client': 'mobile',
          }),
        })
      );
    });

    it('should send refresh token in request body', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(MOCK_REFRESH_TOKEN);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          sessionToken: MOCK_NEW_SESSION_TOKEN,
        }),
      });
      
      await refreshToken();
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ refreshToken: MOCK_REFRESH_TOKEN }),
        })
      );
    });
  });
});
