// Mock for React Native Platform
module.exports = {
  __esModule: true,
  default: {
    OS: 'ios',
    Version: 14,
    select: (obj) => obj.ios || obj.default,
    isPad: false,
    isTVOS: false,
    isTV: false,
  },
  OS: 'ios',
  Version: 14,
  select: (obj) => obj.ios || obj.default,
  isPad: false,
  isTVOS: false,
  isTV: false,
};
