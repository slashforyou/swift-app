// Test du système de console file logging
// Usage: node test-console-logging.js

console.log('=== Test du système de console file logging ===');

// Tester différents types de logs
console.log('Test 1: Log normal');
console.info('Test 2: Info message');
console.warn('Test 3: Warning message');
console.error('Test 4: Error message');
console.debug('Test 5: Debug message');

// Tester avec des objets
const testObject = {
  name: 'Test Object',
  value: 123,
  nested: {
    prop: 'test'
  }
};

console.log('Test 6: Object logging', testObject);

// Tester avec des erreurs JavaScript
try {
  throw new Error('Test error message');
} catch (e) {
  console.error('Test 7: Caught error', e);
}

// Tester avec des logs longs
const longMessage = 'Ceci est un message très long '.repeat(50);
console.log('Test 8: Long message', longMessage);

// Tester avec des caractères spéciaux
console.log('Test 9: Caractères spéciaux: éàèùç ñ 中文 🚀 ✅');

// Simulation d'une séquence d'erreurs
console.log('Test 10: Simulation séquence d\'erreurs...');
for (let i = 1; i <= 5; i++) {
  setTimeout(() => {
    console.error(`Erreur simulée #${i}`);
  }, i * 100);
}

console.log('Tests terminés - vérifiez le fichier app-console-logs.txt');

// Si l'API Copilot est disponible, afficher le chemin du fichier
setTimeout(() => {
  if (typeof global !== 'undefined' && global.copilotAPI && global.copilotAPI.consoleLogger) {
    const logPath = global.copilotAPI.consoleLogger.getLogFilePath();
    console.log(`📁 Fichier de logs: ${logPath}`);
    
    // Afficher les derniers logs via l'API
    global.copilotAPI.consoleLogger.getRecentLogs(20).then(logs => {
      console.log('📄 Derniers logs via API:');
      console.log(logs);
    }).catch(err => {
      console.error('Erreur lecture logs via API:', err);
    });
  } else {
    console.log('⚠️ API Copilot non disponible - fichier sera dans le dossier Documents de l\'app');
  }
}, 1000);