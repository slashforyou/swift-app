// Mock pour expo-modules-core
const mockEventEmitter = {
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  emit: jest.fn(),
};

const mockNativeModulesProxy = new Proxy({}, {
  get: () => ({
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  }),
});

module.exports = {
  EventEmitter: mockEventEmitter,
  NativeModulesProxy: mockNativeModulesProxy,
  requireNativeViewManager: jest.fn(() => ({})),
  requireOptionalNativeModule: jest.fn(() => null),
  requireNativeModule: jest.fn(() => ({})),
  UnavailabilityError: class UnavailabilityError extends Error {},
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
  },
};
