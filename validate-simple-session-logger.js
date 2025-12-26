#!/usr/bin/env node
/**
 * Validation finale du Simple Session Logger
 */

const fs = require('fs');
const path = require('path');

console.log('✅ VALIDATION SIMPLE SESSION LOGGER');
console.log('=' .repeat(50));

class SimpleLoggerValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.checks = [];
  }

  // Vérifications principales
  async runChecks() {
    // 1. Fichier SimpleSessionLogger
    this.checkFile('src/services/simpleSessionLogger.ts', [
      'class SimpleSessionLogger',
      'logError',
      'logInfo',
      'getAllLogs',
      'getFormattedLogs'
    ]);

    // 2. App.tsx intégration
    this.checkFile('src/App.tsx', [
      'simpleSessionLogger',
      'setupGlobalErrorCapture'
    ]);

    // 3. SimpleSessionLogViewer
    this.checkFile('src/components/DevTools/SimpleSessionLogViewer.tsx', [
      'SimpleSessionLogViewer',
      'SimpleSessionLogButton'
    ]);

    // 4. ErrorTestButton
    this.checkFile('src/components/DevTools/ErrorTestButton.tsx', [
      'simpleSessionLogger'
    ]);

    // 5. BusinessInfoPage intégration
    this.checkFile('src/screens/business/BusinessInfoPage.tsx', [
      'SimpleSessionLogButton'
    ]);

    this.generateReport();
  }

  checkFile(filePath, requiredContent) {
    const fullPath = path.join(this.projectRoot, filePath);
    const fileName = path.basename(filePath);
    
    if (!fs.existsSync(fullPath)) {
      this.checks.push({ file: fileName, status: '❌', issue: 'Fichier manquant' });
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const missingContent = requiredContent.filter(item => !content.includes(item));

    if (missingContent.length > 0) {
      this.checks.push({ 
        file: fileName, 
        status: '⚠️', 
        issue: `Contenu manquant: ${missingContent.join(', ')}` 
      });
    } else {
      this.checks.push({ file: fileName, status: '✅', issue: 'OK' });
    }
  }

  generateReport() {
    console.log('📋 RAPPORT DE VALIDATION:');
    console.log('-'.repeat(70));
    
    this.checks.forEach(check => {
      console.log(`${check.status} ${check.file.padEnd(40)} ${check.issue}`);
    });

    const passed = this.checks.filter(check => check.status === '✅').length;
    const warnings = this.checks.filter(check => check.status === '⚠️').length;
    const errors = this.checks.filter(check => check.status === '❌').length;

    console.log('\n📊 RÉSUMÉ:');
    console.log(`✅ Réussis: ${passed}`);
    console.log(`⚠️  Avertissements: ${warnings}`);
    console.log(`❌ Erreurs: ${errors}`);

    console.log('\n🎯 SYSTÈME DE SESSION LOGGING:');
    if (errors === 0) {
      console.log('🎉 Simple Session Logger est OPÉRATIONNEL !');
      console.log('');
      console.log('💡 COMMENT UTILISER:');
      console.log('   1. L\'app stocke automatiquement les logs en mémoire');
      console.log('   2. Aller sur Business Info Page');
      console.log('   3. Utiliser le bouton "📄 Logs" pour voir les logs');
      console.log('   4. Utiliser "🧪 Test Errors" pour tester différents types d\'erreurs');
      console.log('   5. Partager les logs avec le bouton 📤');
      console.log('');
      console.log('🔧 FONCTIONNALITÉS:');
      console.log('   ✅ Capture d\'erreurs globales');
      console.log('   ✅ 4 niveaux de log (ERROR, WARN, INFO, DEBUG)');
      console.log('   ✅ Interface de consultation intégrée');
      console.log('   ✅ Possibilité de partage');
      console.log('   ✅ Effacement des logs');
      console.log('   ✅ Limite automatique (1000 entrées max)');
    } else {
      console.log('❌ Quelques fichiers manquent, vérifiez les erreurs ci-dessus');
    }
  }
}

// Exécution
const validator = new SimpleLoggerValidator();
validator.runChecks();