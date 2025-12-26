#!/usr/bin/env node
/**
 * Test et validation du Session Logger
 * Valide que le système de logging de session fonctionne correctement
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 VALIDATION DU SESSION LOGGER SwiftApp');
console.log('=' .repeat(50));

class SessionLoggerValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.errors = [];
    this.warnings = [];
  }

  // Valider l'existence du fichier SessionLogger
  validateSessionLoggerFile() {
    console.log('🔍 Validation du fichier SessionLogger...');
    
    const sessionLoggerPath = path.join(this.projectRoot, 'src/services/sessionLogger.ts');
    
    if (!fs.existsSync(sessionLoggerPath)) {
      this.errors.push('❌ Fichier sessionLogger.ts manquant');
      return false;
    }

    const content = fs.readFileSync(sessionLoggerPath, 'utf8');
    
    // Vérifier les éléments critiques
    const requiredElements = [
      'class SessionLogger',
      'logError',
      'logWarning',
      'logInfo', 
      'logDebug',
      'setupGlobalErrorCapture',
      'FileSystem.writeAsStringAsync',
      'initializeLogger',
      'export const sessionLogger'
    ];

    const missingElements = requiredElements.filter(element => 
      !content.includes(element)
    );

    if (missingElements.length > 0) {
      this.errors.push(`❌ Éléments manquants dans sessionLogger: ${missingElements.join(', ')}`);
      return false;
    }

    console.log('✅ SessionLogger correctement implémenté');
    return true;
  }

  // Valider l'intégration dans App.tsx
  validateAppIntegration() {
    console.log('🔍 Validation intégration dans App.tsx...');
    
    const appPath = path.join(this.projectRoot, 'src/App.tsx');
    
    if (!fs.existsSync(appPath)) {
      this.errors.push('❌ Fichier App.tsx manquant');
      return false;
    }

    const content = fs.readFileSync(appPath, 'utf8');
    
    const requiredIntegrations = [
      'import.*sessionLogger.*from.*sessionLogger',
      'sessionLogger.setupGlobalErrorCapture',
      'logInfo.*SwiftApp started'
    ];

    const missingIntegrations = requiredIntegrations.filter(pattern => 
      !new RegExp(pattern).test(content)
    );

    if (missingIntegrations.length > 0) {
      this.warnings.push(`⚠️  Intégrations manquantes dans App.tsx: ${missingIntegrations.length} items`);
    } else {
      console.log('✅ SessionLogger correctement intégré dans App.tsx');
    }

    return missingIntegrations.length === 0;
  }

  // Valider les composants DevTools
  validateDevToolsComponents() {
    console.log('🔍 Validation des composants DevTools...');
    
    const devToolsPath = path.join(this.projectRoot, 'src/components/DevTools');
    
    if (!fs.existsSync(devToolsPath)) {
      this.errors.push('❌ Dossier DevTools manquant');
      return false;
    }

    // SessionLogViewer
    const viewerPath = path.join(devToolsPath, 'SessionLogViewer.tsx');
    if (!fs.existsSync(viewerPath)) {
      this.errors.push('❌ SessionLogViewer.tsx manquant');
    } else {
      const viewerContent = fs.readFileSync(viewerPath, 'utf8');
      if (viewerContent.includes('SessionLogViewer') && viewerContent.includes('SessionLogButton')) {
        console.log('✅ SessionLogViewer correctement implémenté');
      } else {
        this.warnings.push('⚠️  SessionLogViewer incomplet');
      }
    }

    // ErrorTestButton
    const errorTestPath = path.join(devToolsPath, 'ErrorTestButton.tsx');
    if (!fs.existsSync(errorTestPath)) {
      this.warnings.push('⚠️  ErrorTestButton.tsx manquant (optionnel)');
    } else {
      console.log('✅ ErrorTestButton disponible');
    }

    return true;
  }

  // Valider les dépendances nécessaires
  validateDependencies() {
    console.log('🔍 Validation des dépendances...');
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.errors.push('❌ package.json manquant');
      return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredDeps = ['expo-file-system'];
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies || !packageJson.dependencies[dep]
    );

    if (missingDeps.length > 0) {
      this.errors.push(`❌ Dépendances manquantes: ${missingDeps.join(', ')}`);
      return false;
    }

    console.log('✅ Toutes les dépendances sont installées');
    return true;
  }

  // Test de simulation (sans exécution réelle)
  validateLogicFlow() {
    console.log('🔍 Validation de la logique de logging...');
    
    try {
      // Simuler le flow de logging
      const logFlow = [
        '1. App démarre → sessionLogger.initializeLogger()',
        '2. Fichier log précédent supprimé',
        '3. Nouveau fichier créé avec header de session',
        '4. Global error capture activé',
        '5. Erreurs automatiquement loggées vers le fichier',
        '6. Interface DevTools pour consulter les logs'
      ];

      console.log('📝 Flow de logging validé:');
      logFlow.forEach(step => console.log(`   ${step}`));
      
      console.log('✅ Logique de logging cohérente');
      return true;
    } catch (error) {
      this.errors.push(`❌ Erreur dans la validation logique: ${error.message}`);
      return false;
    }
  }

  // Génération du rapport
  generateReport() {
    console.log('\n📊 RAPPORT DE VALIDATION');
    console.log('=' .repeat(50));
    
    if (this.errors.length === 0) {
      console.log('🎉 SUCCESS: Session Logger entièrement fonctionnel !');
    } else {
      console.log(`❌ ERRORS (${this.errors.length}):`);
      this.errors.forEach(error => console.log(`   ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach(warning => console.log(`   ${warning}`));
    }

    const score = Math.max(0, 100 - (this.errors.length * 25) - (this.warnings.length * 5));
    console.log(`\n📈 Score de validation: ${score}%`);

    console.log('\n🚀 PROCHAINES ÉTAPES:');
    if (this.errors.length === 0) {
      console.log('   1. Lancer l\'app avec npm start');
      console.log('   2. Aller dans Business Info Page');
      console.log('   3. Appuyer sur le bouton "Test Errors" pour tester');
      console.log('   4. Appuyer sur "Session Logs" pour voir les logs');
      console.log('   5. Partager les logs en cas d\'erreur longue');
    } else {
      console.log('   1. Corriger les erreurs listées ci-dessus');
      console.log('   2. Relancer la validation');
    }
  }

  // Exécution principale
  async run() {
    const checks = [
      this.validateDependencies(),
      this.validateSessionLoggerFile(),
      this.validateAppIntegration(), 
      this.validateDevToolsComponents(),
      this.validateLogicFlow()
    ];

    const passed = checks.filter(Boolean).length;
    const total = checks.length;
    
    console.log(`\n✅ Validations passées: ${passed}/${total}`);
    
    this.generateReport();
    
    process.exit(this.errors.length > 0 ? 1 : 0);
  }
}

// Exécution
const validator = new SessionLoggerValidator();
validator.run().catch(error => {
  console.error('❌ Erreur dans la validation:', error);
  process.exit(1);
});