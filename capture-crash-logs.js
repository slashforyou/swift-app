/**
 * Script pour capturer et sauvegarder les logs longs dans un fichier
 * Usage: node capture-crash-logs.js
 */

const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Configuration
const LOG_DIR = './crash-logs';
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB max

// Créer le dossier de logs s'il n'existe pas
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
  console.log(`📁 Dossier créé: ${LOG_DIR}`);
}

// Générer nom de fichier avec timestamp
function getLogFileName() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return path.join(LOG_DIR, `crash-log-${timestamp}.txt`);
}

// Capturer les logs Metro bundler
function captureMetroLogs() {
  const logFile = getLogFileName();
  console.log(`📝 Capture des logs Metro dans: ${logFile}`);
  
  const metro = exec('npx react-native start');
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  metro.stdout.on('data', (data) => {
    process.stdout.write(data);
    logStream.write(data);
  });
  
  metro.stderr.on('data', (data) => {
    process.stderr.write(data);
    logStream.write(`[ERROR] ${data}`);
  });
  
  metro.on('close', (code) => {
    logStream.end();
    console.log(`\n✅ Logs sauvegardés dans: ${logFile}`);
    console.log(`📊 Taille du fichier: ${fs.statSync(logFile).size} bytes`);
  });
  
  // Gérer Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Arrêt de la capture...');
    metro.kill();
    logStream.end();
    process.exit();
  });
}

// Capturer les logs Android (logcat)
function captureAndroidLogs() {
  const logFile = getLogFileName().replace('.txt', '-android.txt');
  console.log(`📱 Capture des logs Android dans: ${logFile}`);
  
  const logcat = exec('adb logcat -v time');
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  logcat.stdout.on('data', (data) => {
    // Filtrer seulement les erreurs et warnings
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.includes(' E ') || line.includes(' W ') || line.includes('FATAL')) {
        process.stdout.write(line + '\n');
        logStream.write(line + '\n');
      }
    });
  });
  
  logcat.stderr.on('data', (data) => {
    logStream.write(`[ERROR] ${data}`);
  });
  
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Arrêt de la capture Android...');
    logcat.kill();
    logStream.end();
    process.exit();
  });
}

// Analyser un fichier de log existant
function analyzeLogs(filePath) {
  console.log(`🔍 Analyse du fichier: ${filePath}\n`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier non trouvé: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Extraire les erreurs
  const errors = [];
  const warnings = [];
  let currentError = null;
  
  lines.forEach((line, index) => {
    // Détecter les erreurs
    if (line.includes('Error:') || line.includes('ERROR') || line.includes('FATAL')) {
      if (currentError) {
        errors.push(currentError);
      }
      currentError = {
        line: index + 1,
        message: line,
        stackTrace: []
      };
    } else if (currentError && (line.trim().startsWith('at ') || line.includes('.tsx') || line.includes('.ts'))) {
      currentError.stackTrace.push(line.trim());
    } else if (currentError && line.trim() === '') {
      errors.push(currentError);
      currentError = null;
    }
    
    // Détecter les warnings
    if (line.includes('Warning:') || line.includes('WARN')) {
      warnings.push({
        line: index + 1,
        message: line
      });
    }
  });
  
  if (currentError) {
    errors.push(currentError);
  }
  
  // Afficher le résumé
  console.log(`📊 RÉSUMÉ D'ANALYSE`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Total lignes: ${lines.length}`);
  console.log(`Erreurs trouvées: ${errors.length}`);
  console.log(`Warnings trouvés: ${warnings.length}`);
  console.log(`Taille fichier: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB\n`);
  
  // Afficher les erreurs
  if (errors.length > 0) {
    console.log(`🔴 ERREURS DÉTECTÉES:\n`);
    errors.slice(0, 5).forEach((error, idx) => {
      console.log(`${idx + 1}. Ligne ${error.line}:`);
      console.log(`   ${error.message}`);
      if (error.stackTrace.length > 0) {
        console.log(`   Stack trace (${error.stackTrace.length} lignes):`);
        error.stackTrace.slice(0, 3).forEach(trace => {
          console.log(`   ${trace}`);
        });
      }
      console.log();
    });
    
    if (errors.length > 5) {
      console.log(`   ... et ${errors.length - 5} autres erreurs\n`);
    }
  }
  
  // Créer un rapport condensé
  const reportFile = filePath.replace('.txt', '-REPORT.txt');
  let report = `RAPPORT D'ANALYSE - ${new Date().toLocaleString()}\n`;
  report += `═══════════════════════════════════════════════════\n\n`;
  report += `Fichier source: ${filePath}\n`;
  report += `Total lignes: ${lines.length}\n`;
  report += `Erreurs: ${errors.length}\n`;
  report += `Warnings: ${warnings.length}\n\n`;
  
  report += `ERREURS PRINCIPALES:\n`;
  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  errors.forEach((error, idx) => {
    report += `${idx + 1}. Ligne ${error.line}\n`;
    report += `${error.message}\n`;
    if (error.stackTrace.length > 0) {
      report += `Stack trace:\n`;
      error.stackTrace.forEach(trace => {
        report += `  ${trace}\n`;
      });
    }
    report += `\n`;
  });
  
  fs.writeFileSync(reportFile, report);
  console.log(`✅ Rapport condensé créé: ${reportFile}\n`);
}

// Menu principal
function showMenu() {
  console.log(`
╔═══════════════════════════════════════════════════╗
║     🔍 CAPTURE ET ANALYSE DE LOGS - SWIFTAPP     ║
╚═══════════════════════════════════════════════════╝

Options disponibles:

1. Capturer logs Metro (React Native)
2. Capturer logs Android (logcat)
3. Analyser un fichier de log existant
4. Quitter

`);
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Choisir une option (1-4): ', (answer) => {
    readline.close();
    
    switch (answer.trim()) {
      case '1':
        captureMetroLogs();
        break;
      case '2':
        captureAndroidLogs();
        break;
      case '3':
        const rl2 = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        rl2.question('Chemin du fichier de log: ', (filePath) => {
          rl2.close();
          analyzeLogs(filePath.trim());
        });
        break;
      case '4':
        console.log('👋 Au revoir!');
        process.exit(0);
      default:
        console.log('❌ Option invalide');
        showMenu();
    }
  });
}

// Point d'entrée
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Mode ligne de commande
    if (args[0] === 'analyze') {
      analyzeLogs(args[1] || './crash-logs/latest.txt');
    } else if (args[0] === 'metro') {
      captureMetroLogs();
    } else if (args[0] === 'android') {
      captureAndroidLogs();
    } else {
      console.log('Usage: node capture-crash-logs.js [metro|android|analyze <file>]');
    }
  } else {
    // Mode interactif
    showMenu();
  }
}

module.exports = { captureMetroLogs, captureAndroidLogs, analyzeLogs };
