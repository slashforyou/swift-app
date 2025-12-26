/**
 * Script de test pour l'API updateJobStep
 * Lance tous les endpoints et payloads possibles pour identifier le bon format
 */

const testJobStepUpdate = async () => {
  console.log('🧪 [TEST SCRIPT] =================================');
  console.log('🧪 [TEST SCRIPT] TESTING JOB STEP UPDATE API');
  console.log('🧪 [TEST SCRIPT] =================================');

  // Import nécessaires pour React Native
  const { updateJobStep } = require('./src/services/jobSteps');
  
  // ID de test - nous allons utiliser un ID fictif pour le moment
  const testJobId = '123'; // ID de test
  const testTargetStep = 2;
  const testNotes = 'Test API call from script';

  try {
    console.log('🚀 [TEST SCRIPT] Calling updateJobStep with test data...');
    console.log('📋 [TEST SCRIPT] Test parameters:', {
      jobId: testJobId,
      targetStep: testTargetStep,
      notes: testNotes
    });

    await updateJobStep(testJobId, testTargetStep, testNotes);
    
    console.log('✅ [TEST SCRIPT] Test completed! Check logs above for results.');
  } catch (error) {
    console.error('❌ [TEST SCRIPT] Test failed:', error);
  }

  console.log('🏁 [TEST SCRIPT] Test script finished.');
};

// Export pour utilisation
module.exports = { testJobStepUpdate };

// Si exécuté directement
if (require.main === module) {
  testJobStepUpdate();
}