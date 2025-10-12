// Basic setup for Jest
// This file is referenced in jest.config.js setupFilesAfterEnv

// Global fetch mock
global.fetch = jest.fn();

// Mock console methods for cleaner test output
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error, // Keep errors for debugging
};