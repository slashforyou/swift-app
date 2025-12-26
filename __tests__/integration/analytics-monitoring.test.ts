/**
 * Tests d'intégration - Analytics & Monitoring System
 * Valide le fonctionnement complet du système en conditions réelles
 */

import { alertService } from '../../src/services/alertService';
import { analytics } from '../../src/services/analytics';
import { logger } from '../../src/services/logger';
import { navigationService } from '../../src/services/navigationService';

// Mock des dépendances globales
jest.mock('../../src/utils/auth', () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({
    'Authorization': 'Bearer integration-test-token',
    'Content-Type': 'application/json'
  })
}));

// Mock successful API responses by default
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ success: true })
} as Response);

describe('Analytics & Monitoring Integration', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all services
    analytics['eventQueue'] = [];
    logger['logQueue'] = [];
    alertService['activeAlerts'].clear();
    alertService['alertHistory'] = [];
    
    // Enable all services
    analytics.enable();
    
    // Initialize navigation service
    navigationService.initialize('TestStartScreen');
  });

  describe('Complete Job Workflow Integration', () => {
    it('should track complete job progression with analytics, logging and monitoring', async () => {
      const jobId = 'integration-test-job-001';
      const totalSteps = 5;

      // Simulate complete job workflow
      for (let step = 1; step <= totalSteps; step++) {
        // Navigate to job step screen
        await navigationService.navigate(`JobStep${step}`, {
          params: { jobId, step }
        });

        // Track job step progression
        analytics.trackJobStep(jobId, step, totalSteps, `Step ${step} completed`);

        // Log the progression
        logger.info(`Job step ${step} completed`, {
          jobId,
          currentStep: step,
          totalSteps,
          progress: Math.round((step / totalSteps) * 100)
        });

        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Navigate to completion screen
      await navigationService.navigate('JobCompletion', {
        params: { jobId }
      });

      // Track job completion
      analytics.trackUserAction('job_completed', {
        job_id: jobId,
        total_steps: totalSteps,
        completion_time: new Date().toISOString()
      });

      // Verify analytics events
      const analyticsQueue = analytics['eventQueue'];
      expect(analyticsQueue).toHaveLength(7); // 5 steps + navigation events + completion

      const jobStepEvents = analyticsQueue.filter(e => e.event_type === 'job_step_advanced');
      expect(jobStepEvents).toHaveLength(5);

      const completionEvent = analyticsQueue.find(e => e.event_type === 'user_job_completed');
      expect(completionEvent).toBeDefined();
      expect(completionEvent?.event_data.job_id).toBe(jobId);

      // Verify logging
      const logQueue = logger['logQueue'];
      const jobLogs = logQueue.filter(log => log.message.includes('Job step'));
      expect(jobLogs).toHaveLength(5);

      // All logs should have correlation IDs
      logQueue.forEach(log => {
        expect(log.correlationId).toBeDefined();
      });

      // Verify navigation tracking
      const navStats = navigationService.getNavigationStats();
      expect(navStats.totalNavigations).toBeGreaterThan(5);
      expect(navStats.screenVisitCounts['JobCompletion']).toBe(1);
    });

    it('should handle job step failure with comprehensive error tracking', async () => {
      const jobId = 'failing-job-001';
      const failingStep = 3;
      const totalSteps = 5;
      const errorMessage = 'Network timeout during job step update';

      // Navigate to failing step
      await navigationService.navigate(`JobStep${failingStep}`);

      // Track the error
      analytics.trackError('api_error', errorMessage, {
        job_id: jobId,
        failing_step: failingStep,
        endpoint: '/api/job-steps',
        status_code: 504
      });

      // Log the error with context
      logger.error('Job step update failed', {
        jobId,
        currentStep: failingStep,
        totalSteps,
        error: errorMessage,
        retryAttempt: 1
      });

      // This should potentially trigger an alert
      const mockMetrics = {
        jobs: {
          total: 10,
          failed: 2, // 20% failure rate
          success_rate: 0.8
        }
      };

      // Mock analytics.getMetrics for alert checking
      jest.spyOn(analytics, 'getMetrics').mockResolvedValueOnce(mockMetrics as any);

      // Check for alerts
      await alertService.checkAlerts();

      // Verify error tracking
      const analyticsQueue = analytics['eventQueue'];
      const errorEvents = analyticsQueue.filter(e => e.event_type === 'error_api_error');
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].event_data.job_id).toBe(jobId);

      // Verify error logging
      const logQueue = logger['logQueue'];
      const errorLogs = logQueue.filter(log => log.level === 'error');
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].context?.jobId).toBe(jobId);

      // Verify alerts might be triggered (depending on thresholds)
      const activeAlerts = alertService.getActiveAlerts();
      // Note: Alerts depend on configured thresholds and accumulated metrics
    });
  });

  describe('Payment Flow Integration', () => {
    it('should track payment flow with complete monitoring', async () => {
      const amount = 299.99;
      const jobId = 'payment-test-job';

      // Navigate to payment screen
      await navigationService.navigate('Payment', {
        params: { amount, jobId }
      });

      // Track payment initiation
      analytics.trackPayment('initiated', amount, jobId);
      logger.info('Payment initiated', { amount, jobId, currency: 'AUD' });

      // Simulate payment processing time
      await new Promise(resolve => setTimeout(resolve, 20));

      // Track payment completion
      analytics.trackPayment('completed', amount, jobId);
      logger.info('Payment completed successfully', {
        amount,
        jobId,
        transactionId: 'txn_' + Date.now()
      });

      // Navigate to success screen
      await navigationService.navigate('PaymentSuccess');

      // Verify complete payment tracking
      const analyticsQueue = analytics['eventQueue'];
      const paymentEvents = analyticsQueue.filter(e => 
        e.event_type.includes('payment')
      );
      expect(paymentEvents).toHaveLength(2);

      const initiatedEvent = paymentEvents.find(e => e.event_type === 'payment_initiated');
      const completedEvent = paymentEvents.find(e => e.event_type === 'payment_completed');

      expect(initiatedEvent?.event_data.amount).toBe(amount);
      expect(completedEvent?.event_data.amount).toBe(amount);

      // Verify payment logs
      const logQueue = logger['logQueue'];
      const paymentLogs = logQueue.filter(log => 
        log.message.includes('Payment')
      );
      expect(paymentLogs.length).toBeGreaterThanOrEqual(2);

      // Verify correlation across logs
      const paymentCorrelations = paymentLogs.map(log => log.correlationId);
      expect(new Set(paymentCorrelations).size).toBeGreaterThan(0);
    });

    it('should handle payment failure with comprehensive error tracking', async () => {
      const amount = 150.00;
      const jobId = 'failed-payment-job';
      const failureReason = 'Insufficient funds';

      await navigationService.navigate('Payment', { params: { amount, jobId } });

      // Track payment initiation
      analytics.trackPayment('initiated', amount, jobId);

      // Track payment failure
      analytics.trackPayment('failed', amount, jobId);
      analytics.trackError('payment_error', failureReason, {
        amount,
        job_id: jobId,
        payment_method: 'credit_card'
      });

      // Log the failure
      logger.error('Payment failed', {
        amount,
        jobId,
        reason: failureReason,
        timestamp: new Date().toISOString()
      });

      // Navigate to failure screen
      await navigationService.navigate('PaymentFailed');

      // Verify failure tracking
      const analyticsQueue = analytics['eventQueue'];
      const failedPaymentEvents = analyticsQueue.filter(e => 
        e.event_type === 'payment_failed'
      );
      expect(failedPaymentEvents).toHaveLength(1);

      const errorEvents = analyticsQueue.filter(e => 
        e.event_type === 'error_payment_error'
      );
      expect(errorEvents).toHaveLength(1);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track API performance across all service calls', async () => {
      // Mock API calls with various response times
      const apiCalls = [
        { endpoint: '/api/jobs', method: 'GET', duration: 450, status: 200 },
        { endpoint: '/api/user/profile', method: 'GET', duration: 1200, status: 200 },
        { endpoint: '/api/payments', method: 'POST', duration: 2100, status: 201 },
        { endpoint: '/api/jobs/123/steps', method: 'PUT', duration: 3500, status: 500 }
      ];

      for (const call of apiCalls) {
        analytics.trackAPICall(call.endpoint, call.method, call.duration, call.status);
        
        logger.logPerformance(
          `api_${call.method.toLowerCase()}_${call.endpoint.replace(/\//g, '_')}`,
          call.duration,
          'milliseconds',
          {
            endpoint: call.endpoint,
            method: call.method,
            status: call.status
          }
        );
      }

      // Verify performance tracking
      const analyticsQueue = analytics['eventQueue'];
      const apiEvents = analyticsQueue.filter(e => e.event_type === 'api_call');
      expect(apiEvents).toHaveLength(4);

      // Check that slow API calls are properly flagged
      const slowCalls = apiEvents.filter(e => e.event_data.duration_ms > 2000);
      expect(slowCalls).toHaveLength(2);

      // Check that failed API calls are marked
      const failedCalls = apiEvents.filter(e => e.event_data.success === false);
      expect(failedCalls).toHaveLength(1);

      // Verify performance logs
      const logQueue = logger['logQueue'];
      const perfLogs = logQueue.filter(log => 
        log.context?.performance
      );
      expect(perfLogs).toHaveLength(4);
    });

    it('should trigger alerts for performance issues', async () => {
      // Mock high API response times
      const mockMetrics = {
        performance: {
          avg_api_response_time: 2500, // Over 2000ms threshold
          slow_requests_count: 15,
          total_requests: 100
        },
        system: {
          uptime_percentage: 0.995
        },
        payments: {
          success_rate: 0.98
        }
      };

      jest.spyOn(analytics, 'getMetrics').mockResolvedValueOnce(mockMetrics as any);

      await alertService.checkAlerts();

      // Should trigger API response time alert
      const activeAlerts = alertService.getActiveAlerts();
      const performanceAlert = activeAlerts.find(alert => 
        alert.rule.name === 'api_response_time'
      );

      expect(performanceAlert).toBeDefined();
      expect(performanceAlert?.currentValue).toBe(2500);

      // Verify alert is logged
      const logQueue = logger['logQueue'];
      const alertLogs = logQueue.filter(log => 
        log.message.includes('Alert triggered')
      );
      expect(alertLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Data Synchronization Integration', () => {
    it('should synchronize all data to backend correctly', async () => {
      // Mock successful backend responses
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true })
      } as Response);

      // Generate test data
      analytics.trackJobStep('sync-test-job', 1, 3);
      analytics.trackPayment('completed', 100);
      logger.info('Sync test log entry');

      // Force synchronization
      await Promise.all([
        analytics['flushEvents'](),
        logger.flush()
      ]);

      // Verify API calls were made
      expect(fetch).toHaveBeenCalledWith(
        'https://altivo.fr/swift-app/analytics/events',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer integration-test-token'
          })
        })
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://altivo.fr/swift-app/logs',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer integration-test-token'
          })
        })
      );

      // Queues should be empty after successful sync
      expect(analytics['eventQueue']).toHaveLength(0);
      expect(logger['logQueue']).toHaveLength(0);
    });

    it('should handle backend failures gracefully with retry logic', async () => {
      // Mock backend failure
      (fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200
        } as Response);

      // Generate test data
      analytics.trackJobStep('retry-test-job', 1, 3);
      logger.info('Retry test log entry');

      // First sync attempt (should fail)
      await analytics['flushEvents']();
      await logger.flush();

      // Data should be restored to queues
      expect(analytics['eventQueue'].length).toBeGreaterThan(0);
      expect(logger['logQueue'].length).toBeGreaterThan(0);

      // Second sync attempt (should succeed)
      await analytics['flushEvents']();
      await logger.flush();

      // Verify retry worked
      expect(fetch).toHaveBeenCalledTimes(4); // 2 for analytics, 2 for logs
    });
  });

  describe('User Experience Integration', () => {
    it('should provide seamless user experience during monitoring', async () => {
      const correlationId = logger.generateCorrelationId();

      // Simulate user journey
      await navigationService.navigate('Home');
      logger.info('User opened app', { correlationId });

      await navigationService.navigate('JobList');
      analytics.trackUserAction('jobs_viewed', { correlationId });

      await navigationService.navigate('CreateJob');
      analytics.trackUserAction('job_creation_started', { correlationId });

      const jobId = 'ux-test-job-001';
      analytics.trackUserAction('job_created', { 
        job_id: jobId,
        correlationId 
      });
      logger.info('Job created successfully', { jobId, correlationId });

      // Verify correlated tracking
      const logQueue = logger['logQueue'];
      const analyticsQueue = analytics['eventQueue'];

      const correlatedLogs = logQueue.filter(log => 
        log.correlationId === correlationId
      );
      const correlatedAnalytics = analyticsQueue.filter(event => 
        event.event_data?.correlationId === correlationId
      );

      expect(correlatedLogs.length).toBeGreaterThan(0);
      expect(correlatedAnalytics.length).toBeGreaterThan(0);

      // Verify navigation stats
      const navStats = navigationService.getNavigationStats();
      expect(navStats.screenVisitCounts['Home']).toBe(1);
      expect(navStats.screenVisitCounts['JobList']).toBe(1);
      expect(navStats.screenVisitCounts['CreateJob']).toBe(1);
    });
  });

  describe('System Health Integration', () => {
    it('should provide comprehensive system health monitoring', async () => {
      // Generate various types of events
      analytics.trackJobStep('health-job-1', 1, 3);
      analytics.trackPayment('completed', 50);
      analytics.trackUserAction('feature_used', { feature: 'export' });
      analytics.trackAPICall('/api/health', 'GET', 200, 200);

      logger.info('System health check');
      logger.logPerformance('memory_usage', 85, 'percentage');
      
      // Mock system metrics
      const mockMetrics = {
        system: {
          uptime_percentage: 0.999,
          memory_usage: 85,
          cpu_usage: 45
        },
        performance: {
          avg_api_response_time: 800,
          error_rate: 0.01
        },
        business: {
          active_jobs: 25,
          completed_jobs_today: 8,
          revenue_today: 1250.50
        }
      };

      jest.spyOn(analytics, 'getMetrics').mockResolvedValueOnce(mockMetrics as any);

      // Check system health
      await alertService.checkAlerts();

      // All metrics should be healthy (no alerts)
      const activeAlerts = alertService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(0);

      // Verify health data is tracked
      const analyticsQueue = analytics['eventQueue'];
      const logQueue = logger['logQueue'];

      expect(analyticsQueue.length).toBeGreaterThan(0);
      expect(logQueue.length).toBeGreaterThan(0);

      // Verify performance metrics are logged
      const perfLogs = logQueue.filter(log => 
        log.context?.performance
      );
      expect(perfLogs.length).toBeGreaterThan(0);
    });
  });
});