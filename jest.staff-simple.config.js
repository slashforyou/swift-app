/**
 * Configuration Jest simplifiée pour les tests Staff
 */
module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testMatch: [
    '<rootDir>/__tests__/**/*-final.test.{ts,tsx}',
    '<rootDir>/__tests__/**/*-fixed.test.{ts,tsx}',
    '<rootDir>/__tests__/**/*-simple.test.{ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
    'expo-secure-store': '<rootDir>/__mocks__/expo-secure-store.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(expo-secure-store|@react-native|react-native)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/hooks/useStaff.ts',
    'src/types/staff.ts',
  ],
  coverageDirectory: '<rootDir>/coverage/staff-simple',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  verbose: true,
  bail: false,
  maxWorkers: 2,
};