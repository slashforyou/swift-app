module.exports = {
  // preset: 'jest-expo', // COMMENTÉ - cause problèmes avec Expo Winter
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/load/',           // Exclude load tests (timeout issues in CI)
    '/__tests__/e2e/',            // Exclude e2e tests (require device)
    '/__tests__/integration/',    // Exclude integration tests (require mocks)
    '/__tests__/validation/',     // Exclude validation tests (outdated)
    '/__tests__/screens/',        // Exclude screen tests (broken mocks)
    '/__tests__/services/analytics.test.ts',
    '/__tests__/services/alertService.test.ts',
    '/__tests__/services/logger.test.ts',
    '/__tests__/hooks/useJobPhotos.test.ts',
    '/__tests__/hooks/useStaff-diagnostic.test.ts',
    '/__tests__/hooks/useJobTimer.test.ts',
    '/__tests__/utils/jobValidation.test.ts',
    '/__tests__/components/JobsBillingScreen.test.tsx',
    '/src/__tests__/localization.test.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    'expo-secure-store': '<rootDir>/__mocks__/expo-secure-store.js',
    '^expo/src/winter/(.*)$': '<rootDir>/__mocks__/expo-winter-mock.js',
    // Mock React Native internal modules
    '^react-native/Libraries/Utilities/Platform$': '<rootDir>/__mocks__/react-native/Libraries/Utilities/Platform.js',
    '^react-native/Libraries/Alert/Alert$': '<rootDir>/__mocks__/react-native/Libraries/Alert/Alert.js',
  },
  moduleDirectories: ['node_modules', 'src'],
  transformIgnorePatterns: [
    'node_modules/(?!(expo|expo-.*|@expo|@expo-.*|react-native|@react-native|@react-native-.*|@unimodules|unimodules|sentry-expo|native-base|react-native-svg)/)',
  ],
  globals: {
    __DEV__: true,
  },
  setupFiles: ['<rootDir>/jest.globals.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
};