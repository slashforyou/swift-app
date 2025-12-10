/**
 * Types pour les payouts Stripe
 */

export interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'canceled' | 'in_transit';
  method: 'standard' | 'instant';
  type: 'bank_account' | 'card';
  arrival_date?: number;
  created: number;
  description?: string;
  failure_code?: string;
  failure_message?: string;
  statement_descriptor?: string;
  source_type: 'card' | 'bank_account';
  destination?: {
    id: string;
    object: string;
    account?: string;
    bank_name?: string;
    country?: string;
    currency?: string;
    fingerprint?: string;
    last4?: string;
    routing_number?: string;
    status?: string;
  };
}

export interface PayoutBalance {
  available: Array<{
    amount: number;
    currency: string;
    source_types: {
      card?: number;
      bank_account?: number;
      fpx?: number;
    };
  }>;
  pending: Array<{
    amount: number;
    currency: string;
    source_types: {
      card?: number;
      bank_account?: number;
      fpx?: number;
    };
  }>;
  instant_available?: Array<{
    amount: number;
    currency: string;
    source_types: {
      card?: number;
      bank_account?: number;
    };
  }>;
}

export interface PayoutHistory {
  data: Payout[];
  has_more: boolean;
  total_count: number;
  url: string;
}

export interface PayoutRequest {
  amount: number;
  currency?: string;
  method?: 'standard' | 'instant';
  statement_descriptor?: string;
  description?: string;
}

export interface PayoutStats {
  total_amount: number;
  total_count: number;
  pending_amount: number;
  pending_count: number;
  paid_amount: number;
  paid_count: number;
  failed_amount: number;
  failed_count: number;
  currency: string;
}