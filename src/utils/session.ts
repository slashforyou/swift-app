// services/session.ts
import * as SecureStore from "expo-secure-store";
import { refreshToken as refreshAuthToken, getAuthHeaders, clearSession } from "./auth";
import { ServerData } from "../constants/ServerData";

const API = ServerData.serverUrl;

// Clean local session (tokens)
export async function clearLocalSession() {
  await SecureStore.deleteItemAsync("session_token");
  await SecureStore.deleteItemAsync("refresh_token");
  await SecureStore.deleteItemAsync("device_id");
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
  const res = await fetch(`${API}auth/me`, { headers });
  return res;
}

// Ensure session: tries /me with a session token, if fails tries refresh, else clears session

export async function ensureSession() {

  // 1) If possible, get sessionToken, deviceId and refreshToken from storage
  const [sessionToken, deviceId, refreshToken] = await Promise.all([
    SecureStore.getItemAsync("session_token"),
    SecureStore.getItemAsync("device_id"),
    SecureStore.getItemAsync("refresh_token"),
  ]);

  // 2) If there is an session token, try /me
  if (sessionToken) {
    const res = await fetchMe();

    if (res.status === 200) {
        // We extract res.json() in a try/catch to avoid breaking if the response is not JSON (should not happen)
        try {
          const data = await res.json();
          if(!data || typeof data !== 'object' || !data.success) {
            throw new Error("Invalid /me response");
          }

          return { authenticated: true, user: data, reason: "session_ok" as const };
        } catch {
          return { authenticated: false, user: null, reason: "invalid_response" as const };
        }
    }
    // else 401: try refresh below
  }

  // 3) If we have deviceId + refreshToken, try refresh
  if (deviceId && refreshToken) {
    try {
      await refreshAuthToken(); // updates session_token (+ possibly refresh_token)
      const res2 = await fetchMe();
      if (res2.ok) {
        const data2 = await res2.json().catch(() => ({}));
        return { authenticated: true, user: data2, reason: "refreshed" as const };
      }
    } catch (e) {
      // refresh ko: chute plus bas
    }
  }

  // 4) Tout a échoué -> on purge la session locale
  await clearLocalSession();

  return { authenticated: false, user: null, reason: "signed_out" as const };
}

/**
 * Fetch wrapper that handles authentication, token refresh, and retries once if a 401 is encountered.
 * @param input - The resource to fetch.
 * @param init - An object containing any custom settings that apply to the request.
 * @returns A Promise that resolves to the Response to that request.
 * If the request fails due to authentication, it will attempt to refresh the token and retry once.
 */

export async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  // Convert input to string if it's a URL
  const fetchInput: RequestInfo = input instanceof URL ? input.toString() : input;

  // Merge headers and ensure all values are strings and defined
  const rawHeaders = { ...(init.headers || {}), ...(await getAuthHeaders()) };
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
  } catch {
    // refresh failed
    await clearLocalSession();
    return res;
  }

  // Retry the request with the new token
  const newHeaders = { ...(init.headers || {}), ...(await getAuthHeaders()) };
  return fetch(input, { ...init, headers: newHeaders });
}
