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

// Mock src/services/api if it doesn't exist
jest.mock('./src/services/api', () => ({
  authenticatedFetch: jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) })),
  api: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  },
}), { virtual: true });

// Mock ThemeProvider globally
jest.mock('./src/context/ThemeProvider', () => ({
  ThemeProvider: ({ children }) => children,
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
      textSecondary: '#666666',
      primary: '#007AFF',
      backgroundSecondary: '#F2F2F7',
      border: '#E5E5EA',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
      info: '#007AFF',
    },
    isDark: false,
  }),
}), { virtual: true });

// Mock useLocalization globally
jest.mock('./src/localization/useLocalization', () => ({
  useLocalization: () => ({
    t: (key) => key,
    locale: 'en',
    setLocale: jest.fn(),
  }),
}), { virtual: true });

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