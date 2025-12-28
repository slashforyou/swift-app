/**
 * Environment Configuration - Configuration centralisée des environnements
 * 
 * Ce fichier gère la configuration selon l'environnement (dev/staging/prod)
 * 
 * IMPORTANT POUR LA PRODUCTION:
 * 1. Remplacer les clés Stripe par les vraies clés live
 * 2. Vérifier les URLs de production
 * 3. Ne jamais committer les clés secrètes (sk_*)
 */

// Détection de l'environnement
const IS_DEV = __DEV__;

// Configuration par environnement
interface EnvironmentConfig {
  name: 'development' | 'staging' | 'production';
  apiUrl: string;
  stripePublishableKey: string;
  enableDebugLogs: boolean;
  enableAnalytics: boolean;
}

// Configuration Development
const developmentConfig: EnvironmentConfig = {
  name: 'development',
  apiUrl: 'https://altivo.fr/swift-app/',
  // ⚠️ Clé Stripe TEST - Remplacer par votre vraie clé test
  stripePublishableKey: 'pk_test_VOTRE_CLE_STRIPE_TEST',
  enableDebugLogs: true,
  enableAnalytics: false,
};

// Configuration Staging
const stagingConfig: EnvironmentConfig = {
  name: 'staging',
  apiUrl: 'https://api-staging.swiftapp.com.au/',
  // ⚠️ Clé Stripe TEST pour staging
  stripePublishableKey: 'pk_test_VOTRE_CLE_STRIPE_TEST',
  enableDebugLogs: true,
  enableAnalytics: true,
};

// Configuration Production
const productionConfig: EnvironmentConfig = {
  name: 'production',
  apiUrl: 'https://altivo.fr/swift-app/',
  // ⚠️ Clé Stripe LIVE - À configurer avant le déploiement production
  stripePublishableKey: 'pk_live_VOTRE_CLE_STRIPE_PRODUCTION',
  enableDebugLogs: false,
  enableAnalytics: true,
};

/**
 * Obtient la configuration selon l'environnement actuel
 * 
 * En développement (__DEV__ = true) → developmentConfig
 * En production (__DEV__ = false) → productionConfig
 * 
 * Pour utiliser staging, modifier cette fonction ou utiliser une variable d'env
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  if (IS_DEV) {
    return developmentConfig;
  }
  
  // En production, on pourrait détecter staging via une variable d'environnement
  // Pour l'instant, on retourne directement la config production
  return productionConfig;
}

// Export de la configuration active
export const ENV = getEnvironmentConfig();

// Exports individuels pour faciliter l'utilisation
export const API_URL = ENV.apiUrl;
export const STRIPE_PUBLISHABLE_KEY = ENV.stripePublishableKey;
export const IS_PRODUCTION = ENV.name === 'production';
export const ENABLE_DEBUG_LOGS = ENV.enableDebugLogs;
export const ENABLE_ANALYTICS = ENV.enableAnalytics;

// Validation au démarrage
if (!STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
  console.error('⚠️ [ENV] Invalid Stripe publishable key format!');
}

if (IS_PRODUCTION && STRIPE_PUBLISHABLE_KEY.includes('test')) {
  console.error('🚨 [ENV] Using TEST Stripe key in PRODUCTION! Please update to live key.');
}

if (IS_PRODUCTION && STRIPE_PUBLISHABLE_KEY.includes('VOTRE_CLE')) {
  console.error('🚨 [ENV] Stripe key not configured! Please set your production key.');
}

// Log de la configuration au démarrage (sans exposer les clés sensibles)
console.log(`📱 [ENV] Environment: ${ENV.name}`);
console.log(`📱 [ENV] API URL: ${ENV.apiUrl}`);
console.log(`📱 [ENV] Stripe Key: ${STRIPE_PUBLISHABLE_KEY.substring(0, 12)}...`);
