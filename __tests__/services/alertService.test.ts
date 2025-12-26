/**
 * Tests pour le service d'alertes
 * Valide l'évaluation des règles, notifications et intégration analytics
 */

import { alertService } from '../../src/services/alertService';

// Mock des dépendances
jest.mock('../../src/services/analytics', () => ({
  analytics: {
    getMetrics: jest.fn(),
    trackUserAction: jest.fn()
  }
}));

jest.mock('../../src/utils/auth', () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json'
  })
}));

jest.mock('../../src/services/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock global fetch
global.fetch = jest.fn();

// Mock notifications
const mockNotifications = {
  scheduleNotificationAsync: jest.fn(),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' })
};

jest.mock('expo-notifications', () => mockNotifications);

describe('Alert Service', () => {
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
    
    // Reset alert service state
    alertService['activeAlerts'].clear();
    alertService['alertHistory'] = [];
  });

  describe('Rule Evaluation', () => {
    it('should evaluate payment failure rate rule correctly', async () => {
      // Mock analytics data indicating high failure rate
      const { analytics } = require('../../src/services/analytics');
      analytics.getMetrics.mockResolvedValueOnce({
        payments: {
          total: 100,
          failed: 8, // 8% failure rate
          success_rate: 0.92
        }
      });

      await alertService.checkAlerts();

      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts.some(alert => 
        alert.rule.name === 'payment_failure_rate'
      )).toBe(true);
    });

    it('should evaluate API response time rule correctly', async () => {
      const { analytics } = require('../../src/services/analytics');
      analytics.getMetrics.mockResolvedValueOnce({
        performance: {
          avg_api_response_time: 2500 // 2.5 seconds, over threshold
        }
      });

      await alertService.checkAlerts();

      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts.some(alert => 
        alert.rule.name === 'api_response_time'
      )).toBe(true);
    });

    it('should evaluate system uptime rule correctly', async () => {
      const { analytics } = require('../../src/services/analytics');
      analytics.getMetrics.mockResolvedValueOnce({
        system: {
          uptime_percentage: 0.985 // 98.5%, below 99% threshold
        }
      });

      await alertService.checkAlerts();

      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts.some(alert => 
        alert.rule.name === 'system_uptime'
      )).toBe(true);
    });

    it('should not trigger alerts when metrics are within thresholds', async () => {
      const { analytics } = require('../../src/services/analytics');
      analytics.getMetrics.mockResolvedValueOnce({
        payments: {
          total: 100,
          failed: 2, // 2% failure rate, within threshold
          success_rate: 0.98
        },
        performance: {
          avg_api_response_time: 1200 // 1.2 seconds, within threshold
        },
        system: {
          uptime_percentage: 0.995 // 99.5%, above threshold
        }
      });

      await alertService.checkAlerts();

      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(0);
    });
  });

  describe('Alert Lifecycle Management', () => {
    it('should create new alert correctly', () => {
      const rule = {
        name: 'test_rule',
        description: 'Test rule description',
        condition: 'test_metric > 100',
        threshold: 100,
        channels: ['email'] as const,
        enabled: true
      };

      const alert = alertService.createAlert(rule, 150, 'Test alert message');

      expect(alert).toMatchObject({
        id: expect.any(String),
        rule: rule,
        triggeredAt: expect.any(Date),
        currentValue: 150,
        message: 'Test alert message',
        status: 'active',
        notificationsSent: []
      });

      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts).toContain(alert);
    });

    it('should resolve alerts correctly', () => {
      const rule = {
        name: 'test_rule',
        description: 'Test rule',
        condition: 'test > 50',
        threshold: 50,
        channels: ['email'] as const,
        enabled: true
      };

      const alert = alertService.createAlert(rule, 75, 'Test alert');
      const alertId = alert.id;

      alertService.resolveAlert(alertId, 'Issue resolved manually');

      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts.find(a => a.id === alertId)).toBeUndefined();

      const history = alertService.getAlertHistory();
      const resolvedAlert = history.find(a => a.id === alertId);
      expect(resolvedAlert?.status).toBe('resolved');
      expect(resolvedAlert?.resolvedAt).toBeDefined();
    });

    it('should prevent duplicate alerts for same rule', () => {
      const rule = {
        name: 'duplicate_test',
        description: 'Duplicate test rule',
        condition: 'test > 100',
        threshold: 100,
        channels: ['email'] as const,
        enabled: true
      };

      // Create first alert
      alertService.createAlert(rule, 150, 'First alert');
      
      // Try to create second alert for same rule
      alertService.createAlert(rule, 160, 'Second alert');

      const activeAlerts = alertService.getActiveAlerts();
      const duplicateAlerts = activeAlerts.filter(a => a.rule.name === 'duplicate_test');
      
      expect(duplicateAlerts).toHaveLength(1);
    });
  });

  describe('Notification System', () => {
    it('should send push notifications correctly', async () => {
      const rule = {
        name: 'push_test',
        description: 'Push notification test',
        condition: 'test > 100',
        threshold: 100,
        channels: ['push'] as const,
        enabled: true
      };

      const alert = alertService.createAlert(rule, 150, 'Test push notification');
      
      await alertService.sendNotifications(alert);

      expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Swift App Alert',
          body: 'Test push notification',
          data: { alertId: alert.id }
        }
      });
    });

    it('should send email notifications correctly', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      const rule = {
        name: 'email_test',
        description: 'Email notification test',
        condition: 'test > 100',
        threshold: 100,
        channels: ['email'] as const,
        enabled: true
      };

      const alert = alertService.createAlert(rule, 150, 'Test email notification');
      
      await alertService.sendNotifications(alert);

      expect(fetch).toHaveBeenCalledWith(
        'https://altivo.fr/swift-app/alerts/notifications',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          }),
          body: expect.stringContaining('email')
        })
      );
    });

    it('should handle notification failures gracefully', async () => {
      // Mock notification failure
      mockNotifications.scheduleNotificationAsync.mockRejectedValueOnce(
        new Error('Notification service unavailable')
      );

      const rule = {
        name: 'fail_test',
        description: 'Notification failure test',
        condition: 'test > 100',
        threshold: 100,
        channels: ['push'] as const,
        enabled: true
      };

      const alert = alertService.createAlert(rule, 150, 'Test notification failure');
      
      await alertService.sendNotifications(alert);

      // Should log error but not throw
      const { logger } = require('../../src/services/logger');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send notification'),
        expect.any(Object)
      );
    });
  });

  describe('Alert Configuration', () => {
    it('should add custom alert rules correctly', () => {
      const customRule = {
        name: 'custom_metric',
        description: 'Custom metric monitoring',
        condition: 'custom_value > 200',
        threshold: 200,
        channels: ['email', 'push'] as const,
        enabled: true
      };

      alertService.addRule(customRule);

      const rules = alertService.getAllRules();
      expect(rules.some(rule => rule.name === 'custom_metric')).toBe(true);
    });

    it('should disable/enable rules correctly', () => {
      alertService.disableRule('payment_failure_rate');
      
      let rules = alertService.getAllRules();
      const disabledRule = rules.find(r => r.name === 'payment_failure_rate');
      expect(disabledRule?.enabled).toBe(false);

      alertService.enableRule('payment_failure_rate');
      
      rules = alertService.getAllRules();
      const enabledRule = rules.find(r => r.name === 'payment_failure_rate');
      expect(enabledRule?.enabled).toBe(true);
    });

    it('should update rule thresholds correctly', () => {
      const newThreshold = 10; // 10% instead of default 5%
      
      alertService.updateRuleThreshold('payment_failure_rate', newThreshold);

      const rules = alertService.getAllRules();
      const updatedRule = rules.find(r => r.name === 'payment_failure_rate');
      expect(updatedRule?.threshold).toBe(newThreshold);
    });
  });

  describe('Alert Statistics', () => {
    it('should provide correct alert statistics', () => {
      // Create some test alerts
      const rule1 = {
        name: 'test_rule_1',
        description: 'Test rule 1',
        condition: 'test > 50',
        threshold: 50,
        channels: ['email'] as const,
        enabled: true
      };

      const rule2 = {
        name: 'test_rule_2',
        description: 'Test rule 2',
        condition: 'test > 100',
        threshold: 100,
        channels: ['push'] as const,
        enabled: true
      };

      const alert1 = alertService.createAlert(rule1, 75, 'Test alert 1');
      const alert2 = alertService.createAlert(rule2, 150, 'Test alert 2');
      
      // Resolve one alert
      alertService.resolveAlert(alert1.id, 'Resolved for testing');

      const stats = alertService.getAlertStatistics();

      expect(stats).toMatchObject({
        total_alerts: 2,
        active_alerts: 1,
        resolved_alerts: 1,
        alerts_by_rule: expect.objectContaining({
          'test_rule_1': 1,
          'test_rule_2': 1
        }),
        average_resolution_time: expect.any(Number)
      });
    });

    it('should track alert frequency correctly', () => {
      const rule = {
        name: 'frequency_test',
        description: 'Frequency test rule',
        condition: 'test > 50',
        threshold: 50,
        channels: ['email'] as const,
        enabled: true
      };

      // Create multiple alerts for the same rule over time
      alertService.createAlert(rule, 75, 'First alert');
      
      // Simulate time passage and resolution
      const firstAlert = alertService.getActiveAlerts()[0];
      alertService.resolveAlert(firstAlert.id, 'First resolution');
      
      alertService.createAlert(rule, 85, 'Second alert');

      const stats = alertService.getAlertStatistics();
      expect(stats.alerts_by_rule['frequency_test']).toBe(2);
    });
  });

  describe('Integration with Analytics', () => {
    it('should track alert events in analytics', () => {
      const { analytics } = require('../../src/services/analytics');
      
      const rule = {
        name: 'analytics_test',
        description: 'Analytics integration test',
        condition: 'test > 100',
        threshold: 100,
        channels: ['email'] as const,
        enabled: true
      };

      alertService.createAlert(rule, 150, 'Analytics test alert');

      expect(analytics.trackUserAction).toHaveBeenCalledWith(
        'alert_triggered',
        expect.objectContaining({
          rule_name: 'analytics_test',
          threshold: 100,
          current_value: 150
        })
      );
    });

    it('should track alert resolution in analytics', () => {
      const { analytics } = require('../../src/services/analytics');
      
      const rule = {
        name: 'resolution_test',
        description: 'Resolution tracking test',
        condition: 'test > 50',
        threshold: 50,
        channels: ['email'] as const,
        enabled: true
      };

      const alert = alertService.createAlert(rule, 75, 'Resolution test');
      alertService.resolveAlert(alert.id, 'Manual resolution');

      expect(analytics.trackUserAction).toHaveBeenCalledWith(
        'alert_resolved',
        expect.objectContaining({
          rule_name: 'resolution_test',
          alert_id: alert.id,
          resolution_reason: 'Manual resolution'
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle metrics fetch errors gracefully', async () => {
      const { analytics } = require('../../src/services/analytics');
      analytics.getMetrics.mockRejectedValueOnce(new Error('Metrics service unavailable'));

      await expect(alertService.checkAlerts()).resolves.not.toThrow();

      const { logger } = require('../../src/services/logger');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to check alerts'),
        expect.any(Object)
      );
    });

    it('should handle malformed alert rules gracefully', () => {
      const malformedRule = {
        name: 'malformed',
        description: 'Missing required fields'
        // Missing condition, threshold, channels, enabled
      } as any;

      expect(() => {
        alertService.addRule(malformedRule);
      }).toThrow();
    });
  });
});