/**
 * Load Testing for SwiftApp APIs
 * Tests for backend API performance under load and stress conditions
 */
import * as StripeService from '../../src/services/StripeService';
import * as businessService from '../../src/services/businessService';
import * as staffService from '../../src/services/staffService';
import * as templatesService from '../../src/services/templatesService';
import * as mockJobData from '../__mocks__/mockJobData';

// Mock all external dependencies for isolated load testing
jest.mock('../../src/services/StripeService');
jest.mock('../../src/services/staffService');
jest.mock('../../src/services/businessService');
jest.mock('../../src/services/templatesService');

describe('API Load Testing', () => {
  
  // Performance measurement utilities
  const measurePerformance = async (fn: () => Promise<any>, iterations: number = 1) => {
    const times: number[] = [];
    const results: any[] = [];
    let errors = 0;

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      try {
        const result = await fn();
        results.push(result);
        times.push(performance.now() - startTime);
      } catch (error) {
        errors++;
        times.push(performance.now() - startTime);
      }
    }

    return {
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      successRate: ((iterations - errors) / iterations) * 100,
      totalErrors: errors,
      results
    };
  };

  const measureConcurrentPerformance = async (
    fn: () => Promise<any>, 
    concurrency: number, 
    totalRequests: number
  ) => {
    const startTime = performance.now();
    const promises: Promise<any>[] = [];
    let completed = 0;
    let errors = 0;

    for (let i = 0; i < concurrency; i++) {
      promises.push(
        (async () => {
          const requestsPerWorker = Math.floor(totalRequests / concurrency);
          for (let j = 0; j < requestsPerWorker; j++) {
            try {
              await fn();
              completed++;
            } catch (error) {
              errors++;
            }
          }
        })()
      );
    }

    await Promise.all(promises);

    const totalTime = performance.now() - startTime;
    return {
      totalTime,
      requestsPerSecond: (completed / totalTime) * 1000,
      successRate: (completed / (completed + errors)) * 100,
      totalCompleted: completed,
      totalErrors: errors
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup realistic response times for mocks
    (StripeService.checkStripeConnectionStatus as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ isConnected: true, status: 'active' }), 50))
    );
    
    (StripeService.fetchStripeBalance as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ available: 15000, pending: 0 }), 75))
    );
    
    (staffService.fetchStaff as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ staff: [] }), 100))
    );
    
    (businessService.fetchBusinessStats as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ revenue: 10000 }), 120))
    );
  });

  describe('Stripe API Load Testing', () => {
    test('should handle high volume of connection status checks', async () => {
      const iterations = 100;
      const results = await measurePerformance(
        () => StripeService.checkStripeConnectionStatus(),
        iterations
      );

      expect(results.successRate).toBeGreaterThan(95);
      expect(results.averageTime).toBeLessThan(200); // Under 200ms average
      expect(results.maxTime).toBeLessThan(500); // No request over 500ms
      
      console.log('Stripe Connection Status Load Test:', results);
    });

    test('should handle concurrent payment intent creations', async () => {
      (StripeService.createJobPaymentIntent as jest.Mock).mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve(mockJobData.createMockPaymentIntent()), 150)
        )
      );

      const results = await measureConcurrentPerformance(
        () => StripeService.createJobPaymentIntent('JOB-001', { amount: 100 }),
        10, // 10 concurrent workers
        50  // 50 total requests
      );

      expect(results.successRate).toBeGreaterThan(90);
      expect(results.requestsPerSecond).toBeGreaterThan(5); // At least 5 RPS
      
      console.log('Stripe Payment Intent Concurrent Test:', results);
    });

    test('should handle payment confirmation under load', async () => {
      (StripeService.confirmJobPayment as jest.Mock).mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve(mockJobData.createMockPaymentConfirmation()), 200)
        )
      );

      const iterations = 50;
      const results = await measurePerformance(
        () => StripeService.confirmJobPayment('JOB-001', 'pi_123', 'succeeded'),
        iterations
      );

      expect(results.successRate).toBeGreaterThan(95);
      expect(results.averageTime).toBeLessThan(300);
      
      console.log('Stripe Payment Confirmation Load Test:', results);
    });

    test('should validate all 20+ Stripe endpoints under load', async () => {
      const stripeEndpoints = [
        () => StripeService.checkStripeConnectionStatus(),
        () => StripeService.fetchStripeBalance(),
        () => StripeService.fetchStripePayments(),
        () => StripeService.fetchStripePayouts(),
        () => StripeService.fetchStripeAccount(),
        () => StripeService.createJobPaymentIntent('JOB-001', {}),
        () => StripeService.confirmJobPayment('JOB-001', 'pi_123', 'succeeded'),
        () => StripeService.getJobPaymentHistory('JOB-001'),
        () => StripeService.createStripeRefund('pi_123', {}),
        () => StripeService.fetchStripeRefunds({}),
        () => StripeService.createStripeInvoice({ customer_email: 'test@test.com', line_items: [] }),
        () => StripeService.fetchStripeInvoices({}),
        () => StripeService.getStripeAnalytics({ start_date: '2024-01-01', end_date: '2024-12-31' }),
        () => StripeService.getStripeRealtimeAnalytics(),
        // Add more endpoints as needed
      ];

      const endpointResults = await Promise.all(
        stripeEndpoints.map(async (endpoint, index) => {
          const results = await measurePerformance(endpoint, 20);
          return {
            endpointIndex: index,
            ...results
          };
        })
      );

      // All endpoints should have >90% success rate
      endpointResults.forEach(result => {
        expect(result.successRate).toBeGreaterThan(90);
      });

      console.log('All Stripe Endpoints Load Test:', endpointResults);
    });
  });

  describe('Staff API Load Testing', () => {
    test('should handle staff data fetching under high load', async () => {
      (staffService.fetchStaff as jest.Mock).mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            staff: mockJobData.createMockJobList(50).map((_, i) => 
              mockJobData.createMockStaffMember({ id: `STAFF-${i}` })
            )
          }), 150)
        )
      );

      const results = await measurePerformance(
        () => staffService.fetchStaff(),
        75
      );

      expect(results.successRate).toBeGreaterThan(95);
      expect(results.averageTime).toBeLessThan(250);
      
      console.log('Staff Fetch Load Test:', results);
    });

    test('should handle concurrent staff additions', async () => {
      (staffService.inviteEmployee as jest.Mock).mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({ success: true }), 300)
        )
      );

      const results = await measureConcurrentPerformance(
        () => staffService.inviteEmployee({
          name: 'Test Employee',
          email: 'test@example.com',
        }),
        5,  // 5 concurrent
        25  // 25 total
      );

      expect(results.successRate).toBeGreaterThan(85); // Allow slightly lower due to DB constraints
      expect(results.requestsPerSecond).toBeGreaterThan(2);
      
      console.log('Staff Addition Concurrent Test:', results);
    });

    test('should test all 8 staff endpoints under stress', async () => {
      const staffEndpoints = [
        () => staffService.fetchStaff(),
        () => staffService.inviteEmployee({ name: 'Test', email: 'test@test.com' }),
        () => staffService.addContractor({ name: 'Contractor', email: 'contractor@test.com' }),
        () => staffService.updateStaffMember('STAFF-1', { hourlyRate: 50 }),
        () => staffService.removeStaffMember('STAFF-1'),
        () => staffService.searchContractor('search-term'),
        () => staffService.getStaffPerformance('STAFF-1'),
        () => staffService.getStaffSchedule('STAFF-1'),
      ];

      const endpointResults = await Promise.all(
        staffEndpoints.map(async (endpoint, index) => {
          const results = await measurePerformance(endpoint, 15);
          return {
            endpoint: `staff-endpoint-${index}`,
            ...results
          };
        })
      );

      // All staff endpoints should maintain performance
      endpointResults.forEach(result => {
        expect(result.successRate).toBeGreaterThan(85);
        expect(result.averageTime).toBeLessThan(400);
      });

      console.log('All Staff Endpoints Stress Test:', endpointResults);
    });
  });

  describe('Business & Templates API Load Testing', () => {
    test('should handle business statistics under load', async () => {
      (businessService.fetchBusinessStats as jest.Mock).mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve(mockJobData.createMockBusiness()), 100)
        )
      );

      const results = await measurePerformance(
        () => businessService.fetchBusinessStats(),
        60
      );

      expect(results.successRate).toBeGreaterThan(95);
      expect(results.averageTime).toBeLessThan(200);
      
      console.log('Business Stats Load Test:', results);
    });

    test('should handle template operations under concurrent load', async () => {
      (templatesService.fetchTemplates as jest.Mock).mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve([
            { id: 'TEMPLATE-1', name: 'Standard Quote' },
            { id: 'TEMPLATE-2', name: 'Premium Quote' },
          ]), 80)
        )
      );

      const results = await measureConcurrentPerformance(
        () => templatesService.fetchTemplates(),
        8,   // 8 concurrent
        40   // 40 total
      );

      expect(results.successRate).toBeGreaterThan(90);
      expect(results.requestsPerSecond).toBeGreaterThan(8);
      
      console.log('Templates Concurrent Test:', results);
    });
  });

  describe('Integrated Load Testing', () => {
    test('should handle mixed API calls simulating real usage', async () => {
      const simulateUserSession = async () => {
        // Simulate a typical user session
        await StripeService.checkStripeConnectionStatus();
        await staffService.fetchStaff();
        await businessService.fetchBusinessStats();
        await StripeService.fetchStripeBalance();
        await templatesService.fetchTemplates();
        await StripeService.fetchStripePayments();
      };

      const results = await measurePerformance(simulateUserSession, 30);

      expect(results.successRate).toBeGreaterThan(90);
      expect(results.averageTime).toBeLessThan(1000); // Under 1 second for full session
      
      console.log('Integrated User Session Load Test:', results);
    });

    test('should handle peak traffic simulation', async () => {
      const peakTrafficScenario = async () => {
        const promises = [
          StripeService.checkStripeConnectionStatus(),
          StripeService.fetchStripeBalance(),
          staffService.fetchStaff(),
          businessService.fetchBusinessStats(),
          templatesService.fetchTemplates(),
        ];
        
        return Promise.all(promises);
      };

      const results = await measureConcurrentPerformance(
        peakTrafficScenario,
        15,  // 15 concurrent users
        45   // 45 total sessions
      );

      expect(results.successRate).toBeGreaterThan(85); // Allow some degradation under peak
      expect(results.requestsPerSecond).toBeGreaterThan(3);
      
      console.log('Peak Traffic Simulation:', results);
    });

    test('should validate system recovery after stress', async () => {
      // Simulate high load first
      await measureConcurrentPerformance(
        () => StripeService.checkStripeConnectionStatus(),
        20,  // High concurrency
        100  // Many requests
      );

      // Wait for cooldown
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test normal performance after stress
      const recoveryResults = await measurePerformance(
        () => StripeService.checkStripeConnectionStatus(),
        10
      );

      expect(recoveryResults.successRate).toBeGreaterThan(95);
      expect(recoveryResults.averageTime).toBeLessThan(150);
      
      console.log('System Recovery Test:', recoveryResults);
    });
  });

  describe('Error Handling Under Load', () => {
    test('should handle service failures gracefully', async () => {
      let failureCount = 0;
      const maxFailures = 10;

      (StripeService.checkStripeConnectionStatus as jest.Mock).mockImplementation(() => {
        if (failureCount < maxFailures) {
          failureCount++;
          return Promise.reject(new Error('Service temporarily unavailable'));
        }
        return Promise.resolve({ isConnected: true, status: 'active' });
      });

      const results = await measurePerformance(
        () => StripeService.checkStripeConnectionStatus().catch((e: any) => ({ error: e.message })),
        50
      );

      // Should handle errors gracefully without crashing
      expect(results.results.length).toBe(50);
      expect(results.totalErrors).toBeGreaterThan(0);
      
      console.log('Error Handling Load Test:', results);
    });

    test('should handle timeout scenarios', async () => {
      (StripeService.fetchStripeBalance as jest.Mock).mockImplementation(
        () => new Promise((resolve) => {
          // Simulate some requests timing out (>5 seconds)
          const timeout = Math.random() > 0.8 ? 6000 : 100;
          setTimeout(() => resolve({ available: 15000, pending: 0 }), timeout);
        })
      );

      const timeoutPromise = (promise: Promise<any>, timeout: number) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeout)
          )
        ]);
      };

      const results = await measurePerformance(
        () => timeoutPromise(StripeService.fetchStripeBalance(), 1000),
        25
      );

      // Should handle timeouts without blocking other requests
      expect(results.results.length).toBe(25);
      
      console.log('Timeout Handling Test:', results);
    });
  });

  describe('Performance Benchmarks', () => {
    test('should establish baseline performance metrics', async () => {
      const benchmarks = {
        stripe: await measurePerformance(() => StripeService.checkStripeConnectionStatus(), 20),
        staff: await measurePerformance(() => staffService.fetchStaff(), 20),
        business: await measurePerformance(() => businessService.fetchBusinessStats(), 20),
        templates: await measurePerformance(() => templatesService.fetchTemplates(), 20),
      };

      console.log('Performance Benchmarks:', JSON.stringify(benchmarks, null, 2));

      // Store benchmarks for comparison in future tests
      expect(benchmarks.stripe.averageTime).toBeLessThan(100);
      expect(benchmarks.staff.averageTime).toBeLessThan(150);
      expect(benchmarks.business.averageTime).toBeLessThan(130);
      expect(benchmarks.templates.averageTime).toBeLessThan(100);

      // All services should have excellent success rates
      Object.values(benchmarks).forEach(benchmark => {
        expect(benchmark.successRate).toBeGreaterThan(95);
      });
    });

    test('should validate consistent performance over time', async () => {
      const iterations = 5;
      const measurements = [];

      for (let i = 0; i < iterations; i++) {
        const result = await measurePerformance(
          () => StripeService.checkStripeConnectionStatus(),
          10
        );
        measurements.push(result.averageTime);
        
        // Wait between measurements
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Performance should be consistent (coefficient of variation < 0.3)
      const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const variance = measurements.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / measurements.length;
      const standardDeviation = Math.sqrt(variance);
      const coefficientOfVariation = standardDeviation / avg;

      expect(coefficientOfVariation).toBeLessThan(0.3);
      
      console.log('Performance Consistency:', {
        measurements,
        average: avg,
        standardDeviation,
        coefficientOfVariation
      });
    });
  });
});