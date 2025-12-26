/**
 * Script de test pour le système Analytics/Monitoring
 * Exécute tous les tests et génère un rapport complet
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Swift App - Analytics & Monitoring Test Suite');
console.log('================================================');
console.log('');

// Configuration des tests
const testConfig = {
  testTimeout: 30000,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage/analytics',
  coverageReporters: ['text', 'html', 'json'],
  testMatch: [
    '**/__tests__/services/analytics.test.ts',
    '**/__tests__/services/logger.test.ts', 
    '**/__tests__/services/alertService.test.ts',
    '**/__tests__/integration/analytics-monitoring.test.ts'
  ]
};

// Fonction pour exécuter une commande avec gestion d'erreur
function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log(`✅ ${description} - SUCCESS`);
    return { success: true, output };
  } catch (error) {
    console.log(`❌ ${description} - FAILED`);
    console.error(error.stdout || error.message);
    return { success: false, error: error.stdout || error.message };
  }
}

// Fonction pour créer un rapport de test
function generateTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      passRate: (results.filter(r => r.success).length / results.length * 100).toFixed(2)
    },
    details: results
  };

  const reportPath = path.join(process.cwd(), 'test-results', 'analytics-test-report.json');
  
  // Créer le dossier si nécessaire
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  return report;
}

async function runTestSuite() {
  const results = [];
  
  console.log('📋 Tests Planned:');
  console.log('  • Analytics Service Tests');
  console.log('  • Logger Service Tests');  
  console.log('  • Alert Service Tests');
  console.log('  • Integration Tests');
  console.log('');

  // 1. Test Analytics Service
  results.push(
    runCommand(
      'npm test __tests__/services/analytics.test.ts -- --verbose',
      'Analytics Service Tests'
    )
  );

  // 2. Test Logger Service
  results.push(
    runCommand(
      'npm test __tests__/services/logger.test.ts -- --verbose', 
      'Logger Service Tests'
    )
  );

  // 3. Test Alert Service
  results.push(
    runCommand(
      'npm test __tests__/services/alertService.test.ts -- --verbose',
      'Alert Service Tests'
    )
  );

  // 4. Test Integration
  results.push(
    runCommand(
      'npm test __tests__/integration/analytics-monitoring.test.ts -- --verbose',
      'Integration Tests'
    )
  );

  // 5. Test Coverage
  results.push(
    runCommand(
      'npm test -- --coverage --coverageDirectory=coverage/analytics --testPathPattern="analytics|logger|alertService"',
      'Code Coverage Analysis'
    )
  );

  // 6. Lint Check
  results.push(
    runCommand(
      'npm run lint src/services/analytics.ts src/services/logger.ts src/services/alertService.ts',
      'Code Quality Check'
    )
  );

  console.log('');
  console.log('📊 Test Summary');
  console.log('===============');

  const report = generateTestReport(results);
  
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`✅ Passed: ${report.summary.passed}`);
  console.log(`❌ Failed: ${report.summary.failed}`);
  console.log(`📈 Pass Rate: ${report.summary.passRate}%`);

  if (report.summary.failed > 0) {
    console.log('');
    console.log('❌ Failed Tests:');
    results.forEach((result, index) => {
      if (!result.success) {
        console.log(`  ${index + 1}. ${result.description}`);
        console.log(`     Error: ${result.error.split('\\n')[0]}`);
      }
    });
  }

  console.log('');
  console.log(`📄 Detailed report saved to: test-results/analytics-test-report.json`);

  return report.summary.failed === 0;
}

// Fonction pour valider la configuration avant les tests
function validateTestEnvironment() {
  console.log('🔍 Validating test environment...');
  
  // Vérifier que Jest est installé
  try {
    execSync('npm list jest', { stdio: 'pipe' });
    console.log('✅ Jest is installed');
  } catch (error) {
    console.log('❌ Jest is not installed. Run: npm install --save-dev jest');
    return false;
  }

  // Vérifier que TypeScript est installé
  try {
    execSync('npm list typescript', { stdio: 'pipe' });
    console.log('✅ TypeScript is installed');
  } catch (error) {
    console.log('❌ TypeScript is not installed. Run: npm install --save-dev typescript');
    return false;
  }

  // Vérifier que les fichiers de test existent
  const testFiles = [
    '__tests__/services/analytics.test.ts',
    '__tests__/services/logger.test.ts',
    '__tests__/services/alertService.test.ts',
    '__tests__/integration/analytics-monitoring.test.ts'
  ];

  let allFilesExist = true;
  testFiles.forEach(file => {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

// Fonction pour nettoyer après les tests
function cleanup() {
  console.log('🧹 Cleaning up test artifacts...');
  
  // Nettoyer les mocks si nécessaire
  try {
    if (fs.existsSync('coverage/analytics')) {
      console.log('✅ Coverage report generated in coverage/analytics/');
    }
  } catch (error) {
    console.log('⚠️  Cleanup warning:', error.message);
  }
}

// Exécution principale
async function main() {
  try {
    // Validation de l'environnement
    if (!validateTestEnvironment()) {
      process.exit(1);
    }

    console.log('✅ Environment validation passed');
    console.log('');

    // Exécution des tests
    const success = await runTestSuite();

    // Nettoyage
    cleanup();

    // Code de sortie
    if (success) {
      console.log('');
      console.log('🎉 All tests passed! Analytics & Monitoring system is ready.');
      console.log('   Ready for integration into the main application.');
      process.exit(0);
    } else {
      console.log('');
      console.log('💥 Some tests failed. Please review and fix issues before integration.');
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Test suite execution failed:', error.message);
    process.exit(1);
  }
}

// Gestion des signaux pour cleanup
process.on('SIGINT', () => {
  console.log('\\n🛑 Test suite interrupted by user');
  cleanup();
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\\n🛑 Test suite terminated');
  cleanup(); 
  process.exit(1);
});

// Exécution
if (require.main === module) {
  main();
}

module.exports = {
  runTestSuite,
  validateTestEnvironment,
  generateTestReport
};