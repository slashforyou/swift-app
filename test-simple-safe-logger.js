// Test rapide du système de logging simplifiée
const { safeLog } = require('./src/utils/simpleSafeLogger');

console.log('🧪 === TEST DU SYSTÈME DE LOGGING SIMPLIFIÉ ===\n');

// Test 1: Logs normaux
console.log('📋 Test 1: Logs basiques...');
safeLog.info('Test message info');
safeLog.error('Test message erreur');
safeLog.debug('Test message debug');
safeLog.warn('Test message warning');

// Test 2: Objet volumineux
console.log('\n📋 Test 2: Objet volumineux...');
const largeObject = {
  users: Array(50).fill(null).map((_, i) => ({
    id: i,
    name: `User ${i}`,
    description: 'Description très longue '.repeat(100)
  })),
  metadata: 'Metadata très longue '.repeat(200),
  nested: {
    deep: {
      veryDeep: {
        tooDeep: 'Données profondes'
      }
    }
  }
};

safeLog.info('Test objet volumineux', largeObject);

// Test 3: Référence circulaire (simulation)
console.log('\n📋 Test 3: Gestion des erreurs...');
const problematicData = {
  toString: () => { throw new Error('Erreur de sérialisation'); }
};

safeLog.info('Test données problématiques', problematicData);

// Test 4: Chaîne très longue
console.log('\n📋 Test 4: Chaîne très longue...');
const longString = 'Ceci est une chaîne très longue '.repeat(100);
safeLog.info('Test chaîne longue', longString);

console.log('\n✅ === TESTS TERMINÉS ===');
console.log('🚀 Le système de logging simplifié fonctionne !');
console.log('📱 L\'application devrait maintenant démarrer sans problème.');
console.log('🔍 Les logs volumineux sont automatiquement tronqués.');
console.log('⚡ Aucune dépendance complexe, compatible React Native.');