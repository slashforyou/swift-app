/**
 * Centralized Logging Service - Système de logs centralisé avec niveaux et agrégation
 * 
 * ✅ Session 8: Intégration API Discovery
 * - Vérifie disponibilité endpoint /logs avant flush
 * - Logs 404 uniquement si endpoint DEVRAIT exister
 * - Fallback silent si endpoint non disponible
 */

import { getAuthHeaders } from '../utils/auth';
import { apiDiscovery } from './apiDiscovery';

const API_BASE_URL = 'https://altivo.fr/swift-app/v1';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  module?: string;
  userId?: string;
  sessionId?: string;
  deviceInfo?: {
    platform: string;
    version: string;
    model?: string;
  };
  stackTrace?: string;
  correlationId?: string;
}

class LoggingService {
  private logQueue: LogEntry[] = [];
  private isEnabled: boolean = true;
  private minLogLevel: LogLevel = 'info';
  private maxQueueSize: number = 100;
  private flushInterval: number = 30000; // 30 seconds
  private sessionId: string;
  private correlationId?: string;

  // Log levels hierarchy
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startPeriodicFlush();
    this.setupGlobalErrorHandling();
  }

  // ========== PUBLIC LOGGING METHODS ==========

  debug(message: string, context?: Record<string, any>, module?: string) {
    this.log('debug', message, context, module);
  }

  info(message: string, context?: Record<string, any>, module?: string) {
    this.log('info', message, context, module);
  }

  warn(message: string, context?: Record<string, any>, module?: string) {
    this.log('warn', message, context, module);
  }

  error(message: string, error?: Error | any, context?: Record<string, any>, module?: string) {
    const errorContext = {
      ...context,
      ...(error && {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack
      })
    };

    this.log('error', message, errorContext, module, error?.stack);
  }

  fatal(message: string, error?: Error | any, context?: Record<string, any>, module?: string) {
    const errorContext = {
      ...context,
      ...(error && {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack
      })
    };

    this.log('fatal', message, errorContext, module, error?.stack);
    
    // Force immediate flush for fatal errors
    this.flushLogs();
  }

  // ========== STRUCTURED LOGGING ==========

  /**
   * Log API requests/responses
   */
  logAPI(method: string, endpoint: string, status: number, duration: number, error?: any) {
    const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    
    this.log(level, `API ${method} ${endpoint}`, {
      api_method: method,
      api_endpoint: endpoint,
      api_status: status,
      api_duration_ms: duration,
      api_success: status < 400,
      ...(error && { api_error: error.message })
    }, 'api');
  }

  /**
   * Log user actions
   */
  logUserAction(action: string, screen: string, context?: Record<string, any>) {
    this.log('info', `User action: ${action}`, {
      user_action: action,
      screen_name: screen,
      ...context
    }, 'user_action');
  }

  /**
   * Log business events
   */
  logBusinessEvent(event: string, context?: Record<string, any>) {
    this.log('info', `Business event: ${event}`, {
      business_event: event,
      ...context
    }, 'business');
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric: string, value: number, unit: string, context?: Record<string, any>) {
    this.log('info', `Performance: ${metric}`, {
      performance_metric: metric,
      performance_value: value,
      performance_unit: unit,
      ...context
    }, 'performance');
  }

  // ========== CORRELATION ID MANAGEMENT ==========

  setCorrelationId(id: string) {
    this.correlationId = id;
  }

  clearCorrelationId() {
    this.correlationId = undefined;
  }

  generateCorrelationId(): string {
    const id = `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.setCorrelationId(id);
    return id;
  }

  // ========== CORE LOGGING LOGIC ==========

  private log(
    level: LogLevel, 
    message: string, 
    context?: Record<string, any>, 
    module?: string,
    stackTrace?: string
  ) {
    if (!this.isEnabled) return;
    if (this.logLevels[level] < this.logLevels[this.minLogLevel]) return;

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context || {},
      module,
      sessionId: this.sessionId,
      correlationId: this.correlationId,
      deviceInfo: this.getDeviceInfo(),
      ...(stackTrace && { stackTrace })
    };

    // Add to queue
    this.logQueue.push(logEntry);
    
    // Console log for development
    this.consoleLog(logEntry);
    
    // Flush if queue is full
    if (this.logQueue.length >= this.maxQueueSize) {
      this.flushLogs();
    }

    // Immediate flush for errors and fatal logs
    if (level === 'error' || level === 'fatal') {
      setTimeout(() => this.flushLogs(), 1000);
    }
  }

  private consoleLog(entry: LogEntry) {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.module ? `[${entry.module}]` : ''}`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.context);
        break;
      case 'info':
        // TEMP_DISABLED: console.log(message, entry.context);
        break;
      case 'warn':
        console.warn(message, entry.context);
        break;
      case 'error':
      case 'fatal':
        console.error(message, entry.context, entry.stackTrace);
        break;
    }
  }

  // ========== DEVICE & ENVIRONMENT INFO ==========

  private getDeviceInfo() {
    return {
      platform: 'react-native', // Platform.OS,
      version: '1.0.0', // DeviceInfo.getVersion(),
      model: 'unknown' // DeviceInfo.getModel()
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ========== LOG FLUSHING ==========

  private async flushLogs() {
    if (this.logQueue.length === 0) return;

    const logsToFlush = [...this.logQueue];
    this.logQueue = [];

    try {
      // ✅ SESSION 8: Vérifier si endpoint /logs existe avant d'appeler
      const logsEndpointAvailable = await apiDiscovery.isEndpointAvailable('/swift-app/v1/logs', 'POST');
      
      if (!logsEndpointAvailable) {
        // Endpoint non disponible → fallback silent (pas de log d'erreur)
        console.debug(`📝 [LOGGING] Endpoint /logs not available, ${logsToFlush.length} logs kept locally (silent fallback)`);
        return; // Ne PAS envoyer si endpoint n'existe pas
      }

      const authHeaders = await getAuthHeaders();
      if (!authHeaders) {
        // Silencieux - pas connecté, logs pas envoyés
        return;
      }

      const response = await fetch(`${API_BASE_URL}/logs`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logs: logsToFlush })
      });

      if (response.ok) {
        // Logs envoyés avec succès (silencieux)
      } else {
        // Silencieux - le serveur a rejeté mais on continue
        // Ne PAS remettre en queue pour éviter accumulation infinie
      }

    } catch (error) {
      // Silencieux - erreur réseau ou autre
      // Ne PAS remettre en queue pour éviter accumulation infinie
    }
  }

  private startPeriodicFlush() {
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  // ========== GLOBAL ERROR HANDLING ==========

  private setupGlobalErrorHandling() {
    // Global error handler
    const originalConsoleError = console.error;
    
    // Protection contre récursion infinie
    let isLoggingConsoleError = false;

    console.error = (...args) => {
      // Call original console.error
      originalConsoleError.apply(console, args);
      
      // PROTECTION: Éviter la récursion infinie si this.error() appelle console.error
      if (isLoggingConsoleError) {
        return; // Sortir immédiatement pour éviter la boucle
      }

      try {
        isLoggingConsoleError = true;
        
        // Log to our system (uniquement si pas déjà en train de logger)
        const message = args.map(arg => 
          typeof arg === 'string' ? arg : JSON.stringify(arg)
        ).join(' ');
        
        // Ne pas logger si c'est déjà un message "[ERROR] [global]" (éviter duplication)
        if (message.includes('[ERROR] [global] Global console.error caught')) {
          return;
        }
        
        // Ne pas logger si c'est déjà un message "Console Error Captured" (éviter duplication sessionLogger)
        if (message.includes('Console Error Captured')) {
          return;
        }
        
        // Ne pas logger les erreurs React de clés dupliquées (warnings de développement)
        // Ces erreurs peuvent être nombreuses et créer des boucles si elles se répètent
        if (message.includes('Encountered two children with the same key')) {
          originalConsoleError('[REACT-WARNING] Duplicate key detected (not logged to prevent loop):', message.substring(0, 100));
          return;
        }

        this.error('Global console.error caught', undefined, {
          console_error_args: args.length,
          console_error_message: message
        }, 'global');

        // ❌ DÉSACTIVÉ: Causait une boucle infinie avec sessionLogger
        // Aussi logger vers le session logger si disponible
        // if (typeof require !== 'undefined') {
        //   try {
        //     const { logError } = require('./sessionLogger');
        //     logError('Console Error Captured', { consoleArgs: args }, 'global-console-error');
        //   } catch (e) {
        //     // Session logger pas encore disponible, ignore
        //   }
        // }
      } finally {
        isLoggingConsoleError = false;
      }
    };


    // Unhandled promise rejections (web only)
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled Promise Rejection', event.reason, {
          promise_rejection: true,
          reason: event.reason
        }, 'global');

        // Aussi logger vers le session logger si disponible
        if (typeof require !== 'undefined') {
          try {
            const { logError } = require('./sessionLogger');
            logError('Unhandled Promise Rejection', event.reason, 'global-promise-rejection');
          } catch (e) {

            // Session logger pas encore disponible, ignore
          }
        }
      });
    }
  }

  // ========== CONFIGURATION ==========

  setLogLevel(level: LogLevel) {
    this.minLogLevel = level;
    // TEMP_DISABLED: console.log(`📝 [LOGGING] Log level set to: ${level}`);
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    // TEMP_DISABLED: console.log(`📝 [LOGGING] Logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Manual flush
  flush() {
    return this.flushLogs();
  }

  // Get current queue size
  getQueueSize(): number {
    return this.logQueue.length;
  }

  // Get session ID
  getSessionId(): string {
    return this.sessionId;
  }

  // Clear all logs
  clearLogs() {
    this.logQueue = [];
    // TEMP_DISABLED: console.log('📝 [LOGGING] Log queue cleared');
  }
}

// Singleton instance
export const logger = new LoggingService();

// Convenience exports
export const {
  debug,
  info,
  warn,
  error,
  fatal,
  logAPI,
  logUserAction,
  logBusinessEvent,
  logPerformance,
  setCorrelationId,
  clearCorrelationId,
  generateCorrelationId,
  flush: flushLogs,
  setLogLevel,
  setEnabled: setLoggingEnabled
} = logger;

export default logger;