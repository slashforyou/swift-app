module.exports = {
  "testEnvironment": "jsdom",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json"
  ],
  "transform": {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  "testMatch": [
    "<rootDir>/__tests__/types/staff-fixed.test.ts",
    "<rootDir>/__tests__/hooks/useStaff-final.test.ts"
  ],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^src/(.*)$": "<rootDir>/src/$1",
    "expo-secure-store": "<rootDir>/__mocks__/expo-secure-store.js"
  },
  "transformIgnorePatterns": [
    "node_modules/(?!(expo-secure-store|@react-native|react-native)/)"
  ],
  "setupFilesAfterEnv": [
    "<rootDir>/jest.setup.js"
  ],
  "collectCoverageFrom": [
    "src/hooks/useStaff.ts",
    "src/types/staff.ts"
  ],
  "coverageDirectory": "<rootDir>/coverage/staff-working",
  "coverageReporters": [
    "text",
    "lcov",
    "html"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 60,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  },
  "verbose": true,
  "bail": false,
  "maxWorkers": 2
};