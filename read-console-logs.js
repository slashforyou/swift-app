// Script Node.js pour lire les logs console de l'application
// Usage: node read-console-logs.js [options]

const fs = require('fs');
const path = require('path');

// Configuration par défaut
const config = {
  lines: 100,
  tail: false,
  filter: '',
  level: '',
  clear: false,
  help: false
};

// Couleurs ANSI pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

const levelColors = {
  'ERROR': colors.red,
  'WARN': colors.yellow,
  'INFO': colors.cyan,
  'LOG': colors.white,
  'DEBUG': colors.gray
};

// Fonction d'aide
function showHelp() {
  console.log(`${colors.green}Usage: node read-console-logs.js [options]${colors.reset}`);
  console.log('');
  console.log(`${colors.yellow}Options:${colors.reset}`);
  console.log(`${colors.gray}  --tail              Afficher les logs en temps réel (CTRL+C pour arrêter)${colors.reset}`);
  console.log(`${colors.gray}  --lines <number>    Nombre de dernières lignes à afficher (défaut: 100)${colors.reset}`);
  console.log(`${colors.gray}  --filter <text>     Filtrer les logs contenant ce texte${colors.reset}`);
  console.log(`${colors.gray}  --level <level>     Filtrer par niveau: ERROR, WARN, INFO, LOG, DEBUG${colors.reset}`);
  console.log(`${colors.gray}  --clear             Effacer le fichier de logs${colors.reset}`);
  console.log(`${colors.gray}  --help              Afficher cette aide${colors.reset}`);
  console.log('');
  console.log(`${colors.yellow}Exemples:${colors.reset}`);
  console.log(`${colors.gray}  node read-console-logs.js                    # Afficher les 100 dernières lignes${colors.reset}`);
  console.log(`${colors.gray}  node read-console-logs.js --tail             # Mode temps réel${colors.reset}`);
  console.log(`${colors.gray}  node read-console-logs.js --lines 50         # 50 dernières lignes${colors.reset}`);
  console.log(`${colors.gray}  node read-console-logs.js --filter Error     # Filtrer les erreurs${colors.reset}`);
  console.log(`${colors.gray}  node read-console-logs.js --level ERROR      # Seulement les ERRORs${colors.reset}`);
  console.log(`${colors.gray}  node read-console-logs.js --clear            # Effacer les logs${colors.reset}`);
  process.exit(0);
}

// Parser les arguments de ligne de commande
function parseArgs() {
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
        config.help = true;
        break;
      case '--tail':
        config.tail = true;
        break;
      case '--clear':
        config.clear = true;
        break;
      case '--lines':
        config.lines = parseInt(args[++i]) || 100;
        break;
      case '--filter':
        config.filter = args[++i] || '';
        break;
      case '--level':
        config.level = args[++i] || '';
        break;
      default:
        console.log(`${colors.red}Argument inconnu: ${args[i]}${colors.reset}`);
        console.log(`Utilisez --help pour voir les options disponibles.`);
        process.exit(1);
    }
  }
}

// Fonction pour coloriser une ligne de log
function colorizeLog(line) {
  const match = line.match(/\[([^\]]+)\] \[([^\]]+)\] (.+)/);
  
  if (match) {
    const [, timestamp, level, message] = match;
    const color = levelColors[level] || colors.white;
    
    return `${colors.gray}[${timestamp}]${colors.reset} ${color}[${level}]${colors.reset} ${colors.white}${message}${colors.reset}`;
  }
  
  return `${colors.gray}${line}${colors.reset}`;
}

// Fonction pour tester les filtres
function testLineFilter(line) {
  // Filtrer par contenu si spécifié
  if (config.filter && !line.includes(config.filter)) {
    return false;
  }
  
  // Filtrer par niveau si spécifié
  if (config.level && !line.includes(`[${config.level}]`)) {
    return false;
  }
  
  return true;
}

// Fonction pour obtenir le chemin du fichier de logs
async function getLogPath() {
  // Chemin par défaut (local)
  const defaultPath = './app-console-logs.txt';
  
  // TODO: Intégrer avec l'API Copilot si disponible pour obtenir le vrai chemin
  return defaultPath;
}

// Fonction pour lire les logs
async function readLogs() {
  try {
    const logPath = await getLogPath();
    
    if (config.clear) {
      if (fs.existsSync(logPath)) {
        fs.unlinkSync(logPath);
        console.log(`${colors.green}Fichier de logs effacé: ${logPath}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}Aucun fichier de logs à effacer.${colors.reset}`);
      }
      process.exit(0);
    }
    
    if (!fs.existsSync(logPath)) {
      console.log(`${colors.red}Fichier de logs introuvable: ${logPath}${colors.reset}`);
      console.log(`${colors.yellow}Assurez-vous que l'application est démarrée et génère des logs.${colors.reset}`);
      console.log('');
      console.log(`${colors.cyan}Note: Le fichier de logs sera créé dans le répertoire Documents de l'application Expo.${colors.reset}`);
      console.log(`${colors.cyan}Chemin approximatif: ExpoApp/Documents/app-console-logs.txt${colors.reset}`);
      process.exit(1);
    }
    
    console.log(`${colors.green}=== Swift App Console Logs ===${colors.reset}`);
    console.log(`${colors.cyan}Fichier: ${logPath}${colors.reset}`);
    
    if (config.filter) {
      console.log(`${colors.yellow}Filtre de contenu: ${config.filter}${colors.reset}`);
    }
    
    if (config.level) {
      console.log(`${colors.yellow}Filtre de niveau: ${config.level}${colors.reset}`);
    }
    
    console.log(`${colors.gray}----------------------------------------${colors.reset}`);
    
    if (config.tail) {
      console.log(`${colors.yellow}Mode temps réel activé (CTRL+C pour arrêter)...${colors.reset}`);
      console.log('');
      
      // Afficher d'abord les dernières lignes existantes
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n').slice(-config.lines);
      
      for (const line of lines) {
        if (line.trim() && testLineFilter(line)) {
          console.log(colorizeLog(line));
        }
      }
      
      // Puis surveiller les nouvelles lignes
      let lastSize = fs.statSync(logPath).size;
      
      setInterval(() => {
        const currentSize = fs.statSync(logPath).size;
        if (currentSize > lastSize) {
          const newContent = fs.readFileSync(logPath, 'utf8', { start: lastSize });
          const newLines = newContent.split('\n');
          
          for (const line of newLines) {
            if (line.trim() && testLineFilter(line)) {
              console.log(colorizeLog(line));
            }
          }
          
          lastSize = currentSize;
        }
      }, 100); // Vérifier toutes les 100ms
      
    } else {
      // Affichage statique
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n').slice(-config.lines);
      
      const filteredLines = lines.filter(line => line.trim() && testLineFilter(line));
      
      if (filteredLines.length === 0) {
        console.log(`${colors.yellow}Aucune ligne trouvée avec les filtres spécifiés.${colors.reset}`);
      } else {
        for (const line of filteredLines) {
          console.log(colorizeLog(line));
        }
        
        console.log(`${colors.gray}----------------------------------------${colors.reset}`);
        console.log(`${colors.green}Affichées: ${filteredLines.length} lignes sur ${lines.length} total${colors.reset}`);
      }
    }
    
  } catch (error) {
    console.log(`${colors.red}Erreur lors de la lecture des logs: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Point d'entrée principal
function main() {
  parseArgs();
  
  if (config.help) {
    showHelp();
  }
  
  readLogs();
}

// Gestion des signaux pour arrêter proprement en mode tail
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Arrêt du monitoring des logs...${colors.reset}`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n${colors.yellow}Arrêt du monitoring des logs...${colors.reset}`);
  process.exit(0);
});

main();