/**
 * Système de logging ultra-simple et sûr pour éviter les crashes
 * Version minimaliste qui ne risque jamais de crasher l'app
 */

// Helper ultra-sécurisé pour éviter tout crash
function ultraSafeStringify(obj: any): string {
  if (!obj) return '';
  
  try {
    // Pour les chaînes, on limite strictement
    if (typeof obj === 'string') {
      return obj.length > 100 ? obj.substring(0, 100) + '...' : obj;
    }
    
    // Pour les nombres, booléens, etc.
    if (typeof obj !== 'object') {
      const str = String(obj);
      return str.length > 100 ? str.substring(0, 100) + '...' : str;
    }
    
    // Pour les objets, on évite JSON.stringify qui peut crasher
    // On crée juste un résumé minimal
    if (obj instanceof Error) {
      return `Error: ${obj.message || 'Unknown error'}`;
    }
    
    if (Array.isArray(obj)) {
      return `[Array with ${obj.length} items]`;
    }
    
    // Pour les objets, on fait un résumé très simple
    const keys = Object.keys(obj);
    return `{Object with ${keys.length} properties: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
    
  } catch (error) {

    return '[Cannot display object]';
  }
}

// Logging ultra-sécurisé qui ne peut jamais crasher
export const safeLog = {
  info: (message: string, data?: any) => {
    try {
      if (data !== undefined) {
      } else {
      }
    } catch (error) {

    }
  },
  
  error: (message: string, error?: any) => {
    try {
      if (error !== undefined) {
        console.error(`❌ ${message} | ${ultraSafeStringify(error)}`);
      } else {
        console.error(`❌ ${message}`);
      }
    } catch (consoleError) {

      console.error(`❌ ${message} | [error display failed]`);
    }
  },
  
  debug: (message: string, data?: any) => {
    try {
      if (__DEV__) {
        if (data !== undefined) {
        } else {
        }
      }
    } catch (error) {

      if (__DEV__) {
      }
    }
  },
  
  warn: (message: string, data?: any) => {
    try {
      if (data !== undefined) {
        console.warn(`⚠️ ${message} | ${ultraSafeStringify(data)}`);
      } else {
        console.warn(`⚠️ ${message}`);
      }
    } catch (error) {

      console.warn(`⚠️ ${message} | [data display failed]`);
    }
  }
};

export default safeLog;
