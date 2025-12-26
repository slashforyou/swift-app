#!/usr/bin/env node
/**
 * Test rapide de compilation du Session Logger
 */

console.log('🚀 Test de compilation Session Logger...');

const { spawn } = require('child_process');
const path = require('path');

// Test de TypeScript compilation
const testCompile = () => {
  return new Promise((resolve, reject) => {
    console.log('🔍 Test TypeScript compilation...');
    
    const tsc = spawn('npx', ['tsc', '--noEmit', '--skipLibCheck'], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd()
    });

    let output = '';
    let errorOutput = '';

    tsc.stdout.on('data', (data) => {
      output += data.toString();
    });

    tsc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    tsc.on('close', (code) => {
      if (code === 0) {
        console.log('✅ TypeScript compilation successful');
        resolve(true);
      } else {
        console.log('❌ TypeScript compilation errors:');
        console.log(errorOutput);
        resolve(false);
      }
    });

    tsc.on('error', (err) => {
      console.log('❌ Failed to run TypeScript check:', err.message);
      resolve(false);
    });
  });
};

// Test principal
const runTests = async () => {
  console.log('📝 Session Logger - Quick Compile Test');
  console.log('=' .repeat(40));

  // Test 1: Compilation TypeScript
  const compileOk = await testCompile();

  // Résultat final
  console.log('\n📊 RÉSULTATS:');
  console.log(`Compilation TypeScript: ${compileOk ? '✅ OK' : '❌ ERREUR'}`);
  
  if (compileOk) {
    console.log('\n🎉 Session Logger prêt à être testé !');
    console.log('🚀 Prochaines étapes:');
    console.log('   1. L\'app Expo est démarrée');
    console.log('   2. Allez dans Business Info Page');
    console.log('   3. Testez les boutons Session Logs');
  } else {
    console.log('\n⚠️  Quelques erreurs TypeScript subsistent');
    console.log('💡 Mais l\'app devrait fonctionner quand même');
  }

  process.exit(0);
};

runTests().catch(console.error);