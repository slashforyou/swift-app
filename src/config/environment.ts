/**
 * Environment Configuration - Configuration centralisée des environnements
 *
 * Ce fichier gère la configuration selon l'environnement (dev/staging/prod)
 *
 * IMPORTANT POUR LA PRODUCTION:
 * 1. Remplacer les clés Stripe par les vraies clés live
 * 2. Vérifier les URLs de production
 * 3. Ne jamais committer les clés secrètes (sk_*)
 *
 * UTILISATION AVEC EAS BUILD:
 * - eas build --profile development → APP_ENV=development
 * - eas build --profile preview → APP_ENV=staging
 * - eas build --profile production → APP_ENV=production
 */

import Constants from "expo-constants";

// Détection de l'environnement
const IS_DEV = __DEV__;

// Variable d'environnement EAS (définie dans eas.json)
const APP_ENV =
  Constants.expoConfig?.extra?.APP_ENV ||
  process.env.APP_ENV ||
  (IS_DEV ? "development" : "production");

// Configuration par environnement
interface EnvironmentConfig {
  name: "development" | "staging" | "production";
  apiUrl: string;
  stripePublishableKey: string;
  enableDebugLogs: boolean;
  enableAnalytics: boolean;
}

// Configuration Development
const developmentConfig: EnvironmentConfig = {
  name: "development",
  apiUrl: "https://altivo.fr/swift-app/",
  // ✅ Clé Stripe TEST réelle (depuis la doc PAYMENT_ENDPOINT_404.md)
  stripePublishableKey:
    "pk_test_51SMZIJInA65k4AVU4pfHe2XYbwfiqZqYNmCSCfgrIP7iyI2rQ4sw5Po5KbZC5nt1NVMOXiWzZXaxnD1wiDnPNd2m00BwhyWbwP",
  enableDebugLogs: true,
  enableAnalytics: false,
};

// Configuration Staging
const stagingConfig: EnvironmentConfig = {
  name: "staging",
  apiUrl: "https://api-staging.swiftapp.com.au/",
  // ⚠️ Clé Stripe TEST pour staging
  stripePublishableKey: "pk_test_VOTRE_CLE_STRIPE_TEST",
  enableDebugLogs: true,
  enableAnalytics: true,
};

// Configuration Production
const productionConfig: EnvironmentConfig = {
  name: "production",
  apiUrl: "https://altivo.fr/swift-app/",
  // ⚠️ Clé Stripe LIVE - À configurer avant le déploiement production
  stripePublishableKey: "pk_live_VOTRE_CLE_STRIPE_PRODUCTION",
  enableDebugLogs: false,
  enableAnalytics: true,
};

/**
 * Obtient la configuration selon l'environnement actuel
 *
 * Priorité de détection:
 * 1. Variable APP_ENV (EAS Build)
 * 2. __DEV__ flag (développement local)
 *
 * EAS Build profiles:
 * - development → developmentConfig
 * - preview/staging → stagingConfig
 * - production → productionConfig
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // Utiliser APP_ENV si défini (via EAS Build)
  switch (APP_ENV) {
    case "development":
      return developmentConfig;
    case "staging":
      return stagingConfig;
    case "production":
      return productionConfig;
    default:
      // Fallback sur __DEV__
      return IS_DEV ? developmentConfig : productionConfig;
  }
}

// Export de la configuration active
export const ENV = getEnvironmentConfig();

// Exports individuels pour faciliter l'utilisation
export const API_URL = ENV.apiUrl;
export const STRIPE_PUBLISHABLE_KEY = ENV.stripePublishableKey;
export const IS_PRODUCTION = ENV.name === "production";
export const ENABLE_DEBUG_LOGS = ENV.enableDebugLogs;
export const ENABLE_ANALYTICS = ENV.enableAnalytics;

// Validation au démarrage
if (!STRIPE_PUBLISHABLE_KEY.startsWith("pk_")) {
  console.error("⚠️ [ENV] Invalid Stripe publishable key format!");
}

if (IS_PRODUCTION && STRIPE_PUBLISHABLE_KEY.includes("test")) {
  console.error(
    "🚨 [ENV] Using TEST Stripe key in PRODUCTION! Please update to live key.",
  );
}

if (IS_PRODUCTION && STRIPE_PUBLISHABLE_KEY.includes("VOTRE_CLE")) {
  console.error(
    "🚨 [ENV] Stripe key not configured! Please set your production key.",
  );
}

// Log de la configuration au démarrage (sans exposer les clés sensibles)
console.log(`📱 [ENV] Environment: ${ENV.name}`);
console.log(`📱 [ENV] API URL: ${ENV.apiUrl}`);
console.log(
  `📱 [ENV] Stripe Key: ${STRIPE_PUBLISHABLE_KEY.substring(0, 12)}...`,
);
