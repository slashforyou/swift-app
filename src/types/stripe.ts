/**/**

 * Types pour Stripe API * Stripe Types - Types et interfaces pour Stripe Connect

 */ * Utilisés par les services et hooks Stripe

 */

// Payment Intent status from Stripe

export type PaymentStatus = // ================================================================================

  | 'requires_payment_method'// STRIPE CONNECT - RESPONSES BACKEND  

  | 'requires_confirmation'// ================================================================================

  | 'requires_action'

  | 'processing'/**

  | 'requires_capture' * Response de la requête de statut Stripe Connect

  | 'canceled' * Structure réelle du backend (flat, pas imbriquée dans account)

  | 'succeeded' */

  | 'failed';export interface StripeConnectStatusResponse {

  success: boolean;

// Payout status from Stripe  data: {

export type PayoutStatus =     // Account info (structure plate)

  | 'paid'    stripe_account_id: string;

  | 'pending'    charges_enabled: boolean;

  | 'in_transit'    payouts_enabled: boolean;

  | 'canceled'    details_submitted: boolean;

  | 'failed';    onboarding_completed: boolean;

    company_id: string;

// Payment Intent from Stripe API    created_at: string;

export interface StripePayment {    

  id: string;    // Requirements

  object: 'payment_intent';    requirements: {

  amount: number;      currently_due: string[];

  currency: string;      eventually_due: string[];

  status: PaymentStatus;      past_due: string[];

  created: number;      disabled_reason?: string;

  customer?: string;    };

  description?: string;    

  metadata: Record<string, string>;    // Capabilities

  payment_method?: {    capabilities: {

    id: string;      card_payments: 'active' | 'inactive' | 'pending';

    type: string;      transfers: 'active' | 'inactive' | 'pending';

    card?: {    };

      brand: string;    

      last4: string;    // Business profile

    };    business_profile: {

  };      name: string | null;

  receipt_email?: string;      url: string | null;

  fees?: Array<{      support_email: string | null;

    amount: number;    };

    currency: string;  };

    description: string;  message?: string;

    type: string;}

  }>;

}// ================================================================================

// STRIPE CONNECT - STATUTS

// Payout from Stripe API// ================================================================================

export interface StripePayout {

  id: string;/**

  object: 'payout'; * Statut du compte Stripe Connect

  amount: number; */

  currency: string;export type StripeConnectStatus = 'not_connected' | 'incomplete' | 'active';

  arrival_date: number;

  created: number;/**

  description?: string; * Type de requirement Stripe

  destination: string; */

  failure_code?: string;export type RequirementStatus = 'currently_due' | 'past_due' | 'eventually_due';

  failure_message?: string;

  livemode: boolean;/**

  metadata: Record<string, string>; * Type de paiement disponible

  method: 'standard' | 'instant'; */

  source_type: 'card' | 'bank_account' | 'fpx';export type PaymentCapability = 'card_payments' | 'transfers' | 'refunds';

  statement_descriptor?: string;

  status: PayoutStatus;// ============================================================================

  type: 'bank_account' | 'card';// STRIPE CONNECT - ACCOUNT INFO

}// ============================================================================



// Account from Stripe API/**

export interface StripeAccount { * Informations du compte Stripe Connect

  id: string; */

  object: 'account';export interface StripeConnectAccount {

  business_profile?: {  id: string;

    name?: string;  status: StripeConnectStatus;

    support_email?: string;  email: string;

    support_phone?: string;  country: string;

    support_url?: string;  default_currency: string;

    url?: string;  charges_enabled: boolean;

  };  payouts_enabled: boolean;

  business_type?: 'individual' | 'company' | 'non_profit' | 'government_entity';  details_submitted: boolean;

  capabilities?: Record<string, string>;  created_at: string;

  charges_enabled: boolean;  updated_at: string;

  country: string;}

  created: number;

  default_currency: string;/**

  details_submitted: boolean; * Requirements pour compléter le compte

  email?: string; */

  external_accounts: {export interface StripeRequirements {

    data: Array<{  currently_due: string[];

      id: string;  eventually_due: string[];

      object: 'bank_account' | 'card';  past_due: string[];

      account_holder_type?: string;  pending_verification: string[];

      bank_name?: string;  disabled_reason?: string;

      country: string;  current_deadline?: string;

      currency: string;}

      fingerprint?: string;

      last4: string;/**

      metadata: Record<string, string>; * Capabilities du compte

      routing_number?: string; */

      status: string;export interface StripeCapabilities {

    }>;  card_payments: 'active' | 'inactive' | 'pending';

  };  transfers: 'active' | 'inactive' | 'pending';

  metadata: Record<string, string>;  [key: string]: string;

  payouts_enabled: boolean;}

  requirements?: {

    currently_due: string[];// ============================================================================

    disabled_reason?: string;// STRIPE CONNECT - ONBOARDING

    eventually_due: string[];// ============================================================================

    past_due: string[];

    pending_verification: string[];/**

  }; * Response de création de compte Stripe Connect

  settings?: { */

    branding?: {export interface CreateAccountResponse {

      icon?: string;  success: boolean;

      logo?: string;  accountId: string;

      primary_color?: string;  onboardingUrl: string;

      secondary_color?: string;  message?: string;

    };}

    card_payments?: {

      decline_on?: {/**

        avs_failure?: boolean; * Response du process d'onboarding

        cvc_failure?: boolean; */

      };export interface OnboardingResponse {

    };  success: boolean;

    dashboard?: {  url: string;

      display_name?: string;  accountId: string;

      timezone?: string;  expiresAt: number;

    };  message?: string;

    payments?: {}

      statement_descriptor?: string;

      statement_descriptor_kana?: string;/**

      statement_descriptor_kanji?: string; * Response de refresh onboarding

    }; */

    payouts?: {export interface RefreshOnboardingResponse {

      debit_negative_balances?: boolean;  success: boolean;

      schedule?: {  url: string;

        delay_days?: number;  expiresAt: number;

        interval?: 'manual' | 'daily' | 'weekly' | 'monthly';  message?: string;

        monthly_anchor?: number;}

        weekly_anchor?: string;

      };// ============================================================================

      statement_descriptor?: string;// STRIPE CONNECT - BALANCE & TRANSACTIONS

    };// ============================================================================

  };

  tos_acceptance?: {/**

    date?: number; * Balance du compte Stripe

    ip?: string; */

    user_agent?: string;export interface StripeBalance {

  };  available: Array<{

  type: 'standard' | 'express' | 'custom';    amount: number;

}    currency: string;

  }>;

// Balance from Stripe API  pending: Array<{

export interface StripeBalance {    amount: number;

  object: 'balance';    currency: string;

  available: Array<{  }>;

    amount: number;}

    currency: string;

    source_types: Record<string, number>;/**

  }>; * Transaction Stripe

  connect_reserved?: Array<{ */

    amount: number;export interface StripeTransaction {

    currency: string;  id: string;

  }>;  amount: number;

  livemode: boolean;  currency: string;

  pending: Array<{  description: string;

    amount: number;  status: 'succeeded' | 'pending' | 'failed';

    currency: string;  type: 'charge' | 'payout' | 'refund' | 'adjustment';

    source_types: Record<string, number>;  created: number;

  }>;  net: number;

}  fee: number;

}

// API Response Types

export interface StripePaymentsResponse {/**

  success: boolean; * Payout (versement) Stripe

  data: StripePayment[]; */

  has_more: boolean;export interface StripePayout {

  total_count?: number;  id: string;

}  amount: number;

  currency: string;

export interface StripePayoutsResponse {  status: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';

  success: boolean;  arrival_date: number;

  data: StripePayout[];  method: 'standard' | 'instant';

  has_more: boolean;  type: 'bank_account' | 'card';

  total_count?: number;  created: number;

}}



export interface StripeAccountResponse {// ============================================================================

  success: boolean;// STRIPE CONNECT - DASHBOARD

  account: StripeAccount;// ============================================================================

}

/**

export interface StripeBalanceResponse { * Response du lien vers dashboard Stripe

  success: boolean; */

  balance: StripeBalance;export interface DashboardLinkResponse {

}  success: boolean;

  url: string;

// Link creation  expiresAt: number;

export interface StripePaymentLinkRequest {  message?: string;

  amount: number;}

  currency: string;

  description?: string;// ============================================================================

  customer_email?: string;// STRIPE CONNECT - STATUS CHECK

  metadata?: Record<string, string>;// ============================================================================

}

/**

export interface StripePaymentLinkResponse { * Response de la requête de statut Stripe Connect

  success: boolean; * Structure réelle du backend (flat, pas imbriquée dans account)

  payment_link: { */

    id: string;export interface StripeConnectStatusResponse {

    url: string;  success: boolean;

    active: boolean;  data: {

    created: number;    // Account info (structure plate)

    metadata: Record<string, string>;    stripe_account_id: string;

  };    charges_enabled: boolean;

}    payouts_enabled: boolean;

    details_submitted: boolean;

// Account Link for onboarding    onboarding_completed: boolean;

export interface StripeAccountLinkRequest {    company_id: string;

  account: string;    created_at: string;

  refresh_url: string;    

  return_url: string;    // Requirements

  type: 'account_onboarding' | 'account_update';    requirements: {

}      currently_due: string[];

      eventually_due: string[];

export interface StripeAccountLinkResponse {      past_due: string[];

  success: boolean;      disabled_reason?: string;

  account_link: {    };

    object: 'account_link';    

    created: number;    // Capabilities

    expires_at: number;    capabilities: {

    url: string;      card_payments: 'active' | 'inactive' | 'pending';

  };      transfers: 'active' | 'inactive' | 'pending';

}    };

    

// Transformation des types Stripe vers nos types d'interface    // Business profile

export const transformStripePayment = (payment: StripePayment) => ({    business_profile: {

  id: payment.id,      name: string | null;

  date: new Date(payment.created * 1000).toISOString(),      url: string | null;

  amount: payment.amount / 100, // Stripe amounts are in cents      support_email: string | null;

  currency: payment.currency.toUpperCase(),    };

  status: payment.status,  };

  description: payment.description || 'Paiement',  message?: string;

  customer: payment.customer || 'Client anonyme',}

  method: payment.payment_method?.card ? 

    `${payment.payment_method.card.brand} ****${payment.payment_method.card.last4}` : // ============================================================================

    'Carte'// STRIPE CONNECT - DISCONNECT

});// ============================================================================



export const transformStripePayout = (payout: StripePayout) => ({/**

  id: payout.id, * Response de déconnexion Stripe

  date: new Date(payout.created * 1000).toISOString(), */

  amount: payout.amount / 100, // Stripe amounts are in centsexport interface DisconnectResponse {

  currency: payout.currency.toUpperCase(),  success: boolean;

  status: payout.status,  message: string;

  description: payout.description || 'Virement',}

  arrivalDate: new Date(payout.arrival_date * 1000).toISOString(),

  method: payout.method,// ============================================================================

  type: payout.type// STRIPE CONNECT - ERROR HANDLING

});// ============================================================================

/**
 * Erreur Stripe API
 */
export interface StripeError {
  type: 'api_error' | 'card_error' | 'validation_error' | 'authentication_error';
  message: string;
  code?: string;
  param?: string;
  statusCode?: number;
}

// ============================================================================
// STRIPE CONNECT - WEBHOOK EVENTS
// ============================================================================

/**
 * Types d'événements webhook Stripe Connect
 */
export type StripeWebhookEvent =
  | 'account.updated'
  | 'account.application.authorized'
  | 'account.application.deauthorized'
  | 'capability.updated'
  | 'charge.succeeded'
  | 'charge.failed'
  | 'payout.paid'
  | 'payout.failed';

/**
 * Payload d'un webhook Stripe
 */
export interface StripeWebhookPayload {
  id: string;
  type: StripeWebhookEvent;
  data: {
    object: any;
  };
  created: number;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * État du statut Stripe (pour UI)
 */
export interface StripeStatusState {
  status: StripeConnectStatus;
  accountId?: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements_count: number;
  deadline?: Date;
  balance_available: number;
  balance_pending: number;
}
