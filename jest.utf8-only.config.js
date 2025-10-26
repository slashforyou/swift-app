// Configuration Jest pour tester UNIQUEMENT les 4 suites avec problèmes UTF-8
// Ces tests échouent sur Windows à cause de l'encodage CP1252 au lieu d'UTF-8
// Usage: npm run test:utf8

const baseConfig = require('./jest.config.js');

module.exports = {
  ...baseConfig,
  // Ne tester QUE les 4 suites problématiques
  testMatch: [
    '**/__tests__/components/modals/AddContractorModal.test.tsx',
    '**/__tests__/components/modals/InviteEmployeeModal.test.tsx',
    '**/__tests__/screens/staffCrewScreen.test.tsx',
    '**/__tests__/screens/TrucksScreen.test.tsx',
  ],
  // Afficher les erreurs détaillées pour debug UTF-8
  verbose: true,
  bail: 1, // Arrêter après la première erreur
};
