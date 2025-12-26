/**
 * API Configuration - Configuration centralisée pour toutes les APIs
 * Gère les URLs, authentification et paramètres globaux
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform as RNPlatform } from 'react-native';

// Variables d'environnement
const IS_DEV = __DEV__;
const IS_WEB = RNPlatform.OS === 'web';

// Configuration des URLs de base selon l'environnement
const API_URLS = {
  development: {
    web: 'http://localhost:3001',
    mobile: 'http://192.168.0.51:3001', // IP de dev - ajuster selon votre réseau
  },
  staging: {
    web: 'https://api-staging.swiftapp.com.au',
    mobile: 'https://api-staging.swiftapp.com.au',
  },
  production: {
    web: 'https://api.swiftapp.com.au', 
    mobile: 'https://api.swiftapp.com.au',
  }
} as const;

// Déterminer l'environnement actuel
const getEnvironment = (): keyof typeof API_URLS => {
  if (IS_DEV) return 'development';
  
  // En production, on peut utiliser une variable d'environnement
  // ou détecter automatiquement selon le build
  return 'production';
};

// Obtenir l'URL de base selon l'environnement et la plateforme
const getBaseURL = (): string => {
  const env = getEnvironment();
  const platform = IS_WEB ? 'web' : 'mobile';
  
  return API_URLS[env][platform];
};

/**
 * Configuration API centralisée
 */
export const apiConfig = {
  // URL de base dynamique
  baseURL: getBaseURL(),
  
  // Timeout par défaut (30 secondes)
  timeout: 30000,
  
  // Headers par défaut
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Configuration Stripe
  stripe: {
    publishableKey: IS_DEV 
      ? 'pk_test_51OsLQ8DYjI2sE1B1Gxw8SJ9xqJBAFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
      : 'pk_live_VOTRE_CLE_STRIPE_PRODUCTION',
  },
  
  // Clés d'authentification AsyncStorage
  authKeys: {
    token: '@swiftapp:auth_token',
    refreshToken: '@swiftapp:refresh_token', 
    userId: '@swiftapp:user_id',
  },
  
  /**
   * Récupère le token d'authentification
   */
  getAuthToken: async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem(apiConfig.authKeys.token);
      return token;
    } catch (error) {
      console.error('❌ [apiConfig] Error getting auth token:', error);
      return null;
    }
  },
  
  /**
   * Stocke le token d'authentification  
   */
  setAuthToken: async (token: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(apiConfig.authKeys.token, token);
      // TEMP_DISABLED: console.log('✅ [apiConfig] Auth token stored');
    } catch (error) {
      console.error('❌ [apiConfig] Error storing auth token:', error);
    }
  },
  
  /**
   * Supprime le token d'authentification
   */
  clearAuthToken: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([
        apiConfig.authKeys.token,
        apiConfig.authKeys.refreshToken,
        apiConfig.authKeys.userId,
      ]);
      // TEMP_DISABLED: console.log('✅ [apiConfig] Auth tokens cleared');
    } catch (error) {
      console.error('❌ [apiConfig] Error clearing auth tokens:', error);
    }
  },
  
  /**
   * Crée les headers avec authentification
   */
  getAuthHeaders: async (): Promise<Record<string, string>> => {
    const token = await apiConfig.getAuthToken();
    
    return {
      ...apiConfig.defaultHeaders,
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  },
  
  /**
   * Helper pour faire des requêtes authentifiées
   */
  authenticatedFetch: async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = await apiConfig.getAuthHeaders();
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };
    
    // Ajouter le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);
    
    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Gestion automatique des erreurs 401 (token expiré)
      if (response.status === 401) {
        console.warn('⚠️ [apiConfig] Auth token expired, clearing storage');
        await apiConfig.clearAuthToken();
        // Vous pouvez ici déclencher une redirection vers login
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  },
  
  /**
   * Endpoint de vérification de santé de l'API
   */
  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${apiConfig.baseURL}/health`, {
        method: 'GET',
        headers: apiConfig.defaultHeaders,
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ [apiConfig] Health check failed:', error);
      return false;
    }
  },
};

// Export des constantes utiles
export const API_ENDPOINTS = {
  // Auth
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  refresh: '/api/auth/refresh',
  
  // Staff
  staff: '/api/staff',
  employees: '/api/staff/employees',
  contractors: '/api/staff/contractors',
  
  // Business
  companies: '/api/companies',
  stats: '/api/companies/stats',
  
  // Jobs
  jobs: '/api/jobs',
  jobStats: '/api/jobs/stats',
  
  // Vehicles  
  vehicles: '/api/vehicles',
  vehicleStats: '/api/vehicles/stats',
  
  // Payments (Stripe)
  payments: '/api/payments',
  paymentIntents: '/api/payments/intents',
  stripeConnect: '/api/stripe/connect',
  
} as const;

// Types pour TypeScript
export type Environment = keyof typeof API_URLS;
export type Platform = 'web' | 'mobile';
export type APIEndpoint = keyof typeof API_ENDPOINTS;

// TEMP_DISABLED: console.log(`🌐 [apiConfig] Initialized with baseURL: ${apiConfig.baseURL} (${getEnvironment()})`);