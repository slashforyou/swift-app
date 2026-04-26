/**
 * referral.ts — Service pour le parrainage (referral)
 * Endpoints:
 *   GET  /v1/company/:companyId/referral-code
 *   GET  /v1/company/:companyId/referrals
 *   POST /v1/referral/use
 */
import { ServerData } from "../constants/ServerData";
import { authenticatedFetch } from "../utils/auth";

const API = ServerData.serverUrl;

export interface ReferralCodeResponse {
  success: boolean;
  referral_code: string;
  share_text: string;
}

export interface ReferredCompany {
  company_name: string;
  joined_at: string;
  reward_granted: boolean;
}

export interface ReferralsResponse {
  success: boolean;
  referrals: ReferredCompany[];
  total_referrals: number;
  total_rewards: number;
}

export async function getReferralCode(
  companyId: number | string,
): Promise<ReferralCodeResponse> {
  const res = await authenticatedFetch(
    `${API}v1/company/${companyId}/referral-code`,
    { method: "GET" },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function listReferrals(
  companyId: number | string,
): Promise<ReferralsResponse> {
  const res = await authenticatedFetch(
    `${API}v1/company/${companyId}/referrals`,
    { method: "GET" },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function useReferralCode(
  code: string,
  companyId: number | string,
): Promise<{ success: boolean; message: string }> {
  const res = await authenticatedFetch(`${API}v1/referral/use`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, company_id: companyId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
