/**
 * Analytics Service - Système de tracking et monitoring complet
 *
 * Fonctionnalités:
 * - Event tracking (jobs, paiements, navigation)
 * - Performance monitoring
 * - Error tracking
 * - Business metrics
 *
 * ✅ Session 8: Intégration API Discovery
 * - Vérifie disponibilité endpoint /analytics/events avant flush
 * - Fallback silent si endpoint non disponible
 */

import { API_URL } from "../config/environment";
import { getAuthHeaders } from "../utils/auth";
import { apiDiscovery } from "./apiDiscovery";
import { logger } from "./logger";

const API_BASE_URL = `${API_URL}v1`;

// Types pour les événements analytics
export interface AnalyticsEvent {
  event_type: string;
  event_category: "user_action" | "business" | "technical" | "error";
  event_data?: Record<string, any>;
  user_id?: string;
  company_id?: string;
  timestamp?: string;
}

export interface PerformanceMetric {
  metric_name: string;
  value: number;
  unit: "ms" | "seconds" | "bytes" | "count";
  context?: Record<string, any>;
}

export interface ErrorEvent {
  error_type: "api_error" | "app_crash" | "validation_error" | "network_error";
  error_message: string;
  error_stack?: string;
  context?: Record<string, any>;
}

// Service Analytics
class AnalyticsService {
  private isEnabled: boolean = true;
  private eventQueue: AnalyticsEvent[] = [];
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 secondes

  constructor() {
    this.startPeriodicFlush();
  }

  // ========== EVENT TRACKING ==========

  /**
   * Track job progression events
   */
  trackJobStep(
    jobId: string,
    currentStep: number,
    totalSteps: number,
    notes?: string,
  ) {
    this.trackEvent({
      event_type: "job_step_advanced",
      event_category: "business",
      event_data: {
        job_id: jobId,
        current_step: currentStep,
        total_steps: totalSteps,
        progress_percentage: Math.round((currentStep / totalSteps) * 100),
        notes: notes || null,
      },
    });
  }

  /**
   * Track payment events
   */
  trackPayment(
    action: "initiated" | "completed" | "failed",
    amount: number,
    jobId?: string,
  ) {
    this.trackEvent({
      event_type: `payment_${action}`,
      event_category: "business",
      event_data: {
        amount: amount,
        job_id: jobId,
        currency: "AUD",
      },
    });
  }

  /**
   * Track user navigation
   */
  trackNavigation(screenName: string, previousScreen?: string) {
    this.trackEvent({
      event_type: "screen_view",
      event_category: "user_action",
      event_data: {
        screen_name: screenName,
        previous_screen: previousScreen,
      },
    });
  }

  /**
   * Track screen time
   */
  trackScreenTime(screenName: string, timeSpentMs: number) {
    this.trackEvent({
      event_type: "screen_time",
      event_category: "user_action",
      event_data: {
        screen_name: screenName,
        time_spent_ms: timeSpentMs,
        time_spent_seconds: Math.round(timeSpentMs / 1000),
      },
    });
  }

  /**
   * Track API performance
   */
  trackAPICall(
    endpoint: string,
    method: string,
    duration: number,
    status: number,
  ) {
    this.trackEvent({
      event_type: "api_call",
      event_category: "technical",
      event_data: {
        endpoint: endpoint,
        method: method,
        duration_ms: duration,
        status_code: status,
        success: status < 400,
      },
    });
  }

  /**
   * Track errors
   */
  trackError(error: ErrorEvent) {
    this.trackEvent({
      event_type: "error_occurred",
      event_category: "error",
      event_data: {
        error_type: error.error_type,
        error_message: error.error_message,
        error_stack: error.error_stack,
        context: error.context,
      },
    });
  }

  /**
   * Generic event tracking
   */
  private trackEvent(event: AnalyticsEvent) {
    if (!this.isEnabled) {
      logger.debug("Analytics tracking disabled, skipping event", {
        eventType: event.event_type,
      });
      return;
    }

    const enrichedEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.eventQueue.push(enrichedEvent);

    logger.info("Analytics event tracked", {
      eventType: event.event_type,
      eventCategory: event.event_category,
      queueLength: this.eventQueue.length,
    });


    // Flush si la queue est pleine
    if (this.eventQueue.length >= this.batchSize) {
      logger.debug("Event queue full, flushing events", {
        queueLength: this.eventQueue.length,
      });
      this.flushEvents();
    }
  }

  // ========== PERFORMANCE MONITORING ==========

  /**
   * Track app performance metrics
   */
  trackPerformance(metric: PerformanceMetric) {
    this.trackEvent({
      event_type: "performance_metric",
      event_category: "technical",
      event_data: {
        metric_name: metric.metric_name,
        value: metric.value,
        unit: metric.unit,
        context: metric.context,
      },
    });
  }

  /**
   * Measure and track function execution time
   */
  measureExecutionTime<T>(
    functionName: string,
    fn: () => Promise<T>,
    context?: Record<string, any>,
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();

      try {
        const result = await fn();
        const duration = Date.now() - startTime;

        this.trackPerformance({
          metric_name: `${functionName}_execution_time`,
          value: duration,
          unit: "ms",
          context: context,
        });

        resolve(result);
      } catch (error) {
        const duration = Date.now() - startTime;

        this.trackPerformance({
          metric_name: `${functionName}_execution_time`,
          value: duration,
          unit: "ms",
          context: { ...context, failed: true },
        });

        reject(error);
      }
    });
  }

  // ========== DATA COLLECTION ==========

  /**
   * Get business metrics summary
   */
  async getBusinessMetrics(period: "24h" | "7d" | "30d" = "24h"): Promise<any> {
    try {
      const authHeaders = await getAuthHeaders();
      if (!authHeaders) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(
        `${API_BASE_URL}/analytics/business-metrics?period=${period}`,
        {
          method: "GET",
          headers: authHeaders,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("❌ [ANALYTICS] Error fetching business metrics:", error);
      this.trackError({
        error_type: "api_error",
        error_message: `Failed to fetch business metrics: ${error}`,
        context: { period },
      });
      throw error;
    }
  }

  /**
   * Get app usage analytics
   */
  async getUsageAnalytics(period: "24h" | "7d" | "30d" = "24h"): Promise<any> {
    try {
      const authHeaders = await getAuthHeaders();
      if (!authHeaders) {
        throw new Error("No authentication token available");
      }

      const response = await fetch(
        `${API_BASE_URL}/analytics/usage?period=${period}`,
        {
          method: "GET",
          headers: authHeaders,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("❌ [ANALYTICS] Error fetching usage analytics:", error);
      this.trackError({
        error_type: "api_error",
        error_message: `Failed to fetch usage analytics: ${error}`,
        context: { period },
      });
      throw error;
    }
  }

  // ========== INTERNAL MANAGEMENT ==========

  /**
   * Flush events to backend
   * ✅ Session 8: Vérifie disponibilité endpoint avant envoi
   */
  private async flushEvents() {
    if (this.eventQueue.length === 0) {
      logger.debug("No events to flush");
      return;
    }

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // ✅ SESSION 8: Vérifier si endpoint /analytics/events existe avant d'appeler
      const analyticsEndpointAvailable = await apiDiscovery.isEndpointAvailable(
        "/swift-app/v1/analytics/events",
        "POST",
      );

      if (!analyticsEndpointAvailable) {
        // Endpoint non disponible → fallback silent
        logger.debug(
          "Analytics endpoint not available, events kept locally (silent fallback)",
          {
            eventCount: eventsToFlush.length,
          },
        );
        return; // Ne PAS envoyer si endpoint n'existe pas
      }

      const authHeaders = await getAuthHeaders();
      if (!authHeaders) {
        logger.warn("No auth headers available, skipping analytics flush");
        return;
      }

      logger.debug("Flushing analytics events to backend", {
        eventCount: eventsToFlush.length,
      });

      const response = await fetch(`${API_BASE_URL}/analytics/events`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events: eventsToFlush }),
      });

      if (response.ok) {
        logger.info("Analytics events flushed successfully", {
          eventCount: eventsToFlush.length,
          status: response.status,
        });
      } else {
        // ⚠️ Si on arrive ici, c'est une VRAIE erreur (endpoint existe mais erreur serveur)
        logger.warn("Failed to flush analytics events (server error)", {
          status: response.status,
          statusText: response.statusText,
          eventCount: eventsToFlush.length,
        });
        // Ne PAS remettre en queue pour éviter accumulation infinie
      }
    } catch (error) {
      // ⚠️ Erreur réseau ou autre
      logger.warn(
        "Error flushing analytics events to backend (network issue)",
        {
          error: error instanceof Error ? error.message : "Unknown error",
          eventCount: eventsToFlush.length,
        },
      );
      // Ne PAS remettre en queue pour éviter accumulation infinie
      // this.eventQueue.unshift(...eventsToFlush);
    }
  }

  /**
   * Start periodic flush
   */
  private startPeriodicFlush() {
    setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  /**
   * Manual flush (useful for app background/close)
   */
  flush() {
    return this.flushEvents();
  }

  /**
   * Public method to track custom events
   */
  trackCustomEvent(
    eventType: string,
    category: "user_action" | "business" | "technical" | "error",
    data?: Record<string, any>,
  ) {
    this.trackEvent({
      event_type: eventType,
      event_category: category,
      event_data: data,
    });
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // ========== JOB FUNNEL EVENTS (AARRR) ==========
  // 7 events couvrant le cycle complet d'un job Cobbr.
  // TODO: remplacer this.trackEvent(...) par Analytics.track(event_type, event_data)
  //       lors de l'intégration d'un SDK tiers (Mixpanel / Amplitude / PostHog).

  /** EVENT 1 — job_created. Funnel: activation — premier job = milestone d'activation clé */
  trackJobCreated(params: {
    job_id: number;
    company_id: number;
    billing_mode: string;
    has_staff_assigned: boolean;
    has_client: boolean;
  }) {
    this.trackEvent({ event_type: "job_created", event_category: "business", event_data: params });
  }

  /** EVENT 2 — job_staff_assigned. Funnel: activation — job sans staff = job orphelin */
  trackJobStaffAssigned(params: {
    job_id: number;
    company_id: number;
    staff_count: number;
  }) {
    this.trackEvent({ event_type: "job_staff_assigned", event_category: "business", event_data: params });
  }

  /** EVENT 3 — job_accepted. Funnel: retention — acceptation = engagement du contractor */
  trackJobAccepted(params: {
    job_id: number;
    company_id: number;
    time_to_accept_hours?: number;
  }) {
    this.trackEvent({ event_type: "job_accepted", event_category: "business", event_data: params });
  }

  /** EVENT 4 — job_started. Funnel: retention — début effectif = utilisation terrain réelle */
  trackJobStarted(params: {
    job_id: number;
    company_id: number;
  }) {
    this.trackEvent({ event_type: "job_started", event_category: "business", event_data: params });
  }

  /** EVENT 5 — job_completed. Funnel: retention — ratio completed/started mesure les jobs bloqués */
  trackJobCompleted(params: {
    job_id: number;
    company_id: number;
    duration_minutes?: number;
  }) {
    this.trackEvent({ event_type: "job_completed", event_category: "business", event_data: params });
  }

  /** EVENT 6 — review_requested. Funnel: referral — dernier maillon du cycle job */
  trackReviewRequested(params: {
    job_id: number;
    company_id?: number;
  }) {
    this.trackEvent({ event_type: "review_requested", event_category: "business", event_data: params });
  }

  /** EVENT 7 — job_declined. Funnel: retention — signal friction ou mismatch job/contractor */
  trackJobDeclined(params: {
    job_id: number;
    company_id: number;
    reason?: string;
  }) {
    this.trackEvent({ event_type: "job_declined", event_category: "business", event_data: params });
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// Convenience exports with proper binding
export const trackJobStep = analytics.trackJobStep.bind(analytics);
export const trackPayment = analytics.trackPayment.bind(analytics);
export const trackNavigation = analytics.trackNavigation.bind(analytics);
export const trackAPICall = analytics.trackAPICall.bind(analytics);
export const trackError = analytics.trackError.bind(analytics);
export const trackPerformance = analytics.trackPerformance.bind(analytics);
export const trackCustomEvent = analytics.trackCustomEvent.bind(analytics);
export const measureExecutionTime =
  analytics.measureExecutionTime.bind(analytics);
export const getBusinessMetrics = analytics.getBusinessMetrics.bind(analytics);
export const getUsageAnalytics = analytics.getUsageAnalytics.bind(analytics);
export const flushAnalytics = analytics.flush.bind(analytics);

// Job funnel events
export const trackJobCreated = analytics.trackJobCreated.bind(analytics);
export const trackJobStaffAssigned = analytics.trackJobStaffAssigned.bind(analytics);
export const trackJobAccepted = analytics.trackJobAccepted.bind(analytics);
export const trackJobStarted = analytics.trackJobStarted.bind(analytics);
export const trackJobCompleted = analytics.trackJobCompleted.bind(analytics);
export const trackReviewRequested = analytics.trackReviewRequested.bind(analytics);
export const trackJobDeclined = analytics.trackJobDeclined.bind(analytics);
