const fs = require('fs');
const path = require('path');

/**
 * Console File Logger - Captures all console output to files
 * This script overrides the default console methods and saves all output to timestamped files
 * while still showing everything in the console.
 */

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Generate filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFileName = `console-logs-${timestamp}.log`;
const logFilePath = path.join(logsDir, logFileName);

// Keep references to original console methods
const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console)
};

// Helper function to format and write log entry
function writeLogEntry(level, args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return '[Object - Cannot Stringify]';
      }
    }
    return String(arg);
  }).join(' ');
  
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  
  try {
    fs.appendFileSync(logFilePath, logEntry);
  } catch (error) {
    originalConsole.error('Failed to write to log file:', error);
  }
}

// Override console methods
console.log = function(...args) {
  writeLogEntry('log', args);
  originalConsole.log(...args);
};

console.warn = function(...args) {
  writeLogEntry('warn', args);
  originalConsole.warn(...args);
};

console.error = function(...args) {
  writeLogEntry('error', args);
  originalConsole.error(...args);
};

console.info = function(...args) {
  writeLogEntry('info', args);
  originalConsole.info(...args);
};

console.debug = function(...args) {
  writeLogEntry('debug', args);
  originalConsole.debug(...args);
};

// Initialize logging
originalConsole.log('🚀 Console logging to file started:', logFilePath);
writeLogEntry('system', ['Console logging to file started']);

// Export for potential cleanup
module.exports = {
  logFilePath,
  stopLogging: function() {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
    originalConsole.log('🛑 Console logging to file stopped');
  }
};