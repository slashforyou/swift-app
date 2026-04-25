/**
 * usersLookup service
 * Calls POST /v1/users/lookup-by-phones to identify which phone numbers
 * from the device's address book belong to existing Cobbr users.
 *
 * The endpoint returns only matches — unknown numbers are not echoed back,
 * so the device contact book is never enumerated server-side.
 */
import { API_URL } from "../config/environment";
import { getAuthHeaders } from "../utils/auth";

const API_BASE_URL = `${API_URL}v1`;

export interface CobbrUserMatch {
  phone: string; // original phone string from the input
  user: {
    id: number | string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

export interface LookupResponse {
  success: boolean;
  matches: CobbrUserMatch[];
  error?: string;
}

/**
 * Look up which phone numbers correspond to existing Cobbr users.
 * Phones are sent as-is (the server normalizes them).
 *
 * Hard-capped at 500 entries per call — caller should batch larger lists.
 */
export async function lookupUsersByPhones(
  phones: string[],
): Promise<CobbrUserMatch[]> {
  if (!phones || phones.length === 0) return [];

  // Dedupe locally to keep the payload small.
  const unique = Array.from(new Set(phones.filter(Boolean)));
  const batchSize = 500;
  const allMatches: CobbrUserMatch[] = [];

  try {
    const headers = await getAuthHeaders();
    for (let i = 0; i < unique.length; i += batchSize) {
      const batch = unique.slice(i, i + batchSize);
      const res = await fetch(`${API_BASE_URL}/users/lookup-by-phones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ phones: batch }),
      });
      if (!res.ok) {
        // Endpoint not yet deployed → silently degrade (return what we have).
        if (res.status === 404) return allMatches;
        continue;
      }
      const data: LookupResponse = await res.json();
      if (data?.success && Array.isArray(data.matches)) {
        allMatches.push(...data.matches);
      }
    }
  } catch {
    // Network error → degrade gracefully (no Cobbr badges, search still works).
    return allMatches;
  }

  return allMatches;
}
