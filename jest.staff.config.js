/**
 * Configuration Jest spécifique pour les tests Staff
 * Basée sur jest.config.js existant
 */
module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testMatch: [
    '<rootDir>/__tests__/**/staff*.test.{js,ts,tsx}',
    '<rootDir>/__tests__/**/*Staff*.test.{js,ts,tsx}',
    '<rootDir>/__tests__/hooks/useStaff.test.ts',
    '<rootDir>/__tests__/types/staff.test.ts',
    '<rootDir>/__tests__/components/modals/*Employee*.test.tsx',
    '<rootDir>/__tests__/components/modals/*Contractor*.test.tsx',
    '<rootDir>/__tests__/screens/staffCrewScreen.test.tsx',
    '<rootDir>/__tests__/integration/staff-e2e.test.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    'expo-secure-store': '<rootDir>/__mocks__/expo-secure-store.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(expo-secure-store|@react-native|react-native)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/hooks/useStaff.ts',
    'src/types/staff.ts',
    'src/components/business/modals/InviteEmployeeModal.tsx',
    'src/components/business/modals/AddContractorModal.tsx',
    'src/screens/business/staffCrewScreen.tsx',
  ],
  coverageDirectory: '<rootDir>/coverage/staff',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  verbose: true,
  bail: false,
  maxWorkers: 4,
};