#!/usr/bin/env node

/**
 * Script pour exécuter la suite complète de tests Staff
 * Usage: npm run test:staff [options]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration des couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function banner(text) {
  const border = '='.repeat(text.length + 4);
  log(border, 'cyan');
  log(`  ${text}  `, 'cyan');
  log(border, 'cyan');
}

function section(text) {
  log(`\n📋 ${text}`, 'blue');
  log('-'.repeat(text.length + 4), 'blue');
}

// Fonction pour exécuter une commande et capturer la sortie
function runCommand(command, description) {
  section(description);
  
  try {
    log(`Commande: ${command}`, 'yellow');
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'inherit',
      cwd: process.cwd()
    });
    log('✅ Succès!', 'green');
    return true;
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return false;
  }
}

// Fonction pour vérifier l'existence des fichiers de test
function checkTestFiles() {
  const testFiles = [
    '__tests__/hooks/useStaff.test.ts',
    '__tests__/types/staff.test.ts',
    '__tests__/components/modals/InviteEmployeeModal.test.tsx',
    '__tests__/components/modals/AddContractorModal.test.tsx',
    '__tests__/screens/staffCrewScreen.test.tsx',
    '__tests__/integration/staff-e2e.test.ts',
  ];

  section('Vérification des fichiers de test');
  
  let allFilesExist = true;
  testFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file} (manquant)`, 'red');
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

// Fonction pour analyser les arguments de ligne de commande
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    coverage: args.includes('--coverage') || args.includes('-c'),
    watch: args.includes('--watch') || args.includes('-w'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    updateSnapshots: args.includes('--updateSnapshot') || args.includes('-u'),
    specific: null,
  };

  // Chercher un test spécifique
  const testArg = args.find(arg => arg.startsWith('--test='));
  if (testArg) {
    options.specific = testArg.split('=')[1];
  }

  return options;
}

// Fonction pour générer le rapport de couverture
function generateCoverageReport() {
  section('Génération du rapport de couverture');
  
  const coverageDir = path.join(process.cwd(), 'coverage', 'staff');
  if (fs.existsSync(coverageDir)) {
    const htmlPath = path.join(coverageDir, 'index.html');
    if (fs.existsSync(htmlPath)) {
      log(`📊 Rapport HTML disponible: file://${htmlPath}`, 'cyan');
    }
  }
}

// Fonction pour afficher les statistiques de test
function displayTestStats() {
  section('Statistiques de la suite de tests Staff');
  
  const stats = {
    'Tests unitaires': {
      'Hook useStaff': '~25 tests',
      'Types Staff': '~20 tests',
    },
    'Tests de composants': {
      'InviteEmployeeModal': '~30 tests',
      'AddContractorModal': '~35 tests',
      'StaffCrewScreen': '~25 tests',
    },
    'Tests d\'intégration': {
      'E2E Staff System': '~15 tests',
    },
  };

  Object.entries(stats).forEach(([category, tests]) => {
    log(`\n📁 ${category}:`, 'magenta');
    Object.entries(tests).forEach(([test, count]) => {
      log(`  • ${test}: ${count}`, 'reset');
    });
  });

  log(`\n📈 Total estimé: ~150 tests`, 'bright');
}

// Fonction principale
function main() {
  banner('SUITE DE TESTS STAFF SYSTEM');
  
  const options = parseArgs();
  
  log('\n🚀 Démarrage de la suite de tests pour le système Staff', 'bright');
  log('Systèmes testés: Employés TFN + Prestataires ABN', 'yellow');
  
  // Vérifier les fichiers de test
  if (!checkTestFiles()) {
    log('\n❌ Certains fichiers de test sont manquants. Arrêt.', 'red');
    process.exit(1);
  }

  // Afficher les statistiques
  displayTestStats();

  // Construire la commande Jest
  let command = 'npx jest --config=jest.staff.config.js';
  
  if (options.coverage) {
    command += ' --coverage';
  }
  
  if (options.watch) {
    command += ' --watch';
  }
  
  if (options.verbose) {
    command += ' --verbose';
  }
  
  if (options.updateSnapshots) {
    command += ' --updateSnapshot';
  }
  
  if (options.specific) {
    command += ` --testNamePattern="${options.specific}"`;
  }

  // Exécuter les tests
  const success = runCommand(command, 'Exécution de la suite de tests Staff');
  
  if (success && options.coverage) {
    generateCoverageReport();
  }

  // Résumé final
  section('Résumé');
  if (success) {
    log('🎉 Tous les tests Staff sont passés avec succès!', 'green');
    log('\nCouverture testée:', 'bright');
    log('• Hook useStaff (gestion dual TFN/ABN)', 'reset');
    log('• Types TypeScript (Employee, Contractor)', 'reset');
    log('• Modal InviteEmployee (workflow email)', 'reset');
    log('• Modal AddContractor (recherche + statuts)', 'reset');
    log('• StaffCrewScreen (interface principale)', 'reset');
    log('• Tests E2E (workflows complets)', 'reset');
  } else {
    log('❌ Des tests ont échoué. Vérifiez les logs ci-dessus.', 'red');
    process.exit(1);
  }
}

// Point d'entrée
if (require.main === module) {
  main();
}