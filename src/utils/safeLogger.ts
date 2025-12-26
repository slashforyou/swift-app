/**
 * SafeLogger - Un système de logging qui évite la pollution de console
 * 
 * Fonctionnalités:
 * - Détection et prévention des objets circulaires
 * - Limitation de la profondeur d'affichage
 * - Formatage sûr des objets complexes
 * - Protection contre les crashs de console
 */

class SafeLogger {
  private maxDepth = 3;
  private maxStringLength = 200;
  private enabled = true;

  /**
   * Stringify sécurisé qui évite les objets circulaires et limite la profondeur
   */
  private safeStringify(obj: any, depth = 0): string {
    if (depth > this.maxDepth) {
      return '[Max depth reached]';
    }

    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    
    const type = typeof obj;
    
    if (type === 'string') {
      return obj.length > this.maxStringLength 
        ? `"${obj.substring(0, this.maxStringLength)}..."` 
        : `"${obj}"`;
    }
    
    if (type === 'number' || type === 'boolean') {
      return String(obj);
    }
    
    if (type === 'function') {
      return '[Function]';
    }
    
    if (obj instanceof Date) {
      return `Date(${obj.toISOString()})`;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      if (obj.length > 5) {
        return `[Array(${obj.length})]`;
      }
      const items = obj.slice(0, 5).map(item => this.safeStringify(item, depth + 1));
      return `[${items.join(', ')}]`;
    }
    
    if (type === 'object') {
      try {
        const keys = Object.keys(obj);
        if (keys.length === 0) return '{}';
        if (keys.length > 5) {
          return `{Object with ${keys.length} keys}`;
        }
        
        const pairs = keys.slice(0, 5).map(key => {
          try {
            return `${key}: ${this.safeStringify(obj[key], depth + 1)}`;
          } catch (e) {
            return `${key}: [Error]`;
          }
        });
        
        return `{${pairs.join(', ')}}`;
      } catch (e) {
        return '[Object - Error accessing]';
      }
    }
    
    return String(obj);
  }

  /**
   * Log sécurisé qui ne crash jamais
   */
  log(message: string, ...args: any[]) {
    if (!this.enabled) return;
    
    try {
      if (args.length === 0) {
        console.log(message);
      } else {
        const safeArgs = args.map(arg => this.safeStringify(arg));
        console.log(message, ...safeArgs);
      }
    } catch (error) {
      console.log(`[SafeLogger Error] ${message} [Args caused error]`);
    }
  }

  /**
   * Méthodes spécialisées
   */
  error(message: string, ...args: any[]) {
    if (!this.enabled) return;
    this.log(`❌ ERROR: ${message}`, ...args);
  }

  warn(message: string, ...args: any[]) {
    if (!this.enabled) return;
    this.log(`⚠️ WARN: ${message}`, ...args);
  }

  info(message: string, ...args: any[]) {
    if (!this.enabled) return;
    this.log(`ℹ️ INFO: ${message}`, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (!this.enabled) return;
    this.log(`🔍 DEBUG: ${message}`, ...args);
  }

  /**
   * Configuration
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setMaxDepth(depth: number) {
    this.maxDepth = Math.max(1, Math.min(10, depth));
  }

  setMaxStringLength(length: number) {
    this.maxStringLength = Math.max(50, Math.min(1000, length));
  }
}

// Export singleton
export const safeLogger = new SafeLogger();

// Fonction utilitaire pour remplacer console.log temporairement
export const replaceDangerousLogs = () => {
  const originalLog = console.log;
  console.log = (...args) => {
    safeLogger.log('[SAFE]', ...args);
  };
  
  return () => {
    console.log = originalLog;
  };
};