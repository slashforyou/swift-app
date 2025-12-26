/**
 * Job Workflow Test Suite
 * Tests automatisés pour le workflow complet d'un job
 * 
 * Usage: node test-job-workflow.js
 */

const readline = require('readline');

// Configuration
const CONFIG = {
  API_BASE_URL: process.env.API_URL || 'http://localhost:3000/api',
  AUTH_TOKEN: process.env.AUTH_TOKEN || '',
  TEST_MODE: true
};

// Couleurs pour console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper pour logs colorés
const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}━━━ ${msg} ━━━${colors.reset}\n`),
  step: (msg) => console.log(`${colors.yellow}▶${colors.reset} ${msg}`)
};

// État du test
const testState = {
  jobId: null,
  employeeId: null,
  clientId: null,
  startTime: null,
  stepTimes: [],
  photos: [],
  results: {
    passed: 0,
    failed: 0,
    errors: []
  }
};

// Helper pour appels API
async function apiCall(endpoint, method = 'GET', data = null) {
  const url = `${CONFIG.API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`
    }
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }
  
  try {
    log.info(`API Call: ${method} ${endpoint}`);
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (response.ok) {
      log.success(`Response: ${response.status} ${response.statusText}`);
      return { success: true, data: result, status: response.status };
    } else {
      log.error(`Response: ${response.status} ${response.statusText}`);
      return { success: false, error: result, status: response.status };
    }
  } catch (error) {
    log.error(`Network Error: ${error.message}`);
    return { success: false, error: error.message, status: 0 };
  }
}

// Helper pour attendre
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper pour saisie utilisateur
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Tests individuels
const tests = {
  
  /**
   * TEST 1: Création d'un job
   */
  async createJob() {
    log.header('TEST 1: Création d\'un Job');
    
    const jobData = {
      clientId: testState.clientId || 'test_client_001',
      templateId: 'template_plumbing_basic',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '14:00',
      location: {
        address: '123 Test Street, TestCity',
        coordinates: { lat: 48.8566, lon: 2.3522 }
      },
      estimatedDuration: 120,
      description: 'Test job - Réparation robinet cuisine'
    };
    
    log.step('Envoi de la requête de création...');
    const result = await apiCall('/jobs', 'POST', jobData);
    
    if (result.success && result.data.job) {
      testState.jobId = result.data.job.id;
      log.success(`Job créé avec succès: ${testState.jobId}`);
      log.info(`Code job: ${result.data.job.code || 'N/A'}`);
      log.info(`Statut: ${result.data.job.status}`);
      testState.results.passed++;
      return true;
    } else {
      log.error('Échec de création du job');
      log.error(JSON.stringify(result.error, null, 2));
      testState.results.failed++;
      testState.results.errors.push({
        test: 'createJob',
        error: result.error
      });
      return false;
    }
  },
  
  /**
   * TEST 2: Assignation du job à un employé
   */
  async assignJob() {
    log.header('TEST 2: Assignation du Job');
    
    if (!testState.jobId) {
      log.error('Aucun job ID disponible. Exécuter TEST 1 d\'abord.');
      testState.results.failed++;
      return false;
    }
    
    const employeeId = testState.employeeId || await prompt('Entrer Employee ID: ');
    testState.employeeId = employeeId;
    
    log.step(`Assignation du job ${testState.jobId} à l'employé ${employeeId}...`);
    const result = await apiCall(`/jobs/${testState.jobId}/assign`, 'PUT', {
      employeeId: employeeId
    });
    
    if (result.success) {
      log.success('Job assigné avec succès');
      log.info(`Statut: ${result.data.job?.status || 'N/A'}`);
      testState.results.passed++;
      return true;
    } else {
      log.error('Échec d\'assignation du job');
      log.error(JSON.stringify(result.error, null, 2));
      testState.results.failed++;
      testState.results.errors.push({
        test: 'assignJob',
        error: result.error
      });
      return false;
    }
  },
  
  /**
   * TEST 3: Récupération des détails du job
   */
  async getJobDetails() {
    log.header('TEST 3: Récupération Détails du Job');
    
    if (!testState.jobId) {
      log.error('Aucun job ID disponible.');
      testState.results.failed++;
      return false;
    }
    
    log.step(`Récupération job ${testState.jobId}...`);
    const result = await apiCall(`/jobs/${testState.jobId}`);
    
    if (result.success && result.data) {
      log.success('Détails récupérés avec succès');
      log.info(`Code: ${result.data.code || 'N/A'}`);
      log.info(`Statut: ${result.data.status}`);
      log.info(`Client: ${result.data.client?.name || 'N/A'}`);
      log.info(`Assigné à: ${result.data.assignedTo?.name || 'Non assigné'}`);
      log.info(`Steps total: ${result.data.steps?.length || 0}`);
      testState.results.passed++;
      return true;
    } else {
      log.error('Échec de récupération des détails');
      log.error(JSON.stringify(result.error, null, 2));
      testState.results.failed++;
      testState.results.errors.push({
        test: 'getJobDetails',
        error: result.error
      });
      return false;
    }
  },
  
  /**
   * TEST 4: Démarrage du job et timer
   */
  async startJob() {
    log.header('TEST 4: Démarrage du Job');
    
    if (!testState.jobId) {
      log.error('Aucun job ID disponible.');
      testState.results.failed++;
      return false;
    }
    
    log.step('Démarrage du job...');
    testState.startTime = Date.now();
    
    const result = await apiCall(`/jobs/${testState.jobId}/start`, 'POST');
    
    if (result.success) {
      log.success('Job démarré avec succès');
      log.info(`Statut: ${result.data.job?.status || 'N/A'}`);
      log.info(`Heure de démarrage: ${new Date(testState.startTime).toLocaleTimeString()}`);
      log.info(`Step actuel: ${result.data.job?.currentStep || 1}`);
      testState.results.passed++;
      
      // Simuler le timer
      log.step('Timer démarré...');
      await wait(2000);
      const elapsed = Math.floor((Date.now() - testState.startTime) / 1000);
      log.info(`Temps écoulé: ${elapsed}s`);
      
      return true;
    } else {
      log.error('Échec de démarrage du job');
      log.error(JSON.stringify(result.error, null, 2));
      testState.results.failed++;
      testState.results.errors.push({
        test: 'startJob',
        error: result.error
      });
      return false;
    }
  },
  
  /**
   * TEST 5: Progression vers step suivant
   */
  async nextStep(stepNumber = 2) {
    log.header(`TEST 5: Progression vers Step ${stepNumber}`);
    
    if (!testState.jobId) {
      log.error('Aucun job ID disponible.');
      testState.results.failed++;
      return false;
    }
    
    const stepTime = Math.floor((Date.now() - testState.startTime) / 1000);
    log.step(`Passage au step ${stepNumber} (temps step précédent: ${stepTime}s)...`);
    
    const result = await apiCall(`/jobs/${testState.jobId}/step`, 'PUT', {
      stepNumber: stepNumber,
      previousStepDuration: stepTime
    });
    
    if (result.success) {
      log.success(`Step ${stepNumber} activé`);
      testState.stepTimes.push({
        step: stepNumber - 1,
        duration: stepTime
      });
      testState.results.passed++;
      
      // Simuler travail sur le step
      log.step(`Travail sur step ${stepNumber}...`);
      await wait(2000);
      
      return true;
    } else {
      log.error(`Échec de progression vers step ${stepNumber}`);
      log.error(JSON.stringify(result.error, null, 2));
      testState.results.failed++;
      testState.results.errors.push({
        test: `nextStep${stepNumber}`,
        error: result.error
      });
      return false;
    }
  },
  
  /**
   * TEST 6: Pause du job
   */
  async pauseJob() {
    log.header('TEST 6: Pause du Job');
    
    if (!testState.jobId) {
      log.error('Aucun job ID disponible.');
      testState.results.failed++;
      return false;
    }
    
    const timeBeforePause = Math.floor((Date.now() - testState.startTime) / 1000);
    log.step(`Mise en pause (temps écoulé: ${timeBeforePause}s)...`);
    
    const result = await apiCall(`/jobs/${testState.jobId}/pause`, 'POST');
    
    if (result.success) {
      log.success('Job mis en pause');
      log.info(`Temps avant pause: ${timeBeforePause}s`);
      testState.results.passed++;
      
      // Simuler pause de 3 secondes
      log.step('Pause de 3 secondes...');
      await wait(3000);
      
      return true;
    } else {
      log.error('Échec de mise en pause');
      log.error(JSON.stringify(result.error, null, 2));
      testState.results.failed++;
      testState.results.errors.push({
        test: 'pauseJob',
        error: result.error
      });
      return false;
    }
  },
  
  /**
   * TEST 7: Reprise du job
   */
  async resumeJob() {
    log.header('TEST 7: Reprise du Job');
    
    if (!testState.jobId) {
      log.error('Aucun job ID disponible.');
      testState.results.failed++;
      return false;
    }
    
    log.step('Reprise du job...');
    const result = await apiCall(`/jobs/${testState.jobId}/resume`, 'POST');
    
    if (result.success) {
      log.success('Job repris avec succès');
      testState.results.passed++;
      
      // Timer reprend
      log.step('Timer reprend...');
      await wait(2000);
      const totalElapsed = Math.floor((Date.now() - testState.startTime) / 1000);
      log.info(`Temps total (incluant pause): ${totalElapsed}s`);
      
      return true;
    } else {
      log.error('Échec de reprise');
      log.error(JSON.stringify(result.error, null, 2));
      testState.results.failed++;
      testState.results.errors.push({
        test: 'resumeJob',
        error: result.error
      });
      return false;
    }
  },
  
  /**
   * TEST 8: Completion du job
   */
  async completeJob() {
    log.header('TEST 8: Completion du Job');
    
    if (!testState.jobId) {
      log.error('Aucun job ID disponible.');
      testState.results.failed++;
      return false;
    }
    
    const totalTime = Math.floor((Date.now() - testState.startTime) / 1000);
    log.step(`Completion du job (temps total: ${totalTime}s)...`);
    
    const result = await apiCall(`/jobs/${testState.jobId}/complete`, 'POST', {
      totalDuration: totalTime,
      stepDurations: testState.stepTimes
    });
    
    if (result.success) {
      log.success('Job complété avec succès');
      log.info(`Statut final: ${result.data.job?.status || 'N/A'}`);
      log.info(`Temps total: ${totalTime}s (${Math.floor(totalTime / 60)}min)`);
      log.info(`Steps completés: ${testState.stepTimes.length}`);
      testState.results.passed++;
      return true;
    } else {
      log.error('Échec de completion du job');
      log.error(JSON.stringify(result.error, null, 2));
      testState.results.failed++;
      testState.results.errors.push({
        test: 'completeJob',
        error: result.error
      });
      return false;
    }
  }
};

// Exécution des tests
async function runTests() {
  log.header('🧪 JOB WORKFLOW TEST SUITE');
  log.info(`API Base URL: ${CONFIG.API_BASE_URL}`);
  log.info(`Test Mode: ${CONFIG.TEST_MODE ? 'ON' : 'OFF'}`);
  log.info(`Date: ${new Date().toLocaleString()}`);
  
  // Vérifier token
  if (!CONFIG.AUTH_TOKEN) {
    log.warning('Aucun token d\'authentification. Certains tests peuvent échouer.');
    const proceed = await prompt('Continuer quand même? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      log.info('Tests annulés.');
      return;
    }
  }
  
  // Workflow complet
  try {
    // 1. Création job
    await tests.createJob();
    await wait(1000);
    
    // 2. Assignation
    await tests.assignJob();
    await wait(1000);
    
    // 3. Récupération détails
    await tests.getJobDetails();
    await wait(1000);
    
    // 4. Démarrage
    await tests.startJob();
    await wait(1000);
    
    // 5. Progression steps
    await tests.nextStep(2);
    await wait(1000);
    await tests.nextStep(3);
    await wait(1000);
    
    // 6. Pause
    await tests.pauseJob();
    await wait(1000);
    
    // 7. Resume
    await tests.resumeJob();
    await wait(1000);
    
    // 8. Completion
    await tests.completeJob();
    
  } catch (error) {
    log.error(`Erreur lors de l'exécution des tests: ${error.message}`);
    testState.results.errors.push({
      test: 'global',
      error: error.message
    });
  }
  
  // Résultats finaux
  printResults();
}

// Affichage des résultats
function printResults() {
  log.header('📊 RÉSULTATS DES TESTS');
  
  const total = testState.results.passed + testState.results.failed;
  const successRate = total > 0 ? ((testState.results.passed / total) * 100).toFixed(1) : 0;
  
  console.log(`Total tests: ${total}`);
  console.log(`${colors.green}✓ Réussis: ${testState.results.passed}${colors.reset}`);
  console.log(`${colors.red}✗ Échoués: ${testState.results.failed}${colors.reset}`);
  console.log(`${colors.blue}Taux de réussite: ${successRate}%${colors.reset}`);
  
  if (testState.results.errors.length > 0) {
    log.header('🐛 ERREURS DÉTECTÉES');
    testState.results.errors.forEach((err, idx) => {
      console.log(`\n${idx + 1}. Test: ${err.test}`);
      console.log(`   Erreur: ${JSON.stringify(err.error, null, 2)}`);
    });
  }
  
  if (testState.jobId) {
    log.header('📋 INFORMATIONS DU JOB TESTÉ');
    console.log(`Job ID: ${testState.jobId}`);
    console.log(`Temps total: ${testState.startTime ? Math.floor((Date.now() - testState.startTime) / 1000) : 0}s`);
    console.log(`Steps complétés: ${testState.stepTimes.length}`);
  }
  
  // Status final
  if (successRate >= 95) {
    log.success(`\n🎉 TESTS RÉUSSIS - Taux de succès: ${successRate}%`);
  } else if (successRate >= 80) {
    log.warning(`\n⚠️  TESTS PARTIELLEMENT RÉUSSIS - Taux de succès: ${successRate}%`);
  } else {
    log.error(`\n❌ TESTS ÉCHOUÉS - Taux de succès: ${successRate}%`);
  }
}

// Point d'entrée
if (require.main === module) {
  runTests().catch((error) => {
    log.error(`Erreur fatale: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runTests, tests, testState };
