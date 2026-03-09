// src/services/stripeCache.ts
// Small in-memory cache for Stripe company context.
// Kept separate to avoid require cycles between StripeService <-> session.

let cachedCompanyId: string | null = null;
let inFlightCompanyIdPromise: Promise<string> | null = null;

export function getCachedCompanyId(): string | null {
  return cachedCompanyId;
}

export function setCachedCompanyId(companyId: string | null) {
  cachedCompanyId = companyId;
}

export function getInFlightCompanyIdPromise(): Promise<string> | null {
  return inFlightCompanyIdPromise;
}

export function setInFlightCompanyIdPromise(promise: Promise<string> | null) {
  inFlightCompanyIdPromise = promise;
}

export function clearStripeCache() {
  cachedCompanyId = null;
  inFlightCompanyIdPromise = null;
}
