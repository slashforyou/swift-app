/**
 * ABN Lookup Service
 *
 * Proxy vers l'API ABR (Australian Business Register)
 * via notre backend pour auto-complétion ABN.
 */

import { ServerData } from "../constants/ServerData";
import { fetchWithAuth } from "../utils/session";

const API = ServerData.serverUrl;

export interface AbnLookupResult {
  abn: string;
  abn_status: string;
  acn: string;
  entity_name: string;
  entity_type_code: string;
  entity_type_name: string;
  business_names: string[];
  gst_registered: boolean;
  gst_effective_from: string | null;
  address_state: string;
  address_postcode: string;
}

export interface AbnSearchResult {
  abn: string;
  abn_status: string;
  name: string;
  name_type: string;
  state: string;
  postcode: string;
}

/**
 * Look up a specific ABN — returns full business details.
 */
export async function lookupAbn(abn: string): Promise<AbnLookupResult> {
  const cleaned = abn.replace(/\s/g, "");
  const response = await fetchWithAuth(
    `${API}v1/companies/abn-lookup?abn=${encodeURIComponent(cleaned)}`,
    { method: "GET" },
  );

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error || "ABN lookup failed");
  }
  return json.data;
}

/**
 * Search businesses by name — returns list of matching ABNs.
 */
export async function searchAbn(
  name: string,
  maxResults = 10,
): Promise<AbnSearchResult[]> {
  const response = await fetchWithAuth(
    `${API}v1/companies/abn-search?name=${encodeURIComponent(name)}&maxResults=${maxResults}`,
    { method: "GET" },
  );

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error || "ABN search failed");
  }
  return json.data;
}
