/**
 * Alert System Service - Système d'alertes critiques pour monitoring proactif
 */

import { getAuthHeaders } from '../utils/auth';
import { analytics } from './analytics';

const API_BASE_URL = 'https://altivo.fr/swift-app/v1';

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notification_channels: ('email' | 'sms' | 'push' | 'webhook')[];
}

export interface Alert {
  id: string;
  rule_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  current_value: number;
  threshold_value: number;
  triggered_at: string;
  resolved_at?: string;
  status: 'active' | 'resolved' | 'suppressed';
}

class AlertService {
  private alertRules: AlertRule[] = [];
  private activeAlerts: Alert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private checkIntervalMs = 60000; // Check every minute

  constructor() {
    this.initializeDefaultRules();
    this.startMonitoring();
  }

  // ========== DEFAULT ALERT RULES ==========

  private initializeDefaultRules() {
    this.alertRules = [
      // Payment Alerts
      {
        id: 'payment_failure_rate',
        name: 'Taux d\'échec paiement élevé',
        metric: 'payment_failure_rate',
        operator: 'gt',
        threshold: 0.1, // 10%
        severity: 'high',
        enabled: true,
        notification_channels: ['email', 'push']
      },
      {
        id: 'payment_amount_unusual',
        name: 'Montant de paiement inhabituel',
        metric: 'payment_amount',
        operator: 'gt',
        threshold: 10000, // $100.00
        severity: 'medium',
        enabled: true,
        notification_channels: ['email']
      },

      // API Performance Alerts
      {
        id: 'api_response_slow',
        name: 'API lente',
        metric: 'avg_api_response_time',
        operator: 'gt',
        threshold: 2000, // 2 seconds
        severity: 'medium',
        enabled: true,
        notification_channels: ['push']
      },
      {
        id: 'api_error_rate_high',
        name: 'Taux d\'erreur API élevé',
        metric: 'api_error_rate',
        operator: 'gt',
        threshold: 0.05, // 5%
        severity: 'high',
        enabled: true,
        notification_channels: ['email', 'push']
      },

      // Business Alerts
      {
        id: 'job_completion_rate_low',
        name: 'Taux de completion job faible',
        metric: 'job_completion_rate',
        operator: 'lt',
        threshold: 0.8, // 80%
        severity: 'medium',
        enabled: true,
        notification_channels: ['email']
      },

      // Critical System Alerts
      {
        id: 'system_uptime_low',
        name: 'Disponibilité système faible',
        metric: 'system_uptime',
        operator: 'lt',
        threshold: 0.95, // 95%
        severity: 'critical',
        enabled: true,
        notification_channels: ['email', 'sms', 'push']
      }
    ];
  }

  // ========== MONITORING FUNCTIONS ==========

  private async checkAlertRules() {
    try {
      // Get current metrics
      const metrics = await this.getCurrentMetrics();

      for (const rule of this.alertRules) {
        if (!rule.enabled) continue;

        const currentValue = metrics[rule.metric];
        if (currentValue === undefined) continue;

        const shouldTrigger = this.evaluateCondition(
          currentValue,
          rule.operator,
          rule.threshold
        );

        const existingAlert = this.activeAlerts.find(
          alert => alert.rule_id === rule.id && alert.status === 'active'
        );

        if (shouldTrigger && !existingAlert) {
          await this.triggerAlert(rule, currentValue);
        } else if (!shouldTrigger && existingAlert) {
          await this.resolveAlert(existingAlert.id);
        }
      }

    } catch (error) {
      console.error('❌ [ALERTS] Error checking alert rules:', error);
      analytics.trackError({
        error_type: 'api_error',
        error_message: `Alert monitoring failed: ${error}`,
        context: { service: 'alert_system' }
      });
    }
  }

  private async getCurrentMetrics(): Promise<Record<string, number>> {
    // In a real implementation, this would fetch from your analytics API
    // For now, return mock data structure
    try {
      const authHeaders = await getAuthHeaders();
      if (!authHeaders) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${API_BASE_URL}/analytics/current-metrics`, {
        method: 'GET',
        headers: authHeaders
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.metrics || {};
      
    } catch (error) {
      console.error('❌ [ALERTS] Failed to fetch current metrics:', error);
      // Return safe defaults to prevent false alerts
      return {
        payment_failure_rate: 0,
        payment_amount: 0,
        avg_api_response_time: 0,
        api_error_rate: 0,
        job_completion_rate: 1,
        system_uptime: 1
      };
    }
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  // ========== ALERT MANAGEMENT ==========

  private async triggerAlert(rule: AlertRule, currentValue: number) {
    const alert: Alert = {
      id: `alert_${Date.now()}_${rule.id}`,
      rule_id: rule.id,
      severity: rule.severity,
      title: rule.name,
      description: this.generateAlertDescription(rule, currentValue),
      current_value: currentValue,
      threshold_value: rule.threshold,
      triggered_at: new Date().toISOString(),
      status: 'active'
    };

    this.activeAlerts.push(alert);

    console.warn(`🚨 [ALERT TRIGGERED] ${alert.title} - ${alert.description}`);

    // Track the alert
    analytics.trackCustomEvent('alert_triggered', 'error', {
      alert_id: alert.id,
      rule_id: rule.id,
      severity: rule.severity,
      current_value: currentValue,
      threshold: rule.threshold
    });

    // Send notifications
    await this.sendNotifications(alert, rule.notification_channels);

    // Send to backend
    await this.sendAlertToBackend(alert);
  }

  private async resolveAlert(alertId: string) {
    const alertIndex = this.activeAlerts.findIndex(alert => alert.id === alertId);
    if (alertIndex === -1) return;

    const alert = this.activeAlerts[alertIndex];
    alert.status = 'resolved';
    alert.resolved_at = new Date().toISOString();

    // TEMP_DISABLED: console.log(`✅ [ALERT RESOLVED] ${alert.title}`);

    // Track resolution
    analytics.trackCustomEvent('alert_resolved', 'business', {
      alert_id: alert.id,
      duration: Date.now() - new Date(alert.triggered_at).getTime(),
      severity: alert.severity
    });

    // Update backend
    await this.updateAlertInBackend(alert);

    // Remove from active alerts
    this.activeAlerts.splice(alertIndex, 1);
  }

  private generateAlertDescription(rule: AlertRule, currentValue: number): string {
    const formattedValue = rule.metric.includes('rate') || rule.metric.includes('uptime')
      ? `${(currentValue * 100).toFixed(1)}%`
      : rule.metric.includes('time')
      ? `${currentValue}ms`
      : currentValue.toString();

    const formattedThreshold = rule.metric.includes('rate') || rule.metric.includes('uptime')
      ? `${(rule.threshold * 100).toFixed(1)}%`
      : rule.metric.includes('time')
      ? `${rule.threshold}ms`
      : rule.threshold.toString();

    return `Valeur actuelle: ${formattedValue}, Seuil: ${formattedThreshold}`;
  }

  // ========== NOTIFICATIONS ==========

  private async sendNotifications(alert: Alert, channels: ('email' | 'sms' | 'push' | 'webhook')[]) {
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'push':
            await this.sendPushNotification(alert);
            break;
          case 'email':
            await this.sendEmailNotification(alert);
            break;
          case 'sms':
            await this.sendSMSNotification(alert);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert);
            break;
        }
      } catch (error) {
        console.error(`❌ [ALERTS] Failed to send ${channel} notification:`, error);
      }
    }
  }

  private async sendPushNotification(alert: Alert) {
    // Implementation for push notifications
    // TEMP_DISABLED: console.log(`📱 [PUSH] ${alert.severity.toUpperCase()}: ${alert.title}`);
  }

  private async sendEmailNotification(alert: Alert) {
    try {
      const authHeaders = await getAuthHeaders();
      if (!authHeaders) return;

      await fetch(`${API_BASE_URL}/notifications/email`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'alert',
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          alert_id: alert.id
        })
      });

      // TEMP_DISABLED: console.log(`📧 [EMAIL] Alert notification sent for: ${alert.title}`);
    } catch (error) {
      console.error('❌ [ALERTS] Failed to send email notification:', error);
    }
  }

  private async sendSMSNotification(alert: Alert) {
    // Implementation for SMS notifications (only critical alerts)
    if (alert.severity === 'critical') {
      // TEMP_DISABLED: console.log(`📱 [SMS] CRITICAL ALERT: ${alert.title}`);
    }
  }

  private async sendWebhookNotification(alert: Alert) {
    // Implementation for webhook notifications
    // TEMP_DISABLED: console.log(`🔗 [WEBHOOK] Alert sent: ${alert.title}`);
  }

  // ========== BACKEND SYNC ==========

  private async sendAlertToBackend(alert: Alert) {
    try {
      const authHeaders = await getAuthHeaders();
      if (!authHeaders) return;

      await fetch(`${API_BASE_URL}/alerts`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alert)
      });

    } catch (error) {
      console.error('❌ [ALERTS] Failed to send alert to backend:', error);
    }
  }

  private async updateAlertInBackend(alert: Alert) {
    try {
      const authHeaders = await getAuthHeaders();
      if (!authHeaders) return;

      await fetch(`${API_BASE_URL}/alerts/${alert.id}`, {
        method: 'PUT',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alert)
      });

    } catch (error) {
      console.error('❌ [ALERTS] Failed to update alert in backend:', error);
    }
  }

  // ========== PUBLIC METHODS ==========

  public startMonitoring() {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(() => {
      this.checkAlertRules();
    }, this.checkIntervalMs);

    // TEMP_DISABLED: console.log('🚨 [ALERTS] Monitoring started');
  }

  public stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    // TEMP_DISABLED: console.log('🚨 [ALERTS] Monitoring stopped');
  }

  public getActiveAlerts(): Alert[] {
    return [...this.activeAlerts];
  }

  public getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  public updateAlertRule(ruleId: string, updates: Partial<AlertRule>) {
    const ruleIndex = this.alertRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex !== -1) {
      this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
    }
  }

  public suppressAlert(alertId: string) {
    const alert = this.activeAlerts.find(alert => alert.id === alertId);
    if (alert) {
      alert.status = 'suppressed';
    }
  }

  // Manual alert triggering for testing
  public async triggerTestAlert() {
    const testRule: AlertRule = {
      id: 'test_alert',
      name: 'Test Alert',
      metric: 'test_metric',
      operator: 'gt',
      threshold: 0,
      severity: 'low',
      enabled: true,
      notification_channels: ['push']
    };

    await this.triggerAlert(testRule, 1);
  }
}

// Singleton instance
export const alertService = new AlertService();

export default alertService;