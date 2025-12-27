/**
 * 🔍 API DISCOVERY SERVICE
 * 
 * Service de découverte automatique des endpoints API disponibles.
 * Utilise l'endpoint /swift-app/v1/api/discover pour valider
 * la disponibilité des endpoints avant de les appeler.
 * 
 * Avantages:
 * - ✅ Évite les erreurs 404 parasites
 * - ✅ Cache intelligent (5 minutes)
 * - ✅ Fallbacks gracieux pour endpoints manquants
 * - ✅ Auto-mise à jour (détecte nouveaux endpoints)
 * - ✅ Logs propres (ne log que vraies erreurs)
 * 
 * ⚠️ IMPORTANT: N'importe PAS logger.ts pour éviter cycle de dépendances
 * Utilise console.debug/log/error directement
 * 
 * @see API_DISCOVERY_DOCUMENTATION.md
 */

// ❌ NE PAS IMPORTER: import { logger } from './logger';
// ✅ Utiliser console.debug/log/error directement pour éviter cycle de dépendances

// ========================================
// TYPES & INTERFACES
// ========================================

export interface ApiEndpoint {
  method: string;
  path: string;
  full_url: string;
  category: string;
  description: string;
  authentication_required: boolean;
  parameters: {
    path: { name: string; type: string; required: boolean }[];
    query: any[];
    body: any[];
  };
  responses: Record<string, string>;
}

export interface ApiDiscoveryData {
  api_info: {
    version: string;
    base_url: string;
    total_endpoints: number;
    scanned_at: string;
    server_time: string;
    authentication: {
      type: string;
      header: string;
      description: string;
    };
  };
  categories: Record<string, { count: number; routes: any[] }>;
  endpoints: ApiEndpoint[];
}

export interface ApiDiscoverySummary {
  total_endpoints: number;
  base_url: string;
  categories: Record<string, { count: number; routes: any[] }>;
  scanned_at: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// ========================================
// API DISCOVERY SERVICE CLASS
// ========================================

class ApiDiscoveryService {
  private baseUrl = 'https://altivo.fr/swift-app/v1/api/discover';
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  
  // Flag pour éviter les boucles de logging
  private isFetchingDiscovery = false;

  // ========================================
  // MÉTHODES PRINCIPALES
  // ========================================

  /**
   * Récupère tous les endpoints disponibles
   * @returns Liste complète des endpoints
   */
  async getAllEndpoints(): Promise<ApiEndpoint[]> {
    try {
      const cacheKey = 'all-endpoints';
      const cached = this.getFromCache<ApiEndpoint[]>(cacheKey);
      if (cached) {
        console.debug('[ApiDiscovery] Returning cached endpoints', { count: cached.length });
        return cached;
      }

      console.log('[ApiDiscovery] Fetching all endpoints from server...');
      this.isFetchingDiscovery = true;
      
      const response = await fetch(this.baseUrl);
      const data = await response.json();
      
      this.isFetchingDiscovery = false;

      if (data.success && data.data?.endpoints) {
        this.setCache(cacheKey, data.data.endpoints);
        console.log('✅ [ApiDiscovery] Fetched and cached endpoints', { 
          count: data.data.endpoints.length,
          categories: Object.keys(data.data.categories || {})
        });
        return data.data.endpoints;
      }

      console.warn('[ApiDiscovery] Invalid response from discovery endpoint', data);
      return [];
    } catch (error) {
      this.isFetchingDiscovery = false;
      console.error('[ApiDiscovery] Failed to fetch endpoints', error);
      return [];
    }
  }

  /**
   * Récupère les endpoints d'une catégorie spécifique
   * @param category - Nom de la catégorie (case insensitive)
   * @returns Liste des endpoints de cette catégorie
   */
  async getEndpointsByCategory(category: string): Promise<ApiEndpoint[]> {
    try {
      const cacheKey = `category-${category.toLowerCase()}`;
      const cached = this.getFromCache<ApiEndpoint[]>(cacheKey);
      if (cached) {
        console.debug(`[ApiDiscovery] Returning cached endpoints for category: ${category}`, { count: cached.length });
        return cached;
      }

      console.log(`[ApiDiscovery] Fetching endpoints for category: ${category}`);
      this.isFetchingDiscovery = true;

      const response = await fetch(`${this.baseUrl}/category/${encodeURIComponent(category)}`);
      const data = await response.json();
      
      this.isFetchingDiscovery = false;

      if (data.success && data.data?.endpoints) {
        this.setCache(cacheKey, data.data.endpoints);
        console.log(`✅ [ApiDiscovery] Fetched endpoints for category: ${category}`, { count: data.data.endpoints.length });
        return data.data.endpoints;
      }

      if (data.error) {
        console.warn(`[ApiDiscovery] Category not found: ${category}`, {
          available: data.available_categories
        });
      }

      return [];
    } catch (error) {
      this.isFetchingDiscovery = false;
      console.error(`[ApiDiscovery] Failed to fetch category: ${category}`, error);
      return [];
    }
  }

  /**
   * Récupère le résumé (plus léger que getAllEndpoints)
   * @returns Résumé des catégories et counts
   */
  async getSummary(): Promise<ApiDiscoverySummary | null> {
    try {
      const cacheKey = 'summary';
      const cached = this.getFromCache<ApiDiscoverySummary>(cacheKey);
      if (cached) {
        console.debug('[ApiDiscovery] Returning cached summary');
        return cached;
      }

      console.log('[ApiDiscovery] Fetching API summary...');
      this.isFetchingDiscovery = true;

      const response = await fetch(`${this.baseUrl}/summary`);
      const data = await response.json();
      
      this.isFetchingDiscovery = false;

      if (data.success && data.data) {
        this.setCache(cacheKey, data.data);
        console.log('✅ [ApiDiscovery] Fetched API summary', {
          total: data.data.total_endpoints,
          categories: Object.keys(data.data.categories || {})
        });
        return data.data;
      }

      return null;
    } catch (error) {
      this.isFetchingDiscovery = false;
      console.error('[ApiDiscovery] Failed to fetch summary', error);
      return null;
    }
  }

  /**
   * Liste toutes les catégories disponibles
   * @returns Tableau des noms de catégories
   */
  async getCategories(): Promise<string[]> {
    try {
      const summary = await this.getSummary();
      if (summary?.categories) {
        return Object.keys(summary.categories);
      }
      return [];
    } catch (error) {
      console.error('[ApiDiscovery] Failed to fetch categories', error);
      return [];
    }
  }

  /**
   * Convertit un path avec valeurs concrètes en pattern regex pour matcher les endpoints dynamiques
   * Ex: "/job/123/step" → matche "/job/:id/step" ou "/job/:job_id/step"
   */
  private pathMatchesPattern(concretePath: string, patternPath: string): boolean {
    // Normaliser les paths
    const normConcrete = concretePath.replace(/^https?:\/\/[^\/]+/, '');
    const normPattern = patternPath.replace(/^https?:\/\/[^\/]+/, '');
    
    // Convertir le pattern (:id, :job_id, etc.) en regex
    // /job/:id/step → /job/[^/]+/step
    const regexPattern = normPattern.replace(/:[a-zA-Z_]+/g, '[^/]+');
    const regex = new RegExp(`^${regexPattern}$`);
    
    return regex.test(normConcrete);
  }

  /**
   * Recherche un endpoint spécifique par son path
   * @param path - Path de l'endpoint (ex: "/swift-app/v1/job/123/step")
   * @returns Endpoint trouvé ou null
   * 
   * ✅ Phase 2.3: Supporte les patterns dynamiques (/job/:id/step matche /job/123/step)
   */
  async findEndpoint(path: string): Promise<ApiEndpoint | null> {
    try {
      const endpoints = await this.getAllEndpoints();
      
      // 1. Recherche exacte
      let found = endpoints.find(e => e.path === path);
      if (found) return found;

      // 2. Recherche avec normalisation (avec/sans base URL)
      const normalizedPath = path.replace(/^https?:\/\/[^\/]+/, '');
      found = endpoints.find(e => {
        const endpointNormalizedPath = e.path.replace(/^https?:\/\/[^\/]+/, '');
        return endpointNormalizedPath === normalizedPath;
      });
      if (found) return found;
      
      // 3. ✅ Phase 2.3: Recherche par pattern dynamique
      // Ex: "/job/123/step" matche "/job/:id/step"
      found = endpoints.find(e => this.pathMatchesPattern(path, e.path));
      
      return found || null;
    } catch (error) {
      console.error('[ApiDiscovery] Failed to find endpoint', { path, error });
      return null;
    }
  }

  /**
   * Vérifie si un endpoint est disponible
   * @param path - Path de l'endpoint
   * @param method - Méthode HTTP (optionnel, pour vérification stricte)
   * @returns true si l'endpoint existe
   */
  async isEndpointAvailable(path: string, method?: string): Promise<boolean> {
    try {
      const endpoint = await this.findEndpoint(path);
      
      if (!endpoint) {
        console.debug(`[ApiDiscovery] Endpoint not available: ${method || 'ANY'} ${path}`);
        return false;
      }

      // Si méthode spécifiée, vérifier qu'elle correspond
      if (method && endpoint.method.toUpperCase() !== method.toUpperCase()) {
        console.debug(`[ApiDiscovery] Endpoint exists but method mismatch: ${endpoint.method} vs ${method}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[ApiDiscovery] Failed to check endpoint availability', { path, method, error });
      return false;
    }
  }

  /**
   * Vérifie si plusieurs endpoints sont disponibles en une seule requête
   * @param paths - Liste des paths à vérifier
   * @returns Map des paths avec leur statut de disponibilité
   */
  async checkMultipleEndpoints(paths: string[]): Promise<Map<string, boolean>> {
    try {
      const endpoints = await this.getAllEndpoints();
      const result = new Map<string, boolean>();

      paths.forEach(path => {
        const normalizedPath = path.replace(/^https?:\/\/[^\/]+/, '');
        const found = endpoints.some(e => {
          const endpointNormalizedPath = e.path.replace(/^https?:\/\/[^\/]+/, '');
          return endpointNormalizedPath === normalizedPath;
        });
        result.set(path, found);
      });

      return result;
    } catch (error) {
      console.error('[ApiDiscovery] Failed to check multiple endpoints', { paths, error });
      return new Map();
    }
  }

  /**
   * Récupère les informations détaillées d'un endpoint
   * @param path - Path de l'endpoint
   * @returns Informations complètes ou null
   */
  async getEndpointDetails(path: string): Promise<ApiEndpoint | null> {
    return this.findEndpoint(path);
  }

  // ========================================
  // MÉTHODES DE CACHE
  // ========================================

  /**
   * Récupère une donnée depuis le cache
   * @param key - Clé du cache
   * @returns Donnée cachée ou null si expiré/inexistant
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const { data, timestamp } = cached;
    const age = Date.now() - timestamp;

    // Cache expiré
    if (age > this.cacheExpiry) {
      this.cache.delete(key);
      console.debug(`[ApiDiscovery] Cache expired for key: ${key}`, { age: `${Math.round(age / 1000)}s` });
      return null;
    }

    console.debug(`[ApiDiscovery] Cache hit for key: ${key}`, { age: `${Math.round(age / 1000)}s` });
    return data;
  }

  /**
   * Sauvegarde une donnée dans le cache
   * @param key - Clé du cache
   * @param data - Donnée à cacher
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.debug(`[ApiDiscovery] Cached data for key: ${key}`);
  }

  /**
   * Vide tout le cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[ApiDiscovery] Cache cleared');
  }

  /**
   * Vide une clé spécifique du cache
   * @param key - Clé à supprimer
   */
  clearCacheKey(key: string): void {
    this.cache.delete(key);
    console.debug(`[ApiDiscovery] Cache key cleared: ${key}`);
  }

  /**
   * Force le rechargement des endpoints (bypass cache)
   */
  async refresh(): Promise<void> {
    this.clearCache();
    await this.getAllEndpoints();
    console.log('[ApiDiscovery] Cache refreshed with latest endpoints');
  }

  // ========================================
  // MÉTHODES UTILITAIRES
  // ========================================

  /**
   * Vérifie si le service est actuellement en train de fetcher
   * (pour éviter les boucles de logging)
   */
  isFetching(): boolean {
    return this.isFetchingDiscovery;
  }

  /**
   * Configure la durée de validité du cache
   * @param durationMs - Durée en millisecondes
   */
  setCacheExpiry(durationMs: number): void {
    this.cacheExpiry = durationMs;
    console.log(`[ApiDiscovery] Cache expiry set to ${durationMs}ms`);
  }

  /**
   * Obtient les statistiques du cache
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// ========================================
// EXPORT SINGLETON
// ========================================

export const apiDiscovery = new ApiDiscoveryService();

// Export pour tests
export { ApiDiscoveryService };

/**
 * EXEMPLES D'UTILISATION :
 * 
 * // Vérifier si un endpoint existe avant de l'appeler
 * const available = await apiDiscovery.isEndpointAvailable('/swift-app/v1/job/123/step');
 * if (available) {
 *   // Appeler l'endpoint
 * } else {
 *   // Fallback local
 * }
 * 
 * // Récupérer tous les endpoints Stripe
 * const stripeEndpoints = await apiDiscovery.getEndpointsByCategory('Stripe & Payments');
 * 
 * // Vérifier plusieurs endpoints en une fois
 * const statuses = await apiDiscovery.checkMultipleEndpoints([
 *   '/swift-app/v1/logs',
 *   '/swift-app/v1/analytics/events',
 *   '/swift-app/v1/job/:id/step'
 * ]);
 * 
 * // Rafraîchir le cache
 * await apiDiscovery.refresh();
 */
