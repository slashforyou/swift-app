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