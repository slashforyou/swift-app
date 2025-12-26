// save-logs.js
/**
 * Script pour sauvegarder les logs depuis l'API Copilot
 * À exécuter dans la console de l'app ou via Node.js
 */

console.log('💾 Script de sauvegarde des logs SwiftApp');

// Fonction pour sauvegarder les logs
function saveLogs() {
  if (typeof global !== 'undefined' && global.copilotAPI) {
    try {
      const logContent = global.copilotAPI.logs.export();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `swiftapp-logs-${timestamp}.txt`;
      
      // Pour Node.js/Expo
      if (typeof require !== 'undefined') {
        const fs = require('fs');
        fs.writeFileSync(filename, logContent);
        console.log(`✅ Logs sauvegardés dans: ${filename}`);
      } else {
        // Pour le navigateur
        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        console.log(`📥 Téléchargement des logs: ${filename}`);
      }
      
      return logContent;
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des logs:', error);
      return null;
    }
  } else {
    console.log('❌ API Copilot non disponible');
    console.log('💡 Assurez-vous que l\'application SwiftApp est en cours d\'exécution.');
    return null;
  }
}

// Fonction pour afficher les logs récents
function showRecentLogs(count = 20) {
  if (typeof global !== 'undefined' && global.copilotAPI) {
    const logs = global.copilotAPI.logs.getArray();
    const recent = logs.slice(-count);
    
    console.log(`📄 ${count} derniers logs:`);
    console.log('='.repeat(50));
    
    recent.forEach((log, index) => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      const level = log.level.padEnd(5);
      const context = log.context ? `[${log.context}] ` : '';
      console.log(`${index + 1}. ${timestamp} ${level} ${context}${log.message}`);
      if (log.data) {
        console.log(`   Data:`, log.data);
      }
    });
    
    return recent;
  } else {
    console.log('❌ API Copilot non disponible');
    return [];
  }
}

// Si exécuté directement
if (typeof window !== 'undefined') {
  // Dans le navigateur
  console.log('🌐 Exécution dans le navigateur');
  console.log('📝 Utilisez: saveLogs() pour télécharger les logs');
  console.log('👀 Utilisez: showRecentLogs(50) pour voir les 50 derniers logs');
} else {
  // Dans Node.js
  console.log('⚙️  Exécution en Node.js');
  const result = saveLogs();
  if (result) {
    console.log(`📊 ${result.split('\n').length} lignes de logs exportées`);
  }
}

// Exporter les fonctions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { saveLogs, showRecentLogs };
}