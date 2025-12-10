/**
 * Stripe Types - Types et interfaces pour Stripe Connect
 * Utilisés par les services et hooks Stripe
 */

// Payment Intent status from Stripe
export type PaymentStatus = 
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

// Payout status from Stripe  
export type PayoutStatus = 
  | 'paid'
  | 'pending'
  | 'in_transit'
  | 'canceled'
  | 'failed';

// Connect account status
export type StripeConnectStatus = 'not_connected' | 'incomplete' | 'active';

// Requirement status
export type RequirementStatus = 'currently_due' | 'past_due' | 'eventually_due';

// Interface pour les requirements Stripe
export interface StripeRequirement {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'required' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

// ================================================================================
// INTERFACES PRINCIPALES
// ================================================================================

/**
 * Informations du compte Stripe Connect
 */
export interface StripeAccount {
  id: string;
  object: 'account';
  business_profile?: {
    mcc?: string;
    name?: string;
    product_description?: string;
    support_address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postal_code?: string;
      state?: string;
    };
    support_email?: string;
    support_phone?: string;
    support_url?: string;
    url?: string;
  };
  business_type?: 'individual' | 'company' | 'non_profit' | 'government_entity';
  capabilities?: {
    card_payments?: 'active' | 'inactive' | 'pending';
    transfers?: 'active' | 'inactive' | 'pending';
  };
  charges_enabled: boolean;
  country: string;
  created: number;
  default_currency: string;
  details_submitted: boolean;
  email?: string;
  metadata: Record<string, string>;
  payouts_enabled: boolean;
  requirements?: {
    currently_due: string[];
    past_due: string[];
    eventually_due: string[];
    disabled_reason?: string;
  };
  type: 'standard' | 'express' | 'custom';
  verification_status?: 'complete' | 'pending' | 'restricted' | 'rejected';
}

// Balance from Stripe API
export interface StripeBalance {
  object: 'balance';
  available: Array<{
    amount: number;
    currency: string;
  }>;
  pending: Array<{
    amount: number;
    currency: string;
    source_types: Record<string, number>;
  }>;
}

// Transaction Stripe
export interface StripeTransaction {
  id: string;
  object: 'charge' | 'payment_intent' | 'transfer' | 'payout';
  amount: number;
  currency: string;
  created: number;
  description?: string;
  metadata: Record<string, string>;
  status: PaymentStatus | PayoutStatus;
  failure_code?: string;
  failure_message?: string;
}

// ============================================================================
// TYPES POUR NOTRE APPLICATION
// ============================================================================

/**
 * Statut de connexion Stripe Connect dans notre app
 */
export interface StripeConnectionStatus {
  isConnected: boolean;
  status: StripeConnectStatus;
  account?: StripeAccount;
  requirements?: {
    currently_due: string[];
    past_due: string[];
    eventually_due: string[];
  };
  capabilities?: {
    charges_enabled: boolean;
    payouts_enabled: boolean;
  };
  onboarding?: {
    url?: string;
    expires_at?: number;
  };
}

/**
 * Demande de lien de paiement Stripe
 */
export interface StripePaymentLinkRequest {
  amount: number;
  currency: string;
  description?: string;
  customer_email?: string;
  metadata?: Record<string, string>;
  success_url: string;
  cancel_url: string;
}

/**
 * Réponse statut Stripe Connect
 */
export interface StripeConnectStatusResponse {
  success: boolean;
  data: {
    status: StripeConnectStatus;
    stripe_account_id?: string;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
    onboarding_completed: boolean;
    requirements?: {
      currently_due: string[];
      past_due: string[];
      eventually_due: string[];
    };
  };
  message?: string;
}

/**
 * Demande de lien d'onboarding
 */
export interface StripeAccountLinkRequest {
  account: string;
  refresh_url: string;
  return_url: string;
  type: 'account_onboarding' | 'account_update';
}

/**
 * Réponse de lien d'onboarding
 */
export interface StripeAccountLinkResponse {
  object: 'account_link';
  created: number;
  expires_at: number;
  url: string;
}

/**
 * Réponse de refresh onboarding
 */
export interface RefreshOnboardingResponse {
  success: boolean;
  url: string;
  expiresAt: number;
  message?: string;
}

// ============================================================================
// TYPES POUR LES HOOKS
// ============================================================================

/**
 * Type pour les données d'un paiement dans nos hooks
 */
export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  date: string;
  customer?: {
    name?: string;
    email?: string;
  };
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * Type pour les données d'un virement dans nos hooks
 */
export interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  arrival_date: number;
  created: number;
  description?: string;
  method: string;
  type: 'bank_account' | 'card';
  failure_code?: string;
  failure_message?: string;
}

/**
 * Props du Payment Link Hook
 */
export interface StripePaymentLinkProps {
  creating: boolean;
  error: string | null;
  createPaymentLink: (request: StripePaymentLinkRequest) => Promise<string>;
}

/**
 * Props du Stripe Account Hook
 */
export interface StripeAccountProps {
  account: StripeAccount | null;
  balance: StripeBalance | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateSettings: (settings: any) => Promise<void>;
}

/**
 * Props du Stripe Payments Hook
 */
export interface StripePaymentsProps {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Props du Stripe Payouts Hook  
 */
export interface StripePayoutsProps {
  payouts: Payout[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  createPayout: (amount: number) => Promise<string>;
}