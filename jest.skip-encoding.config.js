// Jest configuration temporaire qui skip les tests avec problèmes d'encodage UTF-8
// Pour usage: npm test -- --config=jest.skip.config.js

const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  testPathIgnorePatterns: [
    ...( baseConfig.testPathIgnorePatterns || []),
    // Tests avec problèmes d'encodage UTF-8 Windows
    '__tests__/components/modals/AddContractorModal.test.tsx',
    '__tests__/components/modals/InviteEmployeeModal.test.tsx',
    '__tests__/screens/staffCrewScreen.test.tsx',
    '__tests__/screens/TrucksScreen.test.tsx',
  ],
};
