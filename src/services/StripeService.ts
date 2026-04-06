/**
 * StripeService - Service API pour Stripe Connect
 * Version simplifiée pour tester avec Company ID 1
 */
import * as SecureStore from "expo-secure-store";
import { ServerData } from "../constants/ServerData";
import { safeLogError } from "../utils/logUtils";
import { fetchWithAuth } from "../utils/session";
import {
    clearStripeCache as clearStripeCacheInternal,
    getCachedCompanyId,
    getInFlightCompanyIdPromise,
    setCachedCompanyId,
    setInFlightCompanyIdPromise,
} from "./stripeCache";
import { fetchUserProfile } from "./user";

/**
 * Efface le cache local Stripe (à appeler lors du logout)
 * ✅ FIX: Recommandation backend pour éviter les données obsolètes
 */
export const clearStripeCache = () => {
  clearStripeCacheInternal();
};

/**
 * Helper pour récupérer le company_id de l'utilisateur connecté
 * ✅ CORRIGÉ: Utilise company_id depuis le profil API OU SecureStore (fallback)
 */
const getUserCompanyId = async (): Promise<string> => {
  // ✅ Fast path: avoid hammering /v1/user/profile on every Stripe call
  const cachedCompanyId = getCachedCompanyId();
  if (cachedCompanyId) {
    return cachedCompanyId;
  }

  // ✅ Coalesce concurrent callers (StripeHub triggers multiple requests at once)
  const inFlight = getInFlightCompanyIdPromise();
  if (inFlight) {
    return inFlight;
  }

  const inFlightCompanyIdPromise = (async () => {
    try {
      const profile = await fetchUserProfile();
      const userId = profile.id.toString();

      // ✅ PRIORITÉ 1: Utiliser company_id depuis le profil API (v1.1.0+)
      if (profile.company_id) {
        const companyId = profile.company_id.toString();
        setCachedCompanyId(companyId);
        return companyId;
      }

      // ✅ FALLBACK 1: Essayer de récupérer depuis SecureStore (cache local)
      try {
        // ✅ Essayer d'abord avec "user_data" (avec underscore - format utilisé par useBusinessInfo)
        let userDataStr = await SecureStore.getItemAsync("user_data");

        // Fallback: essayer "userData" (sans underscore)
        if (!userDataStr) {
          userDataStr = await SecureStore.getItemAsync("userData");
        }

        if (userDataStr) {
          const userData = JSON.parse(userDataStr);

          if (userData.company_id) {
            const companyId = userData.company_id.toString();
            setCachedCompanyId(companyId);
            return companyId;
          }
        } else {
          // No userData in SecureStore
        }
      } catch (storeError) {
        // Non-critical: SecureStore read may fail, will throw below
      }

      // ❌ Ne pas fallback sur user_id: cela cible potentiellement la mauvaise company
      console.error(
        "❌ [COMPANY ID] Missing company_id in API profile and SecureStore. Aborting Stripe request.",
        { userId },
      );
      throw new Error(
        "Company ID is missing. Please re-login to refresh your company context.",
      );
    } catch (error) {
      console.error("❌ [COMPANY ID] Failed to get company_id:", error);
      throw new Error(
        "Unable to get user company_id. Please ensure you are logged in.",
      );
    }
  })().finally(() => {
    setInFlightCompanyIdPromise(null);
  });

  setInFlightCompanyIdPromise(inFlightCompanyIdPromise);
  return inFlightCompanyIdPromise;
};

/**
 * Vérifie le statut de connexion Stripe pour l'utilisateur
 * Utilise l'endpoint backend confirmé : GET /v1/stripe/connect/status
 */
export const checkStripeConnectionStatus = async (): Promise<{
  isConnected: boolean;
  status: "not_connected" | "incomplete" | "active" | "restricted" | "pending";
  account?: any;
  details?: string;
}> => {
  try {
    const companyId = await getUserCompanyId();

    // Essayer d'abord l'endpoint connect/status
    try {
      const statusUrl = `${ServerData.serverUrl}v1/stripe/connect/status?company_id=${companyId}`;
      const response = await fetchWithAuth(statusUrl, { method: "GET" });

      if (response.ok) {
        const data = await response.json();
        const result = analyzeStripeConnectionResponse(data);
        if (result.status !== "not_connected") {
          return result;
        }
      }
    } catch {
      // Fallback to account endpoint below
    }

    // Fallback: utiliser l'endpoint company account qui est plus fiable
    try {
      const accountUrl = `${ServerData.serverUrl}v1/stripe/company/${companyId}/account`;
      const response = await fetchWithAuth(accountUrl, { method: "GET" });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stripe) {
          const chargesEnabled = data.stripe.charges_enabled === true;
          const payoutsEnabled = data.stripe.payouts_enabled === true;
          const detailsSubmitted = data.stripe.details_submitted === true;
          const accountId = data.stripe.account_id || data.stripe.stripe_account_id;

          if (!accountId) {
            return { isConnected: false, status: "not_connected", details: "No Stripe account ID" };
          }

          if (chargesEnabled && payoutsEnabled && detailsSubmitted) {
            return { isConnected: true, status: "active", account: data, details: "Account is fully operational" };
          }

          if (chargesEnabled && detailsSubmitted) {
            return { isConnected: true, status: "active", account: data, details: "Charges enabled" };
          }

          return { isConnected: true, status: "incomplete", account: data, details: "Onboarding not completed" };
        }
      }
    } catch {
      // Both endpoints failed
    }

    return {
      isConnected: false,
      status: "not_connected",
      details: "Could not reach Stripe API",
    };
  } catch (error) {
    return {
      isConnected: false,
      status: "not_connected",
      details: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

/**
 * Crée un compte Stripe Connect Express pour un utilisateur sur notre plateforme
 * Utilise l'endpoint backend confirmé: POST /v1/stripe/connect/create
 */
export const createStripeConnectAccount = async (): Promise<{
  accountId: string;
  onboardingUrl: string;
}> => {
  try {
    const companyId = await getUserCompanyId();

    const createUrl = `${ServerData.serverUrl}v1/stripe/connect/create`;

    // Appel du vrai endpoint POST du serveur avec company_id dans le body
    const response = await fetchWithAuth(createUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company_id: companyId,
      }),
    });

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error("Compte Stripe déjà existant pour cette entreprise");
      }
      const errorText = await response.text().catch(() => "No error text");
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.data?.stripe_account_id) {
      throw new Error("API returned invalid account data");
    }

    return {
      accountId: data.data.stripe_account_id,
      onboardingUrl: data.data.onboarding_url,
    };
  } catch (error) {
    // Si c'est un compte existant, essayer de récupérer le lien d'onboarding
    if (error instanceof Error && error.message.includes("déjà existant")) {
      try {
        const onboardingUrl = await getStripeConnectOnboardingLink();
        return {
          accountId: "existing_account",
          onboardingUrl: onboardingUrl,
        };
      } catch (onboardingError) {
        // Fallback: continues to create new account
      }
    }

    // Re-throw the error - no mock data
    throw error;
  }
};

/**
 * Récupère ou régénère un lien d'onboarding Stripe Connect
 * Utilise l'endpoint backend confirmé: GET /v1/stripe/connect/onboarding
 */
export const getStripeConnectOnboardingLink = async (): Promise<string> => {
  try {
    const companyId = await getUserCompanyId();

    const onboardingUrl = `${ServerData.serverUrl}v1/stripe/connect/onboarding?company_id=${companyId}`;

    const response = await fetchWithAuth(onboardingUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.data?.onboarding_url) {
      throw new Error("API returned invalid onboarding link data");
    }

    return data.data.onboarding_url;
  } catch (error) {
    // Re-throw the error - no mock URLs
    throw error;
  }
};

/**
 * Régénère un lien d'onboarding Stripe Connect
 * Utilise l'endpoint backend confirmé: POST /v1/stripe/connect/refresh-onboarding
 */
export const refreshStripeConnectOnboardingLink = async (): Promise<string> => {
  try {
    const companyId = await getUserCompanyId();

    const refreshUrl = `${ServerData.serverUrl}v1/stripe/connect/refresh-onboarding`;
    const response = await fetchWithAuth(refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ company_id: companyId }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      throw new Error(`HTTP error! status: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const onboardingUrl =
      data.data?.onboarding_url ||
      data.data?.url ||
      data.url ||
      data.onboarding_url;

    if (!data.success || !onboardingUrl) {
      throw new Error("API returned invalid onboarding link data");
    }

    return onboardingUrl;
  } catch (error) {
    throw error;
  }
};

/**
 * Analyse la réponse d'un endpoint Stripe pour déterminer le statut de connexion
 */
const analyzeStripeConnectionResponse = (
  data: any,
): {
  isConnected: boolean;
  status: "not_connected" | "incomplete" | "active" | "restricted" | "pending";
  account?: any;
  details?: string;
} => {
  // Analyse silencieuse pour éviter tout crash

  // CORRIGÉ: Chercher dans data.data.stripe_account_id car c'est la structure réelle de la réponse
  const accountId =
    data.data?.stripe_account_id ||
    data.stripe_account_id ||
    data.account?.id ||
    data.id;

  if (!accountId || accountId === "" || accountId === "null") {
    return {
      isConnected: false,
      status: "not_connected",
      details: "No Stripe account ID",
    };
  }

  // CORRIGÉ: Chercher dans data.data aussi pour les autres propriétés
  const detailsSubmitted =
    data.data?.details_submitted ??
    data.details_submitted ??
    data.account?.details_submitted ??
    false;
  const chargesEnabled =
    data.data?.charges_enabled ??
    data.charges_enabled ??
    data.account?.charges_enabled ??
    false;
  const payoutsEnabled =
    data.data?.payouts_enabled ??
    data.payouts_enabled ??
    data.account?.payouts_enabled ??
    false;

  // Vérifier les blocages - aussi dans data.data
  const requirements =
    data.data?.requirements ??
    data.requirements ??
    data.account?.requirements ??
    {};
  const currentlyDue = requirements.currently_due ?? [];
  const pastDue = requirements.past_due ?? [];
  const disabledReason = requirements.disabled_reason;

  // Déterminer le statut
  if (disabledReason) {
    return {
      isConnected: true,
      status: "restricted",
      account: data,
      details: `Account restricted: ${disabledReason}`,
    };
  }

  if (pastDue.length > 0) {
    return {
      isConnected: true,
      status: "restricted",
      account: data,
      details: `Past due requirements: ${pastDue.join(", ")}`,
    };
  }

  if (!detailsSubmitted || !chargesEnabled) {
    // Only require charges_enabled and details_submitted for "active"
    // payouts_enabled is not required — account can still accept payments
    return {
      isConnected: true,
      status: "incomplete",
      account: data,
      details: "Onboarding not completed",
    };
  }

  if (currentlyDue.length > 0) {
    return {
      isConnected: true,
      status: "pending",
      account: data,
      details: `Pending requirements: ${currentlyDue.join(", ")}`,
    };
  }

  // Tout semble bon !
  return {
    isConnected: true,
    status: "active",
    account: data,
    details: "Account is fully operational",
  };
};

// Fonctions export par défaut (pour éviter les erreurs d'import)
export const fetchStripePayments = async () => {
  try {
    const companyId = await getUserCompanyId();

    // Essayer l'endpoint payments dédié - pattern: /v1/stripe/company/{id}/payments
    const paymentsUrl = `${ServerData.serverUrl}v1/stripe/company/${companyId}/payments`;

    const response = await fetchWithAuth(paymentsUrl, {
      method: "GET",
    });

    if (response.ok) {
      const data = await response.json();

      // Backend retourne: { success: true, payments: [...] }
      // Pas { success: true, data: [...] }
      if (data.success && (data.payments || data.data)) {
        const paymentsArray = data.payments || data.data;
        const payments = paymentsArray.map((payment: any) => ({
          id: payment.id || payment.stripe_payment_id,
          date: payment.created || payment.date || new Date().toISOString(),
          amount: payment.amount_received || payment.amount || 0,
          currency: payment.currency || "AUD",
          status: payment.status || "succeeded",
          description: payment.description || "Payment",
          customer: payment.customer_name || payment.customer || "Customer",
          method: payment.payment_method || "card",
          receipt_url:
            payment.receipt_url ||
            payment.charges?.data?.[0]?.receipt_url ||
            null,
        }));

        return payments;
      }
    } else {
      const errorText = await response.text();
    }

    throw new Error("Unable to fetch payments from API");
  } catch (error: any) {
    safeLogError("❌ [FETCH PAYMENTS] Error:", error);
    return [];
  }
};

export const fetchStripePayouts = async () => {
  try {
    const companyId = await getUserCompanyId();

    // Essayer l'endpoint payouts dédié
    const payoutsUrl = `${ServerData.serverUrl}v1/stripe/payouts?company_id=${companyId}`;

    const response = await fetchWithAuth(payoutsUrl, {
      method: "GET",
    });

    if (response.ok) {
      const data = await response.json();

      if (data.success && data.data) {
        const payoutsList = data.data.payouts || data.data || [];

        const payouts = Array.isArray(payoutsList)
          ? payoutsList.map((payout: any) => ({
              id: payout.id || payout.stripe_payout_id,
              date: payout.created || payout.date || new Date().toISOString(),
              amount: payout.amount || 0,
              currency: payout.currency || "AUD",
              status: payout.status || "paid",
              description: payout.description || "Payout",
              arrivalDate:
                payout.arrival_date ||
                new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              method: payout.method || "standard",
              type: payout.type || "bank_account",
            }))
          : [];

        return payouts;
      }
    } else {
    }

    throw new Error("Unable to fetch payouts from API");
  } catch (error: any) {
    safeLogError("❌ [FETCH PAYOUTS] Error fetching real payouts:", error);
    // Retourner des données vides en cas d'erreur
    return [];
  }
};

export const fetchStripeAccount = async () => {
  try {
    const companyId = await getUserCompanyId();

    let statusData: any = null;
    try {
      const statusUrl = `${ServerData.serverUrl}v1/stripe/connect/status?company_id=${companyId}`;
      const statusResponse = await fetchWithAuth(statusUrl, { method: "GET" });
      if (statusResponse.ok) {
        const statusJson = await statusResponse.json();
        statusData = statusJson?.data || statusJson;
      }
    } catch (statusError) {
      // Non-critical: optional pre-fetch, main call follows
    }

    // ✅ NOUVEAU: Utiliser l'endpoint spécifique company/{id}/account
    const accountUrl = `${ServerData.serverUrl}v1/stripe/company/${companyId}/account`;

    const response = await fetchWithAuth(accountUrl, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch account: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("Invalid account data from API");
    }

    // Si pas de compte Stripe lié, retourner null
    if (!data.stripe) {
      return null;
    }

    // ✅ Transformer les données du NOUVEAU format API
    const requirements = statusData?.requirements ||
      data.stripe.requirements || {
        currently_due: [],
        eventually_due: [],
        past_due: [],
        disabled_reason: null,
      };

    const chargesEnabled =
      statusData?.charges_enabled ?? data.stripe.charges_enabled;
    const payoutsEnabled =
      statusData?.payouts_enabled ?? data.stripe.payouts_enabled;
    const detailsSubmitted =
      statusData?.details_submitted ?? data.stripe.details_submitted;
    const onboardingCompleted =
      statusData?.onboarding_completed ?? (detailsSubmitted && chargesEnabled);

    const accountData = {
      stripe_account_id:
        statusData?.stripe_account_id || data.stripe.account_id,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      details_submitted: detailsSubmitted,
      onboarding_completed: onboardingCompleted,
      business_name: data.company.name,
      support_email: data.stripe.email || data.company.email,
      country: data.stripe.country || "AU",
      default_currency: data.stripe.currency || "AUD",
      bank_accounts: (
        data.stripe.external_accounts?.data ||
        data.stripe.bank_accounts ||
        []
      )
        .filter(
          (acct: any) =>
            acct.object === "bank_account" ||
            acct.type === "bank_account" ||
            acct.bank_name,
        )
        .map((acct: any) => ({
          id: acct.id,
          bank_name: acct.bank_name || "Bank",
          last4: acct.last4,
          currency: acct.currency,
        })),
      requirements: {
        currently_due: requirements.currently_due || [],
        eventually_due: requirements.eventually_due || [],
        past_due: requirements.past_due || [],
        disabled_reason:
          requirements.disabled_reason ||
          (!chargesEnabled ? "pending_verification" : null),
      },
      capabilities: statusData?.capabilities ||
        data.stripe.capabilities || {
          card_payments: chargesEnabled ? "active" : "pending",
          transfers: payoutsEnabled ? "active" : "pending",
        },
    };

    return accountData;
  } catch (error: any) {
    console.error(
      "❌ [FETCH ACCOUNT] Error fetching real account data:",
      error,
    );
    // ✅ FIX: Retourner null au lieu de données mock obsolètes
    // Le frontend doit gérer le cas où account === null (= pas de compte Stripe)
    // Vérifier si c'est une erreur "pas de compte" vs erreur réseau
    const errorMessage = error?.message?.toLowerCase() || "";
    const isNoAccountError =
      errorMessage.includes("404") ||
      errorMessage.includes("no active") ||
      errorMessage.includes("not found") ||
      errorMessage.includes("has_stripe_account");

    if (isNoAccountError) {
    } else {
    }
    return null;
  }
};

export const fetchStripeBalance = async () => {
  try {
    const companyId = await getUserCompanyId();

    // Essayer l'endpoint balance dédié
    const balanceUrl = `${ServerData.serverUrl}v1/stripe/balance?company_id=${companyId}`;

    const response = await fetchWithAuth(balanceUrl, {
      method: "GET",
    });

    if (response.ok) {
      const data = await response.json();

      if (data.success && data.data) {
        const balanceData = {
          available: data.data.available?.amount || 0,
          pending: data.data.pending?.amount || 0,
        };
        return balanceData;
      }
    } else {
    }

    // Si l'endpoint balance n'existe pas, essayer de récupérer depuis l'endpoint status

    const statusUrl = `${ServerData.serverUrl}v1/stripe/connect/status?company_id=${companyId}`;
    const statusResponse = await fetchWithAuth(statusUrl, {
      method: "GET",
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();

      if (statusData.success && statusData.data) {
        const balance = statusData.data.balance || { available: 0, pending: 0 };
        return balance;
      }
    }

    throw new Error("Unable to fetch balance from any endpoint");
  } catch (error) {
    console.error("❌ [FETCH BALANCE] Error fetching real balance:", error);
    // Fallback vers données mock avec valeurs réalistes
    const fallbackBalance = { available: 0, pending: 0 };
    return fallbackBalance;
  }
};

/**
 * ✅ NOUVEAU: Récupère tous les comptes Stripe liés aux companies
 * Endpoint: GET /v1/stripe/company-accounts
 * Utilisé par: Admins pour voir tous les comptes, Users pour voir leur company
 */
export const fetchAllCompanyStripeAccounts = async () => {
  try {
    const accountsUrl = `${ServerData.serverUrl}v1/stripe/company-accounts`;

    const response = await fetchWithAuth(accountsUrl, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("Invalid accounts data from API");
    }

    return {
      summary: data.summary,
      accounts: data.accounts || [],
    };
  } catch (error) {
    console.error("❌ [FETCH ALL ACCOUNTS] Error fetching accounts:", error);
    // Retourner structure vide en cas d'erreur
    return {
      summary: {
        total_companies: 0,
        connected: 0,
        active: 0,
        pending: 0,
        not_connected: 0,
      },
      accounts: [],
    };
  }
};

/**
 * Crée un compte Stripe Connect et retourne le lien d'onboarding
 * ✅ AMÉLIORÉ: Vérifie si un compte existe avant de créer
 */
export const createStripeConnectAccountAndLink = async (): Promise<{
  url: string;
  isExisting: boolean;
  accountId?: string;
}> => {
  try {
    // ✅ ÉTAPE 1: Vérifier si un compte existe déjà
    const existingAccount = await fetchStripeAccount();

    if (existingAccount && existingAccount.stripe_account_id) {
      // Compte existe, récupérer le lien d'onboarding
      const onboardingUrl = await getStripeConnectOnboardingLink();

      return {
        url: onboardingUrl,
        isExisting: true,
        accountId: existingAccount.stripe_account_id,
      };
    }

    // ✅ ÉTAPE 2: Pas de compte, en créer un nouveau
    const result = await createStripeConnectAccount();

    return {
      url: result.onboardingUrl,
      isExisting: false,
      accountId: result.accountId,
    };
  } catch (error) {
    console.error("❌ [CREATE & LINK] Erreur:", error);

    // ✅ FALLBACK: En cas d'erreur, essayer de récupérer le lien d'onboarding
    try {
      const onboardingUrl = await getStripeConnectOnboardingLink();

      return {
        url: onboardingUrl,
        isExisting: true,
      };
    } catch (onboardingError) {
      console.error("❌ [CREATE & LINK] Fallback échoué:", onboardingError);
      throw onboardingError;
    }
  }
};

// Fonctions additionnelles utilisées par les hooks
export const createInstantPayout = async (amount: number): Promise<string> => {
  try {
    // ✅ Utiliser l'endpoint réel POST /stripe/payouts/create
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/payouts/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Stripe utilise les centimes
          currency: "aud",
          method: "instant", // Payout instantané
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "❌ [CREATE PAYOUT] API error:",
        response.status,
        errorData,
      );
      throw new Error(
        errorData.message || `HTTP ${response.status}: Failed to create payout`,
      );
    }

    const data = await response.json();

    // Retourner l'ID du payout
    return data.data?.id || data.id || `po_${Date.now()}`;
  } catch (error) {
    console.error("❌ [CREATE PAYOUT] Error:", error);
    // Fallback: retourner un ID mock en cas d'erreur
    return `po_error_${Date.now()}`;
  }
};

// ========================================
// 🔗 PAYMENT LINKS API - NOUVEAUX ENDPOINTS
// ========================================

/**
 * Interface pour la création de Payment Link
 */
export interface CreatePaymentLinkRequest {
  amount: number; // Montant en centimes
  currency?: string;
  description?: string;
  customer_email?: string;
  metadata?: Record<string, string>;
}

/**
 * Interface pour un Payment Link
 */
export interface PaymentLink {
  id: string;
  url: string;
  active: boolean;
  created: number;
  currency?: string;
  metadata?: Record<string, string>;
}

/**
 * Crée un lien de paiement Stripe partageable
 * POST /v1/stripe/payment-links/create
 */
export const createStripePaymentLink = async (
  request: CreatePaymentLinkRequest,
): Promise<PaymentLink> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/payment-links/create`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: request.amount,
          currency: request.currency || "aud",
          description: request.description,
          customer_email: request.customer_email,
          metadata: request.metadata,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to create payment link");
    }

    return data.data;
  } catch (error) {
    safeLogError("CREATE_PAYMENT_LINK", error);
    throw error;
  }
};

/**
 * Liste tous les liens de paiement
 * GET /v1/stripe/payment-links/list
 */
export const fetchStripePaymentLinks = async (options?: {
  limit?: number;
  active?: boolean;
}): Promise<{ payment_links: PaymentLink[]; has_more: boolean }> => {
  try {
    const companyId = await getUserCompanyId();

    const params = new URLSearchParams();
    params.append("company_id", companyId.toString());
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.active !== undefined)
      params.append("active", options.active.toString());

    const url = `${ServerData.serverUrl}v1/stripe/payment-links/list${params.toString() ? "?" + params.toString() : ""}`;

    const response = await fetchWithAuth(url, { method: "GET" });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch payment links");
    }

    return data.data;
  } catch (error) {
    safeLogError("FETCH_PAYMENT_LINKS", error);
    throw error;
  }
};

/**
 * Récupère les détails d'un lien de paiement
 * GET /v1/stripe/payment-links/:id
 */
export const getStripePaymentLink = async (
  linkId: string,
): Promise<PaymentLink> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/payment-links/${linkId}`,
      { method: "GET" },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch payment link");
    }

    return data.data;
  } catch (error) {
    safeLogError("GET_PAYMENT_LINK", error);
    throw error;
  }
};

/**
 * Met à jour un lien de paiement
 * PATCH /v1/stripe/payment-links/:id
 */
export const updateStripePaymentLink = async (
  linkId: string,
  updates: { active?: boolean; metadata?: Record<string, string> },
): Promise<PaymentLink> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/payment-links/${linkId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to update payment link");
    }

    return data.data;
  } catch (error) {
    safeLogError("UPDATE_PAYMENT_LINK", error);
    throw error;
  }
};

/**
 * Désactive un lien de paiement
 * POST /v1/stripe/payment-links/:id/deactivate
 */
export const deactivateStripePaymentLink = async (
  linkId: string,
): Promise<{ id: string; active: boolean }> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/payment-links/${linkId}/deactivate`,
      { method: "POST" },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to deactivate payment link");
    }

    return data.data;
  } catch (error) {
    safeLogError("DEACTIVATE_PAYMENT_LINK", error);
    throw error;
  }
};

// ========================================
// ⚙️ ACCOUNT SETTINGS API - NOUVEAUX ENDPOINTS
// ========================================

/**
 * Interface pour les paramètres du compte Stripe
 */
export interface StripeAccountSettings {
  branding?: {
    icon?: string | null;
    logo?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
  };
  payments?: {
    statement_descriptor?: string | null;
    statement_descriptor_kana?: string | null;
    statement_descriptor_kanji?: string | null;
  };
  payouts?: {
    schedule?: {
      interval?: "manual" | "daily" | "weekly" | "monthly";
      delay_days?: number;
      weekly_anchor?: string;
      monthly_anchor?: number;
    };
    statement_descriptor?: string | null;
    debit_negative_balances?: boolean;
  };
  dashboard?: {
    display_name?: string | null;
    support_email?: string | null;
    support_phone?: string | null;
    support_url?: string | null;
    url?: string | null;
  };
  account_status?: {
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
    country: string;
    default_currency: string;
  };
}

/**
 * Récupère les paramètres actuels du compte Stripe
 * GET /v1/stripe/account/settings
 */
export const getStripeAccountSettings =
  async (): Promise<StripeAccountSettings> => {
    try {
      const response = await fetchWithAuth(
        `${ServerData.serverUrl}v1/stripe/account/settings`,
        { method: "GET" },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch account settings");
      }

      return data.data.settings;
    } catch (error) {
      safeLogError("GET_ACCOUNT_SETTINGS", error);
      throw error;
    }
  };

/**
 * Met à jour les paramètres du compte Stripe
 * PATCH /v1/stripe/account/settings
 */
export const updateStripeAccountSettings = async (
  settings: Partial<Omit<StripeAccountSettings, "account_status">>,
): Promise<StripeAccountSettings> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/account/settings`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to update account settings");
    }

    return data.data.settings;
  } catch (error) {
    safeLogError("UPDATE_ACCOUNT_SETTINGS", error);
    throw error;
  }
};

/**
 * Interface pour l'historique des modifications
 */
export interface SettingsHistoryEntry {
  id: number;
  changes: Partial<StripeAccountSettings>;
  updated_by_user_id: number;
  created_at: string;
}

/**
 * Récupère l'historique des modifications de paramètres
 * GET /v1/stripe/account/settings/history
 */
export const getStripeSettingsHistory = async (
  limit?: number,
): Promise<SettingsHistoryEntry[]> => {
  try {
    const params = limit ? `?limit=${limit}` : "";
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/account/settings/history${params}`,
      { method: "GET" },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch settings history");
    }

    return data.data.history;
  } catch (error) {
    safeLogError("GET_SETTINGS_HISTORY", error);
    throw error;
  }
};

// ========================================
// 💼 JOB PAYMENT SYSTEM - NOUVEAU
// ========================================

/**
 * Crée un Payment Intent Stripe pour un job spécifique
 * Utilise l'endpoint backend: POST /v1/jobs/{job_id}/payment/create
 *
 * @param jobId - ID du job à payer
 * @param options - Options du paiement (montant, devise, description)
 * @returns Payment Intent avec client_secret pour frontend
 */
export const createJobPaymentIntent = async (
  jobId: string | number,
  options: {
    amount?: number; // Optionnel, utilise amount_total du job par défaut
    currency?: string; // Optionnel, défaut "AUD"
    description?: string; // Optionnel, description personnalisée
  } = {},
): Promise<{
  payment_intent_id: string;
  client_secret: string;
  amount: number;
  currency: string;
  application_fee_amount: number;
  status: string;
  metadata: any;
}> => {
  try {
    const createUrl = `${ServerData.serverUrl}v1/jobs/${jobId}/payment/create`;

    // Test if we have a valid session token
    const token = await SecureStore.getItemAsync("session_token");
    if (token) {
    }

    const response = await fetchWithAuth(createUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      let errorData: any = null;
      let errorText = "";

      try {
        errorData = await response.json();
      } catch (jsonError) {
        errorText = await response.text().catch(() => "No error text");
      }

      const payload = errorData ? JSON.stringify(errorData) : errorText;
      console.error(`❌ [JOB PAYMENT] Error response: ${payload}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à créer un paiement pour ce job");
      }

      if (response.status === 404) {
        throw new Error("Job introuvable");
      }

      if (response.status === 400) {
        if (errorData?.action_required === "complete_stripe_onboarding") {
          throw new Error(
            "Compte Stripe non prêt. Terminez l'onboarding dans StripeHub.",
          );
        }

        if (
          typeof errorData?.message === "string" &&
          /no such customer/i.test(errorData.message)
        ) {
          throw new Error(
            "Client Stripe introuvable. Veuillez resynchroniser le client.",
          );
        }

        throw new Error(errorData?.error || "Données de paiement invalides");
      }

      throw new Error(
        errorData?.error ||
          `Erreur lors de la création du paiement: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success || !data.data?.payment_intent_id) {
      throw new Error("API returned invalid Payment Intent data");
    }

    return data.data;
  } catch (error) {
    console.error("❌ [JOB PAYMENT] Error creating Payment Intent:", error);
    throw error;
  }
};

/**
 * Confirme le paiement d'un job après traitement Stripe
 * Utilise l'endpoint backend: POST /v1/jobs/{job_id}/payment/confirm
 *
 * @param jobId - ID du job
 * @param paymentIntentId - Payment Intent ID Stripe
 * @param status - Statut du paiement ('succeeded' ou 'failed')
 * @returns Job mis à jour avec statut paiement
 */
export const confirmJobPayment = async (
  jobId: string | number,
  paymentIntentId: string,
  status: "succeeded" | "failed",
): Promise<{
  job: any;
  payment_status: string;
  message: string;
}> => {
  try {
    const confirmUrl = `${ServerData.serverUrl}v1/jobs/${jobId}/payment/confirm`;

    const response = await fetchWithAuth(confirmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_intent_id: paymentIntentId,
        status: status,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`❌ [JOB PAYMENT] Error response: ${errorText}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à confirmer le paiement de ce job");
      } else if (response.status === 404) {
        throw new Error("Job ou paiement introuvable");
      }

      throw new Error(
        `Erreur lors de la confirmation du paiement: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("API returned error during payment confirmation");
    }

    return data.data;
  } catch (error) {
    console.error("❌ [JOB PAYMENT] Error confirming payment:", error);
    throw error;
  }
};

/**
 * Récupère l'historique des paiements d'un job
 * Utilise l'endpoint backend: GET /v1/jobs/{job_id}/payments
 * Les données sont récupérées directement depuis Stripe API (source de vérité)
 *
 * @param jobId - ID du job
 * @returns Liste des paiements avec métadonnées complètes
 */
export const getJobPaymentHistory = async (
  jobId: string | number,
): Promise<{
  payments: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    type: string;
    description: string;
    created: string;
    updated: string | null;
    application_fee: number;
    method: string | null;
    metadata: {
      swiftapp_job_id: string;
      swiftapp_user_id: string;
      job_title?: string;
    };
  }[];
  meta: {
    job_id: number;
    total_payments: number;
    source: string;
  };
}> => {
  try {
    const historyUrl = `${ServerData.serverUrl}v1/jobs/${jobId}/payments`;

    const response = await fetchWithAuth(historyUrl, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`❌ [JOB PAYMENT] Error response: ${errorText}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à voir l'historique de ce job");
      } else if (response.status === 404) {
        throw new Error("Job introuvable");
      }

      throw new Error(
        `Erreur lors de la récupération de l'historique: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("API returned error for payment history");
    }

    return data;
  } catch (error) {
    console.error("❌ [JOB PAYMENT] Error getting payment history:", error);
    throw error;
  }
};

// ========================================
// 💸 REFUND SYSTEM - NOUVEAU
// ========================================

/**
 * Crée un remboursement pour un paiement spécifique
 * Utilise l'endpoint backend: POST /v1/stripe/refunds/create
 *
 * @param paymentIntentId - Payment Intent ID à rembourser
 * @param options - Options du remboursement (montant, raison)
 * @returns Refund data avec statut et details
 */
export const createStripeRefund = async (
  paymentIntentId: string,
  options: {
    amount?: number; // Montant en centimes, null = remboursement total
    reason?: "duplicate" | "fraudulent" | "requested_by_customer";
    metadata?: Record<string, string>;
    reverse_transfer?: boolean; // Annuler le transfer vers le compte connecté
  } = {},
): Promise<{
  refund_id: string;
  status: string;
  amount: number;
  currency: string;
  reason: string | null;
  receipt_number: string | null;
  created: string;
  updated: string | null;
  metadata: Record<string, string>;
}> => {
  try {
    const createUrl = `${ServerData.serverUrl}v1/stripe/refunds/create`;

    const response = await fetchWithAuth(createUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_intent_id: paymentIntentId,
        ...options,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`❌ [STRIPE REFUND] Error response: ${errorText}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à créer un remboursement");
      } else if (response.status === 404) {
        throw new Error("Paiement introuvable pour remboursement");
      } else if (response.status === 400) {
        throw new Error("Données de remboursement invalides");
      }

      throw new Error(
        `Erreur lors de la création du remboursement: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success || !data.data?.refund_id) {
      throw new Error("API returned invalid refund data");
    }

    return data.data;
  } catch (error) {
    console.error("❌ [STRIPE REFUND] Error creating refund:", error);
    throw error;
  }
};

/**
 * Récupère tous les remboursements d'une entreprise
 * Utilise l'endpoint backend: GET /v1/stripe/refunds?company_id={id}
 *
 * @param filters - Filtres optionnels pour les remboursements
 * @returns Liste des remboursements avec métadonnées
 */
export const fetchStripeRefunds = async (
  filters: {
    limit?: number;
    starting_after?: string;
    ending_before?: string;
    created?: {
      gte?: number;
      lte?: number;
    };
  } = {},
): Promise<{
  refunds: {
    id: string;
    amount: number;
    currency: string;
    status: "pending" | "succeeded" | "failed" | "canceled";
    reason: string | null;
    receipt_number: string | null;
    payment_intent_id: string;
    created: string;
    updated: string | null;
    metadata: Record<string, string>;
  }[];
  meta: {
    total_count: number;
    has_more: boolean;
    source: string;
  };
}> => {
  try {
    const companyId = await getUserCompanyId();

    const queryParams = new URLSearchParams({
      company_id: companyId.toString(),
      ...Object.fromEntries(
        Object.entries(filters).map(([key, value]) => [
          key,
          typeof value === "object" ? JSON.stringify(value) : String(value),
        ]),
      ),
    });

    const refundsUrl = `${ServerData.serverUrl}v1/stripe/refunds?${queryParams}`;

    const response = await fetchWithAuth(refundsUrl, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`❌ [FETCH REFUNDS] Error response: ${errorText}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à voir les remboursements");
      }

      throw new Error(
        `Erreur lors de la récupération des remboursements: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("API returned error for refunds");
    }

    return {
      refunds: data.data,
      meta: data.meta,
    };
  } catch (error) {
    console.error("❌ [FETCH REFUNDS] Error fetching refunds:", error);
    throw error;
  }
};

/**
 * Récupère les détails d'un remboursement spécifique
 * Utilise l'endpoint backend: GET /v1/stripe/refunds/{refund_id}
 *
 * @param refundId - ID du remboursement
 * @returns Détails complets du remboursement
 */
export const getStripeRefundDetails = async (
  refundId: string,
): Promise<{
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "canceled";
  reason: string | null;
  receipt_number: string | null;
  payment_intent_id: string;
  failure_reason: string | null;
  created: string;
  updated: string | null;
  metadata: Record<string, string>;
  balance_transaction: {
    id: string;
    amount: number;
    fee: number;
    net: number;
  } | null;
}> => {
  try {
    const detailsUrl = `${ServerData.serverUrl}v1/stripe/refunds/${refundId}`;

    const response = await fetchWithAuth(detailsUrl, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`❌ [REFUND DETAILS] Error response: ${errorText}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à voir ce remboursement");
      } else if (response.status === 404) {
        throw new Error("Remboursement introuvable");
      }

      throw new Error(
        `Erreur lors de la récupération du remboursement: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("API returned error for refund details");
    }

    return data.data;
  } catch (error) {
    console.error("❌ [REFUND DETAILS] Error getting refund details:", error);
    throw error;
  }
};

/**
 * Annule un remboursement en attente (si possible)
 * Utilise l'endpoint backend: POST /v1/stripe/refunds/{refund_id}/cancel
 *
 * @param refundId - ID du remboursement à annuler
 * @returns Remboursement mis à jour avec statut 'canceled'
 */
export const cancelStripeRefund = async (
  refundId: string,
): Promise<{
  id: string;
  status: "canceled";
  canceled_at: string;
  amount: number;
  currency: string;
}> => {
  try {
    const cancelUrl = `${ServerData.serverUrl}v1/stripe/refunds/${refundId}/cancel`;

    const response = await fetchWithAuth(cancelUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`❌ [CANCEL REFUND] Error response: ${errorText}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à annuler ce remboursement");
      } else if (response.status === 404) {
        throw new Error("Remboursement introuvable");
      } else if (response.status === 400) {
        throw new Error(
          "Impossible d'annuler ce remboursement (probablement déjà traité)",
        );
      }

      throw new Error(
        `Erreur lors de l'annulation du remboursement: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("API returned error during refund cancellation");
    }

    return data.data;
  } catch (error) {
    console.error("❌ [CANCEL REFUND] Error canceling refund:", error);
    throw error;
  }
};

// ========================================
// 🧾 INVOICE SYSTEM - NOUVEAU
// ========================================

/**
 * Crée une facture Stripe pour un client
 * Utilise l'endpoint backend: POST /v1/stripe/invoices/create
 *
 * @param invoiceData - Données de la facture
 * @returns Invoice data avec URL de paiement
 */
export const createStripeInvoice = async (invoiceData: {
  customer_email: string;
  customer_name?: string;
  description?: string;
  line_items: {
    description: string;
    quantity: number;
    unit_amount: number; // En centimes
    currency?: string;
  }[];
  due_date?: string; // ISO string
  metadata?: Record<string, string>;
  auto_advance?: boolean; // Auto-finaliser la facture
  collection_method?: "send_invoice" | "charge_automatically";
}): Promise<{
  invoice_id: string;
  invoice_number: string;
  status: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  customer_email: string;
  hosted_invoice_url: string;
  invoice_pdf: string;
  created: string;
  due_date: string | null;
  metadata: Record<string, string>;
}> => {
  try {
    const createUrl = `${ServerData.serverUrl}v1/stripe/invoices/create`;

    const response = await fetchWithAuth(createUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      let errorData: any = null;
      let errorText = "";

      try {
        errorData = await response.json();
      } catch (jsonError) {
        errorText = await response.text().catch(() => "No error text");
      }

      const payload = errorData ? JSON.stringify(errorData) : errorText;
      console.error(`❌ [STRIPE INVOICE] Error response: ${payload}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à créer une facture");
      }

      if (response.status === 400) {
        if (errorData?.action_required === "complete_stripe_onboarding") {
          throw new Error(
            "Compte Stripe non prêt. Terminez l'onboarding dans StripeHub.",
          );
        }

        if (
          typeof errorData?.message === "string" &&
          /no such customer/i.test(errorData.message)
        ) {
          throw new Error(
            "Client Stripe introuvable. Veuillez resynchroniser le client.",
          );
        }

        throw new Error(errorData?.error || "Données de facture invalides");
      }

      throw new Error(
        errorData?.error ||
          `Erreur lors de la création de la facture: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success || !data.data?.invoice_id) {
      throw new Error("API returned invalid invoice data");
    }

    return data.data;
  } catch (error) {
    console.error("❌ [STRIPE INVOICE] Error creating invoice:", error);
    throw error;
  }
};

/**
 * Cree un Payment Intent pour une facture existante
 * Utilise l'endpoint backend: POST /v1/payments/create-payment-intent
 */
export const createInvoicePaymentIntent = async (payload: {
  invoice_id: number;
  save_card?: boolean;
  payment_method_id?: string;
}): Promise<{
  payment_intent_id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, string>;
}> => {
  try {
    const createUrl = `${ServerData.serverUrl}v1/payments/create-payment-intent`;

    const response = await fetchWithAuth(createUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorData: any = null;
      let errorText = "";

      try {
        errorData = await response.json();
      } catch (jsonError) {
        errorText = await response.text().catch(() => "No error text");
      }

      const payloadText = errorData ? JSON.stringify(errorData) : errorText;
      console.error(`❌ [INVOICE PAYMENT] Error response: ${payloadText}`);

      if (response.status === 401) {
        throw new Error("Non autorise a creer un paiement de facture");
      }

      if (response.status === 400) {
        if (errorData?.action_required === "complete_stripe_onboarding") {
          throw new Error(
            "Compte Stripe non pret. Terminez l'onboarding dans StripeHub.",
          );
        }

        if (
          typeof errorData?.message === "string" &&
          /no such customer/i.test(errorData.message)
        ) {
          throw new Error(
            "Client Stripe introuvable. Veuillez resynchroniser le client.",
          );
        }

        throw new Error(errorData?.error || "Donnees de facture invalides");
      }

      throw new Error(
        errorData?.error ||
          `Erreur lors de la creation du paiement: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success || !data.data?.payment_intent_id) {
      throw new Error("API returned invalid invoice payment data");
    }

    return data.data;
  } catch (error) {
    console.error(
      "❌ [INVOICE PAYMENT] Error creating invoice payment:",
      error,
    );
    throw error;
  }
};

/**
 * Confirme le paiement d'une facture
 * Utilise l'endpoint backend: POST /v1/payment/confirm
 */
export const confirmInvoicePayment = async (payload: {
  payment_intent_id: string;
  payment_method?: string;
}): Promise<{
  status: string;
  message?: string;
}> => {
  try {
    const confirmUrl = `${ServerData.serverUrl}v1/payment/confirm`;

    const response = await fetchWithAuth(confirmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`❌ [INVOICE PAYMENT] Error response: ${errorText}`);

      if (response.status === 401) {
        throw new Error("Non autorise a confirmer ce paiement");
      }

      throw new Error(
        `Erreur lors de la confirmation du paiement: ${response.status}`,
      );
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "API returned error during confirmation");
    }

    return data.data;
  } catch (error) {
    console.error(
      "❌ [INVOICE PAYMENT] Error confirming invoice payment:",
      error,
    );
    throw error;
  }
};

/**
 * Récupère toutes les factures d'une entreprise
 * Utilise l'endpoint backend: GET /v1/stripe/invoices?company_id={id}
 *
 * @param filters - Filtres pour les factures
 * @returns Liste des factures avec métadonnées
 */
export const fetchStripeInvoices = async (
  filters: {
    status?: "draft" | "open" | "paid" | "void" | "uncollectible";
    limit?: number;
    starting_after?: string;
    ending_before?: string;
    created?: {
      gte?: number;
      lte?: number;
    };
    due_date?: {
      gte?: number;
      lte?: number;
    };
  } = {},
): Promise<{
  invoices: {
    id: string;
    number: string;
    status: "draft" | "open" | "paid" | "void" | "uncollectible";
    amount_due: number;
    amount_paid: number;
    amount_remaining: number;
    currency: string;
    customer_email: string;
    customer_name: string | null;
    description: string | null;
    hosted_invoice_url: string;
    invoice_pdf: string;
    created: string;
    due_date: string | null;
    paid_at: string | null;
    metadata: Record<string, string>;
  }[];
  meta: {
    total_count: number;
    has_more: boolean;
    source: string;
  };
}> => {
  try {
    const companyId = await getUserCompanyId();

    const queryParams = new URLSearchParams({
      company_id: companyId.toString(),
      ...Object.fromEntries(
        Object.entries(filters).map(([key, value]) => [
          key,
          typeof value === "object" ? JSON.stringify(value) : String(value),
        ]),
      ),
    });

    const invoicesUrl = `${ServerData.serverUrl}v1/stripe/invoices?${queryParams}`;

    const response = await fetchWithAuth(invoicesUrl, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`❌ [FETCH INVOICES] Error response: ${errorText}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à voir les factures");
      }

      throw new Error(
        `Erreur lors de la récupération des factures: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("API returned error for invoices");
    }

    return {
      invoices: data.data,
      meta: data.meta,
    };
  } catch (error) {
    console.error("❌ [FETCH INVOICES] Error fetching invoices:", error);
    throw error;
  }
};

/**
 * Envoie une facture par email au client
 * Utilise l'endpoint backend: POST /v1/stripe/invoices/{invoice_id}/send
 *
 * @param invoiceId - ID de la facture à envoyer
 * @returns Confirmation d'envoi avec détails
 */
export const sendStripeInvoice = async (
  invoiceId: string,
): Promise<{
  invoice_id: string;
  sent: boolean;
  sent_at: string;
  customer_email: string;
}> => {
  try {
    const sendUrl = `${ServerData.serverUrl}v1/stripe/invoices/${invoiceId}/send`;

    const response = await fetchWithAuth(sendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`❌ [SEND INVOICE] Error response: ${errorText}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à envoyer cette facture");
      } else if (response.status === 404) {
        throw new Error("Facture introuvable");
      } else if (response.status === 400) {
        throw new Error(
          "Impossible d'envoyer cette facture (vérifiez son statut)",
        );
      }

      throw new Error(
        `Erreur lors de l'envoi de la facture: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("API returned error during invoice sending");
    }

    return data.data;
  } catch (error) {
    console.error("❌ [SEND INVOICE] Error sending invoice:", error);
    throw error;
  }
};

/**
 * Marque une facture comme payée manuellement
 * Utilise l'endpoint backend: POST /v1/stripe/invoices/{invoice_id}/mark_paid
 *
 * @param invoiceId - ID de la facture
 * @param paymentDetails - Détails du paiement externe
 * @returns Facture mise à jour
 */
export const markStripeInvoiceAsPaid = async (
  invoiceId: string,
  paymentDetails?: {
    external_payment_id?: string;
    payment_method?: string;
    notes?: string;
  },
): Promise<{
  invoice_id: string;
  status: "paid";
  amount_paid: number;
  paid_at: string;
  payment_method: string | null;
}> => {
  try {
    const markUrl = `${ServerData.serverUrl}v1/stripe/invoices/${invoiceId}/mark_paid`;

    const response = await fetchWithAuth(markUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentDetails || {}),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`❌ [MARK PAID] Error response: ${errorText}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à modifier cette facture");
      } else if (response.status === 404) {
        throw new Error("Facture introuvable");
      } else if (response.status === 400) {
        throw new Error("Impossible de marquer cette facture comme payée");
      }

      throw new Error(
        `Erreur lors de la mise à jour de la facture: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("API returned error during invoice update");
    }

    return data.data;
  } catch (error) {
    console.error("❌ [MARK PAID] Error marking invoice as paid:", error);
    throw error;
  }
};

/**
 * Annule une facture (draft ou open)
 * Utilise l'endpoint backend: POST /v1/stripe/invoices/{invoice_id}/void
 *
 * @param invoiceId - ID de la facture à annuler
 * @returns Facture annulée
 */
export const voidStripeInvoice = async (
  invoiceId: string,
): Promise<{
  invoice_id: string;
  status: "void";
  voided_at: string;
}> => {
  try {
    const voidUrl = `${ServerData.serverUrl}v1/stripe/invoices/${invoiceId}/void`;

    const response = await fetchWithAuth(voidUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`❌ [VOID INVOICE] Error response: ${errorText}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à annuler cette facture");
      } else if (response.status === 404) {
        throw new Error("Facture introuvable");
      } else if (response.status === 400) {
        throw new Error(
          "Impossible d'annuler cette facture (vérifiez son statut)",
        );
      }

      throw new Error(
        `Erreur lors de l'annulation de la facture: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("API returned error during invoice voiding");
    }

    return data.data;
  } catch (error) {
    console.error("❌ [VOID INVOICE] Error voiding invoice:", error);
    throw error;
  }
};

// ========================================
// 📊 ANALYTICS & REPORTS - NOUVEAU
// ========================================

/**
 * Récupère les analytics détaillés par période
 * Utilise l'endpoint backend: GET /v1/stripe/analytics/overview
 *
 * @param period - Période d'analyse
 * @returns Analytics complets avec métriques et graphiques
 */
export const getStripeAnalytics = async (period: {
  start_date: string; // ISO string
  end_date: string; // ISO string
  granularity?: "day" | "week" | "month";
}): Promise<{
  metrics: {
    total_revenue: number;
    total_fees: number;
    net_revenue: number;
    total_payments: number;
    successful_payments: number;
    failed_payments: number;
    total_refunds: number;
    refund_amount: number;
    average_payment_amount: number;
    success_rate: number;
  };
  period_data: {
    date: string;
    revenue: number;
    fees: number;
    net: number;
    payments_count: number;
    refunds_count: number;
    refund_amount: number;
  }[];
  top_customers: {
    customer_id: string;
    customer_email: string;
    total_spent: number;
    payments_count: number;
  }[];
  payment_methods: {
    type: string;
    count: number;
    amount: number;
    percentage: number;
  }[];
  currency_breakdown: {
    currency: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  meta: {
    period: string;
    granularity: string;
    timezone: string;
    source: string;
  };
}> => {
  try {
    const companyId = await getUserCompanyId();

    const queryParams = new URLSearchParams({
      company_id: companyId.toString(),
      start_date: period.start_date,
      end_date: period.end_date,
      granularity: period.granularity || "day",
    });

    const analyticsUrl = `${ServerData.serverUrl}v1/stripe/analytics/overview?${queryParams}`;

    const response = await fetchWithAuth(analyticsUrl, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`❌ [STRIPE ANALYTICS] Error response: ${errorText}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à voir les analytics");
      }

      throw new Error(
        `Erreur lors de la récupération des analytics: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("API returned error for analytics");
    }

    return data.data;
  } catch (error) {
    console.error("❌ [STRIPE ANALYTICS] Error fetching analytics:", error);
    throw error;
  }
};

/**
 * Exporte les données Stripe au format CSV
 * Utilise l'endpoint backend: POST /v1/stripe/exports/csv
 *
 * @param exportConfig - Configuration de l'export
 * @returns URL de téléchargement du fichier CSV
 */
export const exportStripeDataCSV = async (exportConfig: {
  type: "payments" | "refunds" | "invoices" | "payouts" | "analytics";
  start_date: string;
  end_date: string;
  filters?: Record<string, any>;
  include_fields?: string[];
}): Promise<{
  download_url: string;
  file_name: string;
  expires_at: string;
  record_count: number;
}> => {
  try {
    const companyId = await getUserCompanyId();

    const exportUrl = `${ServerData.serverUrl}v1/stripe/exports/csv`;

    const response = await fetchWithAuth(exportUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company_id: companyId,
        ...exportConfig,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`❌ [CSV EXPORT] Error response: ${errorText}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à exporter les données");
      } else if (response.status === 400) {
        throw new Error("Configuration d'export invalide");
      }

      throw new Error(
        `Erreur lors de la création de l'export: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success || !data.data?.download_url) {
      throw new Error("API returned invalid export data");
    }

    return data.data;
  } catch (error) {
    console.error("❌ [CSV EXPORT] Error creating CSV export:", error);
    throw error;
  }
};

/**
 * Exporte les données Stripe au format PDF
 * Utilise l'endpoint backend: POST /v1/stripe/exports/pdf
 *
 * @param reportConfig - Configuration du rapport PDF
 * @returns URL de téléchargement du fichier PDF
 */
export const exportStripeDataPDF = async (reportConfig: {
  type:
    | "monthly_report"
    | "payment_summary"
    | "refund_report"
    | "invoice_summary";
  start_date: string;
  end_date: string;
  template?: "standard" | "detailed" | "summary";
  include_charts?: boolean;
  company_branding?: boolean;
}): Promise<{
  download_url: string;
  file_name: string;
  expires_at: string;
  page_count: number;
}> => {
  try {
    const companyId = await getUserCompanyId();

    const exportUrl = `${ServerData.serverUrl}v1/stripe/exports/pdf`;

    const response = await fetchWithAuth(exportUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company_id: companyId,
        ...reportConfig,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`❌ [PDF EXPORT] Error response: ${errorText}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à créer un rapport PDF");
      } else if (response.status === 400) {
        throw new Error("Configuration de rapport invalide");
      }

      throw new Error(
        `Erreur lors de la création du rapport: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success || !data.data?.download_url) {
      throw new Error("API returned invalid report data");
    }

    return data.data;
  } catch (error) {
    console.error("❌ [PDF EXPORT] Error creating PDF report:", error);
    throw error;
  }
};

/**
 * Récupère les analytics en temps réel (tableau de bord)
 * Utilise l'endpoint backend: GET /v1/stripe/analytics/realtime
 *
 * @returns Métriques en temps réel pour le tableau de bord
 */
export const getStripeRealtimeAnalytics = async (): Promise<{
  today: {
    revenue: number;
    payments_count: number;
    avg_payment: number;
    refunds_count: number;
    refund_amount: number;
  };
  yesterday: {
    revenue: number;
    payments_count: number;
    avg_payment: number;
    refunds_count: number;
    refund_amount: number;
  };
  this_month: {
    revenue: number;
    payments_count: number;
    avg_payment: number;
    refunds_count: number;
    refund_amount: number;
  };
  last_month: {
    revenue: number;
    payments_count: number;
    avg_payment: number;
    refunds_count: number;
    refund_amount: number;
  };
  trending: {
    revenue_change_pct: number;
    payments_change_pct: number;
    trend_direction: "up" | "down" | "stable";
  };
  recent_activity: {
    type: "payment" | "refund" | "invoice" | "payout";
    amount: number;
    currency: string;
    description: string;
    timestamp: string;
  }[];
  meta: {
    last_updated: string;
    timezone: string;
    source: string;
  };
}> => {
  try {
    const companyId = await getUserCompanyId();

    const realtimeUrl = `${ServerData.serverUrl}v1/stripe/analytics/realtime?company_id=${companyId}`;

    const response = await fetchWithAuth(realtimeUrl, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error text");
      console.error(`❌ [REALTIME ANALYTICS] Error response: ${errorText}`);

      if (response.status === 401) {
        throw new Error("Non autorisé à voir les analytics en temps réel");
      }

      throw new Error(
        `Erreur lors de la récupération des données temps réel: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("API returned error for real-time analytics");
    }

    return data.data;
  } catch (error) {
    console.error(
      "❌ [REALTIME ANALYTICS] Error fetching real-time analytics:",
      error,
    );
    throw error;
  }
};

/**
 * Refresh Stripe Account Link pour compléter le profil
 * Génère un nouveau lien d'onboarding pour compléter les informations manquantes
 * @returns Promise avec l'URL du lien et son timestamp d'expiration
 */
export const refreshStripeAccountLink = async (): Promise<{
  url: string;
  expires_at: number;
}> => {
  try {
    const refreshUrl = `${ServerData.serverUrl}v1/stripe/connect/refresh-link`;

    const response = await fetchWithAuth(refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error(`❌ [STRIPE LINK] Error response:`, errorData);

      if (response.status === 404) {
        throw new Error("Aucun compte Stripe trouvé pour cette entreprise");
      }

      if (response.status === 401) {
        throw new Error("Non autorisé à créer un lien Stripe");
      }

      throw new Error(
        errorData.error ||
          `Erreur lors de la création du lien: ${response.status}`,
      );
    }

    const data = await response.json();

    if (!data.success || !data.url) {
      throw new Error("API returned error or missing URL");
    }

    // Vérifier que l'URL expire dans le futur
    const now = Math.floor(Date.now() / 1000);
    if (data.expires_at && data.expires_at < now) {
    } else if (data.expires_at) {
      const expiresInMin = Math.floor((data.expires_at - now) / 60);
    }

    return {
      url: data.url,
      expires_at: data.expires_at,
    };
  } catch (error) {
    console.error("❌ [STRIPE LINK] Error refreshing account link:", error);
    throw error;
  }
};

// ============================================================================
// 🆕 STRIPE NATIVE ONBOARDING API
// ============================================================================

/**
 * Démarre l'onboarding Stripe natif (crée un compte Custom)
 * @param businessType Type d'entreprise: "individual" ou "company" (défaut: "company")
 * @param businessProfile Profil entreprise optionnel (name, mcc, url)
 * @returns Promise avec stripe_account_id et progress
 */
export const startStripeOnboarding = async (
  businessType: "individual" | "company" = "company",
  businessProfile?: {
    name?: string;
    mcc?: string;
    url?: string;
  },
): Promise<{
  stripeAccountId: string;
  progress: number;
}> => {
  try {
    // Build payload according to backend expected format
    const payload: any = { business_type: businessType };

    // Add business_profile if provided (will be applied at account creation level by backend)
    if (businessProfile) {
      payload.business_profile = businessProfile;
    }

    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/onboarding/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error(`❌ [ONBOARDING] Error response:`, errorData);
      throw new Error(errorData.error || "Failed to start onboarding");
    }

    const data = await response.json();

    return {
      stripeAccountId: data.stripe_account_id,
      progress: data.progress || 0,
    };
  } catch (error) {
    console.error("❌ [ONBOARDING] Error starting onboarding:", error);
    throw error;
  }
};

/**
 * Supprime le compte Stripe Connect de l'entreprise
 */
export const deleteStripeAccount = async (): Promise<{ success: boolean }> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/account`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error(`❌ [STRIPE] Error response:`, errorData);
      throw new Error(errorData.error || "Failed to delete account");
    }

    const data = await response.json();

    return { success: true };
  } catch (error) {
    console.error("❌ [STRIPE] Error deleting account:", error);
    throw error;
  }
};

/**
 * Démarre l'onboarding Stripe (Étape 0/6) - Crée le compte Custom
 * @param businessType Type d'entreprise: "individual" ou "company"
 * @param businessProfile Profil entreprise optionnel (name, mcc, url)
 */
export const startOnboarding = async (
  businessType: "individual" | "company" = "company",
  businessProfile?: {
    name?: string;
    mcc?: string;
    url?: string;
  },
): Promise<{
  success: boolean;
  stripe_account_id: string;
  onboarding_progress: number;
  next_step: string;
}> => {
  try {
    // Build payload according to backend expected format
    const payload: any = { business_type: businessType };

    // Add business_profile if provided
    if (businessProfile) {
      payload.business_profile = businessProfile;
    }

    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/onboarding/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error(`❌ [ONBOARDING] Error response:`, errorData);
      throw new Error(
        errorData.error || errorData.message || "Failed to start onboarding",
      );
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("❌ [ONBOARDING] Error starting onboarding:", error);
    throw error;
  }
};

/**
 * Soumet les informations personnelles (Étape 1/6)
 * @param info Données personnelles (prénom, nom, date de naissance, email, téléphone)
 * @param businessType Type d'entreprise pour adapter le payload
 */
export const submitPersonalInfo = async (
  info: {
    first_name: string;
    last_name: string;
    dob_day: number;
    dob_month: number;
    dob_year: number;
    email: string;
    phone: string;
    // For company type
    company_name?: string;
    tax_id?: string;
  },
  businessType: "individual" | "company" = "individual",
): Promise<{
  progress: number;
  onboarding_progress?: number;
  next_step?: string;
}> => {
  try {
    // Build payload based on business type
    let payload: any;

    if (businessType === "company" && info.company_name) {
      // Company: send company info
      payload = {
        company: {
          name: info.company_name,
          tax_id: info.tax_id || "",
        },
      };
    } else {
      // Individual: send personal info with dob as object
      payload = {
        first_name: info.first_name,
        last_name: info.last_name,
        email: info.email,
        phone: info.phone,
        dob: {
          day: info.dob_day,
          month: info.dob_month,
          year: info.dob_year,
        },
      };
    }

    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/onboarding/personal-info`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error(`❌ [ONBOARDING] Error response:`, errorData);
      throw new Error(errorData.error || "Failed to submit personal info");
    }

    const data = await response.json();

    return {
      progress: data.onboarding_progress || data.progress,
      onboarding_progress: data.onboarding_progress,
      next_step: data.next_step,
    };
  } catch (error) {
    console.error("❌ [ONBOARDING] Error submitting personal info:", error);
    throw error;
  }
};

/**
 * Soumet le profil business (MCC, site, description)
 * @param profile Donnees de profil business
 */
export const submitBusinessProfile = async (profile: {
  mcc: string;
  url: string;
  product_description: string;
}): Promise<{ progress: number }> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/onboarding/business-profile`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error(`❌ [ONBOARDING] Error response:`, errorData);
      throw new Error(errorData.error || "Failed to submit business profile");
    }

    const data = await response.json();

    return { progress: data.progress };
  } catch (error) {
    console.error("❌ [ONBOARDING] Error submitting business profile:", error);
    throw error;
  }
};

/**
 * Soumet l'adresse (Étape 3/6)
 * @param address Adresse de résidence (ligne1, ligne2, ville, état, code postal, pays)
 */
export const submitAddress = async (address: {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
}): Promise<{
  progress: number;
  onboarding_progress?: number;
  next_step?: string;
}> => {
  try {
    // Ensure country is included (default to AU for Australia)
    const payload = {
      ...address,
      country: address.country || "AU",
    };

    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/onboarding/address`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error(`❌ [ONBOARDING] Error response:`, errorData);
      throw new Error(
        errorData.error || errorData.message || "Failed to submit address",
      );
    }

    const data = await response.json();

    return {
      progress: data.onboarding_progress || data.progress,
      onboarding_progress: data.onboarding_progress,
      next_step: data.next_step,
    };
  } catch (error) {
    console.error("❌ [ONBOARDING] Error submitting address:", error);
    throw error;
  }
};

/**
 * Soumet les informations entreprise (raison sociale, ABN, adresse)
 * @param company Donnees entreprise
 */
export const submitCompanyDetails = async (company: {
  name: string;
  tax_id: string;
  company_number?: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
  };
}): Promise<{ progress: number }> => {
  try {
    const personalInfoPayload = {
      company: {
        name: company.name,
        tax_id: company.tax_id,
        phone: company.phone,
        // Backend v3: expects registration_number (keep compatibility with existing name)
        registration_number: company.company_number,
      },
    };

    const personalInfoResponse = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/onboarding/personal-info`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(personalInfoPayload),
      },
    );

    if (!personalInfoResponse.ok) {
      const errorData = await personalInfoResponse
        .json()
        .catch(() => ({ error: "Unknown error" }));
      const requiredFields = Array.isArray(errorData?.required)
        ? errorData.required
        : [];
      const requiresIndividualPayload =
        personalInfoResponse.status === 400 &&
        requiredFields.includes("first_name") &&
        requiredFields.includes("last_name") &&
        requiredFields.includes("dob") &&
        requiredFields.includes("email") &&
        requiredFields.includes("phone");

      if (requiresIndividualPayload) {
      } else {
        console.error(
          `❌ [ONBOARDING] Error response (/personal-info company):`,
          errorData,
        );
        throw new Error(
          errorData.error ||
            errorData.message ||
            "Failed to submit company info",
        );
      }
    }

    const addressPayload = {
      line1: company.address.line1,
      line2: company.address.line2,
      city: company.address.city,
      state: company.address.state,
      postal_code: company.address.postal_code,
      country: "AU",
    };

    const addressResponse = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/onboarding/address`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addressPayload),
      },
    );

    if (!addressResponse.ok) {
      const errorData = await addressResponse
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error(`❌ [ONBOARDING] Error response (/address):`, errorData);
      throw new Error(
        errorData.error ||
          errorData.message ||
          "Failed to submit company address",
      );
    }

    const addressData = await addressResponse.json();
    const progress =
      addressData.onboarding_progress || addressData.progress || 0;
    return { progress };
  } catch (error) {
    console.error("❌ [ONBOARDING] Error submitting company details:", error);
    throw error;
  }
};

/**
 * Soumet les informations du representant legal
 * @param representative Donnees representant
 */
export const submitRepresentativeDetails = async (representative: {
  first_name: string;
  last_name: string;
  dob_day: number;
  dob_month: number;
  dob_year: number;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
  };
  relationship: {
    title: string;
    owner: boolean;
    director: boolean;
    executive: boolean;
    percent_ownership?: number;
  };
}): Promise<{ progress: number }> => {
  try {
    const payload = {
      first_name: representative.first_name,
      last_name: representative.last_name,
      email: representative.email,
      phone: representative.phone,
      dob: {
        day: representative.dob_day,
        month: representative.dob_month,
        year: representative.dob_year,
      },
      address: {
        line1: representative.address.line1,
        line2: representative.address.line2,
        city: representative.address.city,
        state: representative.address.state,
        postal_code: representative.address.postal_code,
        country: "AU",
      },
      relationship: {
        title: representative.relationship.title,
        owner: representative.relationship.owner,
        director: representative.relationship.director,
        executive: representative.relationship.executive,
        percent_ownership: representative.relationship.percent_ownership,
      },
    };

    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/onboarding/personal-info`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      const requiredFields = Array.isArray(errorData?.required)
        ? errorData.required
        : [];
      const accountBusinessType = errorData?.details?.accountBusinessType;
      const requiresCompanyPayload =
        response.status === 400 &&
        accountBusinessType === "company" &&
        requiredFields.includes("company.name");

      if (requiresCompanyPayload) {
        const currentAccount = await fetchStripeAccount();
        const fallbackCompanyName =
          currentAccount?.business_name ||
          `${representative.first_name} ${representative.last_name}`.trim();

        const companyFallbackResponse = await fetchWithAuth(
          `${ServerData.serverUrl}v1/stripe/onboarding/personal-info`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              company: {
                name: fallbackCompanyName,
              },
            }),
          },
        );

        if (!companyFallbackResponse.ok) {
          const fallbackErrorData = await companyFallbackResponse
            .json()
            .catch(() => ({ error: "Unknown error" }));
          console.error(
            "❌ [ONBOARDING] Error response (/personal-info representative fallback):",
            fallbackErrorData,
          );
          throw new Error(
            fallbackErrorData.error ||
              fallbackErrorData.message ||
              "Failed to submit representative details",
          );
        }

        const fallbackData = await companyFallbackResponse.json();
        const fallbackProgress =
          fallbackData.onboarding_progress || fallbackData.progress || 0;
        return { progress: fallbackProgress };
      }

      console.error(
        `❌ [ONBOARDING] Error response (/personal-info representative):`,
        errorData,
      );
      throw new Error(
        errorData.error ||
          errorData.message ||
          "Failed to submit representative details",
      );
    }

    const data = await response.json();
    const progress = data.onboarding_progress || data.progress || 0;
    return { progress };
  } catch (error) {
    console.error(
      "❌ [ONBOARDING] Error submitting representative details:",
      error,
    );
    throw error;
  }
};

type StripePersonPayload = {
  first_name: string;
  last_name: string;
  dob: string; // YYYY-MM-DD
  email: string;
  phone?: string;
  title?: string;
  percent_ownership?: number;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
  };
};

/**
 * Soumet les persons company (Owners/Directors/Executives/Representative)
 * Endpoint v3: POST /v1/stripe/onboarding/persons
 */
export const submitCompanyPersons = async (payload: {
  representative: StripePersonPayload;
  owners?: StripePersonPayload[];
  directors?: StripePersonPayload[];
  executives?: StripePersonPayload[];
  no_owners?: boolean;
}): Promise<{
  success: boolean;
  progress?: number;
  onboarding_progress?: number;
  next_step?: string;
  request_id?: string;
  person_id?: string;
  roles_applied?: string[];
  requirements_pending?: string[];
  requirements?: {
    currently_due?: string[];
    eventually_due?: string[];
    past_due?: string[];
  };
}> => {
  const response = await fetchWithAuth(
    `${ServerData.serverUrl}v1/stripe/onboarding/persons`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json().catch(() => ({ success: false }));
  if (!response.ok || data?.success === false) {
    console.error("❌ [ONBOARDING] Error response (/persons):", data);
    throw new Error(
      data?.error || data?.message || "Failed to submit company persons",
    );
  }

  if (data?.request_id) {
  }

  if (data?.person_id) {
    try {
      await SecureStore.setItemAsync(
        "stripe_onboarding_person_id",
        String(data.person_id),
      );
    } catch (storeError) {
      // Non-critical: SecureStore write for person_id cache
    }
  }

  return data;
};

/**
 * Soumet les coordonnées bancaires (Étape 5/6)
 * @param bank Données bancaires - supporte IBAN (EU) ou BSB/account (AU)
 */
export const submitBankAccount = async (bank: {
  // IBAN format (Europe)
  iban?: string;
  // AU format (BSB + account number)
  bsb?: string;
  account_number?: string;
  routing_number?: string;
  // Common
  account_holder_name: string;
  country?: string;
  currency?: string;
}): Promise<{
  progress: number;
  onboarding_progress?: number;
  next_step?: string;
}> => {
  try {
    // Build payload based on what's provided
    let payload: any = {
      account_holder_name: bank.account_holder_name,
    };

    if (bank.iban) {
      // European IBAN format
      payload.iban = bank.iban;
    } else if (bank.bsb && bank.account_number) {
      // Australian BSB format
      payload.account_number = bank.account_number;
      payload.bsb = bank.bsb.replace(/-/g, ""); // Backend contract expects bsb
      payload.routing_number = payload.bsb; // Compatibility for backends still reading routing_number
      payload.country = bank.country || "AU";
      payload.currency = bank.currency || "aud";
    } else if (bank.account_number && bank.routing_number) {
      // US/other format
      payload.account_number = bank.account_number;
      payload.routing_number = bank.routing_number;
      payload.country = bank.country || "US";
      payload.currency = bank.currency || "usd";

      // Compatibility: if country AU and only routing_number is provided, map it to bsb too
      if ((payload.country || "").toUpperCase() === "AU") {
        payload.bsb = String(bank.routing_number).replace(/-/g, "");
      }
    }

    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/onboarding/bank-account`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));

      const requiredFields = Array.isArray(errorData?.required)
        ? errorData.required
        : [];
      const requiresBsb =
        response.status === 400 && requiredFields.includes("bsb");

      if (requiresBsb && payload.routing_number && !payload.bsb) {
        const retryPayload = {
          ...payload,
          bsb: String(payload.routing_number).replace(/-/g, ""),
        };

        const retryResponse = await fetchWithAuth(
          `${ServerData.serverUrl}v1/stripe/onboarding/bank-account`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(retryPayload),
          },
        );

        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          return {
            progress: retryData.onboarding_progress || retryData.progress,
            onboarding_progress: retryData.onboarding_progress,
            next_step: retryData.next_step,
          };
        }

        const retryErrorData = await retryResponse
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("❌ [ONBOARDING] Retry error response:", retryErrorData);
      }

      console.error(`❌ [ONBOARDING] Error response:`, errorData);
      throw new Error(
        errorData.error || errorData.message || "Failed to submit bank account",
      );
    }

    const data = await response.json();

    return {
      progress: data.onboarding_progress || data.progress,
      onboarding_progress: data.onboarding_progress,
      next_step: data.next_step,
    };
  } catch (error) {
    console.error("❌ [ONBOARDING] Error submitting bank account:", error);
    throw error;
  }
};

/**
 * Upload documents d'identité (Étape 4/6)
 * @param frontImageUri URI de l'image recto
 * @param backImageUri URI de l'image verso (optionnel pour passeport)
 * @param documentType Type de document ("passport" | "id_card" | "driving_license")
 */
export const uploadDocument = async (
  frontImageUri: string,
  documentType: "passport" | "id_card" | "driving_license",
  backImageUri?: string,
): Promise<{
  progress: number;
  onboarding_progress?: number;
  next_step?: string;
}> => {
  try {
    const createFileObject = (uri: string, name: string) => ({
      uri,
      type: "image/jpeg",
      name,
    });

    const personId = await SecureStore.getItemAsync(
      "stripe_onboarding_person_id",
    ).catch(() => null);

    const appendPersonIdAliases = (formData: FormData, id: string) => {
      // Different backend versions may use different param names.
      // These are non-file fields, safe with Multer.
      formData.append("person_id", id);
      formData.append("personId", id);
      formData.append("person", id);
      formData.append("stripe_person_id", id);
      formData.append("stripePersonId", id);
      formData.append("stripe_person", id);
      formData.append("stripePerson", id);
    };

    const extractRequiredFields = (body: any): string[] => {
      if (!body || typeof body !== "object") return [];
      if (Array.isArray((body as any).required)) {
        return (body as any).required.filter((v: any) => typeof v === "string");
      }
      if (Array.isArray((body as any).errors)) {
        // Some backends return: { errors: [{ field: "..." }, ...] }
        const fields = (body as any).errors
          .map((e: any) => e?.field)
          .filter((v: any) => typeof v === "string");
        return fields;
      }
      return [];
    };

    const summarizeBackendError = (body: any): string => {
      if (typeof body === "string") {
        // If HTML/plain text, keep it short
        const compact = body.replace(/\s+/g, " ").trim();
        return compact.length > 300 ? `${compact.slice(0, 300)}…` : compact;
      }

      if (!body || typeof body !== "object") {
        return "Failed to upload document";
      }

      const message =
        typeof (body as any).message === "string"
          ? (body as any).message
          : typeof (body as any).error_description === "string"
            ? (body as any).error_description
            : typeof (body as any).error === "string"
              ? (body as any).error
              : typeof (body as any).code === "string"
                ? (body as any).code
                : "Failed to upload document";

      const required = extractRequiredFields(body);
      if (required.length > 0) {
        return `${message} (required: ${required.join(", ")})`;
      }
      return message;
    };

    const postFormData = async (formData: FormData) => {
      const uploadResponse = await fetchWithAuth(
        `${ServerData.serverUrl}v1/stripe/onboarding/document`,
        {
          method: "POST",
          body: formData,
        },
      );

      const contentType = uploadResponse.headers.get("content-type") || "";
      const rawText = await uploadResponse.text().catch(() => "");
      let parsedBody: any = null;

      if (rawText && contentType.includes("application/json")) {
        try {
          parsedBody = JSON.parse(rawText);
        } catch {
          parsedBody = rawText;
        }
      } else {
        try {
          parsedBody = rawText ? JSON.parse(rawText) : null;
        } catch {
          parsedBody = rawText || null;
        }
      }

      return {
        ok: uploadResponse.ok,
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        contentType,
        body: parsedBody,
      };
    };

    // Backend v3.2 contract: field name must be `file` and `side` must be `front|back`.
    // Send two requests when a back image is required.
    const uploadOneSide = async (side: "front" | "back", uri: string) => {
      const formData = new FormData();

      if (personId) {
        appendPersonIdAliases(formData, String(personId));
      }

      formData.append(
        "file",
        createFileObject(uri, `document_${side}.jpg`) as any,
      );
      formData.append("side", side);
      formData.append("document_type", documentType);
      formData.append("documentType", documentType);
      formData.append("type", documentType);

      const result = await postFormData(formData);

      if (!result.ok) {
        console.error("❌ [ONBOARDING] Error response (/document):", {
          side,
          status: result.status,
          statusText: result.statusText,
          contentType: result.contentType,
          errorData: result.body,
        });
        throw new Error(
          `Upload failed (${result.status}): ${summarizeBackendError(result.body)}`,
        );
      }

      return result.body;
    };

    const frontBody = await uploadOneSide("front", frontImageUri);
    let lastBody: any = frontBody;

    if (documentType !== "passport") {
      if (!backImageUri) {
        throw new Error("Back image is required for this document type");
      }
      lastBody = await uploadOneSide("back", backImageUri);
    }

    const data = lastBody && typeof lastBody === "object" ? lastBody : {};
    return {
      progress: (data as any).onboarding_progress || (data as any).progress,
      onboarding_progress: (data as any).onboarding_progress,
      next_step: (data as any).next_step,
    };
  } catch (error) {
    console.error("❌ [ONBOARDING] Error uploading document:", error);
    throw error;
  }
};

/**
 * Vérifie et finalise l'onboarding (Étape 6/6)
 * @returns Statut du compte après vérification
 */
export const verifyOnboarding = async (
  tosAcceptance?: boolean,
): Promise<{
  success: boolean;
  onboarding_progress: number;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
}> => {
  try {
    const normalizeVerifyResponse = (raw: any) => {
      const pendingRequirements = Array.isArray(raw?.requirements_pending)
        ? raw.requirements_pending
        : Array.isArray(raw?.requirementsPending)
          ? raw.requirementsPending
          : [];

      // Backend v3: /verify is a check-only endpoint (no finalize). Requirements can be
      // returned in different shapes depending on backend version.
      const requirements = {
        currently_due:
          raw?.requirements?.currently_due ||
          raw?.currently_due ||
          pendingRequirements ||
          [],
        eventually_due:
          raw?.requirements?.eventually_due || raw?.eventually_due || [],
        past_due: raw?.requirements?.past_due || raw?.past_due || [],
      };

      const onboardingComplete =
        typeof raw?.onboarding_complete === "boolean"
          ? raw.onboarding_complete
          : requirements.currently_due.length === 0;

      const onboardingProgress =
        raw?.onboarding_progress ??
        raw?.progress ??
        (onboardingComplete ? 100 : 0);

      return {
        success: raw?.success !== false,
        onboarding_progress: onboardingProgress,
        onboarding_complete: onboardingComplete,
        charges_enabled:
          raw?.charges_enabled ?? raw?.account_status?.charges_enabled ?? false,
        payouts_enabled:
          raw?.payouts_enabled ?? raw?.account_status?.payouts_enabled ?? false,
        requirements,
      };
    };

    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/onboarding/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));

      const requiredFields = Array.isArray((errorData as any)?.required)
        ? (errorData as any).required
        : [];
      const errorMessage =
        (errorData as any)?.message || (errorData as any)?.error || "";
      const requiresTosAcceptance =
        response.status === 400 &&
        (requiredFields.includes("tos_acceptance") ||
          String(errorMessage)
            .toLowerCase()
            .includes("terms of service must be accepted"));

      if (requiresTosAcceptance && tosAcceptance) {
        try {
          const completion = await completeOnboarding(true);

          const retryResponse = await fetchWithAuth(
            `${ServerData.serverUrl}v1/stripe/onboarding/verify`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}),
            },
          );

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            return normalizeVerifyResponse(retryData);
          }

          return {
            success: true,
            onboarding_progress: completion.progress,
            onboarding_complete: completion.progress >= 100,
            charges_enabled: completion.accountStatus.charges_enabled,
            payouts_enabled: completion.accountStatus.payouts_enabled,
            requirements: {
              currently_due: [],
              eventually_due: [],
              past_due: [],
            },
          };
        } catch (fallbackError) {
          console.error(
            "❌ [ONBOARDING] Fallback /complete failed:",
            fallbackError,
          );
        }
      }

      console.error(`❌ [ONBOARDING] Error response:`, errorData);
      throw new Error(
        (errorData as any).error ||
          (errorData as any).message ||
          "Failed to verify onboarding",
      );
    }

    const data = await response.json();
    const normalizedData = normalizeVerifyResponse(data);

    try {
    } catch {
      // ignore
    }

    return normalizedData;
  } catch (error) {
    console.error("❌ [ONBOARDING] Error verifying onboarding:", error);
    throw error;
  }
};

/**
 * @deprecated Utiliser verifyOnboarding() à la place
 * Finalise l'onboarding (Étape 5/5)
 * @param tosAccepted Acceptation des CGU Stripe (doit être true)
 */
export const completeOnboarding = async (
  tosAccepted: boolean,
): Promise<{
  progress: number;
  accountStatus: {
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  };
}> => {
  try {
    if (!tosAccepted) {
      throw new Error("Terms of service must be accepted");
    }

    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/onboarding/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tos_acceptance: tosAccepted }),
      },
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "unknown";
      const rawText = await response.text();
      let errorData: unknown = null;

      if (rawText) {
        try {
          errorData = JSON.parse(rawText);
        } catch {
          errorData = rawText;
        }
      }

      console.error(
        `❌ [ONBOARDING] Error response (${response.status} ${response.statusText}):`,
        {
          contentType,
          error: errorData ?? "Empty body",
        },
      );

      const errorMessage =
        typeof errorData === "object" && errorData !== null
          ? (errorData as { error?: string }).error
          : typeof errorData === "string"
            ? errorData
            : "Failed to complete onboarding";

      throw new Error(errorMessage || "Failed to complete onboarding");
    }

    const data = await response.json();

    return {
      progress: data.progress,
      accountStatus: data.account_status,
    };
  } catch (error) {
    console.error("❌ [ONBOARDING] Error completing onboarding:", error);
    throw error;
  }
};

/**
 * Récupère le statut de l'onboarding en cours
 * @returns Statut complet avec progression et étapes complétées
 */
export const getOnboardingStatus = async (): Promise<{
  progress: number;
  status:
    | "not_started"
    | "in_progress"
    | "pending_verification"
    | "completed"
    | "restricted";
  completedSteps: string[];
  pendingSteps: string[];
  stripeAccountId?: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    pending_verification: string[];
  };
}> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/onboarding/status`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error(`❌ [ONBOARDING] Error response:`, errorData);
      throw new Error(errorData.error || "Failed to get onboarding status");
    }

    const data = await response.json();

    return {
      progress: data.progress,
      status: data.status,
      completedSteps: data.completed_steps || [],
      pendingSteps: data.pending_steps || [],
      stripeAccountId: data.stripe_account_id,
      chargesEnabled: data.charges_enabled || false,
      payoutsEnabled: data.payouts_enabled || false,
      requirements: data.requirements,
    };
  } catch (error) {
    console.error("❌ [ONBOARDING] Error getting onboarding status:", error);
    throw error;
  }
};
