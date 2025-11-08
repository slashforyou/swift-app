/**
 * Logger utilitaire - Logs conditionnels basés sur l'environnement
 * 
 * En développement (__DEV__): tous les logs sont affichés
 * En production: seuls les warnings et erreurs sont affichés
 * 
 * Usage:
 * ```typescript
 * import { logger } from '@/utils/logger';
 * 
 * logger.log('Message de debug');           // Affiché seulement en DEV
 * logger.warn('Avertissement');             // Toujours affiché
 * logger.error('Erreur critique');          // Toujours affiché
 * logger.info('Information');               // Affiché seulement en DEV
 * logger.debug('Debug détaillé');           // Affiché seulement en DEV
 * logger.group('Groupe de logs');           // Affiché seulement en DEV
 * logger.groupEnd();                        // Affiché seulement en DEV
 * ```
 * 
 * Features:
 * - Préfixes colorés pour faciliter la lecture
 * - Timestamps automatiques
 * - Support des groupes de logs
 * - Désactivation automatique en production
 */

// Détection de l'environnement
const IS_DEV = __DEV__;

// Configuration des préfixes
const PREFIX = {
  LOG: '📝',
  INFO: 'ℹ️',
  DEBUG: '🔍',
  WARN: '⚠️',
  ERROR: '❌',
  SUCCESS: '✅',
  TIMER: '⏱️',
  API: '🌐',
  STORAGE: '💾',
};

/**
 * Logger principal
 */
export const logger = {
  /**
   * Log standard - Affiché uniquement en développement
   */
  log: (...args: any[]) => {
    if (IS_DEV) {
      console.log(PREFIX.LOG, ...args);
    }
  },

  /**
   * Log d'information - Affiché uniquement en développement
   */
  info: (...args: any[]) => {
    if (IS_DEV) {
      console.info(PREFIX.INFO, ...args);
    }
  },

  /**
   * Log de debug - Affiché uniquement en développement
   */
  debug: (...args: any[]) => {
    if (IS_DEV) {
      console.debug(PREFIX.DEBUG, ...args);
    }
  },

  /**
   * Warning - Toujours affiché (important en production)
   */
  warn: (...args: any[]) => {
    console.warn(PREFIX.WARN, ...args);
  },

  /**
   * Erreur - Toujours affichée (critique en production)
   */
  error: (...args: any[]) => {
    console.error(PREFIX.ERROR, ...args);
  },

  /**
   * Log de succès - Affiché uniquement en développement
   */
  success: (...args: any[]) => {
    if (IS_DEV) {
      console.log(PREFIX.SUCCESS, ...args);
    }
  },

  /**
   * Log de timer - Affiché uniquement en développement
   */
  timer: (...args: any[]) => {
    if (IS_DEV) {
      console.log(PREFIX.TIMER, ...args);
    }
  },

  /**
   * Log d'API - Affiché uniquement en développement
   */
  api: (...args: any[]) => {
    if (IS_DEV) {
      console.log(PREFIX.API, ...args);
    }
  },

  /**
   * Log de storage - Affiché uniquement en développement
   */
  storage: (...args: any[]) => {
    if (IS_DEV) {
      console.log(PREFIX.STORAGE, ...args);
    }
  },

  /**
   * Grouper des logs - Affiché uniquement en développement
   */
  group: (label: string) => {
    if (IS_DEV) {
      console.group(label);
    }
  },

  /**
   * Terminer un groupe de logs
   */
  groupEnd: () => {
    if (IS_DEV) {
      console.groupEnd();
    }
  },

  /**
   * Grouper des logs (collapsed) - Affiché uniquement en développement
   */
  groupCollapsed: (label: string) => {
    if (IS_DEV) {
      console.groupCollapsed(label);
    }
  },

  /**
   * Mesurer le temps d'exécution - Affiché uniquement en développement
   */
  time: (label: string) => {
    if (IS_DEV) {
      console.time(label);
    }
  },

  /**
   * Terminer la mesure de temps
   */
  timeEnd: (label: string) => {
    if (IS_DEV) {
      console.timeEnd(label);
    }
  },

  /**
   * Afficher un tableau - Affiché uniquement en développement
   */
  table: (data: any) => {
    if (IS_DEV) {
      console.table(data);
    }
  },
};

/**
 * Logger spécialisé pour le JobTimer
 */
export const timerLogger = {
  start: (jobId: string) => {
    logger.timer('[JobTimer] Starting timer for job:', jobId);
  },

  step: (jobId: string, currentStep: number, totalSteps: number) => {
    logger.timer(`[JobTimer] Job ${jobId} - Step ${currentStep}/${totalSteps}`);
  },

  pause: (jobId: string) => {
    logger.timer('[JobTimer] Pause started for job:', jobId);
  },

  resume: (jobId: string) => {
    logger.timer('[JobTimer] Pause ended for job:', jobId);
  },

  complete: (jobId: string, finalCost: number, billableHours: number) => {
    logger.success('[JobTimer] Job completed!', { jobId, finalCost, billableHours });
  },

  sync: (direction: 'toContext' | 'fromContext', step: number) => {
    logger.debug(`[JobTimer] Sync ${direction}:`, step);
  },

  error: (operation: string, error: any) => {
    logger.error(`[JobTimer] Error in ${operation}:`, error);
  },
};

/**
 * Logger spécialisé pour JobDetails
 */
export const jobDetailsLogger = {
  mount: (jobId: string) => {
    logger.info('[JobDetails] Component mounted for job:', jobId);
  },

  update: (jobId: string, updates: any) => {
    logger.debug('[JobDetails] Updating job data:', { jobId, updates });
  },

  apiSync: (jobId: string, apiData: any) => {
    logger.api('[JobDetails] Syncing with API data:', { jobId, apiData });
  },

  stepChange: (newStep: number) => {
    logger.debug('[JobDetails] Step changed to:', newStep);
  },

  completed: (finalCost: number, billableHours: number) => {
    logger.success('[JobDetails] Job completed!', { finalCost, billableHours });
  },

  debug: (...args: any[]) => {
    logger.debug(...args);
  },

  success: (...args: any[]) => {
    logger.success(...args);
  },

  error: (operation: string, error: any) => {
    logger.error(`[JobDetails] Error in ${operation}:`, error);
  },
};

/**
 * Logger spécialisé pour les API calls
 */
export const apiLogger = {
  request: (endpoint: string, method: string, data?: any) => {
    logger.api(`[API] ${method} ${endpoint}`, data);
  },

  response: (endpoint: string, status: number, data?: any) => {
    logger.api(`[API] Response ${status} from ${endpoint}`, data);
  },

  error: (endpoint: string, error: any) => {
    logger.error(`[API] Error calling ${endpoint}:`, error);
  },
};

export default logger;
