/**
 * Simple Console Logger for Development
 * Provides structured logging that stores logs in memory and provides utilities to export them
 * Note: This is a simplified version that doesn't use file system due to compatibility issues
 */

import React from 'react';

interface LogEntry {
  timestamp: string;
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  data?: any;
}

class MemoryConsoleLogger {
  private static instance: MemoryConsoleLogger;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000; // Keep last 1000 log entries
  private originalConsole: any;
  private isInitialized: boolean = false;

  private constructor() {
    // Keep references to original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console)
    };
  }

  public static getInstance(): MemoryConsoleLogger {
    if (!MemoryConsoleLogger.instance) {
      MemoryConsoleLogger.instance = new MemoryConsoleLogger();
    }
    return MemoryConsoleLogger.instance;
  }

  private addLogEntry(level: string, args: any[]): void {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, this.circularReplacer(), 2);
        } catch (e) {

          return '[Object - Cannot Stringify]';
        }
      }
      return String(arg);
    }).join(' ');
    
    const logEntry: LogEntry = {
      timestamp,
      level: level as any,
      message,
      data: args.length > 1 ? args : undefined
    };
    
    this.logs.push(logEntry);
        
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private circularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    };
  }

  public initialize(): void {
    if (this.isInitialized) return;

    try {
      // Override console methods
      console.log = (...args: any[]) => {
        this.addLogEntry('log', args);
        this.originalConsole.log(...args);
      };

      console.warn = (...args: any[]) => {
        this.addLogEntry('warn', args);
        this.originalConsole.warn(...args);
      };

      console.error = (...args: any[]) => {
        this.addLogEntry('error', args);
        this.originalConsole.error(...args);
      };

      console.info = (...args: any[]) => {
        this.addLogEntry('info', args);
        this.originalConsole.info(...args);
      };

      console.debug = (...args: any[]) => {
        this.addLogEntry('debug', args);
        this.originalConsole.debug(...args);
      };

      this.isInitialized = true;
      
      // Log initialization
      this.addLogEntry('system', ['Console logging to memory started']);
      this.originalConsole.log('🚀 Console logging to memory started - use logger.exportLogs() to get log text');
      
    } catch (error) {

      this.originalConsole.error('Failed to initialize memory logging:', error);
    }
  }

  public stopLogging(): void {
    if (!this.isInitialized) return;

    // Restore original console methods
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;

    this.isInitialized = false;
    this.originalConsole.log('🛑 Console logging to memory stopped');
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public getLogsAsText(): string {
    return this.logs.map(entry => {
      return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
    }).join('\n');
  }

  public exportLogs(): string {
    const header = `=== SWIFT APP CONSOLE LOGS ===\nGenerated: ${new Date().toISOString()}\nTotal Entries: ${this.logs.length}\n${'='.repeat(50)}\n\n`;
    return header + this.getLogsAsText();
  }

  public clearLogs(): void {
    this.logs = [];
    this.addLogEntry('system', ['Log memory cleared']);
  }

  public getLogsByLevel(level: string): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  public getLogsAfterTime(timestamp: string): LogEntry[] {
    return this.logs.filter(log => log.timestamp > timestamp);
  }
}

// Export singleton instance and utility functions
export const memoryConsoleLogger = MemoryConsoleLogger.getInstance();

// Hook for React components
export function useConsoleLogger() {
  const [isLogging, setIsLogging] = React.useState(false);
  const [logCount, setLogCount] = React.useState(0);

  const startLogging = () => {
    try {
      memoryConsoleLogger.initialize();
      setIsLogging(true);
      updateLogCount();
    } catch (error) {

      console.error('Failed to start logging:', error);
    }
  };

  const stopLogging = () => {
    memoryConsoleLogger.stopLogging();
    setIsLogging(false);
  };

  const getLogs = () => {
    return memoryConsoleLogger.getLogs();
  };

  const exportLogs = () => {
    return memoryConsoleLogger.exportLogs();
  };

  const clearLogs = () => {
    memoryConsoleLogger.clearLogs();
    updateLogCount();
  };

  const updateLogCount = () => {
    setLogCount(memoryConsoleLogger.getLogs().length);
  };

  React.useEffect(() => {
    const interval = setInterval(updateLogCount, 1000); // Update count every second
    return () => clearInterval(interval);
  }, []);

  return {
    isLogging,
    logCount,
    startLogging,
    stopLogging,
    getLogs,
    exportLogs,
    clearLogs,
    updateLogCount
  };
}

// Auto-initialize in development
if (__DEV__) {
  memoryConsoleLogger.initialize();
}

export default memoryConsoleLogger;