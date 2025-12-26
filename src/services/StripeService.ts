/**
 * StripeService - Service API pour Stripe Connect
 * Version simplifiée pour tester avec Company ID 1
 */
import { ServerData } from '../constants/ServerData';
import { safeLogError } from '../utils/logUtils';
import { fetchWithAuth } from '../utils/session';
import { fetchUserProfile } from './user';

// Cache pour éviter les appels répétés à l'API utilisateur
let cachedUserId: string | null = null;

/**
 * Helper pour récupérer le company_id de l'utilisateur connecté
 * CORRIGÉ: Utilise Company ID 1 pour l'utilisateur 15 (Nerd-Test)
 */
const getUserCompanyId = async (): Promise<string> => {
  try {
    // TEMP_DISABLED: console.log('🔍 [COMPANY ID] Getting company_id for user...');
    const profile = await fetchUserProfile();
    const userId = profile.id.toString();
    
    // TEMP_DISABLED: console.log('👤 [USER INFO] User ID:', userId, '-', profile.firstName, profile.lastName);
    
    // TEMPORAIRE: D'après tes données, l'utilisateur 15 est lié à Company ID: 1
    if (userId === '15') {cachedUserId = '1';
      return '1';
    }
    
    // Pour d'autres utilisateurs, utiliser l'ancien comportement (user_id = company_id)
    console.warn('⚠️ [FALLBACK] Using user_id as company_id for user:', userId);
    cachedUserId = userId;
    return userId;
    
  } catch (error) {

    console.error('❌ [COMPANY ID] Failed to get company_id:', error);
    throw new Error('Unable to get user company_id. Please ensure you are logged in.');
  }
};

/**
 * Vérifie le statut de connexion Stripe pour l'utilisateur
 * Utilise l'endpoint backend confirmé : GET /v1/stripe/connect/status
 */
export const checkStripeConnectionStatus = async (): Promise<{
  isConnected: boolean;
  status: 'not_connected' | 'incomplete' | 'active' | 'restricted' | 'pending';
  account?: any;
  details?: string;
}> => {
  try {
    const companyId = await getUserCompanyId();
    // TEMP_DISABLED: console.log('🔍 [STRIPE CONNECTION] Checking connection status for company_id:', companyId);

    // Utiliser l'endpoint confirmé par le backend
    const statusUrl = `${ServerData.serverUrl}v1/stripe/connect/status?company_id=${companyId}`;
    // TEMP_DISABLED: console.log('🌐 [STRIPE STATUS] Calling confirmed endpoint:', statusUrl);

    const response = await fetchWithAuth(statusUrl, {
      method: 'GET',
    });

    // TEMP_DISABLED: console.log(`🔍 [STRIPE CONNECTION] Response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      // TEMP_DISABLED: console.log('✅ [STRIPE CONNECTION] Success! Response received');

      // Analyser la réponse pour déterminer le statut de connexion
      return analyzeStripeConnectionResponse(data);
    } else {
        const errorText = await response.text().catch(() => 'No error text');
      // TEMP_DISABLED: console.log(`❌ [STRIPE CONNECTION] Error details: ${errorText}`);
      
      return {
        isConnected: false,
        status: 'not_connected',
        details: `Status endpoint error: ${response.status}`
      };
    }
  } catch (error) {

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [STRIPE CONNECTION] Error checking connection status:', error);
    return {
      isConnected: false,
      status: 'not_connected',
      details: `Error: ${errorMessage}`
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
    // TEMP_DISABLED: console.log('🏢 Creating Stripe Connect Express account for company:', companyId);

    const createUrl = `${ServerData.serverUrl}v1/stripe/connect/create`;
    // TEMP_DISABLED: console.log('🌐 Full URL being called:', createUrl);
    // TEMP_DISABLED: console.log('🔧 ServerData.serverUrl:', ServerData.serverUrl);
    // TEMP_DISABLED: console.log('🏢 Company ID:', companyId);

    // Appel du vrai endpoint POST du serveur avec company_id dans le body
    const response = await fetchWithAuth(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: companyId
      })
    });

    // TEMP_DISABLED: console.log('📡 [STRIPE CREATE] Response status:', response.status);
    // TEMP_DISABLED: console.log('📡 [STRIPE CREATE] Response ok:', response.ok);

    if (!response.ok) {
      if (response.status === 400) {
        console.warn('⚠️ Account already exists for this company');
        throw new Error('Compte Stripe déjà existant pour cette entreprise');
      }
      const errorText = await response.text().catch(() => 'No error text');
      console.error('❌ [STRIPE CREATE] Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [STRIPE CREATE] Response data received');
    
    if (!data.success || !data.data?.stripe_account_id) {
      throw new Error('API returned invalid account data');
    }

    // TEMP_DISABLED: console.log('✅ Stripe Connect Express account created:', data.data.stripe_account_id);
    // TEMP_DISABLED: console.log('🔗 Onboarding URL received:', data.data.onboarding_url);
    
    return {
      accountId: data.data.stripe_account_id,
      onboardingUrl: data.data.onboarding_url
    };

  } catch (error) {

    console.error('Error creating Stripe Connect Express account:', error);
    
    // Si c'est un compte existant, essayer de récupérer le lien d'onboarding
    if (error instanceof Error && error.message.includes('déjà existant')) {
      try {
        // TEMP_DISABLED: console.log('🔄 Account exists, trying to get onboarding link...');
        const onboardingUrl = await getStripeConnectOnboardingLink();
        return {
          accountId: 'existing_account',
          onboardingUrl: onboardingUrl
        };
      } catch (onboardingError) {

        console.error('Failed to get existing account onboarding link:', onboardingError);
      }
    }
    
    // Return mock data for development
    const mockAccountId = `acct_mock_${Date.now()}`;
    const mockOnboardingUrl = `https://connect.stripe.com/express/setup/mock-${Date.now()}`;
    console.warn(`Using mock data:`, { mockAccountId, mockOnboardingUrl });
    
    return {
      accountId: mockAccountId,
      onboardingUrl: mockOnboardingUrl
    };
  }
};

/**
 * Récupère ou régénère un lien d'onboarding Stripe Connect
 * Utilise l'endpoint backend confirmé: GET /v1/stripe/connect/onboarding
 */
export const getStripeConnectOnboardingLink = async (): Promise<string> => {
  try {
    const companyId = await getUserCompanyId();
    // TEMP_DISABLED: console.log('🔗 Getting Stripe Connect onboarding link for company:', companyId);

    const onboardingUrl = `${ServerData.serverUrl}v1/stripe/connect/onboarding?company_id=${companyId}`;
    // TEMP_DISABLED: console.log('🌐 Onboarding URL being called:', onboardingUrl);

    const response = await fetchWithAuth(onboardingUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // TEMP_DISABLED: console.log('📡 [STRIPE ONBOARDING] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error('❌ [STRIPE ONBOARDING] Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [STRIPE ONBOARDING] Response data received');
    
    if (!data.success || !data.data?.onboarding_url) {
      throw new Error('API returned invalid onboarding link data');
    }

    // TEMP_DISABLED: console.log('✅ Onboarding link retrieved:', data.data.onboarding_url);
    // TEMP_DISABLED: console.log('⏰ Expires at:', data.data.expires_at);
    
    return data.data.onboarding_url;
  } catch (error) {

    console.error('Error getting Stripe Connect onboarding link:', error);
    // Return mock URL for development
    const mockUrl = `https://connect.stripe.com/express/setup/mock-${Date.now()}`;
    console.warn(`Using mock Express onboarding link: ${mockUrl}`);
    return mockUrl;
  }
};

/**
 * Analyse la réponse d'un endpoint Stripe pour déterminer le statut de connexion
 */
const analyzeStripeConnectionResponse = (data: any): {
  isConnected: boolean;
  status: 'not_connected' | 'incomplete' | 'active' | 'restricted' | 'pending';
  account?: any;
  details?: string;
} => {
  // Analyse silencieuse pour éviter tout crash

  // CORRIGÉ: Chercher dans data.data.stripe_account_id car c'est la structure réelle de la réponse
  const accountId = data.data?.stripe_account_id || data.stripe_account_id || data.account?.id || data.id;
  
  if (!accountId || accountId === '' || accountId === 'null') {
    return {
      isConnected: false,
      status: 'not_connected',
      details: 'No Stripe account ID'
    };
  }

  // CORRIGÉ: Chercher dans data.data aussi pour les autres propriétés
  const detailsSubmitted = data.data?.details_submitted ?? data.details_submitted ?? data.account?.details_submitted ?? false;
  const chargesEnabled = data.data?.charges_enabled ?? data.charges_enabled ?? data.account?.charges_enabled ?? false;
  const payoutsEnabled = data.data?.payouts_enabled ?? data.payouts_enabled ?? data.account?.payouts_enabled ?? false;

  // Vérifier les blocages - aussi dans data.data
  const requirements = data.data?.requirements ?? data.requirements ?? data.account?.requirements ?? {};
  const currentlyDue = requirements.currently_due ?? [];
  const pastDue = requirements.past_due ?? [];
  const disabledReason = requirements.disabled_reason;

  // Déterminer le statut
  if (disabledReason) {
    return {
      isConnected: true,
      status: 'restricted',
      account: data,
      details: `Account restricted: ${disabledReason}`
    };
  }

  if (pastDue.length > 0) {
    return {
      isConnected: true,
      status: 'restricted',
      account: data,
      details: `Past due requirements: ${pastDue.join(', ')}`
    };
  }

  if (!detailsSubmitted || !chargesEnabled || !payoutsEnabled) {
    return {
      isConnected: true,
      status: 'incomplete',
      account: data,
      details: 'Onboarding not completed'
    };
  }

  if (currentlyDue.length > 0) {
    return {
      isConnected: true,
      status: 'pending',
      account: data,
      details: `Pending requirements: ${currentlyDue.join(', ')}`
    };
  }

  // Tout semble bon !
  return {
    isConnected: true,
    status: 'active',
    account: data,
    details: 'Account is fully operational'
  };
};

// Fonctions export par défaut (pour éviter les erreurs d'import)
export const fetchStripePayments = async () => {
  try {
    const companyId = await getUserCompanyId();
    // TEMP_DISABLED: console.log('� [FETCH PAYMENTS] Loading REAL payments data for company:', companyId);

    // Essayer l'endpoint payments dédié
    const paymentsUrl = `${ServerData.serverUrl}v1/stripe/payments?company_id=${companyId}`;
    // TEMP_DISABLED: console.log('🌐 [FETCH PAYMENTS] Calling payments endpoint:', paymentsUrl);

    const response = await fetchWithAuth(paymentsUrl, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      // TEMP_DISABLED: console.log('✅ [FETCH PAYMENTS] Payments API response received');
      
      if (data.success && data.data) {const payments = data.data.map((payment: any) => ({
          id: payment.id || payment.stripe_payment_id,
          date: payment.created || payment.date || new Date().toISOString(),
          amount: payment.amount_received || payment.amount || 0,
          currency: payment.currency || 'AUD',
          status: payment.status || 'succeeded',
          description: payment.description || 'Payment',
          customer: payment.customer_name || payment.customer || 'Customer',
          method: payment.payment_method || 'card'
        }));
        
        // TEMP_DISABLED: console.log('💳 [FETCH PAYMENTS] Processed payments:', payments.length, 'items');
        return payments;
      }
    } else {
      console.warn('⚠️ [FETCH PAYMENTS] Payments endpoint failed, status:', response.status);
    }

    throw new Error('Unable to fetch payments from API');

  } catch (error: any) {

    safeLogError('❌ [FETCH PAYMENTS] Error fetching real payments:', error);
    // Retourner des données vides en cas d'erreur
    // TEMP_DISABLED: console.log('💳 [FETCH PAYMENTS] Using empty payments list');
    return [];
  }
};

export const fetchStripePayouts = async () => {
  try {
    const companyId = await getUserCompanyId();
    // TEMP_DISABLED: console.log('� [FETCH PAYOUTS] Loading REAL payouts data for company:', companyId);

    // Essayer l'endpoint payouts dédié
    const payoutsUrl = `${ServerData.serverUrl}v1/stripe/payouts?company_id=${companyId}`;
    // TEMP_DISABLED: console.log('🌐 [FETCH PAYOUTS] Calling payouts endpoint:', payoutsUrl);

    const response = await fetchWithAuth(payoutsUrl, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      // TEMP_DISABLED: console.log('✅ [FETCH PAYOUTS] Payouts API response received');
      
      if (data.success && data.data) {const payoutsList = data.data.payouts || data.data || [];
        // TEMP_DISABLED: console.log('💸 [FETCH PAYOUTS] Raw payouts list:', payoutsList);
        
        const payouts = Array.isArray(payoutsList) ? payoutsList.map((payout: any) => ({
          id: payout.id || payout.stripe_payout_id,
          date: payout.created || payout.date || new Date().toISOString(),
          amount: payout.amount || 0,
          currency: payout.currency || 'AUD',
          status: payout.status || 'paid',
          description: payout.description || 'Payout',
          arrivalDate: payout.arrival_date || new Date(Date.now() + 24*60*60*1000).toISOString(),
          method: payout.method || 'standard',
          type: payout.type || 'bank_account'
        })) : [];
        
        // TEMP_DISABLED: console.log('💸 [FETCH PAYOUTS] Processed payouts:', payouts.length, 'items');
        return payouts;
      }
    } else {
      console.warn('⚠️ [FETCH PAYOUTS] Payouts endpoint failed, status:', response.status);
    }

    throw new Error('Unable to fetch payouts from API');

  } catch (error: any) {

    safeLogError('❌ [FETCH PAYOUTS] Error fetching real payouts:', error);
    // Retourner des données vides en cas d'erreur
    // TEMP_DISABLED: console.log('💸 [FETCH PAYOUTS] Using empty payouts list');
    return [];
  }
};

export const fetchStripeAccount = async () => {
  try {
    const companyId = await getUserCompanyId();
    // TEMP_DISABLED: console.log('📊 [FETCH ACCOUNT] Loading REAL account data for company:', companyId);

    // Utiliser l'endpoint de statut qui contient toutes les infos du compte
    const statusUrl = `${ServerData.serverUrl}v1/stripe/connect/status?company_id=${companyId}`;
    // TEMP_DISABLED: console.log('🌐 [FETCH ACCOUNT] Calling endpoint:', statusUrl);

    const response = await fetchWithAuth(statusUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch account: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [FETCH ACCOUNT] Raw API response received');
    
    if (!data.success || !data.data) {
      throw new Error('Invalid account data from API');
    }

    // Transformer les données API en format attendu par les hooks
    const accountData = {
      stripe_account_id: data.data.stripe_account_id,
      charges_enabled: data.data.charges_enabled,
      payouts_enabled: data.data.payouts_enabled,
      details_submitted: data.data.details_submitted,
      onboarding_completed: data.data.onboarding_completed,
      business_name: data.data.business_profile?.name || 'Company test',
      support_email: data.data.business_profile?.support_email || null,
      country: data.data.country || 'AU',
      default_currency: data.data.default_currency || 'AUD',
      bank_accounts: data.data.external_accounts?.data || [], // Récupéré depuis external_accounts si disponible
      requirements: data.data.requirements || {
        currently_due: [],
        eventually_due: [],
        past_due: [],
        disabled_reason: null
      },
      capabilities: data.data.capabilities || {}
    };

    // TEMP_DISABLED: console.log('📊 [FETCH ACCOUNT] Processed account data:', JSON.stringify(accountData, null, 2));
    return accountData;

  } catch (error) {

    console.error('❌ [FETCH ACCOUNT] Error fetching real account data:', error);
    // Fallback vers les données mock en cas d'erreur
    return {
      stripe_account_id: 'acct_1SV8KSIsgSU2xbML',
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
      onboarding_completed: true,
      business_name: 'Company test (fallback)',
      support_email: 'support@company-test.com.au',
      country: 'AU',
      default_currency: 'AUD',
      bank_accounts: [],
      requirements: {
        currently_due: [],
        eventually_due: [],
        past_due: [],
        disabled_reason: null
      }
    };
  }
};

export const fetchStripeBalance = async () => {
  try {
    const companyId = await getUserCompanyId();
    // TEMP_DISABLED: console.log('� [FETCH BALANCE] Loading REAL balance data for company:', companyId);

    // Essayer l'endpoint balance dédié
    const balanceUrl = `${ServerData.serverUrl}v1/stripe/balance?company_id=${companyId}`;
    // TEMP_DISABLED: console.log('🌐 [FETCH BALANCE] Calling balance endpoint:', balanceUrl);

    const response = await fetchWithAuth(balanceUrl, {
      method: 'GET',
    });

    if (response.ok) {
      const data = await response.json();
      // TEMP_DISABLED: console.log('✅ [FETCH BALANCE] Balance API response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.data) {const balanceData = {
          available: data.data.available?.amount || 0,
          pending: data.data.pending?.amount || 0
        };
        // TEMP_DISABLED: console.log('💰 [FETCH BALANCE] Processed balance:', balanceData);
        return balanceData;
      }
    } else {
      console.warn('⚠️ [FETCH BALANCE] Balance endpoint failed, status:', response.status);
    }

    // Si l'endpoint balance n'existe pas, essayer de récupérer depuis l'endpoint status
    // TEMP_DISABLED: console.log('💰 [FETCH BALANCE] Fallback: trying to get balance from status endpoint');
    
    const statusUrl = `${ServerData.serverUrl}v1/stripe/connect/status?company_id=${companyId}`;
    const statusResponse = await fetchWithAuth(statusUrl, {
      method: 'GET',
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      // TEMP_DISABLED: console.log('💰 [FETCH BALANCE] Status response for balance:', JSON.stringify(statusData, null, 2));
      
      if (statusData.success && statusData.data) {const balance = statusData.data.balance || { available: 0, pending: 0 };
        // TEMP_DISABLED: console.log('💰 [FETCH BALANCE] Balance from status endpoint:', balance);
        return balance;
      }
    }

    throw new Error('Unable to fetch balance from any endpoint');

  } catch (error) {

    console.error('❌ [FETCH BALANCE] Error fetching real balance:', error);
    // Fallback vers données mock avec valeurs réalistes
    const fallbackBalance = { available: 0, pending: 0 };
    // TEMP_DISABLED: console.log('💰 [FETCH BALANCE] Using fallback balance:', fallbackBalance);
    return fallbackBalance;
  }
};

/**
 * Crée un compte Stripe Connect et retourne le lien d'onboarding
 * NOUVEAU: Fonction combinée demandée par StripeHub.tsx
 */
export const createStripeConnectAccountAndLink = async (): Promise<string> => {
  try {
    // TEMP_DISABLED: console.log('🔗 [CREATE & LINK] Creating Stripe Connect account and getting onboarding link...');
    
    // Essayer de créer un compte d'abord
    const result = await createStripeConnectAccount();
    // TEMP_DISABLED: console.log('✅ [CREATE & LINK] Account creation result:', result);
    
    // Retourner l'URL d'onboarding
    return result.onboardingUrl;
    
  } catch (error) {
    try {
      const onboardingUrl = await getStripeConnectOnboardingLink();
      // TEMP_DISABLED: console.log('✅ [CREATE & LINK] Got existing account onboarding link:', onboardingUrl);
      return onboardingUrl;
      
    } catch (onboardingError) {

      console.error('❌ [CREATE & LINK] Failed to get any onboarding link:', onboardingError);
      
      // En dernier recours, retourner une URL mock
      const mockUrl = `https://connect.stripe.com/express/setup/mock-${Date.now()}`;
      console.warn('🔧 [CREATE & LINK] Using mock URL:', mockUrl);
      return mockUrl;
    }
  }
};

// Fonctions additionnelles utilisées par les hooks
export const createInstantPayout = async (amount: number): Promise<string> => {
  console.log('💸 [CREATE PAYOUT] Creating instant payout for:', amount);
  
  try {
    // ✅ Utiliser l'endpoint réel POST /stripe/payouts/create
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/stripe/payouts/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Stripe utilise les centimes
        currency: 'aud',
        method: 'instant', // Payout instantané
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [CREATE PAYOUT] API error:', response.status, errorData);
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to create payout`);
    }

    const data = await response.json();
    console.log('✅ [CREATE PAYOUT] Payout created:', data);
    
    // Retourner l'ID du payout
    return data.data?.id || data.id || `po_${Date.now()}`;
  } catch (error) {
    console.error('❌ [CREATE PAYOUT] Error:', error);
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
export const createStripePaymentLink = async (request: CreatePaymentLinkRequest): Promise<PaymentLink> => {
  try {
    const response = await fetchWithAuth(`${ServerData.serverUrl}v1/stripe/payment-links/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency || 'aud',
        description: request.description,
        customer_email: request.customer_email,
        metadata: request.metadata
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to create payment link');
    }

    return data.data;
  } catch (error) {
    safeLogError('CREATE_PAYMENT_LINK', error);
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
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.active !== undefined) params.append('active', options.active.toString());

    const url = `${ServerData.serverUrl}v1/stripe/payment-links/list${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetchWithAuth(url, { method: 'GET' });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch payment links');
    }

    return data.data;
  } catch (error) {
    safeLogError('FETCH_PAYMENT_LINKS', error);
    throw error;
  }
};

/**
 * Récupère les détails d'un lien de paiement
 * GET /v1/stripe/payment-links/:id
 */
export const getStripePaymentLink = async (linkId: string): Promise<PaymentLink> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/payment-links/${linkId}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch payment link');
    }

    return data.data;
  } catch (error) {
    safeLogError('GET_PAYMENT_LINK', error);
    throw error;
  }
};

/**
 * Met à jour un lien de paiement
 * PATCH /v1/stripe/payment-links/:id
 */
export const updateStripePaymentLink = async (
  linkId: string,
  updates: { active?: boolean; metadata?: Record<string, string> }
): Promise<PaymentLink> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/payment-links/${linkId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update payment link');
    }

    return data.data;
  } catch (error) {
    safeLogError('UPDATE_PAYMENT_LINK', error);
    throw error;
  }
};

/**
 * Désactive un lien de paiement
 * POST /v1/stripe/payment-links/:id/deactivate
 */
export const deactivateStripePaymentLink = async (linkId: string): Promise<{ id: string; active: boolean }> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/payment-links/${linkId}/deactivate`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to deactivate payment link');
    }

    return data.data;
  } catch (error) {
    safeLogError('DEACTIVATE_PAYMENT_LINK', error);
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
      interval?: 'manual' | 'daily' | 'weekly' | 'monthly';
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
export const getStripeAccountSettings = async (): Promise<StripeAccountSettings> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/account/settings`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch account settings');
    }

    return data.data.settings;
  } catch (error) {
    safeLogError('GET_ACCOUNT_SETTINGS', error);
    throw error;
  }
};

/**
 * Met à jour les paramètres du compte Stripe
 * PATCH /v1/stripe/account/settings
 */
export const updateStripeAccountSettings = async (
  settings: Partial<Omit<StripeAccountSettings, 'account_status'>>
): Promise<StripeAccountSettings> => {
  try {
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/account/settings`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update account settings');
    }

    return data.data.settings;
  } catch (error) {
    safeLogError('UPDATE_ACCOUNT_SETTINGS', error);
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
export const getStripeSettingsHistory = async (limit?: number): Promise<SettingsHistoryEntry[]> => {
  try {
    const params = limit ? `?limit=${limit}` : '';
    const response = await fetchWithAuth(
      `${ServerData.serverUrl}v1/stripe/account/settings/history${params}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch settings history');
    }

    return data.data.history;
  } catch (error) {
    safeLogError('GET_SETTINGS_HISTORY', error);
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
    amount?: number;      // Optionnel, utilise amount_total du job par défaut
    currency?: string;    // Optionnel, défaut "AUD"
    description?: string; // Optionnel, description personnalisée
  } = {}
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
    // TEMP_DISABLED: console.log(`💳 [JOB PAYMENT] Creating Payment Intent for job ${jobId}...`);

    const createUrl = `${ServerData.serverUrl}v1/jobs/${jobId}/payment/create`;
    // TEMP_DISABLED: console.log('🌐 [JOB PAYMENT] Calling endpoint:', createUrl);

    const response = await fetchWithAuth(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options)
    });

    // TEMP_DISABLED: console.log(`📡 [JOB PAYMENT] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [JOB PAYMENT] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à créer un paiement pour ce job');
      } else if (response.status === 404) {
        throw new Error('Job introuvable');
      } else if (response.status === 400) {
        throw new Error('Données de paiement invalides');
      }
      
      throw new Error(`Erreur lors de la création du paiement: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [JOB PAYMENT] Payment Intent created:', JSON.stringify(data, null, 2));

    if (!data.success || !data.data?.payment_intent_id) {
      throw new Error('API returned invalid Payment Intent data');
    }

    // TEMP_DISABLED: console.log(`💳 [JOB PAYMENT] Payment Intent ID: ${data.data.payment_intent_id}`);
    // TEMP_DISABLED: console.log(`💰 [JOB PAYMENT] Amount: ${data.data.amount / 100} ${data.data.currency.toUpperCase()}`);
    // TEMP_DISABLED: console.log(`💼 [JOB PAYMENT] Application Fee: ${data.data.application_fee_amount / 100} ${data.data.currency.toUpperCase()}`);

    return data.data;

  } catch (error) {

    console.error('❌ [JOB PAYMENT] Error creating Payment Intent:', error);
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
  status: 'succeeded' | 'failed'
): Promise<{
  job: any;
  payment_status: string;
  message: string;
}> => {
  try {
    // TEMP_DISABLED: console.log(`✅ [JOB PAYMENT] Confirming payment for job ${jobId}...`);
    // TEMP_DISABLED: console.log(`💳 [JOB PAYMENT] Payment Intent: ${paymentIntentId}, Status: ${status}`);

    const confirmUrl = `${ServerData.serverUrl}v1/jobs/${jobId}/payment/confirm`;
    // TEMP_DISABLED: console.log('🌐 [JOB PAYMENT] Calling endpoint:', confirmUrl);

    const response = await fetchWithAuth(confirmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_intent_id: paymentIntentId,
        status: status
      })
    });

    // TEMP_DISABLED: console.log(`📡 [JOB PAYMENT] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [JOB PAYMENT] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à confirmer le paiement de ce job');
      } else if (response.status === 404) {
        throw new Error('Job ou paiement introuvable');
      }
      
      throw new Error(`Erreur lors de la confirmation du paiement: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [JOB PAYMENT] Payment confirmed:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error('API returned error during payment confirmation');
    }

    // TEMP_DISABLED: console.log(`✅ [JOB PAYMENT] Job updated with payment status: ${data.data.payment_status}`);
    // TEMP_DISABLED: console.log(`💰 [JOB PAYMENT] Amount paid: ${data.data.job.amount_paid}`);

    return data.data;

  } catch (error) {

    console.error('❌ [JOB PAYMENT] Error confirming payment:', error);
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
  jobId: string | number
): Promise<{
  payments: Array<{
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
  }>;
  meta: {
    job_id: number;
    total_payments: number;
    source: string;
  };
}> => {
  try {
    // TEMP_DISABLED: console.log(`📊 [JOB PAYMENT] Getting payment history for job ${jobId}...`);

    const historyUrl = `${ServerData.serverUrl}v1/jobs/${jobId}/payments`;
    // TEMP_DISABLED: console.log('🌐 [JOB PAYMENT] Calling endpoint:', historyUrl);

    const response = await fetchWithAuth(historyUrl, {
      method: 'GET'
    });

    // TEMP_DISABLED: console.log(`📡 [JOB PAYMENT] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [JOB PAYMENT] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à voir l\'historique de ce job');
      } else if (response.status === 404) {
        throw new Error('Job introuvable');
      }
      
      throw new Error(`Erreur lors de la récupération de l'historique: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [JOB PAYMENT] Payment history retrieved:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error('API returned error for payment history');
    }

    // TEMP_DISABLED: console.log(`📊 [JOB PAYMENT] Found ${data.data.length} payments for job ${jobId}`);
    // TEMP_DISABLED: console.log(`🔒 [JOB PAYMENT] Data source: ${data.meta?.source || 'stripe_api'} (sécurisé)`);

    return data;

  } catch (error) {

    console.error('❌ [JOB PAYMENT] Error getting payment history:', error);
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
    amount?: number;      // Montant en centimes, null = remboursement total
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, string>;
    reverse_transfer?: boolean; // Annuler le transfer vers le compte connecté
  } = {}
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
    // TEMP_DISABLED: console.log(`💸 [STRIPE REFUND] Creating refund for Payment Intent ${paymentIntentId}...`);

    const createUrl = `${ServerData.serverUrl}v1/stripe/refunds/create`;
    // TEMP_DISABLED: console.log('🌐 [STRIPE REFUND] Calling endpoint:', createUrl);

    const response = await fetchWithAuth(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_intent_id: paymentIntentId,
        ...options
      })
    });

    // TEMP_DISABLED: console.log(`📡 [STRIPE REFUND] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [STRIPE REFUND] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à créer un remboursement');
      } else if (response.status === 404) {
        throw new Error('Paiement introuvable pour remboursement');
      } else if (response.status === 400) {
        throw new Error('Données de remboursement invalides');
      }
      
      throw new Error(`Erreur lors de la création du remboursement: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [STRIPE REFUND] Refund created:', JSON.stringify(data, null, 2));

    if (!data.success || !data.data?.refund_id) {
      throw new Error('API returned invalid refund data');
    }

    // TEMP_DISABLED: console.log(`💸 [STRIPE REFUND] Refund ID: ${data.data.refund_id}`);
    // TEMP_DISABLED: console.log(`💰 [STRIPE REFUND] Amount: ${data.data.amount / 100} ${data.data.currency.toUpperCase()}`);
    // TEMP_DISABLED: console.log(`📋 [STRIPE REFUND] Status: ${data.data.status}`);

    return data.data;

  } catch (error) {

    console.error('❌ [STRIPE REFUND] Error creating refund:', error);
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
  } = {}
): Promise<{
  refunds: Array<{
    id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'succeeded' | 'failed' | 'canceled';
    reason: string | null;
    receipt_number: string | null;
    payment_intent_id: string;
    created: string;
    updated: string | null;
    metadata: Record<string, string>;
  }>;
  meta: {
    total_count: number;
    has_more: boolean;
    source: string;
  };
}> => {
  try {
    const companyId = await getUserCompanyId();
    // TEMP_DISABLED: console.log('💸 [FETCH REFUNDS] Loading refunds for company:', companyId);

    const queryParams = new URLSearchParams({
      company_id: companyId.toString(),
      ...Object.fromEntries(
        Object.entries(filters).map(([key, value]) => [
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value)
        ])
      )
    });

    const refundsUrl = `${ServerData.serverUrl}v1/stripe/refunds?${queryParams}`;
    // TEMP_DISABLED: console.log('🌐 [FETCH REFUNDS] Calling endpoint:', refundsUrl);

    const response = await fetchWithAuth(refundsUrl, {
      method: 'GET'
    });

    // TEMP_DISABLED: console.log(`📡 [FETCH REFUNDS] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [FETCH REFUNDS] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à voir les remboursements');
      }
      
      throw new Error(`Erreur lors de la récupération des remboursements: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [FETCH REFUNDS] Refunds retrieved:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error('API returned error for refunds');
    }

    // TEMP_DISABLED: console.log(`💸 [FETCH REFUNDS] Found ${data.data.length} refunds`);
    // TEMP_DISABLED: console.log(`🔒 [FETCH REFUNDS] Data source: ${data.meta?.source || 'stripe_api'} (sécurisé)`);

    return {
      refunds: data.data,
      meta: data.meta
    };

  } catch (error) {

    console.error('❌ [FETCH REFUNDS] Error fetching refunds:', error);
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
  refundId: string
): Promise<{
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
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
    // TEMP_DISABLED: console.log(`💸 [REFUND DETAILS] Getting details for refund ${refundId}...`);

    const detailsUrl = `${ServerData.serverUrl}v1/stripe/refunds/${refundId}`;
    // TEMP_DISABLED: console.log('🌐 [REFUND DETAILS] Calling endpoint:', detailsUrl);

    const response = await fetchWithAuth(detailsUrl, {
      method: 'GET'
    });

    // TEMP_DISABLED: console.log(`📡 [REFUND DETAILS] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [REFUND DETAILS] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à voir ce remboursement');
      } else if (response.status === 404) {
        throw new Error('Remboursement introuvable');
      }
      
      throw new Error(`Erreur lors de la récupération du remboursement: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [REFUND DETAILS] Refund details retrieved:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error('API returned error for refund details');
    }

    // TEMP_DISABLED: console.log(`💸 [REFUND DETAILS] Refund ${refundId} status: ${data.data.status}`);
    // TEMP_DISABLED: console.log(`💰 [REFUND DETAILS] Amount: ${data.data.amount / 100} ${data.data.currency.toUpperCase()}`);

    return data.data;

  } catch (error) {

    console.error('❌ [REFUND DETAILS] Error getting refund details:', error);
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
  refundId: string
): Promise<{
  id: string;
  status: 'canceled';
  canceled_at: string;
  amount: number;
  currency: string;
}> => {
  try {
    // TEMP_DISABLED: console.log(`❌ [CANCEL REFUND] Canceling refund ${refundId}...`);

    const cancelUrl = `${ServerData.serverUrl}v1/stripe/refunds/${refundId}/cancel`;
    // TEMP_DISABLED: console.log('🌐 [CANCEL REFUND] Calling endpoint:', cancelUrl);

    const response = await fetchWithAuth(cancelUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // TEMP_DISABLED: console.log(`📡 [CANCEL REFUND] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [CANCEL REFUND] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à annuler ce remboursement');
      } else if (response.status === 404) {
        throw new Error('Remboursement introuvable');
      } else if (response.status === 400) {
        throw new Error('Impossible d\'annuler ce remboursement (probablement déjà traité)');
      }
      
      throw new Error(`Erreur lors de l'annulation du remboursement: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [CANCEL REFUND] Refund canceled:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error('API returned error during refund cancellation');
    }

    // TEMP_DISABLED: console.log(`❌ [CANCEL REFUND] Refund ${refundId} successfully canceled`);

    return data.data;

  } catch (error) {

    console.error('❌ [CANCEL REFUND] Error canceling refund:', error);
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
export const createStripeInvoice = async (
  invoiceData: {
    customer_email: string;
    customer_name?: string;
    description?: string;
    line_items: Array<{
      description: string;
      quantity: number;
      unit_amount: number; // En centimes
      currency?: string;
    }>;
    due_date?: string; // ISO string
    metadata?: Record<string, string>;
    auto_advance?: boolean; // Auto-finaliser la facture
    collection_method?: 'send_invoice' | 'charge_automatically';
  }
): Promise<{
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
    // TEMP_DISABLED: console.log('🧾 [STRIPE INVOICE] Creating invoice...');

    const createUrl = `${ServerData.serverUrl}v1/stripe/invoices/create`;
    // TEMP_DISABLED: console.log('🌐 [STRIPE INVOICE] Calling endpoint:', createUrl);

    const response = await fetchWithAuth(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData)
    });

    // TEMP_DISABLED: console.log(`📡 [STRIPE INVOICE] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [STRIPE INVOICE] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à créer une facture');
      } else if (response.status === 400) {
        throw new Error('Données de facture invalides');
      }
      
      throw new Error(`Erreur lors de la création de la facture: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [STRIPE INVOICE] Invoice created:', JSON.stringify(data, null, 2));

    if (!data.success || !data.data?.invoice_id) {
      throw new Error('API returned invalid invoice data');
    }

    // TEMP_DISABLED: console.log(`🧾 [STRIPE INVOICE] Invoice ID: ${data.data.invoice_id}`);
    // TEMP_DISABLED: console.log(`💰 [STRIPE INVOICE] Amount due: ${data.data.amount_due / 100} ${data.data.currency.toUpperCase()}`);
    // TEMP_DISABLED: console.log(`📧 [STRIPE INVOICE] Customer: ${data.data.customer_email}`);

    return data.data;

  } catch (error) {

    console.error('❌ [STRIPE INVOICE] Error creating invoice:', error);
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
    status?: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
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
  } = {}
): Promise<{
  invoices: Array<{
    id: string;
    number: string;
    status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
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
  }>;
  meta: {
    total_count: number;
    has_more: boolean;
    source: string;
  };
}> => {
  try {
    const companyId = await getUserCompanyId();
    // TEMP_DISABLED: console.log('🧾 [FETCH INVOICES] Loading invoices for company:', companyId);

    const queryParams = new URLSearchParams({
      company_id: companyId.toString(),
      ...Object.fromEntries(
        Object.entries(filters).map(([key, value]) => [
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value)
        ])
      )
    });

    const invoicesUrl = `${ServerData.serverUrl}v1/stripe/invoices?${queryParams}`;
    // TEMP_DISABLED: console.log('🌐 [FETCH INVOICES] Calling endpoint:', invoicesUrl);

    const response = await fetchWithAuth(invoicesUrl, {
      method: 'GET'
    });

    // TEMP_DISABLED: console.log(`📡 [FETCH INVOICES] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [FETCH INVOICES] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à voir les factures');
      }
      
      throw new Error(`Erreur lors de la récupération des factures: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [FETCH INVOICES] Invoices retrieved:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error('API returned error for invoices');
    }

    // TEMP_DISABLED: console.log(`🧾 [FETCH INVOICES] Found ${data.data.length} invoices`);
    // TEMP_DISABLED: console.log(`🔒 [FETCH INVOICES] Data source: ${data.meta?.source || 'stripe_api'} (sécurisé)`);

    return {
      invoices: data.data,
      meta: data.meta
    };

  } catch (error) {

    console.error('❌ [FETCH INVOICES] Error fetching invoices:', error);
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
  invoiceId: string
): Promise<{
  invoice_id: string;
  sent: boolean;
  sent_at: string;
  customer_email: string;
}> => {
  try {
    // TEMP_DISABLED: console.log(`📧 [SEND INVOICE] Sending invoice ${invoiceId} by email...`);

    const sendUrl = `${ServerData.serverUrl}v1/stripe/invoices/${invoiceId}/send`;
    // TEMP_DISABLED: console.log('🌐 [SEND INVOICE] Calling endpoint:', sendUrl);

    const response = await fetchWithAuth(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // TEMP_DISABLED: console.log(`📡 [SEND INVOICE] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [SEND INVOICE] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à envoyer cette facture');
      } else if (response.status === 404) {
        throw new Error('Facture introuvable');
      } else if (response.status === 400) {
        throw new Error('Impossible d\'envoyer cette facture (vérifiez son statut)');
      }
      
      throw new Error(`Erreur lors de l'envoi de la facture: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [SEND INVOICE] Invoice sent:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error('API returned error during invoice sending');
    }

    // TEMP_DISABLED: console.log(`📧 [SEND INVOICE] Invoice ${invoiceId} sent to ${data.data.customer_email}`);

    return data.data;

  } catch (error) {

    console.error('❌ [SEND INVOICE] Error sending invoice:', error);
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
  }
): Promise<{
  invoice_id: string;
  status: 'paid';
  amount_paid: number;
  paid_at: string;
  payment_method: string | null;
}> => {
  try {
    // TEMP_DISABLED: console.log(`✅ [MARK PAID] Marking invoice ${invoiceId} as paid...`);

    const markUrl = `${ServerData.serverUrl}v1/stripe/invoices/${invoiceId}/mark_paid`;
    // TEMP_DISABLED: console.log('🌐 [MARK PAID] Calling endpoint:', markUrl);

    const response = await fetchWithAuth(markUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentDetails || {})
    });

    // TEMP_DISABLED: console.log(`📡 [MARK PAID] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [MARK PAID] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à modifier cette facture');
      } else if (response.status === 404) {
        throw new Error('Facture introuvable');
      } else if (response.status === 400) {
        throw new Error('Impossible de marquer cette facture comme payée');
      }
      
      throw new Error(`Erreur lors de la mise à jour de la facture: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [MARK PAID] Invoice marked as paid:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error('API returned error during invoice update');
    }

    // TEMP_DISABLED: console.log(`✅ [MARK PAID] Invoice ${invoiceId} marked as paid`);

    return data.data;

  } catch (error) {

    console.error('❌ [MARK PAID] Error marking invoice as paid:', error);
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
  invoiceId: string
): Promise<{
  invoice_id: string;
  status: 'void';
  voided_at: string;
}> => {
  try {
    // TEMP_DISABLED: console.log(`❌ [VOID INVOICE] Voiding invoice ${invoiceId}...`);

    const voidUrl = `${ServerData.serverUrl}v1/stripe/invoices/${invoiceId}/void`;
    // TEMP_DISABLED: console.log('🌐 [VOID INVOICE] Calling endpoint:', voidUrl);

    const response = await fetchWithAuth(voidUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // TEMP_DISABLED: console.log(`📡 [VOID INVOICE] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [VOID INVOICE] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à annuler cette facture');
      } else if (response.status === 404) {
        throw new Error('Facture introuvable');
      } else if (response.status === 400) {
        throw new Error('Impossible d\'annuler cette facture (vérifiez son statut)');
      }
      
      throw new Error(`Erreur lors de l'annulation de la facture: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [VOID INVOICE] Invoice voided:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error('API returned error during invoice voiding');
    }

    // TEMP_DISABLED: console.log(`❌ [VOID INVOICE] Invoice ${invoiceId} successfully voided`);

    return data.data;

  } catch (error) {

    console.error('❌ [VOID INVOICE] Error voiding invoice:', error);
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
export const getStripeAnalytics = async (
  period: {
    start_date: string; // ISO string
    end_date: string;   // ISO string
    granularity?: 'day' | 'week' | 'month';
  }
): Promise<{
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
  period_data: Array<{
    date: string;
    revenue: number;
    fees: number;
    net: number;
    payments_count: number;
    refunds_count: number;
    refund_amount: number;
  }>;
  top_customers: Array<{
    customer_id: string;
    customer_email: string;
    total_spent: number;
    payments_count: number;
  }>;
  payment_methods: Array<{
    type: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  currency_breakdown: Array<{
    currency: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  meta: {
    period: string;
    granularity: string;
    timezone: string;
    source: string;
  };
}> => {
  try {
    const companyId = await getUserCompanyId();
    // TEMP_DISABLED: console.log('📊 [STRIPE ANALYTICS] Loading analytics for company:', companyId);

    const queryParams = new URLSearchParams({
      company_id: companyId.toString(),
      start_date: period.start_date,
      end_date: period.end_date,
      granularity: period.granularity || 'day'
    });

    const analyticsUrl = `${ServerData.serverUrl}v1/stripe/analytics/overview?${queryParams}`;
    // TEMP_DISABLED: console.log('🌐 [STRIPE ANALYTICS] Calling endpoint:', analyticsUrl);

    const response = await fetchWithAuth(analyticsUrl, {
      method: 'GET'
    });

    // TEMP_DISABLED: console.log(`📡 [STRIPE ANALYTICS] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [STRIPE ANALYTICS] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à voir les analytics');
      }
      
      throw new Error(`Erreur lors de la récupération des analytics: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [STRIPE ANALYTICS] Analytics retrieved:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error('API returned error for analytics');
    }

    // TEMP_DISABLED: console.log(`📊 [STRIPE ANALYTICS] Revenue: ${data.data.metrics.total_revenue / 100} ${data.data.currency || 'AUD'}`);
    // TEMP_DISABLED: console.log(`📊 [STRIPE ANALYTICS] Payments: ${data.data.metrics.total_payments}`);
    // TEMP_DISABLED: console.log(`📊 [STRIPE ANALYTICS] Success rate: ${data.data.metrics.success_rate.toFixed(2)}%`);

    return data.data;

  } catch (error) {

    console.error('❌ [STRIPE ANALYTICS] Error fetching analytics:', error);
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
export const exportStripeDataCSV = async (
  exportConfig: {
    type: 'payments' | 'refunds' | 'invoices' | 'payouts' | 'analytics';
    start_date: string;
    end_date: string;
    filters?: Record<string, any>;
    include_fields?: string[];
  }
): Promise<{
  download_url: string;
  file_name: string;
  expires_at: string;
  record_count: number;
}> => {
  try {
    const companyId = await getUserCompanyId();
    // TEMP_DISABLED: console.log('📄 [CSV EXPORT] Creating CSV export for company:', companyId);

    const exportUrl = `${ServerData.serverUrl}v1/stripe/exports/csv`;
    // TEMP_DISABLED: console.log('🌐 [CSV EXPORT] Calling endpoint:', exportUrl);

    const response = await fetchWithAuth(exportUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: companyId,
        ...exportConfig
      })
    });

    // TEMP_DISABLED: console.log(`📡 [CSV EXPORT] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [CSV EXPORT] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à exporter les données');
      } else if (response.status === 400) {
        throw new Error('Configuration d\'export invalide');
      }
      
      throw new Error(`Erreur lors de la création de l'export: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [CSV EXPORT] Export created:', JSON.stringify(data, null, 2));

    if (!data.success || !data.data?.download_url) {
      throw new Error('API returned invalid export data');
    }

    // TEMP_DISABLED: console.log(`📄 [CSV EXPORT] File: ${data.data.file_name}`);
    // TEMP_DISABLED: console.log(`📊 [CSV EXPORT] Records: ${data.data.record_count}`);
    // TEMP_DISABLED: console.log(`🔗 [CSV EXPORT] Download: ${data.data.download_url}`);

    return data.data;

  } catch (error) {

    console.error('❌ [CSV EXPORT] Error creating CSV export:', error);
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
export const exportStripeDataPDF = async (
  reportConfig: {
    type: 'monthly_report' | 'payment_summary' | 'refund_report' | 'invoice_summary';
    start_date: string;
    end_date: string;
    template?: 'standard' | 'detailed' | 'summary';
    include_charts?: boolean;
    company_branding?: boolean;
  }
): Promise<{
  download_url: string;
  file_name: string;
  expires_at: string;
  page_count: number;
}> => {
  try {
    const companyId = await getUserCompanyId();
    // TEMP_DISABLED: console.log('📊 [PDF EXPORT] Creating PDF report for company:', companyId);

    const exportUrl = `${ServerData.serverUrl}v1/stripe/exports/pdf`;
    // TEMP_DISABLED: console.log('🌐 [PDF EXPORT] Calling endpoint:', exportUrl);

    const response = await fetchWithAuth(exportUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: companyId,
        ...reportConfig
      })
    });

    // TEMP_DISABLED: console.log(`📡 [PDF EXPORT] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [PDF EXPORT] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à créer un rapport PDF');
      } else if (response.status === 400) {
        throw new Error('Configuration de rapport invalide');
      }
      
      throw new Error(`Erreur lors de la création du rapport: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [PDF EXPORT] Report created:', JSON.stringify(data, null, 2));

    if (!data.success || !data.data?.download_url) {
      throw new Error('API returned invalid report data');
    }

    // TEMP_DISABLED: console.log(`📊 [PDF EXPORT] File: ${data.data.file_name}`);
    // TEMP_DISABLED: console.log(`📄 [PDF EXPORT] Pages: ${data.data.page_count}`);
    // TEMP_DISABLED: console.log(`🔗 [PDF EXPORT] Download: ${data.data.download_url}`);

    return data.data;

  } catch (error) {

    console.error('❌ [PDF EXPORT] Error creating PDF report:', error);
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
    trend_direction: 'up' | 'down' | 'stable';
  };
  recent_activity: Array<{
    type: 'payment' | 'refund' | 'invoice' | 'payout';
    amount: number;
    currency: string;
    description: string;
    timestamp: string;
  }>;
  meta: {
    last_updated: string;
    timezone: string;
    source: string;
  };
}> => {
  try {
    const companyId = await getUserCompanyId();
    // TEMP_DISABLED: console.log('⚡ [REALTIME ANALYTICS] Loading real-time data for company:', companyId);

    const realtimeUrl = `${ServerData.serverUrl}v1/stripe/analytics/realtime?company_id=${companyId}`;
    // TEMP_DISABLED: console.log('🌐 [REALTIME ANALYTICS] Calling endpoint:', realtimeUrl);

    const response = await fetchWithAuth(realtimeUrl, {
      method: 'GET'
    });

    // TEMP_DISABLED: console.log(`📡 [REALTIME ANALYTICS] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error text');
      console.error(`❌ [REALTIME ANALYTICS] Error response: ${errorText}`);
      
      if (response.status === 401) {
        throw new Error('Non autorisé à voir les analytics en temps réel');
      }
      
      throw new Error(`Erreur lors de la récupération des données temps réel: ${response.status}`);
    }

    const data = await response.json();
    // TEMP_DISABLED: console.log('✅ [REALTIME ANALYTICS] Real-time data retrieved:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error('API returned error for real-time analytics');
    }

    // TEMP_DISABLED: console.log(`⚡ [REALTIME ANALYTICS] Today's revenue: ${data.data.today.revenue / 100} AUD`);
    // TEMP_DISABLED: console.log(`⚡ [REALTIME ANALYTICS] Today's payments: ${data.data.today.payments_count}`);
    // TEMP_DISABLED: console.log(`📈 [REALTIME ANALYTICS] Trend: ${data.data.trending.trend_direction} (${data.data.trending.revenue_change_pct}%)`);

    return data.data;

  } catch (error) {

    console.error('❌ [REALTIME ANALYTICS] Error fetching real-time analytics:', error);
    throw error;
  }
};