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

// Mock Styles constants
jest.mock('./src/constants/Styles', () => ({
  commonStyles: {
    container: { flex: 1 },
    centered: { alignItems: 'center', justifyContent: 'center' },
  },
  DESIGN_TOKENS: {
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40 },
    typography: {
      title: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
      subtitle: { fontSize: 17, lineHeight: 22, fontWeight: '500' },
      body: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
      caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
    },
    radius: { sm: 8, md: 12, lg: 16 },
  },
  useCommonThemedStyles: () => ({
    container: { flex: 1 },
  }),
}), { virtual: true });

// Mock useStaff hook
jest.mock('./src/hooks/useStaff', () => ({
  useStaff: () => ({
    staff: [],
    employees: [],
    contractors: [],
    inviteEmployee: jest.fn(),
    searchContractor: jest.fn(),
    addContractor: jest.fn(),
    updateEmployee: jest.fn(),
    updateContractor: jest.fn(),
    deleteEmployee: jest.fn(),
    deleteContractor: jest.fn(),
    refreshStaff: jest.fn(),
    isLoading: false,
    error: null,
    totalActive: 0,
    totalEmployees: 0,
    totalContractors: 0,
    totalTeams: 0,
    averageEmployeeRate: 0,
  }),
}), { virtual: true });

// Mock modal components
jest.mock('./src/components/business/modals/InviteEmployeeModal', () => ({
  __esModule: true,
  default: ({ visible, onClose, onSubmit }) => {
    if (!visible) return null;
    return null; // Simple mock that returns null
  },
}), { virtual: true });

jest.mock('./src/components/business/modals/AddContractorModal', () => ({
  __esModule: true,
  default: ({ visible, onClose, onSubmit }) => {
    if (!visible) return null;
    return null;
  },
}), { virtual: true });

jest.mock('./src/components/modals/AddStaffModal', () => ({
  __esModule: true,
  default: ({ visible, onClose, onSubmit }) => {
    if (!visible) return null;
    return null;
  },
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