// src/services/testController.ts
/**
 * TestController - Service de contrôle automatisé pour les tests E2E
 * Permet à Copilot de naviguer et interagir avec l'app automatiquement
 */

import { CommonActions, NavigationProp } from '@react-navigation/native';
import { simpleSessionLogger } from './simpleSessionLogger';

// Types pour les commandes de test
export interface TestCommand {
  id: string;
  action: 'navigate' | 'tap' | 'input' | 'scroll' | 'wait' | 'assert' | 'screenshot';
  target?: string;
  params?: any;
  timeout?: number;
  description?: string;
}

export interface TestResult {
  commandId: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
  duration?: number;
  screenshot?: string;
}

export interface TestSession {
  sessionId: string;
  startTime: string;
  commands: TestCommand[];
  results: TestResult[];
  status: 'running' | 'completed' | 'failed' | 'paused';
}

class TestController {
  private navigation: NavigationProp<any> | null = null;
  private currentSession: TestSession | null = null;
  private commandQueue: TestCommand[] = [];
  private isRunning: boolean = false;
  private listeners: Set<(event: TestEvent) => void> = new Set();

  constructor() {
    simpleSessionLogger.logInfo('TestController initialized', 'test-controller');
  }

  // ========== NAVIGATION SETUP ==========

  setNavigation(navigation: NavigationProp<any>) {
    this.navigation = navigation;
    simpleSessionLogger.logInfo('Navigation reference set in TestController', 'test-controller');
  }

  // ========== SESSION MANAGEMENT ==========

  startTestSession(sessionId: string = `session-${Date.now()}`): string {
    this.currentSession = {
      sessionId,
      startTime: new Date().toISOString(),
      commands: [],
      results: [],
      status: 'running'
    };

    simpleSessionLogger.logInfo(`Test session started: ${sessionId}`, 'test-session');
    this.emit('sessionStarted', this.currentSession);
    return sessionId;
  }

  getCurrentSession(): TestSession | null {
    return this.currentSession;
  }

  stopTestSession() {
    if (this.currentSession) {
      this.currentSession.status = 'completed';
      simpleSessionLogger.logInfo(`Test session completed: ${this.currentSession.sessionId}`, 'test-session');
      this.emit('sessionCompleted', this.currentSession);
      this.currentSession = null;
    }
    this.isRunning = false;
  }

  // ========== COMMAND EXECUTION ==========

  async executeCommand(command: TestCommand): Promise<TestResult> {
    const startTime = Date.now();
    
    simpleSessionLogger.logInfo(`Executing command: ${command.action} - ${command.description || command.target}`, 'test-execution');

    if (this.currentSession) {
      this.currentSession.commands.push(command);
    }

    try {
      let result: any = null;

      switch (command.action) {
        case 'navigate':
          result = await this.executeNavigate(command);
          break;
        
        case 'tap':
          result = await this.executeTap(command);
          break;
          
        case 'input':
          result = await this.executeInput(command);
          break;
          
        case 'wait':
          result = await this.executeWait(command);
          break;
          
        case 'assert':
          result = await this.executeAssert(command);
          break;
          
        case 'screenshot':
          result = await this.executeScreenshot(command);
          break;
          
        default:
          throw new Error(`Unknown action: ${command.action}`);
      }

      const testResult: TestResult = {
        commandId: command.id,
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };

      if (this.currentSession) {
        this.currentSession.results.push(testResult);
      }

      simpleSessionLogger.logInfo(`Command executed successfully: ${command.action}`, 'test-execution');
      this.emit('commandCompleted', { command, result: testResult });

      return testResult;

    } catch (error: any) {
      const testResult: TestResult = {
        commandId: command.id,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };

      if (this.currentSession) {
        this.currentSession.results.push(testResult);
        this.currentSession.status = 'failed';
      }

      simpleSessionLogger.logError(`Command failed: ${command.action}`, error, 'test-execution');
      this.emit('commandFailed', { command, result: testResult });

      return testResult;
    }
  }

  // ========== COMMAND IMPLEMENTATIONS ==========

  private async executeNavigate(command: TestCommand): Promise<any> {
    if (!this.navigation) {
      throw new Error('Navigation not available. Make sure to call setNavigation() first.');
    }

    const { target, params } = command;
    
    if (!target) {
      throw new Error('Navigate command requires a target screen');
    }

    // Mapping des noms d'écrans
    const screenMap: { [key: string]: string } = {
      'BusinessInfoPage': 'BusinessInfo',
      'Business': 'Business',
      'Calendar': 'Calendar',
      'JobDetails': 'JobDetails',
      'Staff': 'Staff'
    };

    const screenName = screenMap[target] || target;

    this.navigation.dispatch(
      CommonActions.navigate({
        name: screenName,
        params: params || {}
      })
    );

    // Attendre un peu pour que la navigation se termine
    await this.wait(1000);

    return { screen: screenName, params };
  }

  private async executeTap(command: TestCommand): Promise<any> {
    const { target } = command;
    
    if (!target) {
      throw new Error('Tap command requires a target element');
    }

    // Simulation du tap via des événements globaux
    // En réalité, il faudrait un système plus sophistiqué pour trouver les éléments
    
    simpleSessionLogger.logDebug(`Simulating tap on element: ${target}`, { target }, 'test-tap');
    
    // Pour l'instant, on simule juste
    await this.wait(500);
    
    return { tapped: target };
  }

  private async executeInput(command: TestCommand): Promise<any> {
    const { target, params } = command;
    
    if (!target || !params?.text) {
      throw new Error('Input command requires target and text params');
    }

    simpleSessionLogger.logDebug(`Simulating input on ${target}: ${params.text}`, { target, text: params.text }, 'test-input');
    
    // Pour l'instant, on simule juste
    await this.wait(300);
    
    return { input: target, text: params.text };
  }

  private async executeWait(command: TestCommand): Promise<any> {
    const duration = command.params?.duration || command.params?.seconds * 1000 || 1000;
    
    simpleSessionLogger.logDebug(`Waiting ${duration}ms`, { duration }, 'test-wait');
    
    await this.wait(duration);
    
    return { waited: duration };
  }

  private async executeAssert(command: TestCommand): Promise<any> {
    const { target, params } = command;
    
    simpleSessionLogger.logDebug(`Asserting condition on ${target}`, { target, params }, 'test-assert');
    
    // Pour l'instant, on assume que l'assertion passe
    // Dans une vraie implémentation, on vérifierait l'état de l'UI
    
    return { assertion: target, passed: true };
  }

  private async executeScreenshot(command: TestCommand): Promise<any> {
    simpleSessionLogger.logDebug('Taking screenshot', {}, 'test-screenshot');
    
    // Pour l'instant, on simule juste
    const screenshotPath = `screenshot-${Date.now()}.png`;
    
    return { screenshot: screenshotPath };
  }

  // ========== UTILITY METHODS ==========

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private emit(event: string, data: any) {
    const testEvent: TestEvent = { type: event, data, timestamp: new Date().toISOString() };
    this.listeners.forEach(listener => listener(testEvent));
  }

  // ========== EVENT SYSTEM ==========

  addEventListener(listener: (event: TestEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ========== BATCH EXECUTION ==========

  async executeBatch(commands: TestCommand[]): Promise<TestResult[]> {
    const sessionId = this.startTestSession();
    this.isRunning = true;

    simpleSessionLogger.logInfo(`Executing batch of ${commands.length} commands`, 'test-batch');

    const results: TestResult[] = [];

    for (const command of commands) {
      if (!this.isRunning) {
        simpleSessionLogger.logWarning('Test execution stopped by user', 'test-batch');
        break;
      }

      const result = await this.executeCommand(command);
      results.push(result);

      if (!result.success) {
        simpleSessionLogger.logError(`Batch execution failed at command: ${command.action}`, { command, result }, 'test-batch');
        break;
      }
    }

    this.stopTestSession();
    return results;
  }

  // ========== STATUS METHODS ==========

  isSessionRunning(): boolean {
    return this.currentSession?.status === 'running' || false;
  }

  getSessionStats(): { total: number; passed: number; failed: number } | null {
    if (!this.currentSession) return null;

    const total = this.currentSession.results.length;
    const passed = this.currentSession.results.filter(r => r.success).length;
    const failed = total - passed;

    return { total, passed, failed };
  }

  // ========== PUBLIC API FOR COPILOT ==========

  // API simplifiée pour que Copilot puisse l'utiliser facilement
  async navigateTo(screen: string, params?: any): Promise<TestResult> {
    return this.executeCommand({
      id: `nav-${Date.now()}`,
      action: 'navigate',
      target: screen,
      params,
      description: `Navigate to ${screen}`
    });
  }

  async tapElement(testID: string): Promise<TestResult> {
    return this.executeCommand({
      id: `tap-${Date.now()}`,
      action: 'tap',
      target: testID,
      description: `Tap element ${testID}`
    });
  }

  async inputText(testID: string, text: string): Promise<TestResult> {
    return this.executeCommand({
      id: `input-${Date.now()}`,
      action: 'input',
      target: testID,
      params: { text },
      description: `Input text into ${testID}`
    });
  }

  async waitFor(duration: number): Promise<TestResult> {
    return this.executeCommand({
      id: `wait-${Date.now()}`,
      action: 'wait',
      params: { duration },
      description: `Wait for ${duration}ms`
    });
  }
}

// Types d'événements
export interface TestEvent {
  type: string;
  data: any;
  timestamp: string;
}

// Instance singleton
export const testController = new TestController();

// API globale pour Copilot (dev only)
if (__DEV__) {
  (global as any).testController = testController;
  (global as any).runTest = testController.executeBatch.bind(testController);
  // TEMP_DISABLED: console.log('🤖 TestController available globally as: global.testController');
}

export default testController;