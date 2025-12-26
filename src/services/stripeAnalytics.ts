/**
 * StripeAnalytics Service - Intégration analytics avec Stripe Events
 * ✅ Connecte notre système analytics existant aux événements Stripe
 */

import { trackCustomEvent, trackPayment } from './analytics';
import { logBusinessEvent, error as logError } from './logger';

interface StripePaymentEvent {
  jobId: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
  method: 'card' | 'cash' | 'paymentsheet';
  duration?: number;
  error?: string;
}

// 🔥 Track payment initiation
export async function trackPaymentStarted(event: Omit<StripePaymentEvent, 'duration'>) {
  try {
    await trackCustomEvent(
      'payment_started',
      'business',
      {
        job_id: event.jobId,
        amount: event.amount,
        currency: event.currency,
        payment_intent_id: event.paymentIntentId,
        payment_method: event.method,
        timestamp: new Date().toISOString(),
      }
    );

    logBusinessEvent('🎯 [StripeAnalytics] Payment initiation tracked', {
      jobId: event.jobId,
      method: event.method,
      amount: event.amount,
    });
  } catch (error) {
    logError('❌ [StripeAnalytics] Failed to track payment start', error);
  }
}

// ✅ Track successful payment
export async function trackPaymentSuccess(event: StripePaymentEvent) {
  try {
    await trackPayment('completed', event.amount, event.jobId);

    logBusinessEvent('✅ [StripeAnalytics] Payment success tracked', {
      jobId: event.jobId,
      method: event.method,
      amount: event.amount,
      duration: event.duration,
    });
  } catch (error) {
    logError('❌ [StripeAnalytics] Failed to track payment success', error);
  }
}

// ❌ Track payment failure
export async function trackPaymentError(event: StripePaymentEvent) {
  try {
    await trackPayment('failed', event.amount, event.jobId);

    logBusinessEvent('❌ [StripeAnalytics] Payment error tracked', {
      jobId: event.jobId,
      method: event.method,
      error: event.error,
      duration: event.duration,
    });
  } catch (error) {
    logError('❌ [StripeAnalytics] Failed to track payment error', error);
  }
}

// 🔄 Track payment method selection
export async function trackPaymentMethodSelected(method: 'card' | 'cash' | 'paymentsheet', jobId: string) {
  try {
    await trackCustomEvent(
      'payment_method_selected',
      'user_action',
      {
        job_id: jobId,
        payment_method: method,
        timestamp: new Date().toISOString(),
      }
    );

    logBusinessEvent('📊 [StripeAnalytics] Payment method selection tracked', {
      jobId,
      method,
    });
  } catch (error) {
    logError('❌ [StripeAnalytics] Failed to track method selection', error);
  }
}

// 🎯 Track payment conversion funnel
export async function trackPaymentFunnelStep(
  step: 'view_payment' | 'select_method' | 'enter_details' | 'submit' | 'success', 
  jobId: string, 
  method?: string
) {
  try {
    await trackCustomEvent(
      'payment_funnel',
      'user_action',
      {
        job_id: jobId,
        funnel_step: step,
        payment_method: method,
        timestamp: new Date().toISOString(),
      }
    );

    logBusinessEvent('🎯 [StripeAnalytics] Payment funnel step tracked', {
      jobId,
      step,
      method,
    });
  } catch (error) {
    logError('❌ [StripeAnalytics] Failed to track funnel step', error);
  }
}