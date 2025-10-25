// Mock for React Native Alert
const Alert = {
  alert: jest.fn(),
  prompt: jest.fn(),
};

module.exports = {
  __esModule: true,
  default: Alert,
  ...Alert,
};
