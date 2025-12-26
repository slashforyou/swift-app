/**
 * Tests pour le service Analytics
 * Valide le tracking d'événements, les métriques et la synchronisation backend
 */

import { analytics } from '../../src/services/analytics';

// Mock des dépendances
jest.mock('../../src/utils/auth', () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json'
  })
}));

jest.mock('../../src/services/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock global fetch
global.fetch = jest.fn();

describe('Analytics Service', () => {
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
    
    // Reset analytics state
    analytics.enable();
    analytics['eventQueue'] = [];
  });

  describe('Event Tracking', () => {
    it('should track job step events correctly', () => {
      const jobId = 'test-job-123';
      const currentStep = 2;
      const totalSteps = 5;
      const notes = 'Test notes';

      analytics.trackJobStep(jobId, currentStep, totalSteps, notes);

      const queue = analytics['eventQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        event_type: 'job_step_advanced',
        event_category: 'business',
        event_data: {
          job_id: jobId,
          current_step: currentStep,
          total_steps: totalSteps,
          progress_percentage: 40,
          notes: notes
        }
      });
    });

    it('should track payment events with correct data', () => {
      const amount = 150.50;
      const jobId = 'job-456';

      analytics.trackPayment('completed', amount, jobId);

      const queue = analytics['eventQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        event_type: 'payment_completed',
        event_category: 'business',
        event_data: {
          amount: amount,
          job_id: jobId,
          currency: 'AUD'
        }
      });
    });

    it('should track navigation events', () => {
      const screenName = 'JobDetails';
      const previousScreen = 'JobList';

      analytics.trackNavigation(screenName, previousScreen);

      const queue = analytics['eventQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        event_type: 'screen_view',
        event_category: 'user_action',
        event_data: {
          screen_name: screenName,
          previous_screen: previousScreen
        }
      });
    });

    it('should track screen time correctly', () => {
      const screenName = 'JobDetails';
      const timeSpent = 45000; // 45 seconds

      analytics.trackScreenTime(screenName, timeSpent);

      const queue = analytics['eventQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        event_type: 'screen_time',
        event_category: 'user_action',
        event_data: {
          screen_name: screenName,
          time_spent_ms: timeSpent,
          time_spent_seconds: 45
        }
      });
    });

    it('should track API calls with performance metrics', () => {
      const endpoint = '/api/jobs';
      const method = 'POST';
      const duration = 1250;
      const status = 200;

      analytics.trackAPICall(endpoint, method, duration, status);

      const queue = analytics['eventQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        event_type: 'api_call',
        event_category: 'technical',
        event_data: {
          endpoint: endpoint,
          method: method,
          duration_ms: duration,
          status_code: status,
          success: true
        }
      });
    });
  });

  describe('Event Batching and Sync', () => {
    it('should batch events before sending to backend', async () => {
      // Mock successful API response
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      // Add multiple events
      analytics.trackJobStep('job-1', 1, 3);
      analytics.trackJobStep('job-2', 2, 4);
      analytics.trackPayment('initiated', 100);

      expect(analytics['eventQueue']).toHaveLength(3);

      // Force flush
      await analytics['flushEvents']();

      // Verify API call
      expect(fetch).toHaveBeenCalledWith(
        'https://altivo.fr/swift-app/analytics/events',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"events"')
        })
      );

      // Queue should be empty after successful flush
      expect(analytics['eventQueue']).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      // Add events
      analytics.trackJobStep('job-1', 1, 3);
      const originalQueueLength = analytics['eventQueue'].length;

      await analytics['flushEvents']();

      // Events should be restored to queue on error
      expect(analytics['eventQueue']).toHaveLength(originalQueueLength);
    });

    it('should handle network errors', async () => {
      // Mock network error
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      analytics.trackJobStep('job-1', 1, 3);
      const originalQueueLength = analytics['eventQueue'].length;

      await analytics['flushEvents']();

      // Events should be restored to queue on error
      expect(analytics['eventQueue']).toHaveLength(originalQueueLength);
    });
  });

  describe('Performance Metrics', () => {
    it('should track custom performance metrics', () => {
      const metric = {
        metric_name: 'page_load_time',
        value: 850,
        unit: 'milliseconds',
        context: { page: 'dashboard' }
      };

      analytics.trackPerformanceMetric(metric);

      const queue = analytics['eventQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        event_type: 'performance_metric',
        event_category: 'technical',
        event_data: metric
      });
    });

    it('should measure execution time', async () => {
      const functionName = 'testFunction';
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'test result';
      };

      const result = await analytics.measureExecutionTime(
        functionName,
        testFunction,
        { context: 'test' }
      );

      expect(result).toBe('test result');

      const queue = analytics['eventQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0].event_data.metric_name).toBe('execution_time_testFunction');
      expect(queue[0].event_data.value).toBeGreaterThan(90); // Should be around 100ms
    });
  });

  describe('User Action Tracking', () => {
    it('should track user actions with context', () => {
      const action = 'button_click';
      const context = {
        button_name: 'save_job',
        screen: 'JobEdit',
        job_id: 'job-123'
      };

      analytics.trackUserAction(action, context);

      const queue = analytics['eventQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        event_type: 'user_button_click',
        event_category: 'user_action',
        event_data: context
      });
    });

    it('should track errors with proper categorization', () => {
      const errorType = 'api_error';
      const message = 'Failed to save job';
      const context = { endpoint: '/api/jobs', status: 500 };

      analytics.trackError(errorType, message, context);

      const queue = analytics['eventQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        event_type: 'error_api_error',
        event_category: 'error',
        event_data: {
          error_message: message,
          ...context
        }
      });
    });
  });

  describe('Service State Management', () => {
    it('should enable/disable tracking correctly', () => {
      // Test disable
      analytics.disable();
      expect(analytics.isEnabled).toBe(false);

      analytics.trackJobStep('job-1', 1, 3);
      expect(analytics['eventQueue']).toHaveLength(0);

      // Test enable
      analytics.enable();
      expect(analytics.isEnabled).toBe(true);

      analytics.trackJobStep('job-1', 1, 3);
      expect(analytics['eventQueue']).toHaveLength(1);
    });

    it('should handle missing auth headers', async () => {
      // Mock missing auth
      const { getAuthHeaders } = require('../../src/utils/auth');
      getAuthHeaders.mockResolvedValueOnce(null);

      analytics.trackJobStep('job-1', 1, 3);
      await analytics['flushEvents']();

      // Should not call fetch without auth
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Data Validation', () => {
    it('should add timestamps to events automatically', () => {
      const beforeTimestamp = new Date().toISOString();
      
      analytics.trackJobStep('job-1', 1, 3);
      
      const afterTimestamp = new Date().toISOString();
      const event = analytics['eventQueue'][0];

      expect(event.timestamp).toBeDefined();
      expect(event.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(event.timestamp).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should handle invalid payment amounts', () => {
      // Test with negative amount
      analytics.trackPayment('completed', -50);

      const queue = analytics['eventQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0].event_data.amount).toBe(-50); // Should still track, but flag as suspicious
    });

    it('should handle very large job step numbers', () => {
      analytics.trackJobStep('job-1', 999, 1000);

      const queue = analytics['eventQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0].event_data.progress_percentage).toBe(99.9);
    });
  });
});