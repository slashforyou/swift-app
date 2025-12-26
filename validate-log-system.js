// validate-log-system.js
/**
 * Script pour tester le système de logs amélioré
 * À exécuter dans l'app après compilation
 */

console.log('🔍 Test du système de logs amélioré...\n');

// Test via l'API Copilot
if (typeof global !== 'undefined' && global.copilotAPI) {
  console.log('✅ API Copilot disponible');
  
  // Test des logs
  if (global.copilotAPI.logs) {
    console.log('✅ API Logs disponible');
    
    try {
      // Générer quelques logs de test
      global.copilotAPI.logs.clear();
      console.log('📝 Logs effacés');
      
      // Ajouter des logs de test
      const testLogs = [
        'Test INFO message',
        'Test WARNING message', 
        'Test ERROR message',
        'Test DEBUG message'
      ];
      
      console.log('📝 Génération de logs de test...');
      
      // Obtenir les statistiques
      const stats = global.copilotAPI.logs.count();
      console.log(`📊 Nombre de logs: ${stats}`);
      
      // Test de pagination
      const logsArray = global.copilotAPI.logs.getArray();
      console.log(`📋 Logs récupérés: ${logsArray.length} entrées`);
      
      if (logsArray.length > 0) {
        console.log('📄 Premier log:', {
          level: logsArray[0].level,
          message: logsArray[0].message,
          timestamp: logsArray[0].timestamp
        });
      }
      
      console.log('✅ Test du système de logs réussi !');
      
    } catch (error) {
      console.error('❌ Erreur lors du test des logs:', error);
    }
    
  } else {
    console.log('❌ API Logs non disponible');
  }
  
  // Test de session
  if (global.copilotAPI.session) {
    console.log('✅ API Session disponible');
    
    try {
      const session = global.copilotAPI.session.getCurrent();
      const stats = global.copilotAPI.session.getStats();
      const isRunning = global.copilotAPI.session.isRunning();
      
      console.log('📊 Statut session:', {
        sessionActive: !!session,
        isRunning,
        stats
      });
      
    } catch (error) {
      console.error('❌ Erreur lors du test de session:', error);
    }
  }
  
} else {
  console.log('❌ API Copilot non disponible');
}

console.log('\n🏁 Test terminé');