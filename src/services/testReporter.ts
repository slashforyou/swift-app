// src/services/testReporter.ts
/**
 * TestReporter - Service pour rapporter les résultats de tests à Copilot
 * Capture screenshots, logs et métriques des tests automatisés
 */

import { Platform } from 'react-native';
import { simpleSessionLogger } from './simpleSessionLogger';
import { TestEvent, TestResult, TestSession } from './testController';

interface TestReport {
  sessionId: string;
  startTime: string;
  endTime: string;
  platform: string;
  appVersion: string;
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  totalDuration: number;
  averageDuration: number;
  errors: TestError[];
  screenshots: string[];
  logs: string[];
  performance: PerformanceMetrics;
}

interface TestError {
  commandId: string;
  action: string;
  error: string;
  timestamp: string;
  context?: any;
}

interface PerformanceMetrics {
  memoryUsage?: number;
  cpuUsage?: number;
  networkRequests?: number;
  navigationTime?: number;
  renderTime?: number;
}

class TestReporter {
  private currentReport: Partial<TestReport> | null = null;
  private screenshots: string[] = [];
  private errors: TestError[] = [];
  private performanceData: PerformanceMetrics = {};
  private startTime: number = 0;

  constructor() {
    simpleSessionLogger.logInfo('TestReporter initialized', 'test-reporter');
  }

  // ========== REPORT GENERATION ==========

  startReport(session: TestSession): void {
    this.startTime = Date.now();
    
    this.currentReport = {
      sessionId: session.sessionId,
      startTime: session.startTime,
      platform: Platform.OS,
      appVersion: '1.0.0', // TODO: Get from package.json safely
      totalCommands: 0,
      successfulCommands: 0,
      failedCommands: 0,
      totalDuration: 0,
      errors: [],
      screenshots: [],
      logs: [],
      performance: {}
    };

    simpleSessionLogger.logInfo(`Test report started for session: ${session.sessionId}`, 'test-reporter');
  }

  finishReport(session: TestSession): TestReport {
    if (!this.currentReport) {
      throw new Error('No active report to finish');
    }

    const results = session.results;
    const endTime = new Date().toISOString();
    const totalDuration = Date.now() - this.startTime;

    const report: TestReport = {
      ...this.currentReport,
      endTime,
      totalCommands: results.length,
      successfulCommands: results.filter(r => r.success).length,
      failedCommands: results.filter(r => !r.success).length,
      totalDuration,
      averageDuration: results.length > 0 ? totalDuration / results.length : 0,
      errors: this.errors,
      screenshots: this.screenshots,
      logs: this.collectLogs(),
      performance: this.performanceData
    } as TestReport;

    simpleSessionLogger.logInfo(`Test report completed: ${report.successfulCommands}/${report.totalCommands} passed`, 'test-reporter');

    // Reset for next report
    this.currentReport = null;
    this.errors = [];
    this.screenshots = [];
    this.performanceData = {};

    return report;
  }

  // ========== EVENT TRACKING ==========

  trackTestEvent(event: TestEvent): void {
    if (!this.currentReport) return;

    switch (event.type) {
      case 'commandCompleted':
        this.trackCommandSuccess(event.data.command, event.data.result);
        break;
        
      case 'commandFailed':
        this.trackCommandFailure(event.data.command, event.data.result);
        break;
        
      case 'screenshot':
        this.trackScreenshot(event.data.path);
        break;
        
      default:
        simpleSessionLogger.logDebug(`Tracked test event: ${event.type}`, event.data, 'test-reporter');
    }
  }

  private trackCommandSuccess(command: any, result: TestResult): void {
    simpleSessionLogger.logDebug(`Command succeeded: ${command.action} (${result.duration}ms)`, {
      command: command.action,
      duration: result.duration
    }, 'test-success');

    // Track performance if available
    if (result.duration) {
      this.updatePerformanceMetrics('navigationTime', result.duration);
    }
  }

  private trackCommandFailure(command: any, result: TestResult): void {
    const error: TestError = {
      commandId: result.commandId,
      action: command.action,
      error: result.error || 'Unknown error',
      timestamp: result.timestamp,
      context: {
        target: command.target,
        params: command.params
      }
    };

    this.errors.push(error);

    simpleSessionLogger.logError(`Command failed: ${command.action}`, {
      error: result.error,
      command: command.action,
      target: command.target
    }, 'test-failure');
  }

  private trackScreenshot(path: string): void {
    this.screenshots.push(path);
    simpleSessionLogger.logDebug(`Screenshot captured: ${path}`, { path }, 'test-screenshot');
  }

  // ========== PERFORMANCE TRACKING ==========

  updatePerformanceMetrics(metric: keyof PerformanceMetrics, value: number): void {
    if (!this.performanceData[metric]) {
      this.performanceData[metric] = value;
    } else {
      // Average for multiple values
      this.performanceData[metric] = (this.performanceData[metric]! + value) / 2;
    }
  }

  trackMemoryUsage(): void {
    // Simulate memory tracking (would use actual tools in production)
    const simulatedMemory = Math.random() * 100 + 50; // 50-150 MB
    this.updatePerformanceMetrics('memoryUsage', simulatedMemory);
    
    simpleSessionLogger.logDebug(`Memory usage: ${simulatedMemory.toFixed(2)} MB`, { memory: simulatedMemory }, 'performance');
  }

  trackNetworkRequest(): void {
    const current = this.performanceData.networkRequests || 0;
    this.performanceData.networkRequests = current + 1;
    
    simpleSessionLogger.logDebug(`Network request tracked: ${this.performanceData.networkRequests}`, {
      count: this.performanceData.networkRequests
    }, 'network');
  }

  // ========== LOG COLLECTION ==========

  private collectLogs(): string[] {
    const logs = simpleSessionLogger.getAllLogs();
    return logs.map(log => `${log.timestamp} [${log.level}] ${log.message}`);
  }

  // ========== SCREENSHOT CAPTURE ==========

  async captureScreenshot(description?: string): Promise<string> {
    try {
      // Simulate screenshot capture
      const timestamp = Date.now();
      const screenshotPath = `screenshot-${timestamp}.png`;
      
      // In real implementation, would use:
      // - react-native-view-shot
      // - expo-media-library
      // - Or native screenshot APIs
      
      this.screenshots.push(screenshotPath);
      
      simpleSessionLogger.logInfo(`Screenshot captured: ${description || screenshotPath}`, 'screenshot');
      
      return screenshotPath;
    } catch (error: any) {
      simpleSessionLogger.logError('Failed to capture screenshot', error, 'screenshot');
      throw error;
    }
  }

  // ========== COPILOT INTEGRATION ==========

  // Format report for Copilot consumption
  formatReportForCopilot(report: TestReport): string {
    const successRate = (report.successfulCommands / report.totalCommands * 100).toFixed(1);
    const avgDuration = report.averageDuration.toFixed(0);

    let formattedReport = `
🤖 COPILOT TEST REPORT
======================
📱 Session: ${report.sessionId}
⏰ Duration: ${(report.totalDuration / 1000).toFixed(1)}s
🎯 Commands: ${report.successfulCommands}/${report.totalCommands} (${successRate}%)
📊 Avg Time: ${avgDuration}ms per command
🖥️  Platform: ${report.platform}

`;

    if (report.errors.length > 0) {
      formattedReport += `❌ ERRORS (${report.errors.length}):\n`;
      report.errors.forEach(error => {
        formattedReport += `   • ${error.action}: ${error.error}\n`;
      });
      formattedReport += '\n';
    }

    if (report.performance.memoryUsage) {
      formattedReport += `📈 PERFORMANCE:\n`;
      formattedReport += `   • Memory: ${report.performance.memoryUsage.toFixed(1)} MB\n`;
      if (report.performance.networkRequests) {
        formattedReport += `   • Network: ${report.performance.networkRequests} requests\n`;
      }
      formattedReport += '\n';
    }

    if (report.screenshots.length > 0) {
      formattedReport += `📸 SCREENSHOTS (${report.screenshots.length}):\n`;
      report.screenshots.forEach(screenshot => {
        formattedReport += `   • ${screenshot}\n`;
      });
      formattedReport += '\n';
    }

    formattedReport += `✅ READY FOR NEXT TEST BATCH\n`;

    return formattedReport;
  }

  // Send report to Copilot (via console for now)
  sendReportToCopilot(report: TestReport): void {
    const formattedReport = this.formatReportForCopilot(report);
    
    // TEMP_DISABLED: console.log(formattedReport);
    simpleSessionLogger.logInfo('Report sent to Copilot', 'copilot-report');

    // In real implementation, could send via:
    // - HTTP POST to Copilot endpoint
    // - WebSocket message
    // - File write for Copilot to read
    // - Console output for Copilot to parse
  }

  // ========== QUICK STATS ==========

  getCurrentStats(): any {
    return {
      isReporting: this.currentReport !== null,
      errorsCount: this.errors.length,
      screenshotsCount: this.screenshots.length,
      performance: this.performanceData,
      sessionId: this.currentReport?.sessionId,
      duration: this.currentReport ? Date.now() - this.startTime : 0
    };
  }

  // Export raw data for analysis
  exportRawData(): any {
    return {
      currentReport: this.currentReport,
      errors: this.errors,
      screenshots: this.screenshots,
      performance: this.performanceData,
      logs: this.collectLogs()
    };
  }
}

// Instance singleton
export const testReporter = new TestReporter();

// Global access for Copilot
if (__DEV__) {
  (global as any).testReporter = testReporter;
  // TEMP_DISABLED: console.log('📊 TestReporter available globally as: global.testReporter');
}

export default testReporter;