// Basic setup for Jest
// This file is referenced in jest.config.js setupFilesAfterEnv

// Global fetch mock
global.fetch = jest.fn();

// Mock React Native DevMenu
jest.mock('react-native/Libraries/Utilities/DevSettings', () => ({
  addMenuItem: jest.fn(),
  reload: jest.fn(),
}));

// Mock NativeDevMenu
jest.mock('react-native/src/private/specs_DEPRECATED/modules/NativeDevMenu', () => ({
  show: jest.fn(),
  reload: jest.fn(),
  debugRemotely: jest.fn(),
  setProfilingEnabled: jest.fn(),
  setHotLoadingEnabled: jest.fn(),
}));

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