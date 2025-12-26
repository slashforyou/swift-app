/**
 * 🛡️ API CLIENT WITH DISCOVERY
 * 
 * Client API intelligent qui vérifie la disponibilité des endpoints
 * avant de les appeler, et gère les fallbacks gracieux.
 * 
 * Avantages:
 * - ✅ Évite les erreurs 404 parasites
 * - ✅ Fallbacks automatiques pour endpoints manquants
 * - ✅ Logs propres (seulement vraies erreurs)
 * - ✅ Cache intelligent des vérifications
 * 
 * @example
 * // Au lieu de:
 * const response = await fetch('/swift-app/v1/logs', {...});
 * 
 * // Utiliser:
 * const result = await safeApiCall({
 *   endpoint: '/swift-app/v1/logs',
 *   method: 'POST',
 *   body: logData,
 *   fallback: 'local'
 * });
 */

import { apiDiscovery } from './apiDiscovery';
import { logger } from './logger';

// ========================================
// TYPES
// ========================================

export type ApiFallbackStrategy = 'local' | 'silent' | 'error' | 'retry';

export interface SafeApiCallOptions {
  endpoint: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  fallbackStrategy?: ApiFallbackStrategy;
  skipValidation?: boolean;
  localFallbackFn?: () => Promise<any>;
  retryAttempts?: number;
}

export interface SafeApiCallResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  usedFallback: boolean;
  endpointAvailable: boolean;
  strategy: string;
}

// ========================================
// CACHE DES VÉRIFICATIONS
// ========================================

// Cache des endpoints vérifiés (pour éviter de re-vérifier à chaque appel)
const endpointValidationCache = new Map<string, { available: boolean; timestamp: number }>();
const VALIDATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Vérifie si un endpoint a été validé récemment
 */
function getCachedValidation(endpoint: string): boolean | null {
  const cached = endpointValidationCache.get(endpoint);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > VALIDATION_CACHE_DURATION) {
    endpointValidationCache.delete(endpoint);
    return null;
  }

  return cached.available;
}

/**
 * Cache le résultat de validation d'un endpoint
 */
function setCachedValidation(endpoint: string, available: boolean): void {
  endpointValidationCache.set(endpoint, {
    available,
    timestamp: Date.now()
  });
}

// ========================================
// SAFE API CALL
// ========================================

/**
 * Appelle un endpoint API de manière sécurisée avec vérification de disponibilité
 * 
 * @param options - Options de l'appel API
 * @returns Résultat avec indication si fallback utilisé
 * 
 * @example
 * // Appel avec fallback local
 * const result = await safeApiCall({
 *   endpoint: '/swift-app/v1/job/123/step',
 *   method: 'PATCH',
 *   body: { current_step: 3 },
 *   fallbackStrategy: 'local',
 *   localFallbackFn: async () => {
 *     await localDb.updateJobStep(jobId, 3);
 *     return { success: true };
 *   }
 * });
 * 
 * if (result.usedFallback) {
 *   console.log('Endpoint non disponible, utilisé fallback local');
 * }
 */
export async function safeApiCall<T = any>(
  options: SafeApiCallOptions
): Promise<SafeApiCallResult<T>> {
  const {
    endpoint,
    method = 'GET',
    headers = {},
    body,
    fallbackStrategy = 'error',
    skipValidation = false,
    localFallbackFn,
    retryAttempts = 0
  } = options;

  // Normaliser l'endpoint (retirer l'URL de base si présente)
  const normalizedEndpoint = endpoint.replace(/^https?:\/\/[^\/]+/, '');

  // 1. VÉRIFICATION DE DISPONIBILITÉ
  let isAvailable = true;

  if (!skipValidation) {
    // Vérifier cache d'abord
    const cachedResult = getCachedValidation(normalizedEndpoint);
    
    if (cachedResult !== null) {
      isAvailable = cachedResult;
      logger.debug('[SafeApiCall] Using cached validation', { endpoint: normalizedEndpoint, isAvailable });
    } else {
      // Vérifier avec API Discovery
      isAvailable = await apiDiscovery.isEndpointAvailable(normalizedEndpoint, method);
      setCachedValidation(normalizedEndpoint, isAvailable);
      logger.debug('[SafeApiCall] Validated endpoint', { endpoint: normalizedEndpoint, isAvailable });
    }
  }

  // 2. ENDPOINT NON DISPONIBLE → APPLIQUER FALLBACK
  if (!isAvailable) {
    logger.warn('[SafeApiCall] Endpoint not available', { 
      endpoint: normalizedEndpoint, 
      method,
      fallbackStrategy 
    });

    switch (fallbackStrategy) {
      case 'local':
        if (localFallbackFn) {
          try {
            const fallbackData = await localFallbackFn();
            logger.info('[SafeApiCall] Used local fallback successfully', { endpoint: normalizedEndpoint });
            return {
              success: true,
              data: fallbackData,
              usedFallback: true,
              endpointAvailable: false,
              strategy: 'local'
            };
          } catch (error) {
            logger.error('[SafeApiCall] Local fallback failed', { endpoint: normalizedEndpoint, error });
            return {
              success: false,
              error: 'Endpoint unavailable and local fallback failed',
              usedFallback: true,
              endpointAvailable: false,
              strategy: 'local'
            };
          }
        }
        // Si pas de fonction fallback, retourner erreur
        return {
          success: false,
          error: 'Endpoint unavailable and no local fallback provided',
          usedFallback: false,
          endpointAvailable: false,
          strategy: 'local'
        };

      case 'silent':
        logger.debug('[SafeApiCall] Silent fallback - returning null', { endpoint: normalizedEndpoint });
        return {
          success: true,
          data: null as T,
          usedFallback: true,
          endpointAvailable: false,
          strategy: 'silent'
        };

      case 'retry':
        if (retryAttempts > 0) {
          logger.info('[SafeApiCall] Retrying despite unavailability', { 
            endpoint: normalizedEndpoint,
            attemptsLeft: retryAttempts 
          });
          // Forcer l'appel en skipant la validation
          return safeApiCall({
            ...options,
            skipValidation: true,
            retryAttempts: retryAttempts - 1
          });
        }
        // Plus de retry → error
        return {
          success: false,
          error: 'Endpoint unavailable after retries',
          usedFallback: false,
          endpointAvailable: false,
          strategy: 'retry'
        };

      case 'error':
      default:
        return {
          success: false,
          error: `Endpoint ${normalizedEndpoint} is not available`,
          usedFallback: false,
          endpointAvailable: false,
          strategy: 'error'
        };
    }
  }

  // 3. ENDPOINT DISPONIBLE → APPEL NORMAL
  try {
    const fullUrl = endpoint.startsWith('http') 
      ? endpoint 
      : `https://altivo.fr${normalizedEndpoint}`;

    logger.debug('[SafeApiCall] Calling endpoint', { 
      endpoint: normalizedEndpoint, 
      method,
      hasBody: !!body 
    });

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      ...(body && { body: JSON.stringify(body) })
    };

    const response = await fetch(fullUrl, fetchOptions);

    // Cas spécial: 404 alors que Discovery dit que c'est disponible
    if (response.status === 404) {
      logger.warn('[SafeApiCall] Got 404 but endpoint should be available', {
        endpoint: normalizedEndpoint,
        method
      });
      
      // Invalider le cache
      setCachedValidation(normalizedEndpoint, false);

      // Appliquer fallback
      if (fallbackStrategy === 'local' && localFallbackFn) {
        const fallbackData = await localFallbackFn();
        return {
          success: true,
          data: fallbackData,
          usedFallback: true,
          endpointAvailable: false,
          strategy: 'local-after-404'
        };
      }

      return {
        success: false,
        error: 'Endpoint returned 404',
        usedFallback: false,
        endpointAvailable: true, // Discovery disait oui mais API dit 404
        strategy: 'error'
      };
    }

    // Autres erreurs HTTP
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('[SafeApiCall] HTTP error', {
        endpoint: normalizedEndpoint,
        status: response.status,
        error: errorText
      });

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        usedFallback: false,
        endpointAvailable: true,
        strategy: 'error'
      };
    }

    // Succès
    const data = await response.json();
    logger.debug('[SafeApiCall] Success', { endpoint: normalizedEndpoint });

    return {
      success: true,
      data,
      usedFallback: false,
      endpointAvailable: true,
      strategy: 'normal'
    };

  } catch (error) {
    logger.error('[SafeApiCall] Fetch error', { endpoint: normalizedEndpoint, error });

    // En cas d'erreur réseau, essayer fallback local
    if (fallbackStrategy === 'local' && localFallbackFn) {
      try {
        const fallbackData = await localFallbackFn();
        return {
          success: true,
          data: fallbackData,
          usedFallback: true,
          endpointAvailable: true, // On ne sait pas, erreur réseau
          strategy: 'local-after-error'
        };
      } catch (fallbackError) {
        return {
          success: false,
          error: 'Network error and local fallback failed',
          usedFallback: true,
          endpointAvailable: true,
          strategy: 'error'
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      usedFallback: false,
      endpointAvailable: true,
      strategy: 'error'
    };
  }
}

// ========================================
// HELPERS SPÉCIFIQUES
// ========================================

/**
 * Wrapper pour logs (avec fallback silent)
 */
export async function safeLogToApi(logData: any): Promise<SafeApiCallResult> {
  return safeApiCall({
    endpoint: '/swift-app/v1/logs',
    method: 'POST',
    body: logData,
    fallbackStrategy: 'silent' // Ne pas bloquer si logs API indisponibles
  });
}

/**
 * Wrapper pour analytics (avec fallback silent)
 */
export async function safeAnalyticsEvent(eventData: any): Promise<SafeApiCallResult> {
  return safeApiCall({
    endpoint: '/swift-app/v1/analytics/events',
    method: 'POST',
    body: eventData,
    fallbackStrategy: 'silent' // Ne pas bloquer si analytics indisponibles
  });
}

/**
 * Wrapper pour job steps (avec fallback local)
 */
export async function safeUpdateJobStep(
  jobId: string,
  stepData: any,
  localUpdateFn?: () => Promise<any>
): Promise<SafeApiCallResult> {
  return safeApiCall({
    endpoint: `/swift-app/v1/job/${jobId}/step`,
    method: 'PATCH',
    body: stepData,
    fallbackStrategy: 'local',
    localFallbackFn: localUpdateFn
  });
}

/**
 * Wrapper pour notes (avec fallback local)
 */
export async function safeCreateJobNote(
  jobId: string,
  noteData: any,
  localCreateFn?: () => Promise<any>
): Promise<SafeApiCallResult> {
  return safeApiCall({
    endpoint: `/swift-app/v1/job/${jobId}/notes`,
    method: 'POST',
    body: noteData,
    fallbackStrategy: 'local',
    localFallbackFn: localCreateFn
  });
}

/**
 * Vide le cache de validation des endpoints
 */
export function clearValidationCache(): void {
  endpointValidationCache.clear();
  logger.info('[SafeApiCall] Validation cache cleared');
}

/**
 * EXEMPLES D'UTILISATION :
 * 
 * // 1. Logs API (silent fallback)
 * const result = await safeLogToApi({
 *   level: 'error',
 *   message: 'Something went wrong',
 *   timestamp: Date.now()
 * });
 * // Si l'endpoint n'existe pas → silent, pas d'erreur
 * 
 * // 2. Job step update (local fallback)
 * const result = await safeUpdateJobStep(
 *   'job-123',
 *   { current_step: 3 },
 *   async () => {
 *     await localDb.saveJobStep('job-123', 3);
 *     return { success: true };
 *   }
 * );
 * 
 * if (result.usedFallback) {
 *   Alert.alert('Sauvegardé localement', 'Synchronisation en attente');
 * }
 * 
 * // 3. Custom endpoint avec retry
 * const result = await safeApiCall({
 *   endpoint: '/swift-app/v1/custom-endpoint',
 *   method: 'GET',
 *   fallbackStrategy: 'retry',
 *   retryAttempts: 2
 * });
 */
