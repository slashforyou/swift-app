/**
 * Système de logging robuste pour éviter les crashes liés aux logs trop longs
 * Écrit simultanément dans la console ET dans un fichier pour analyse post-crash
 */

import { logDebug, logError, logInfo, logWarning } from '../services/sessionLogger';

// Taille maximale pour un seul log (en caractères)
const MAX_LOG_SIZE = 5000;
const MAX_OBJECT_DEPTH = 3;

/**
 * Utility pour sérialiser de manière sûre des objets complexes
 */
function safeStringify(obj: any, maxDepth = MAX_OBJECT_DEPTH): string {
  const seen = new WeakSet();
  
  const stringifyWithDepth = (value: any, depth: number): any => {
    if (depth > maxDepth) {
      return '[Max depth exceeded]';
    }
    
    if (value === null) return null;
    if (value === undefined) return '[undefined]';
    
    if (typeof value === 'object') {
      if (seen.has(value)) {
        return '[Circular reference]';
      }
      seen.add(value);
      
      if (Array.isArray(value)) {
        return value.length > 10 
          ? `[Array(${value.length}): ${value.slice(0, 10).map(item => stringifyWithDepth(item, depth + 1))}... (truncated)]`
          : value.map(item => stringifyWithDepth(item, depth + 1));
      }
      
      const result: Record<string, any> = {};
      const keys = Object.keys(value);
      
      if (keys.length > 20) {
        // Si trop de propriétés, prendre les 20 premières
        keys.slice(0, 20).forEach(key => {
          result[key] = stringifyWithDepth(value[key], depth + 1);
        });
        result['__truncated'] = `... ${keys.length - 20} more properties`;
      } else {
        keys.forEach(key => {
          try {
            result[key] = stringifyWithDepth(value[key], depth + 1);
          } catch (err) {
            result[key] = '[Serialization error]';
          }
        });
      }
      
      return result;
    }
    
    if (typeof value === 'string' && value.length > 1000) {
      return value.substring(0, 1000) + '... [String truncated]';
    }
    
    return value;
  };
  
  try {
    const safeObject = stringifyWithDepth(obj, 0);
    const result = JSON.stringify(safeObject, null, 2);
    
    if (result.length > MAX_LOG_SIZE) {
      return result.substring(0, MAX_LOG_SIZE) + '\n... [Log truncated due to size]';
    }
    
    return result;
  } catch (err) {
    return `[Error serializing object: ${err}]`;
  }
}

/**
 * Logger qui écrit de manière sécurisée dans console ET fichier
 */
class CrashSafeLogger {
  private async safeLog(
    logFunction: (message: string, data?: any, context?: string) => Promise<void>,
    consoleFunction: (...args: any[]) => void,
    level: string,
    message: string, 
    data?: any, 
    context?: string
  ) {
    try {
      // 1. Formatter le message de manière sûre
      const safeMessage = typeof message === 'string' 
        ? message.length > MAX_LOG_SIZE 
          ? message.substring(0, MAX_LOG_SIZE) + '... [Message truncated]'
          : message
        : String(message);
      
      // 2. Logger dans la console (synchrone)
      if (data !== undefined) {
        const safeData = typeof data === 'object' ? safeStringify(data) : String(data);
        consoleFunction(`[${level}] ${safeMessage}`, safeData);
      } else {
        consoleFunction(`[${level}] ${safeMessage}`);
      }
      
      // 3. Logger dans le fichier (asynchrone) - ne pas attendre pour éviter de bloquer
      setImmediate(async () => {
        try {
          await logFunction(safeMessage, data, context);
        } catch (fileError) {
          console.warn('📁 [CRASH-SAFE-LOGGER] Failed to write to file:', fileError);
        }
      });
      
    } catch (err) {
      // Si même le logging sécurisé échoue, logger juste l'erreur
      console.error('🚨 [CRASH-SAFE-LOGGER] Critical logging error:', err);
      console.error('🚨 Original message was:', message);
    }
  }

  async info(message: string, data?: any, context?: string) {
    await this.safeLog(logInfo, console.log, 'INFO', message, data, context);
  }

  async error(message: string, errorData?: any, context?: string) {
    await this.safeLog(logError, console.error, 'ERROR', message, errorData, context);
  }

  async debug(message: string, data?: any, context?: string) {
    await this.safeLog(logDebug, console.log, 'DEBUG', message, data, context);
  }

  async warn(message: string, data?: any, context?: string) {
    await this.safeLog(logWarning, console.warn, 'WARN', message, data, context);
  }

  /**
   * Version spéciale pour les logs très volumineux (ex: réponses API)
   */
  async logLarge(level: 'info' | 'error' | 'debug' | 'warn', message: string, largeData?: any, context?: string) {
    const summary = this.createDataSummary(largeData);
    const logMethod = this[level].bind(this);
    
    await logMethod(`${message} [Summary: ${summary.summary}]`, summary.safeData, context);
  }

  /**
   * Créer un résumé d'un objet volumineux
   */
  private createDataSummary(data: any): { summary: string, safeData: any } {
    if (!data) return { summary: 'No data', safeData: data };
    
    if (typeof data === 'string') {
      return {
        summary: `String(${data.length} chars)`,
        safeData: data.length > 500 ? data.substring(0, 500) + '...' : data
      };
    }
    
    if (Array.isArray(data)) {
      return {
        summary: `Array(${data.length} items)`,
        safeData: data.length > 5 ? data.slice(0, 5) : data
      };
    }
    
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      return {
        summary: `Object(${keys.length} keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''})`,
        safeData: safeStringify(data, 2)
      };
    }
    
    return {
      summary: `${typeof data}(${String(data).length})`,
      safeData: String(data).substring(0, 1000)
    };
  }
}

// Instance singleton
export const crashSafeLogger = new CrashSafeLogger();

// Exports pour usage simple
export const safeLog = {
  info: (message: string, data?: any, context?: string) => crashSafeLogger.info(message, data, context),
  error: (message: string, error?: any, context?: string) => crashSafeLogger.error(message, error, context),
  debug: (message: string, data?: any, context?: string) => crashSafeLogger.debug(message, data, context),
  warn: (message: string, data?: any, context?: string) => crashSafeLogger.warn(message, data, context),
  large: (level: 'info' | 'error' | 'debug' | 'warn', message: string, largeData?: any, context?: string) => 
    crashSafeLogger.logLarge(level, message, largeData, context)
};

export default crashSafeLogger;