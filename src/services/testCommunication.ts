// src/services/testCommunication.ts
/**
 * TestCommunication - Interface de communication pour Copilot
 * Permet à Copilot d'envoyer des commandes via HTTP/WebSocket
 */

import { stripeTestSuite } from '../tests/automated/stripePaymentFlow';
import { simpleSessionLogger } from './simpleSessionLogger';
import { TestCommand, testController, TestResult } from './testController';

interface CopilotMessage {
  type: 'command' | 'batch' | 'status' | 'stop';
  data: any;
  requestId?: string;
}

interface CopilotResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId?: string;
}

class TestCommunication {
  private isEnabled: boolean = false;
  private commandBuffer: TestCommand[] = [];
  private responseCallbacks: Map<string, (response: CopilotResponse) => void> = new Map();

  constructor() {
    // Setup global handlers for development
    if (__DEV__) {
      this.setupGlobalAPI();
      this.enableCommunication();
    }
  }

  // ========== COMMUNICATION SETUP ==========

  enableCommunication() {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    simpleSessionLogger.logInfo('Test communication enabled - Copilot can send commands', 'test-comm');
    
    // Setup listeners
    testController.addEventListener((event) => {
      this.handleTestEvent(event);
    });

    // Simulate HTTP server endpoint via global functions
    this.setupHTTPSimulation();
  }

  disableCommunication() {
    this.isEnabled = false;
    simpleSessionLogger.logInfo('Test communication disabled', 'test-comm');
  }

  // ========== GLOBAL API FOR COPILOT ==========

  private setupGlobalAPI() {
    const globalAPI = {
      // Send single command
      sendCommand: async (command: TestCommand): Promise<TestResult> => {
        return this.handleCommand(command);
      },

      // Send batch of commands
      sendBatch: async (commands: TestCommand[]): Promise<TestResult[]> => {
        return this.handleBatch(commands);
      },

      // Get current status
      getStatus: (): any => {
        return this.getStatus();
      },

      // Stop current execution
      stop: (): void => {
        this.handleStop();
      },

      // Quick test actions for Copilot
      quickTest: {
        navigateToBusinessPage: () => this.quickNavigate('BusinessInfoPage'),
        testSessionLogger: () => this.quickTestSessionLogger(),
        testStripePayment: () => this.quickTestStripePayment(),
        fullAppTest: () => this.quickFullAppTest()
      },

      // Advanced test suites
      stripeTests: {
        basic: () => this.handleBatch(stripeTestSuite.basic),
        error: () => this.handleBatch(stripeTestSuite.error),
        secure3d: () => this.handleBatch(stripeTestSuite.secure3d),
        all: () => this.runAllStripeTests()
      },

      // Utilitaires de logs
      logs: {
        get: () => simpleSessionLogger.getFormattedLogs(),
        getArray: () => (simpleSessionLogger as any).logs || [],
        clear: () => simpleSessionLogger.clearLogs(),
        count: () => ((simpleSessionLogger as any).logs || []).length,
        getFilePath: () => simpleSessionLogger.getLogFilePath(),
        export: () => simpleSessionLogger.exportLogs(),
        getFileContent: () => simpleSessionLogger.getFileContent()
      },

      // Informations de session
      session: {
        getStats: () => testController.getSessionStats(),
        getCurrent: () => testController.getCurrentSession(),
        isRunning: () => testController.isSessionRunning()
      }
    };

    (global as any).copilotAPI = globalAPI;
    simpleSessionLogger.logInfo('Copilot API available at: global.copilotAPI', 'test-comm');
  }

  // ========== HTTP SIMULATION ==========

  private setupHTTPSimulation() {
    // Simulate HTTP endpoints via global functions
    const httpAPI = {
      // POST /test/command
      command: async (body: any): Promise<CopilotResponse> => {
        try {
          const command = body as TestCommand;
          const result = await this.handleCommand(command);
          return { success: true, data: result, requestId: body.requestId };
        } catch (error: any) {
          return { success: false, error: error.message, requestId: body.requestId };
        }
      },

      // POST /test/batch
      batch: async (body: any): Promise<CopilotResponse> => {
        try {
          const commands = body.commands as TestCommand[];
          const results = await this.handleBatch(commands);
          return { success: true, data: results, requestId: body.requestId };
        } catch (error: any) {
          return { success: false, error: error.message, requestId: body.requestId };
        }
      },

      // GET /test/status
      status: (): CopilotResponse => {
        try {
          const status = this.getStatus();
          return { success: true, data: status };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },

      // POST /test/stop
      stop: (): CopilotResponse => {
        try {
          this.handleStop();
          return { success: true, data: { stopped: true } };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      }
    };

    (global as any).httpAPI = httpAPI;
    simpleSessionLogger.logInfo('HTTP API simulation available at: global.httpAPI', 'test-comm');
  }

  // ========== MESSAGE HANDLERS ==========

  private async handleCommand(command: TestCommand): Promise<TestResult> {
    if (!this.isEnabled) {
      throw new Error('Test communication is disabled');
    }

    simpleSessionLogger.logInfo(`Received command from Copilot: ${command.action}`, 'copilot-command');
    
    // Add unique ID if not provided
    if (!command.id) {
      command.id = `copilot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    return await testController.executeCommand(command);
  }

  private async handleBatch(commands: TestCommand[]): Promise<TestResult[]> {
    if (!this.isEnabled) {
      throw new Error('Test communication is disabled');
    }

    simpleSessionLogger.logInfo(`Received batch of ${commands.length} commands from Copilot`, 'copilot-batch');
    
    return await testController.executeBatch(commands);
  }

  private getStatus(): any {
    const session = testController.getCurrentSession();
    const stats = testController.getSessionStats();
    
    return {
      enabled: this.isEnabled,
      isRunning: testController.isSessionRunning(),
      currentSession: session,
      stats,
      timestamp: new Date().toISOString()
    };
  }

  private handleStop(): void {
    simpleSessionLogger.logInfo('Stop command received from Copilot', 'copilot-stop');
    testController.stopTestSession();
  }

  private handleTestEvent(event: any): void {
    // Forward test events to Copilot if needed
    simpleSessionLogger.logDebug(`Test event: ${event.type}`, event.data, 'test-event');
  }

  // ========== QUICK TEST METHODS ==========

  private async quickNavigate(screen: string): Promise<TestResult> {
    return this.handleCommand({
      id: `quick-nav-${Date.now()}`,
      action: 'navigate',
      target: screen,
      description: `Quick navigate to ${screen}`
    });
  }

  private async quickTestSessionLogger(): Promise<TestResult[]> {
    const commands: TestCommand[] = [
      {
        id: 'test-logger-1',
        action: 'navigate',
        target: 'BusinessInfoPage',
        description: 'Navigate to business page'
      },
      {
        id: 'test-logger-2', 
        action: 'tap',
        target: 'error-test-button',
        description: 'Tap error test button'
      },
      {
        id: 'test-logger-3',
        action: 'wait',
        params: { duration: 2000 },
        description: 'Wait for error generation'
      },
      {
        id: 'test-logger-4',
        action: 'tap',
        target: 'session-logs-button',
        description: 'Open session logs'
      }
    ];

    return this.handleBatch(commands);
  }

  private async quickTestStripePayment(): Promise<TestResult[]> {
    const commands: TestCommand[] = [
      {
        id: 'stripe-1',
        action: 'navigate',
        target: 'JobDetails',
        description: 'Navigate to job details'
      },
      {
        id: 'stripe-2',
        action: 'tap',
        target: 'payment-button',
        description: 'Tap payment button'
      },
      {
        id: 'stripe-3',
        action: 'input',
        target: 'card-field',
        params: { text: '4242424242424242' },
        description: 'Enter test card number'
      },
      {
        id: 'stripe-4',
        action: 'tap',
        target: 'pay-now-button',
        description: 'Confirm payment'
      }
    ];

    return this.handleBatch(commands);
  }

  private async quickFullAppTest(): Promise<TestResult[]> {
    const commands: TestCommand[] = [
      // Test navigation
      { id: 'full-1', action: 'navigate', target: 'Business', description: 'Test Business tab' },
      { id: 'full-2', action: 'wait', params: { duration: 1000 }, description: 'Wait' },
      
      // Test Calendar
      { id: 'full-3', action: 'navigate', target: 'Calendar', description: 'Test Calendar tab' },
      { id: 'full-4', action: 'wait', params: { duration: 1000 }, description: 'Wait' },
      
      // Test Staff
      { id: 'full-5', action: 'navigate', target: 'Staff', description: 'Test Staff tab' },
      { id: 'full-6', action: 'wait', params: { duration: 1000 }, description: 'Wait' },
      
      // Test session logger
      { id: 'full-7', action: 'navigate', target: 'BusinessInfoPage', description: 'Back to Business Info' },
      { id: 'full-8', action: 'tap', target: 'session-logs-button', description: 'Test session logs' },
    ];

    return this.handleBatch(commands);
  }

  // ========== STRIPE TEST SUITES ==========

  private async runAllStripeTests(): Promise<TestResult[]> {
    simpleSessionLogger.logInfo('Running complete Stripe test suite', 'stripe-tests');
    
    try {
      // Run basic payment test
      const basicResults = await this.handleBatch(stripeTestSuite.basic);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Run error handling test
      const errorResults = await this.handleBatch(stripeTestSuite.error);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Run 3D Secure test
      const secure3dResults = await this.handleBatch(stripeTestSuite.secure3d);
      
      // Combine all results
      const allResults = [...basicResults, ...errorResults, ...secure3dResults];
      
      simpleSessionLogger.logInfo(`Stripe test suite completed: ${allResults.filter(r => r.success).length}/${allResults.length} passed`, 'stripe-tests');
      
      return allResults;
    } catch (error: any) {
      simpleSessionLogger.logError('Stripe test suite failed', error, 'stripe-tests');
      throw error;
    }
  }

  // ========== COPILOT HELPERS ==========

  // Generate command templates for Copilot
  getCommandTemplates(): any {
    return {
      navigation: {
        template: { id: '', action: 'navigate', target: 'SCREEN_NAME', description: 'Navigate to screen' },
        examples: [
          'BusinessInfoPage', 'Business', 'Calendar', 'JobDetails', 'Staff'
        ]
      },
      interaction: {
        tap: { id: '', action: 'tap', target: 'ELEMENT_ID', description: 'Tap element' },
        input: { id: '', action: 'input', target: 'INPUT_ID', params: { text: 'TEXT' }, description: 'Input text' }
      },
      timing: {
        wait: { id: '', action: 'wait', params: { duration: 1000 }, description: 'Wait duration' }
      },
      validation: {
        assert: { id: '', action: 'assert', target: 'ELEMENT_ID', params: { condition: 'visible' }, description: 'Assert condition' }
      }
    };
  }
}

// Instance singleton
export const testCommunication = new TestCommunication();

// Export pour usage dans l'app
export default testCommunication;

// Log initialization
if (__DEV__) {
  // TEMP_DISABLED: console.log('🤖 TEST COMMUNICATION READY');
  // TEMP_DISABLED: console.log('📡 Available APIs:');
  // TEMP_DISABLED: console.log('   - global.copilotAPI.sendCommand(command)');
  // TEMP_DISABLED: console.log('   - global.copilotAPI.sendBatch(commands)');
  // TEMP_DISABLED: console.log('   - global.copilotAPI.getStatus()');
  // TEMP_DISABLED: console.log('   - global.copilotAPI.quickTest.*');
  // TEMP_DISABLED: console.log('   - global.httpAPI.* (HTTP simulation)');
  // TEMP_DISABLED: console.log('   - global.testController (direct access)');
}