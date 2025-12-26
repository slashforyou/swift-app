/**
 * 🔍 SCRIPT DE VÉRIFICATION - INTERCEPTION CONSOLE.ERROR
 * 
 * Objectif: Détecter si plusieurs fichiers interceptent console.error
 * Problème: Double/triple interception → boucle infinie
 * 
 * Usage: node verify-console-interception.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Recherche des interceptions de console.error...\n');

// Fichiers à vérifier
const filesToCheck = [
  'src/services/logger.ts',
  'src/services/sessionLogger.ts',
  'src/services/simpleSessionLogger.ts',
  'src/services/analytics.ts',
  'src/utils/crashLogger.ts',
];

const results = [];
let totalInterceptions = 0;

filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Fichier non trouvé: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  
  // Rechercher les patterns d'interception
  const patterns = [
    /console\.error\s*=\s*\(/g,
    /console\['error'\]\s*=/g,
    /console\["error"\]\s*=/g,
  ];

  let interceptionsFound = 0;
  const lines = content.split('\n');
  
  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(() => {
        // Trouver la ligne exacte
        lines.forEach((line, index) => {
          if (pattern.test(line) && !line.trim().startsWith('//')) {
            interceptionsFound++;
            totalInterceptions++;
            results.push({
              file: filePath,
              line: index + 1,
              code: line.trim(),
              active: !line.includes('❌') && !line.includes('DÉSACTIVÉ')
            });
          }
        });
      });
    }
  });
});

// Affichage des résultats
console.log('📊 RÉSULTATS:\n');

if (results.length === 0) {
  console.log('✅ Aucune interception de console.error détectée');
  console.log('⚠️  ATTENTION: Cela peut indiquer un problème si logger.ts devrait intercepter');
} else {
  console.log(`🔴 ${results.length} interception(s) trouvée(s):\n`);
  
  const activeInterceptions = results.filter(r => r.active);
  const inactiveInterceptions = results.filter(r => !r.active);
  
  // Interceptions actives
  if (activeInterceptions.length > 0) {
    console.log(`🟢 Interceptions ACTIVES (${activeInterceptions.length}):`);
    activeInterceptions.forEach(r => {
      console.log(`   📄 ${r.file}:${r.line}`);
      console.log(`      ${r.code}`);
    });
    console.log('');
  }
  
  // Interceptions désactivées
  if (inactiveInterceptions.length > 0) {
    console.log(`⚪ Interceptions DÉSACTIVÉES (${inactiveInterceptions.length}):`);
    inactiveInterceptions.forEach(r => {
      console.log(`   📄 ${r.file}:${r.line}`);
      console.log(`      ${r.code.substring(0, 80)}...`);
    });
    console.log('');
  }
}

// Verdict final
console.log('\n═══════════════════════════════════════════════');
console.log('🎯 VERDICT:');
console.log('═══════════════════════════════════════════════\n');

const activeCount = results.filter(r => r.active).length;

if (activeCount === 0) {
  console.log('❌ PROBLÈME: Aucune interception active');
  console.log('   → L\'app ne capturera pas les erreurs console');
  console.log('   → Vérifier que logger.ts intercepte bien console.error');
} else if (activeCount === 1) {
  console.log('✅ PARFAIT: 1 seule interception active');
  console.log('   → Pas de risque de boucle infinie');
  console.log('   → Configuration recommandée');
  
  const activeFile = results.find(r => r.active).file;
  console.log(`   → Fichier actif: ${activeFile}`);
  
  if (activeFile !== 'src/services/logger.ts') {
    console.log('\n⚠️  ATTENTION: L\'interception active n\'est PAS dans logger.ts');
    console.log('   → Recommandation: logger.ts devrait être le seul intercepteur');
  }
} else {
  console.log(`🔴 DANGER: ${activeCount} interceptions actives`);
  console.log('   → RISQUE ÉLEVÉ de boucle infinie');
  console.log('   → Désactiver toutes sauf logger.ts');
  console.log('\n   Fichiers à corriger:');
  results.filter(r => r.active).forEach(r => {
    console.log(`   - ${r.file}:${r.line}`);
  });
}

console.log('\n═══════════════════════════════════════════════\n');

// Code de sortie
process.exit(activeCount === 1 ? 0 : 1);
