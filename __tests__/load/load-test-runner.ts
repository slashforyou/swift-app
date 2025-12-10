/**
 * Database Load Testing Configuration
 * Performance testing utilities for database operations
 */

export interface LoadTestResult {
  averageTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  totalErrors: number;
  results: any[];
  requestsPerSecond?: number;
  totalCompleted?: number;
}

export interface ConcurrentTestResult {
  totalTime: number;
  requestsPerSecond: number;
  successRate: number;
  totalCompleted: number;
  totalErrors: number;
}

export class LoadTestRunner {
  private performanceThresholds = {
    stripe: {
      averageTime: 200,
      successRate: 95,
      concurrentRequestsPerSecond: 5
    },
    staff: {
      averageTime: 250,
      successRate: 85,
      concurrentRequestsPerSecond: 3
    },
    business: {
      averageTime: 200,
      successRate: 95,
      concurrentRequestsPerSecond: 8
    },
    templates: {
      averageTime: 100,
      successRate: 90,
      concurrentRequestsPerSecond: 10
    }
  };

  async measurePerformance(
    fn: () => Promise<any>, 
    iterations: number = 1
  ): Promise<LoadTestResult> {
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
  }

  async measureConcurrentPerformance(
    fn: () => Promise<any>,
    concurrency: number,
    totalRequests: number
  ): Promise<ConcurrentTestResult> {
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
  }

  validatePerformanceThresholds(
    service: keyof typeof this.performanceThresholds,
    result: LoadTestResult | ConcurrentTestResult
  ): { passed: boolean; violations: string[] } {
    const thresholds = this.performanceThresholds[service];
    const violations: string[] = [];
    
    if ('averageTime' in result && result.averageTime > thresholds.averageTime) {
      violations.push(`Average time ${result.averageTime}ms exceeds threshold ${thresholds.averageTime}ms`);
    }
    
    if (result.successRate < thresholds.successRate) {
      violations.push(`Success rate ${result.successRate}% below threshold ${thresholds.successRate}%`);
    }
    
    if ('requestsPerSecond' in result && result.requestsPerSecond! < thresholds.concurrentRequestsPerSecond) {
      violations.push(`RPS ${result.requestsPerSecond} below threshold ${thresholds.concurrentRequestsPerSecond}`);
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  generateLoadTestReport(results: Record<string, LoadTestResult>): string {
    const report = ['SwiftApp API Load Test Report', '='.repeat(40), ''];
    
    for (const [service, result] of Object.entries(results)) {
      report.push(`${service.toUpperCase()} Service:`);
      report.push(`  Average Time: ${result.averageTime.toFixed(2)}ms`);
      report.push(`  Min Time: ${result.minTime.toFixed(2)}ms`);
      report.push(`  Max Time: ${result.maxTime.toFixed(2)}ms`);
      report.push(`  Success Rate: ${result.successRate.toFixed(2)}%`);
      report.push(`  Total Errors: ${result.totalErrors}`);
      
      const validation = this.validatePerformanceThresholds(
        service as keyof typeof this.performanceThresholds,
        result
      );
      
      if (validation.passed) {
        report.push(`  Status: ✅ PASSED`);
      } else {
        report.push(`  Status: ❌ FAILED`);
        validation.violations.forEach(violation => {
          report.push(`    - ${violation}`);
        });
      }
      report.push('');
    }

    return report.join('\n');
  }

  async runStressTest(
    fn: () => Promise<any>,
    duration: number = 60000, // 60 seconds
    concurrency: number = 10
  ): Promise<{
    duration: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    requestsPerSecond: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    const endTime = startTime + duration;
    const latencies: number[] = [];
    const errors: string[] = [];
    let totalRequests = 0;
    let successfulRequests = 0;

    const workers = Array(concurrency).fill(null).map(async () => {
      while (Date.now() < endTime) {
        const requestStart = performance.now();
        totalRequests++;
        
        try {
          await fn();
          successfulRequests++;
          latencies.push(performance.now() - requestStart);
        } catch (error) {
          errors.push(error instanceof Error ? error.message : 'Unknown error');
        }
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    });

    await Promise.all(workers);

    const actualDuration = Date.now() - startTime;
    const averageLatency = latencies.length > 0 
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
      : 0;

    return {
      duration: actualDuration,
      totalRequests,
      successfulRequests,
      failedRequests: totalRequests - successfulRequests,
      averageLatency,
      requestsPerSecond: (totalRequests / actualDuration) * 1000,
      errors: [...new Set(errors)] // Unique errors only
    };
  }
}

export const loadTestRunner = new LoadTestRunner();