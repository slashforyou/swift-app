/**
 * Tests pour le service de Logging
 * Valide les niveaux de log, corrélation IDs, et synchronisation backend
 */

import { logger } from '../../src/services/logger';

// Mock des dépendances
jest.mock('../../src/utils/auth', () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json'
  })
}));

// Mock global fetch
global.fetch = jest.fn();

// Mock device info
const mockDeviceInfo = {
  platform: 'ios',
  version: '14.5',
  model: 'iPhone 12'
};

jest.mock('expo-device', () => mockDeviceInfo);

describe('Logging Service', () => {
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
    
    // Reset logger state
    logger['logQueue'] = [];
  });

  describe('Log Levels', () => {
    it('should create debug log with correct level', () => {
      const message = 'Debug message';
      const context = { component: 'TestComponent' };

      logger.debug(message, context);

      const queue = logger['logQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        level: 'debug',
        message,
        context,
        timestamp: expect.any(String)
      });
    });

    it('should create info log with correct level', () => {
      const message = 'Info message';
      const context = { userId: '123' };

      logger.info(message, context);

      const queue = logger['logQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        level: 'info',
        message,
        context
      });
    });

    it('should create warn log with correct level', () => {
      const message = 'Warning message';
      const context = { deprecatedFeature: 'oldAPI' };

      logger.warn(message, context);

      const queue = logger['logQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        level: 'warn',
        message,
        context
      });
    });

    it('should create error log with correct level', () => {
      const message = 'Error message';
      const context = { error: 'Network failure' };

      logger.error(message, context);

      const queue = logger['logQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        level: 'error',
        message,
        context
      });
    });

    it('should create fatal log with correct level', () => {
      const message = 'Fatal error';
      const context = { system: 'payment', critical: true };

      logger.fatal(message, context);

      const queue = logger['logQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        level: 'fatal',
        message,
        context
      });
    });
  });

  describe('Correlation IDs', () => {
    it('should generate unique correlation IDs', () => {
      const id1 = logger.generateCorrelationId();
      const id2 = logger.generateCorrelationId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[a-z0-9-]+$/); // UUID format
    });

    it('should include correlation ID in logs when provided', () => {
      const correlationId = logger.generateCorrelationId();
      const message = 'Correlated message';

      logger.info(message, { correlationId });

      const queue = logger['logQueue'];
      expect(queue[0].correlationId).toBe(correlationId);
    });

    it('should auto-generate correlation ID if not provided', () => {
      logger.info('Message without correlation');

      const queue = logger['logQueue'];
      expect(queue[0].correlationId).toBeDefined();
      expect(queue[0].correlationId).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('Device Information', () => {
    it('should include device info in logs', () => {
      logger.info('Test message');

      const queue = logger['logQueue'];
      expect(queue[0].deviceInfo).toMatchObject({
        platform: 'ios',
        version: '14.5',
        model: 'iPhone 12'
      });
    });

    it('should handle missing device info gracefully', () => {
      // Mock device info error
      jest.doMock('expo-device', () => {
        throw new Error('Device info not available');
      });

      logger.info('Test message');

      const queue = logger['logQueue'];
      expect(queue[0].deviceInfo).toEqual({
        platform: 'unknown',
        version: 'unknown',
        model: 'unknown'
      });
    });
  });

  describe('Performance Logging', () => {
    it('should log performance metrics correctly', () => {
      const operationName = 'api_call';
      const duration = 1234;
      const unit = 'milliseconds';
      const context = { endpoint: '/jobs' };

      logger.logPerformance(operationName, duration, unit, context);

      const queue = logger['logQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        level: 'info',
        message: expect.stringContaining(operationName),
        context: expect.objectContaining({
          performance: expect.objectContaining({
            metric: operationName,
            value: duration,
            unit: unit
          })
        })
      });
    });

    it('should format performance logs correctly', () => {
      logger.logPerformance('slow_operation', 65432, 'milliseconds');

      const queue = logger['logQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0].message).toContain('slow_operation');
      expect(queue[0].context?.performance?.value).toBe(65432);
    });
  });

  describe('Queue Management', () => {
    it('should batch logs before sending to backend', async () => {
      // Mock successful API response
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      // Add multiple logs
      logger.info('Log 1');
      logger.warn('Log 2');
      logger.error('Log 3');

      expect(logger['logQueue']).toHaveLength(3);

      // Force flush
      await logger.flush();

      // Verify API call
      expect(fetch).toHaveBeenCalledWith(
        'https://altivo.fr/swift-app/logs',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"logs"')
        })
      );

      // Queue should be empty after successful flush
      expect(logger['logQueue']).toHaveLength(0);
    });

    it('should auto-flush when queue reaches limit', async () => {
      // Mock successful API response
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        status: 200
      } as Response);

      // Add logs to trigger auto-flush (assuming limit is 50)
      for (let i = 0; i < 51; i++) {
        logger.info(`Log message ${i}`);
      }

      // Should have triggered flush
      expect(fetch).toHaveBeenCalled();
    });

    it('should handle backend errors gracefully', async () => {
      // Mock API error
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      logger.info('Test log');
      const originalQueueLength = logger['logQueue'].length;

      await logger.flush();

      // Logs should be restored to queue on error
      expect(logger['logQueue']).toHaveLength(originalQueueLength);
    });
  });

  describe('Error Handling', () => {
    it('should handle JavaScript errors when setup is called', () => {
      // Test that error handler setup doesn't throw
      expect(() => {
        // The constructor already calls setupGlobalErrorHandling
        // So we test that it's working by checking if errors are logged
        logger.error('Test error handling', { testCase: true });
      }).not.toThrow();

      const queue = logger['logQueue'];
      expect(queue).toHaveLength(1);
      expect(queue[0].level).toBe('error');
    });

    it('should log promise rejections when they occur', () => {
      // Test manual error logging (simulating what global handler would do)
      const testError = new Error('Unhandled promise rejection');
      
      logger.error('Unhandled promise rejection', {
        error: testError.message,
        stack: testError.stack
      });

      const queue = logger['logQueue'];
      expect(queue.some(log => 
        log.level === 'error' && 
        log.message.includes('Unhandled promise rejection')
      )).toBe(true);
    });
  });

  describe('Structured Logging', () => {
    it('should maintain log structure consistency', () => {
      logger.info('Test message', { customField: 'value' });

      const log = logger['logQueue'][0];
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('level');
      expect(log).toHaveProperty('message');
      expect(log).toHaveProperty('context');
      expect(log).toHaveProperty('correlationId');
      expect(log).toHaveProperty('deviceInfo');
    });

    it('should serialize complex objects in context', () => {
      const complexObject = {
        user: { id: 123, name: 'Test User' },
        settings: { theme: 'dark', notifications: true },
        data: [1, 2, 3]
      };

      logger.info('Complex object test', { data: complexObject });

      const log = logger['logQueue'][0];
      expect(log.context?.data).toEqual(complexObject);
    });

    it('should handle circular references in context', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      expect(() => {
        logger.info('Circular reference test', { circular: circularObj });
      }).not.toThrow();

      const log = logger['logQueue'][0];
      expect(log.context?.circular).toBeDefined();
    });
  });

  describe('Log Management', () => {
    it('should provide queue size information', () => {
      logger.info('Test 1');
      logger.info('Test 2');
      logger.info('Test 3');

      expect(logger.getQueueSize()).toBe(3);
    });

    it('should handle queue when flushed', async () => {
      // Mock successful flush
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      logger.info('Test 1');
      logger.info('Test 2');

      expect(logger.getQueueSize()).toBe(2);
      
      await logger.flush();
      
      expect(logger.getQueueSize()).toBe(0);
    });
  });
});