// src/utils/logUtils.ts
/**
 * Utilitaires pour logger les erreurs de manière sécurisée
 * Évite les références circulaires et les objets trop volumineux
 */

// Cache pour éviter les logs répétés
const errorLogCache = new Map<string, number>();
const LOG_THROTTLE_MS = 5000; // 5 secondes minimum entre les mêmes erreurs

export const safeLogError = (message: string, error: any) => {
  try {
    // Créer une clé unique pour ce type d'erreur
    const errorKey = `${message}-${error?.message || error?.toString()}`;
    const now = Date.now();
    const lastLogTime = errorLogCache.get(errorKey);
    
    // Si cette erreur a déjà été loggée récemment, l'ignorer
    if (lastLogTime && (now - lastLogTime) < LOG_THROTTLE_MS) {
      return;
    }
    
    errorLogCache.set(errorKey, now);
    
    // Si c'est une vraie erreur avec message et stack
    if (error instanceof Error) {
      console.error(message, {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 500) // Limiter la stack trace
      });
      return;
    }
    
    // Si c'est un objet avec des propriétés d'erreur
    if (error && typeof error === 'object') {
      const safeError: any = {};
      
      // Extraire les propriétés importantes
      if (error.message) safeError.message = String(error.message);
      if (error.status) safeError.status = error.status;
      if (error.statusText) safeError.statusText = error.statusText;
      if (error.code) safeError.code = error.code;
      if (error.name) safeError.name = error.name;
      
      // Si c'est une erreur fetch/network
      if (error.response) {
        safeError.response = {
          status: error.response.status,
          statusText: error.response.statusText,
          url: error.response.url
        };
      }
      
      console.error(message, safeError);
      return;
    }
    
    // Sinon, convertir en string de manière sécurisée
    console.error(message, String(error).substring(0, 200));
    
  } catch (logError) {
    // En dernier recours si même le logging échoue
    console.error(message, '[Error object could not be logged safely]');
    console.error('Logging error:', logError);
  }
};

export const safeLogWarning = (message: string, data?: any) => {
  try {
    if (data && typeof data === 'object') {
      const safeData = JSON.parse(JSON.stringify(data, null, 0));
      console.warn(message, safeData);
    } else {
      console.warn(message, data);
    }
  } catch (error) {
    console.warn(message, '[Data could not be logged safely]');
  }
};

export const safeLogInfo = (message: string, data?: any) => {
  try {
    if (data && typeof data === 'object') {
      // TEMP_DISABLED: console.log(message, JSON.stringify(data, null, 0).substring(0, 300));
    } else {
        }
  } catch (error) {
    // TEMP_DISABLED: console.log(message, '[Data could not be logged safely]');
  }
};