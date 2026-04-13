// services/session.ts
import * as SecureStore from "expo-secure-store";
import { ServerData } from "../constants/ServerData";
import { clearStripeCache } from "../services/stripeCache";
import { getAuthHeaders, refreshToken as refreshAuthToken } from "./auth";

const API = ServerData.serverUrl;

// Stripe mode: always 'live' (connected accounts are created in live mode)
const STRIPE_MODE = "live";

// Session cache — évite de refaire ensureSession à chaque remontage du Home screen
// Valide 5 minutes ; invalidé par clearLocalSession() (logout)
let sessionCache: {
  authenticated: boolean;
  user: any | null;
  reason: string;
  cachedAt: number;
} | null = null;
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Synchronous check — returns true if the session cache is valid right now.
 * Safe to call during React render (no async, no side-effects).
 */
export function isSessionCached(): boolean {
  return (
    sessionCache !== null &&
    sessionCache.authenticated === true &&
    Date.now() - sessionCache.cachedAt < SESSION_CACHE_TTL
  );
}

// Clean local session (tokens and caches)
export async function clearLocalSession() {
  await SecureStore.deleteItemAsync("session_token");
  await SecureStore.deleteItemAsync("refresh_token");
  await SecureStore.deleteItemAsync("device_id");
  await SecureStore.deleteItemAsync("user_data"); // ✅ FIX: Clear user data too
  clearStripeCache(); // ✅ FIX: Clear Stripe cache to avoid stale account data
  sessionCache = null; // ✅ Invalidate session cache on logout
}

// Ping the /me endpoint to verify the session token
async function fetchMe() {
  const rawHeaders = await getAuthHeaders();
  // Remove undefined values from headers
  let headers: Record<string, string> = {};
  Object.entries(rawHeaders).forEach(([key, value]) => {
    if (typeof value === "string") {
      headers[key] = value;
    }
  });

  // Keep parity with auth endpoints that expect this header
  headers["x-client"] = "mobile";

  // ✅ Add timeout to prevent infinite loading
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

  try {
    const res = await fetch(`${API}auth/me`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Ensure session: tries /me with a session token, if fails tries refresh, else clears session

export async function ensureSession() {
  // Return from cache immediately if session was recently verified (< 5 min)
  if (
    sessionCache &&
    sessionCache.authenticated &&
    Date.now() - sessionCache.cachedAt < SESSION_CACHE_TTL
  ) {
    return {
      authenticated: sessionCache.authenticated,
      user: sessionCache.user,
      reason: sessionCache.reason,
    };
  }

  try {
    // Shared flag: set by sessionCheckPromise as soon as a token is found.
    // Used by the timeout to fail-open (stay authenticated) when a token exists.
    let detectedToken: string | null = null;

    // ✅ Wrap entire session check in timeout to prevent infinite loading
    const sessionCheckPromise = async () => {
      // 1) If possible, get sessionToken and refreshToken from storage
      const [sessionToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync("session_token"),
        SecureStore.getItemAsync("refresh_token"),
      ]);

      detectedToken = sessionToken; // expose for timeout fallback

      // 2) If there is an session token, try /me
      if (sessionToken) {
        let res: Response;
        try {
          res = await fetchMe();
        } catch (fetchError) {
          // Network timeout (AbortError) or connectivity issue — fail-open when token exists
          // Avoids logging out the user on temporary network issues (e.g. during screen transitions)
          return {
            authenticated: true,
            user: { authenticated: true },
            reason: "session_ok" as const,
          };
        }

        if (res.status === 200) {
          // We extract res.json() in a try/catch to avoid breaking if the response is not JSON (should not happen)
          try {
            const data = await res.json();

            // Accept multiple API shapes: {success:true,...} OR {user:{...}} (legacy)
            const isOk =
              !!data &&
              typeof data === "object" &&
              (data.success === true || typeof (data as any).user === "object");

            if (!isOk) {
              throw new Error("Invalid /me response");
            }

            return {
              authenticated: true,
              user: data,
              reason: "session_ok" as const,
            };
          } catch (e) {
            return {
              authenticated: false,
              user: null,
              reason: "invalid_response" as const,
            };
          }
        }
        // else 401: try refresh below
      }

      // 3) If we have a refreshToken, try refresh
      if (refreshToken) {
        try {
          await refreshAuthToken(); // updates session_token (+ possibly refresh_token)
          const res2 = await fetchMe();
          if (res2.ok) {
            const data2 = await res2.json().catch(() => ({}));
            return {
              authenticated: true,
              user: data2,
              reason: "refreshed" as const,
            };
          }
        } catch (e) {
          // refresh ko: chute plus bas
        }
      }

      // 4) Tout a échoué -> on purge la session locale
      await clearLocalSession();

      return {
        authenticated: false,
        user: null,
        reason: "signed_out" as const,
      };
    };

    const timeoutPromise = new Promise<{
      authenticated: boolean;
      user: any | null;
      reason: "timeout";
    }>((resolve) =>
      setTimeout(() => {
        if (detectedToken) {
          // Fail-open: token exists but check timed out — stay authenticated
          // Prevents false sign-out on slow networks or screen transitions
          resolve({
            authenticated: true,
            user: { authenticated: true },
            reason: "timeout" as const,
          });
        } else {
          resolve({
            authenticated: false,
            user: null,
            reason: "timeout" as const,
          });
        }
      }, 8000),
    );

    const result = await Promise.race([sessionCheckPromise(), timeoutPromise]);

    // Update the module-level cache so subsequent calls (on remount) return instantly
    if (result.authenticated) {
      sessionCache = { ...result, cachedAt: Date.now() };
    } else {
      sessionCache = null;
    }

    return result;
  } catch (error) {
    console.error("❌ [Session] ensureSession error:", error);
    await clearLocalSession();
    return { authenticated: false, user: null, reason: "error" as const };
  }
}

/**
 * Fetch wrapper that handles authentication, token refresh, and retries once if a 401 is encountered.
 * @param input - The resource to fetch.
 * @param init - An object containing any custom settings that apply to the request.
 * @returns A Promise that resolves to the Response to that request.
 * If the request fails due to authentication, it will attempt to refresh the token and retry once.
 */

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  // Convert input to string if it's a URL
  const fetchInput: RequestInfo =
    input instanceof URL ? input.toString() : input;

  // Merge headers and ensure all values are strings and defined
  const rawHeaders = {
    ...(init.headers || {}),
    ...(await getAuthHeaders()),
    "X-Stripe-Mode": STRIPE_MODE,
  };
  const headers: Record<string, string> = {};
  Object.entries(rawHeaders).forEach(([key, value]) => {
    if (typeof value === "string") {
      headers[key] = value;
    }
  });

  let res = await fetch(fetchInput, { ...init, headers });

  if (res.status !== 401) return res;

  // 401 Unauthorized - try to refresh the token
  try {
    await refreshAuthToken();
  } catch (e) {
    // refresh failed
    await clearLocalSession();
    return res;
  }

  // Retry the request with the new token
  const newHeaders = { ...(init.headers || {}), ...(await getAuthHeaders()) };
  return fetch(input, { ...init, headers: newHeaders });
}
