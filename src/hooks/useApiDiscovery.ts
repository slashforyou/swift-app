/**
 * 🪝 API DISCOVERY REACT HOOKS
 * 
 * Hooks React pour intégrer l'API Discovery dans les composants.
 * 
 * Hooks disponibles:
 * - useApiEndpoints() - Liste tous les endpoints
 * - useApiCategory() - Endpoints d'une catégorie
 * - useApiValidation() - Valide la disponibilité d'un endpoint
 * - useApiSummary() - Résumé des catégories
 * 
 * @example
 * // Dans un composant
 * function PaymentScreen() {
 *   const { available, loading } = useApiValidation('/swift-app/v1/jobs/:job_id/payment/create');
 *   
 *   if (loading) return <ActivityIndicator />;
 *   if (!available) return <Text>Paiement non disponible</Text>;
 *   
 *   return <PaymentButton />;
 * }
 */

import { useEffect, useState } from 'react';
import { apiDiscovery, ApiDiscoverySummary, ApiEndpoint } from '../services/apiDiscovery';
import { logger } from '../services/logger';

// ========================================
// HOOK: useApiEndpoints
// ========================================

export interface UseApiEndpointsResult {
  endpoints: ApiEndpoint[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer tous les endpoints disponibles
 * 
 * @example
 * const { endpoints, loading, error, refresh } = useApiEndpoints();
 */
export function useApiEndpoints(): UseApiEndpointsResult {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiDiscovery.getAllEndpoints();
      setEndpoints(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch endpoints';
      setError(errorMessage);
      logger.error('[useApiEndpoints] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  return {
    endpoints,
    loading,
    error,
    refresh: fetchEndpoints
  };
}

// ========================================
// HOOK: useApiCategory
// ========================================

export interface UseApiCategoryResult {
  endpoints: ApiEndpoint[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer les endpoints d'une catégorie spécifique
 * 
 * @param category - Nom de la catégorie
 * @example
 * const { endpoints, loading } = useApiCategory('Stripe & Payments');
 */
export function useApiCategory(category: string): UseApiCategoryResult {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiDiscovery.getEndpointsByCategory(category);
      setEndpoints(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch category: ${category}`;
      setError(errorMessage);
      logger.error('[useApiCategory] Error:', { category, err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category) {
      fetchCategory();
    }
  }, [category]);

  return {
    endpoints,
    loading,
    error,
    refresh: fetchCategory
  };
}

// ========================================
// HOOK: useApiValidation
// ========================================

export interface UseApiValidationResult {
  available: boolean;
  loading: boolean;
  error: string | null;
  endpoint: ApiEndpoint | null;
  refresh: () => Promise<void>;
}

/**
 * Hook pour valider la disponibilité d'un endpoint
 * 
 * @param path - Path de l'endpoint à vérifier
 * @param method - Méthode HTTP (optionnel)
 * @example
 * const { available, loading, endpoint } = useApiValidation('/swift-app/v1/logs', 'POST');
 * 
 * if (!loading && !available) {
 *   console.log('Endpoint non disponible, utiliser fallback local');
 * }
 */
export function useApiValidation(
  path: string,
  method?: string
): UseApiValidationResult {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<ApiEndpoint | null>(null);

  const checkAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const isAvailable = await apiDiscovery.isEndpointAvailable(path, method);
      setAvailable(isAvailable);

      if (isAvailable) {
        const details = await apiDiscovery.findEndpoint(path);
        setEndpoint(details);
      } else {
        setEndpoint(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check endpoint';
      setError(errorMessage);
      logger.error('[useApiValidation] Error:', { path, method, err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (path) {
      checkAvailability();
    }
  }, [path, method]);

  return {
    available,
    loading,
    error,
    endpoint,
    refresh: checkAvailability
  };
}

// ========================================
// HOOK: useApiSummary
// ========================================

export interface UseApiSummaryResult {
  summary: ApiDiscoverySummary | null;
  loading: boolean;
  error: string | null;
  categories: string[];
  totalEndpoints: number;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer le résumé de l'API
 * (Plus léger que useApiEndpoints)
 * 
 * @example
 * const { summary, categories, totalEndpoints } = useApiSummary();
 */
export function useApiSummary(): UseApiSummaryResult {
  const [summary, setSummary] = useState<ApiDiscoverySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiDiscovery.getSummary();
      setSummary(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch summary';
      setError(errorMessage);
      logger.error('[useApiSummary] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const categories = summary?.categories ? Object.keys(summary.categories) : [];
  const totalEndpoints = summary?.total_endpoints || 0;

  return {
    summary,
    loading,
    error,
    categories,
    totalEndpoints,
    refresh: fetchSummary
  };
}

// ========================================
// HOOK: useApiMultiValidation
// ========================================

export interface UseApiMultiValidationResult {
  statuses: Map<string, boolean>;
  loading: boolean;
  error: string | null;
  allAvailable: boolean;
  someAvailable: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook pour vérifier plusieurs endpoints en une seule requête
 * 
 * @param paths - Liste des paths à vérifier
 * @example
 * const { statuses, allAvailable } = useApiMultiValidation([
 *   '/swift-app/v1/logs',
 *   '/swift-app/v1/analytics/events'
 * ]);
 * 
 * if (allAvailable) {
 *   // Tous les endpoints sont disponibles
 * }
 */
export function useApiMultiValidation(paths: string[]): UseApiMultiValidationResult {
  const [statuses, setStatuses] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkMultiple = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiDiscovery.checkMultipleEndpoints(paths);
      setStatuses(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check endpoints';
      setError(errorMessage);
      logger.error('[useApiMultiValidation] Error:', { paths, err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paths && paths.length > 0) {
      checkMultiple();
    }
  }, [JSON.stringify(paths)]); // Recheck si la liste change

  const statusArray = Array.from(statuses.values());
  const allAvailable = statusArray.length > 0 && statusArray.every(status => status);
  const someAvailable = statusArray.some(status => status);

  return {
    statuses,
    loading,
    error,
    allAvailable,
    someAvailable,
    refresh: checkMultiple
  };
}

// ========================================
// HOOK: useApiFeatureFlag
// ========================================

export interface UseApiFeatureFlagResult {
  enabled: boolean;
  loading: boolean;
  reason: string;
}

/**
 * Hook pour activer/désactiver une fonctionnalité basée sur la disponibilité d'un endpoint
 * 
 * @param path - Path de l'endpoint requis pour la fonctionnalité
 * @param featureName - Nom de la fonctionnalité (pour logging)
 * @example
 * const { enabled, loading, reason } = useApiFeatureFlag(
 *   '/swift-app/v1/analytics/events',
 *   'Analytics'
 * );
 * 
 * if (enabled) {
 *   return <AnalyticsComponent />;
 * }
 * 
 * return <Text>Analytics désactivé: {reason}</Text>;
 */
export function useApiFeatureFlag(
  path: string,
  featureName: string
): UseApiFeatureFlagResult {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('Vérification en cours...');

  useEffect(() => {
    const checkFeature = async () => {
      try {
        setLoading(true);
        
        const available = await apiDiscovery.isEndpointAvailable(path);
        setEnabled(available);
        
        if (available) {
          setReason(`${featureName} activé`);
          logger.info(`[FeatureFlag] ${featureName} enabled`, { path });
        } else {
          setReason(`${featureName} désactivé (endpoint non disponible)`);
          logger.warn(`[FeatureFlag] ${featureName} disabled - endpoint not available`, { path });
        }
      } catch (err) {
        setEnabled(false);
        setReason(`${featureName} désactivé (erreur de vérification)`);
        logger.error(`[FeatureFlag] ${featureName} check failed`, { path, err });
      } finally {
        setLoading(false);
      }
    };

    if (path && featureName) {
      checkFeature();
    }
  }, [path, featureName]);

  return { enabled, loading, reason };
}

/**
 * EXEMPLES D'UTILISATION AVANCÉS :
 * 
 * // 1. Afficher/Masquer fonctionnalité analytics
 * function AnalyticsButton() {
 *   const { enabled } = useApiFeatureFlag('/swift-app/v1/analytics/events', 'Analytics');
 *   if (!enabled) return null;
 *   return <Button title="Voir Analytics" />;
 * }
 * 
 * // 2. Vérifier availability avant appel API
 * function JobNotesSection({ jobId }: { jobId: string }) {
 *   const { available, loading } = useApiValidation(`/swift-app/v1/job/${jobId}/notes`, 'POST');
 *   
 *   const handleAddNote = async () => {
 *     if (available) {
 *       // Appeler l'API
 *       await api.createNote(jobId, noteText);
 *     } else {
 *       // Fallback local uniquement
 *       await localDb.saveNote(jobId, noteText);
 *       Alert.alert('Note sauvegardée localement (API non disponible)');
 *     }
 *   };
 *   
 *   return <NotesForm onSubmit={handleAddNote} />;
 * }
 * 
 * // 3. Liste des catégories pour navigation
 * function ApiExplorer() {
 *   const { categories, loading } = useApiSummary();
 *   
 *   return (
 *     <FlatList
 *       data={categories}
 *       renderItem={({ item }) => (
 *         <CategoryItem category={item} />
 *       )}
 *     />
 *   );
 * }
 * 
 * // 4. Dashboard de santé API
 * function ApiHealthDashboard() {
 *   const criticalEndpoints = [
 *     '/swift-app/v1/logs',
 *     '/swift-app/v1/analytics/events',
 *     '/swift-app/v1/job/:id/step'
 *   ];
 *   
 *   const { statuses, allAvailable, someAvailable } = useApiMultiValidation(criticalEndpoints);
 *   
 *   return (
 *     <View>
 *       <Text>API Health: {allAvailable ? '✅ OK' : someAvailable ? '⚠️ Partial' : '❌ Down'}</Text>
 *       {Array.from(statuses.entries()).map(([path, available]) => (
 *         <Text key={path}>{path}: {available ? '✅' : '❌'}</Text>
 *       ))}
 *     </View>
 *   );
 * }
 */
