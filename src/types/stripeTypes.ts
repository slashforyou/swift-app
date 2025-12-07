/**
 * Types pour Stripe API
 */

// Payment Intent status from Stripe
export type PaymentStatus = 
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded'
  | 'failed';

// Payout status from Stripe
export type PayoutStatus = 
  | 'paid'
  | 'pending'
  | 'in_transit'
  | 'canceled'
  | 'failed';

// Payment Intent from Stripe API
export interface StripePayment {
  id: string;
  object: 'payment_intent';
  amount: number;
  currency: string;
  status: PaymentStatus;
  created: number;
  customer?: string;
  description?: string;
  metadata: Record<string, string>;
  payment_method?: {
    id: string;
    type: string;
    card?: {
      brand: string;
      last4: string;
    };
  };
  receipt_email?: string;
  fees?: Array<{
    amount: number;
    currency: string;
    description: string;
    type: string;
  }>;
}

// Payout from Stripe API
export interface StripePayout {
  id: string;
  object: 'payout';
  amount: number;
  currency: string;
  arrival_date: number;
  created: number;
  description?: string;
  destination: string;
  failure_code?: string;
  failure_message?: string;
  livemode: boolean;
  metadata: Record<string, string>;
  method: 'standard' | 'instant';
  source_type: 'card' | 'bank_account' | 'fpx';
  statement_descriptor?: string;
  status: PayoutStatus;
  type: 'bank_account' | 'card';
}

// Account from Stripe API
export interface StripeAccount {
  id: string;
  object: 'account';
  business_profile?: {
    name?: string;
    support_email?: string;
    support_phone?: string;
    support_url?: string;
    url?: string;
  };
  business_type?: 'individual' | 'company' | 'non_profit' | 'government_entity';
  capabilities?: Record<string, string>;
  charges_enabled: boolean;
  country: string;
  created: number;
  default_currency: string;
  details_submitted: boolean;
  email?: string;
  external_accounts: {
    data: Array<{
      id: string;
      object: 'bank_account' | 'card';
      account_holder_type?: string;
      bank_name?: string;
      country: string;
      currency: string;
      fingerprint?: string;
      last4: string;
      metadata: Record<string, string>;
      routing_number?: string;
      status: string;
    }>;
  };
  metadata: Record<string, string>;
  payouts_enabled: boolean;
  requirements?: {
    currently_due: string[];
    disabled_reason?: string;
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
  settings?: {
    branding?: {
      icon?: string;
      logo?: string;
      primary_color?: string;
      secondary_color?: string;
    };
    card_payments?: {
      decline_on?: {
        avs_failure?: boolean;
        cvc_failure?: boolean;
      };
    };
    dashboard?: {
      display_name?: string;
      timezone?: string;
    };
    payments?: {
      statement_descriptor?: string;
      statement_descriptor_kana?: string;
      statement_descriptor_kanji?: string;
    };
    payouts?: {
      debit_negative_balances?: boolean;
      schedule?: {
        delay_days?: number;
        interval?: 'manual' | 'daily' | 'weekly' | 'monthly';
        monthly_anchor?: number;
        weekly_anchor?: string;
      };
      statement_descriptor?: string;
    };
  };
  tos_acceptance?: {
    date?: number;
    ip?: string;
    user_agent?: string;
  };
  type: 'standard' | 'express' | 'custom';
}

// Balance from Stripe API
export interface StripeBalance {
  object: 'balance';
  available: Array<{
    amount: number;
    currency: string;
    source_types: Record<string, number>;
  }>;
  connect_reserved?: Array<{
    amount: number;
    currency: string;
  }>;
  livemode: boolean;
  pending: Array<{
    amount: number;
    currency: string;
    source_types: Record<string, number>;
  }>;
}

// API Response Types
export interface StripePaymentsResponse {
  success: boolean;
  data: StripePayment[];
  has_more: boolean;
  total_count?: number;
}

export interface StripePayoutsResponse {
  success: boolean;
  data: StripePayout[];
  has_more: boolean;
  total_count?: number;
}

export interface StripeAccountResponse {
  success: boolean;
  account: StripeAccount;
}

export interface StripeBalanceResponse {
  success: boolean;
  balance: StripeBalance;
}

// Link creation
export interface StripePaymentLinkRequest {
  amount: number;
  currency: string;
  description?: string;
  customer_email?: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentLinkResponse {
  success: boolean;
  payment_link: {
    id: string;
    url: string;
    active: boolean;
    created: number;
    metadata: Record<string, string>;
  };
}

// Account Link for onboarding
export interface StripeAccountLinkRequest {
  account: string;
  refresh_url: string;
  return_url: string;
  type: 'account_onboarding' | 'account_update';
}

export interface StripeAccountLinkResponse {
  success: boolean;
  account_link: {
    object: 'account_link';
    created: number;
    expires_at: number;
    url: string;
  };
}

// Transformation des types Stripe vers nos types d'interface
export const transformStripePayment = (payment: StripePayment) => ({
  id: payment.id,
  date: new Date(payment.created * 1000).toISOString(),
  amount: payment.amount / 100, // Stripe amounts are in cents
  currency: payment.currency.toUpperCase(),
  status: payment.status,
  description: payment.description || 'Paiement',
  customer: payment.customer || 'Client anonyme',
  method: payment.payment_method?.card ? 
    `${payment.payment_method.card.brand} ****${payment.payment_method.card.last4}` : 
    'Carte'
});

export const transformStripePayout = (payout: StripePayout) => ({
  id: payout.id,
  date: new Date(payout.created * 1000).toISOString(),
  amount: payout.amount / 100, // Stripe amounts are in cents
  currency: payout.currency.toUpperCase(),
  status: payout.status,
  description: payout.description || 'Virement',
  arrivalDate: new Date(payout.arrival_date * 1000).toISOString(),
  method: payout.method,
  type: payout.type
});