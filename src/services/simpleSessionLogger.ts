// src/services/simpleSessionLogger.ts
import { Platform } from 'react-native';

interface LogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  data?: any;
  context?: string;
}

class SimpleSessionLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 500; // Réduction de la limite pour éviter les problèmes de mémoire
  private fileBuffer: string[] = [];

  constructor() {
    this.clearLogs();
    this.logInfo('SwiftApp Session Started', 'session-start');
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
        
    // Garder seulement les N derniers logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Formater le log pour le buffer fichier
    let fileLine = `${entry.timestamp} [${entry.level.padEnd(5)}] ${entry.message}`;
    if (entry.context) {
      fileLine += ` (${entry.context})`;
    }
    if (entry.data) {
      fileLine += ` | Data: ${JSON.stringify(entry.data)}`;
    }

    // Ajouter au buffer fichier
    this.fileBuffer.push(fileLine);
    if (this.fileBuffer.length > this.maxLogs) {
      this.fileBuffer = this.fileBuffer.slice(-this.maxLogs);
    }

    // Log également dans la console
    const consoleMsg = `${entry.timestamp} [${entry.level}] ${entry.message}`;
    switch (entry.level) {
      case 'ERROR':
        console.error(consoleMsg, entry.data);
        break;
      case 'WARN':
        console.warn(consoleMsg, entry.data);
        break;
      case 'INFO':
        // TEMP_DISABLED: console.log(consoleMsg, entry.data);
        break;
      case 'DEBUG':
        if (__DEV__) // TEMP_DISABLED: console.log(consoleMsg, entry.data);
        break;
    }
  }

  // API publique
  logError(message: string, error?: any, context?: string) {
    this.addLog({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      data: error,
      context
    });
  }

  logWarning(message: string, context?: string) {
    this.addLog({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      context
    });
  }

  logInfo(message: string, context?: string) {
    this.addLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      context
    });
  }

  logDebug(message: string, data?: any, context?: string) {
    if (!__DEV__) return;

    this.addLog({
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message,
      data,
      context
    });
  }

  // Obtenir tous les logs
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Obtenir logs formatés pour affichage
  getFormattedLogs(): string {
    const header = `
=================================================================
🚀 SWIFT APP - SESSION LOG (Simple Memory)
=================================================================
📅 Session Started: ${this.logs[0]?.timestamp || 'Unknown'}
🏗️ Platform: ${Platform.OS} ${Platform.Version}
🔧 Environment: ${__DEV__ ? 'Development' : 'Production'}
📝 Total Logs: ${this.logs.length}
=================================================================

`;

    const logLines = this.logs.map(log => {
      let line = `${log.timestamp} [${log.level.padEnd(5)}] ${log.message}`;
      if (log.context) {
        line += ` (${log.context})`;
      }
      if (log.data) {
        line += `\n  Data: ${JSON.stringify(log.data, null, 2)}`;
      }
      return line;
    }).join('\n');

    return header + logLines;
  }

  // Effacer les logs
  clearLogs() {
    this.logs = [];
  }

  // Obtenir une page de logs
  getLogPage(page: number = 1, pageSize: number = 20) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      logs: this.logs.slice(start, end),
      totalPages: Math.ceil(this.logs.length / pageSize),
      currentPage: page,
      total: this.logs.length
    };
  }

  // Filtrer les logs
  filterLogs(level?: string, context?: string, searchTerm?: string) {
    let filtered = [...this.logs];
    
    if (level && level !== 'ALL') {
      filtered = filtered.filter(log => log.level === level);
    }
    
    if (context && context !== 'ALL') {
      filtered = filtered.filter(log => log.context === context);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(term) ||
        (log.context && log.context.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  }

  // Obtenir les statistiques
  getStats() {
    const stats = {
      total: this.logs.length,
      error: this.logs.filter(l => l.level === 'ERROR').length,
      warn: this.logs.filter(l => l.level === 'WARN').length,
      info: this.logs.filter(l => l.level === 'INFO').length,
      debug: this.logs.filter(l => l.level === 'DEBUG').length,
      contexts: [...new Set(this.logs.map(l => l.context).filter(Boolean))]
    };
    return stats;
  }

  // Obtenir le chemin du fichier de logs (pour info)
  getLogFilePath() {
    return 'swiftapp-logs.txt (in memory buffer)';
  }

  // Obtenir le contenu des logs comme si c'était un fichier
  getFileContent() {
    const header = `=== SWIFTAPP SESSION LOGS ===
📅 Generated: ${new Date().toISOString()}
🏗️ Platform: ${Platform.OS} ${Platform.Version}
🔧 Environment: ${__DEV__ ? 'Development' : 'Production'}
📝 Total Logs: ${this.logs.length}
=================================================================

`;
    return header + this.fileBuffer.join('\n');
  }

  // Sauvegarder les logs dans un fichier virtuel (pour export)
  exportLogs() {
    return this.getFileContent();
  }

  // Setup global error capture (version simplifiée)
  // ❌ DÉSACTIVÉ: Causait conflit avec logger.ts qui intercepte déjà console.error
  // Résultat: Double interception → boucle infinie
  setupGlobalErrorCapture() {
    // NE RIEN FAIRE - logger.ts gère déjà l'interception de console.error
    this.logInfo('⚠️ Global error capture delegated to logger.ts', 'error-capture');
    
    // try {
    //   // Capturer les erreurs console.error
    //   const originalError = console.error;
    //   console.error = (...args) => {
    //     originalError.apply(console, args);
    //     
    //     this.logError(
    //       'Console Error Captured',
    //       { args: args.map(arg => String(arg)) },
    //       'global-console'
    //     );
    //   };
    //
    //   this.logInfo('Simple global error capture enabled', 'error-capture');
    // } catch (error) {
    //
    //   this.logWarning('Failed to setup global error capture', 'error-capture');
    // }
  }
}

// Instance singleton
export const simpleSessionLogger = new SimpleSessionLogger();

// API simplifiée pour l'app
export const logError = (message: string, error?: any, context?: string) => 
  simpleSessionLogger.logError(message, error, context);

export const logWarning = (message: string, context?: string) => 
  simpleSessionLogger.logWarning(message, context);

export const logInfo = (message: string, context?: string) => 
  simpleSessionLogger.logInfo(message, context);

export const logDebug = (message: string, data?: any, context?: string) => 
  simpleSessionLogger.logDebug(message, data, context);

export default simpleSessionLogger;