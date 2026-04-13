/**
 * Stripe Token Utilities
 *
 * FR-based platforms MUST use account tokens and person tokens
 * for all operations on Custom accounts (PSD2 compliance).
 * Tokens must be created CLIENT-SIDE with the publishable key.
 *
 * @see https://docs.stripe.com/connect/account-tokens
 */
import { STRIPE_PUBLISHABLE_KEY } from "../config/environment";

const STRIPE_TOKENS_URL = "https://api.stripe.com/v1/tokens";

/**
 * Flatten a nested object into URLSearchParams format for Stripe API.
 * e.g. { account: { individual: { first_name: "John" } } }
 * → "account[individual][first_name]=John"
 */
function flattenToParams(
  obj: Record<string, any>,
  prefix: string,
  params: URLSearchParams,
): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      flattenToParams(value, fullKey, params);
    } else if (value != null && value !== "") {
      params.append(fullKey, String(value));
    }
  }
}

/**
 * Create an account token for Custom account creation or update.
 * Wraps business_type, tos_acceptance, individual/company data.
 */
export async function createAccountToken(data: {
  business_type?: string;
  tos_acceptance?: { date?: number; service_agreement?: string };
  tos_shown_and_accepted?: boolean;
  individual?: Record<string, any>;
  company?: Record<string, any>;
}): Promise<string> {
  const params = new URLSearchParams();

  flattenToParams({ account: data }, "", params);

  const response = await fetch(STRIPE_TOKENS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: { message: "Token creation failed" } }));
    throw new Error(
      error.error?.message || "Failed to create account token",
    );
  }

  const tokenData = await response.json();
  return tokenData.id;
}

/**
 * Create a person token for creating/updating persons on Custom accounts.
 */
export async function createPersonToken(data: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  dob?: { day?: number; month?: number; year?: number };
  address?: Record<string, any>;
  relationship?: Record<string, any>;
  id_number?: string;
  verification?: {
    document?: { front?: string; back?: string };
    additional_document?: { front?: string; back?: string };
  };
}): Promise<string> {
  const params = new URLSearchParams();

  flattenToParams({ person: data }, "", params);

  const response = await fetch(STRIPE_TOKENS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: { message: "Person token creation failed" } }));
    throw new Error(
      error.error?.message || "Failed to create person token",
    );
  }

  const tokenData = await response.json();
  return tokenData.id;
}
