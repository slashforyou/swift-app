/**
 * Test rapide pour vérifier que la correction du binding fonctionne
 */

const { trackNavigation } = require('./src/services/analytics.ts');

console.log('🧪 Testing trackNavigation binding...');

try {
  // Ceci devrait maintenant fonctionner sans erreur
  trackNavigation('TestScreen', 'PreviousScreen');
  console.log('✅ trackNavigation binding works correctly');
} catch (error) {
  console.error('❌ trackNavigation binding failed:', error.message);
}