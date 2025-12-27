// src/services/sessionLogger.ts
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

interface SessionLogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  error?: any;
  stack?: string;
  context?: string;
}

class SessionLogger {
  private logFilePath: string;
  private isInitialized: boolean = false;
  private logQueue: SessionLogEntry[] = [];
  private maxLogSize: number = 10 * 1024 * 1024; // 10MB max

  constructor() {
    this.logFilePath = `${FileSystem.documentDirectory}swift-app-session.log`;
    this.initializeLogger();
  }

  private async initializeLogger() {
    try {
      // Effacer le fichier de log de la session précédente
      const fileExists = await this.fileExists(this.logFilePath);
      if (fileExists) {
        await FileSystem.deleteAsync(this.logFilePath);
        // TEMP_DISABLED: console.log('📄 [SESSION-LOG] Previous session log cleared');
      }

      // Créer nouveau fichier avec header de session
      const sessionHeader = this.createSessionHeader();
      await this.writeToFile(sessionHeader);

      this.isInitialized = true;
      
      // Écrire les logs en queue si il y en a
      if (this.logQueue.length > 0) {
        for (const entry of this.logQueue) {
          await this.writeLogEntry(entry);
        }
        this.logQueue = [];
      }

      // TEMP_DISABLED: console.log(`📄 [SESSION-LOG] Initialized: ${this.logFilePath}`);
    } catch (error) {

      console.error('❌ [SESSION-LOG] Failed to initialize:', error);
    }
  }

  private createSessionHeader(): string {
    const now = new Date();
    
    // Version de l'app de manière sécurisée
    let appVersion = '1.0.0'; // Version par défaut
    try {
      // En React Native, on peut utiliser différentes approches
      if (typeof require !== 'undefined') {
        // Essayer avec le chemin correct depuis src/services/
        const pkg = require('../../package.json');
        appVersion = pkg.version || '1.0.0';
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {

      // Fallback si le package.json n'est pas accessible
      // TEMP_DISABLED: console.log('📄 [SESSION-LOG] Unable to read app version from package.json');
    }
    
    return `
=================================================================
🚀 SWIFT APP - SESSION LOG
=================================================================
📅 Session Started: ${now.toISOString()}
🏗️ Platform: ${Platform.OS} ${Platform.Version}
📱 App Version: ${appVersion}
🔧 Environment: ${__DEV__ ? 'Development' : 'Production'}
=================================================================

`;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(path);
      return info.exists;
    } catch {
      return false;
    }
  }

  private async writeToFile(content: string) {
    try {
      await FileSystem.writeAsStringAsync(this.logFilePath, content);
    } catch (error) {

      console.error('❌ [SESSION-LOG] Write failed:', error);
    }
  }

  private async appendToFile(content: string) {
    try {
      // Vérifier la taille du fichier avant d'écrire
      const fileInfo = await FileSystem.getInfoAsync(this.logFilePath);
      if (fileInfo.exists && fileInfo.size && fileInfo.size > this.maxLogSize) {
        // Si trop gros, on garde seulement les 1000 dernières lignes
        await this.rotateLogFile();
      }

      // Pour l'append, on lit le contenu existant puis on réécrit tout
      const existingContent = await this.fileExists(this.logFilePath) 
        ? await FileSystem.readAsStringAsync(this.logFilePath)
        : '';
      
      await FileSystem.writeAsStringAsync(this.logFilePath, existingContent + content);
    } catch (error) {

      console.error('❌ [SESSION-LOG] Append failed:', error);
    }
  }

  private async rotateLogFile() {
    try {
      const content = await FileSystem.readAsStringAsync(this.logFilePath);
      const lines = content.split('\n');
      const keepLines = 1000;
      
      if (lines.length > keepLines) {
        const rotatedContent = [
          '... [LOG ROTATED - Keeping last 1000 lines] ...\n',
          ...lines.slice(-keepLines)
        ].join('\n');
        
        await this.writeToFile(rotatedContent);
        // TEMP_DISABLED: console.log('📄 [SESSION-LOG] Log file rotated');
      }
    } catch (error) {

      console.error('❌ [SESSION-LOG] Rotation failed:', error);
    }
  }

  private formatLogEntry(entry: SessionLogEntry): string {
    const timestamp = entry.timestamp;
    const level = entry.level.padEnd(5);
    let logLine = `${timestamp} [${level}] ${entry.message}`;
    
    if (entry.context) {
      logLine += ` (${entry.context})`;
    }
    
    if (entry.error) {
      logLine += `\n  Error: ${JSON.stringify(entry.error, null, 2)}`;
    }
    
    if (entry.stack) {
      logLine += `\n  Stack: ${entry.stack}`;
    }
    
    return logLine + '\n';
  }

  private async writeLogEntry(entry: SessionLogEntry) {
    const formattedEntry = this.formatLogEntry(entry);
    if (this.isInitialized) {
      await this.appendToFile(formattedEntry);
    } else {
      // Si pas encore initialisé, mettre en queue
      this.logQueue.push(entry);
    }
  }

  // ========== API PUBLIQUE ==========

  async logError(message: string, error?: any, context?: string) {
    const entry: SessionLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        ...error
      } : undefined,
      stack: error?.stack,
      context
    };

    console.error(`🔴 [SESSION-LOG] ${message}`, error);
    await this.writeLogEntry(entry);
  }

  async logWarning(message: string, context?: string) {
    const entry: SessionLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      context
    };

    console.warn(`🟡 [SESSION-LOG] ${message}`);
    await this.writeLogEntry(entry);
  }

  async logInfo(message: string, context?: string) {
    const entry: SessionLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      context
    };

    // TEMP_DISABLED: console.log(`🔵 [SESSION-LOG] ${message}`);
    await this.writeLogEntry(entry);
  }

  async logDebug(message: string, data?: any, context?: string) {
    if (!__DEV__) return; // Debug logs seulement en dev

    const entry: SessionLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message,
      error: data ? { debug_data: data } : undefined,
      context
    };

    // TEMP_DISABLED: console.log(`⚪ [SESSION-LOG] ${message}`, data);
    await this.writeLogEntry(entry);
  }

  // Capturer les erreurs globales non gérées
  setupGlobalErrorCapture() {
    // Capturer les erreurs JS non gérées (React Native)
    try {
      const ErrorUtils = (global as any).ErrorUtils;
      if (ErrorUtils && typeof ErrorUtils.getGlobalHandler === 'function') {
        const originalErrorHandler = ErrorUtils.getGlobalHandler();
        
        ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
          this.logError(
            'Unhandled JavaScript Error',
            {
              isFatal,
              message: error.message,
              name: error.name,
              stack: error.stack
            },
            'global-error'
          );

          // Appeler le handler original si il existe
          if (originalErrorHandler) {
            originalErrorHandler(error, isFatal);
          }
        });
      }
    } catch {

      // TEMP_DISABLED: console.log('📄 [SESSION-LOG] Unable to setup global error handler');
    }

    // Capturer les promesses rejetées non gérées (React Native)
    if (typeof global !== 'undefined' && typeof (global as any).addEventListener === 'function') {
      (global as any).addEventListener('unhandledrejection', (event: any) => {
        this.logError(
          'Unhandled Promise Rejection',
          {
            reason: event.reason,
            promise: 'Promise rejected'
          },
          'unhandled-promise'
        );
      });
    }

    // TEMP_DISABLED: console.log('📄 [SESSION-LOG] Global error capture enabled');
  }

  // Obtenir le chemin du fichier de log pour debug
  getLogFilePath(): string {
    return this.logFilePath;
  }

  // Lire le contenu du log (pour debug/support)
  async readLogContent(): Promise<string> {
    try {
      const exists = await this.fileExists(this.logFilePath);
      if (!exists) {
        return 'No log file found for this session.';
      }
      
      return await FileSystem.readAsStringAsync(this.logFilePath);
    } catch (error) {

      return `Error reading log file: ${error}`;
    }
  }

  // Partager le fichier de log (pour support/debug)
  async shareLogFile(): Promise<void> {
    try {
      const exists = await this.fileExists(this.logFilePath);
      if (!exists) {
        throw new Error('No log file to share');
      }

      // Sur Android/iOS, on peut utiliser Share ou autre méthode
      // Pour l'instant, on log juste le chemin
      // TEMP_DISABLED: console.log('📄 [SESSION-LOG] Log file available at:', this.logFilePath);
      
      // TODO: Implémenter sharing avec react-native-share ou expo-sharing
      return;
    } catch (error) {

      console.error('❌ [SESSION-LOG] Failed to share log file:', error);
      throw error;
    }
  }
}

// Instance singleton
export const sessionLogger = new SessionLogger();

// API simplifiée pour usage dans l'app
export const logError = (message: string, error?: any, context?: string) => 
  sessionLogger.logError(message, error, context);

export const logWarning = (message: string, context?: string) => 
  sessionLogger.logWarning(message, context);

export const logInfo = (message: string, context?: string) => 
  sessionLogger.logInfo(message, context);

export const logDebug = (message: string, data?: any, context?: string) => 
  sessionLogger.logDebug(message, data, context);