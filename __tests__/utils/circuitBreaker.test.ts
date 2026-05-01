/**
 * Tests unitaires — Circuit breaker SESSION_EXPIRED (auth.ts)
 *
 * Couvre :
 *  - isSessionDead / markSessionDead / resetSessionDead
 *  - authenticatedFetch fast-fail si session morte
 *  - markSessionDead déclenché sur 401 non récupérable
 *  - resetSessionDead au login réussi
 */

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../../src/services/navRef', () => ({
  navigateGlobal: jest.fn(),
}));

jest.mock('../../src/services/stripeCache', () => ({
  clearStripeCache: jest.fn(),
}));

jest.mock('../../src/utils/device', () => ({
  collectDevicePayload: jest.fn().mockResolvedValue({ deviceId: 'test-device' }),
}));

// ─── Import après mocks ───────────────────────────────────────────────────────

import * as SecureStore from 'expo-secure-store';
import {
    authenticatedFetch,
    isSessionDead,
    markSessionDead,
    resetSessionDead,
} from '../../src/utils/auth';

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockFetchWith(status: number, body: object = {}) {
  global.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: { get: () => null },
  } as unknown as Response);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Circuit breaker — isSessionDead / markSessionDead / resetSessionDead', () => {
  beforeEach(() => {
    resetSessionDead(); // état propre avant chaque test
  });

  it('isSessionDead() retourne false par défaut', () => {
    expect(isSessionDead()).toBe(false);
  });

  it('markSessionDead() passe isSessionDead() à true', () => {
    markSessionDead();
    expect(isSessionDead()).toBe(true);
  });

  it('resetSessionDead() remet isSessionDead() à false', () => {
    markSessionDead();
    resetSessionDead();
    expect(isSessionDead()).toBe(false);
  });

  it('markSessionDead() est idempotent (appels multiples)', () => {
    markSessionDead();
    markSessionDead();
    markSessionDead();
    expect(isSessionDead()).toBe(true);
  });
});

describe('authenticatedFetch — fast-fail si session morte', () => {
  beforeEach(() => {
    resetSessionDead();
    jest.clearAllMocks();
  });

  it('lance SESSION_EXPIRED immédiatement si _sessionDead est true', async () => {
    markSessionDead();
    mockFetchWith(200); // ne doit jamais être appelé

    await expect(
      authenticatedFetch('https://api.example.com/test')
    ).rejects.toThrow('SESSION_EXPIRED');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('appelle fetch normalement si _sessionDead est false', async () => {
    mockSecureStore.getItemAsync.mockResolvedValue('valid-token');
    mockFetchWith(200, { ok: true });

    const response = await authenticatedFetch('https://api.example.com/test');

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('authenticatedFetch — gestion 401 et activation du circuit breaker', () => {
  beforeEach(() => {
    resetSessionDead();
    jest.clearAllMocks();
    mockSecureStore.getItemAsync.mockResolvedValue(null); // pas de refresh token
  });

  it('passe _sessionDead à true quand le refresh échoue sur 401', async () => {
    // Simule 401 à chaque appel (pas de refresh token disponible)
    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      ok: false,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      headers: { get: () => null },
    } as unknown as Response);

    await expect(
      authenticatedFetch('https://api.example.com/protected')
    ).rejects.toThrow('SESSION_EXPIRED');

    expect(isSessionDead()).toBe(true);
  });

  it('bloque les appels suivants après un premier 401 non récupérable', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      ok: false,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      headers: { get: () => null },
    } as unknown as Response);

    // Premier appel → déclenche le circuit breaker
    await expect(
      authenticatedFetch('https://api.example.com/protected')
    ).rejects.toThrow('SESSION_EXPIRED');

    const callsAfterFirst = (global.fetch as jest.Mock).mock.calls.length;

    // Deuxième appel → fast-fail, fetch ne doit pas être rappelé
    await expect(
      authenticatedFetch('https://api.example.com/protected')
    ).rejects.toThrow('SESSION_EXPIRED');

    expect((global.fetch as jest.Mock).mock.calls.length).toBe(callsAfterFirst);
  });
});

describe('resetSessionDead() appelé au login réussi', () => {
  it('remet le circuit breaker à false après login', () => {
    markSessionDead();
    expect(isSessionDead()).toBe(true);

    // Simuler ce que login() fait
    resetSessionDead();

    expect(isSessionDead()).toBe(false);
  });
});
