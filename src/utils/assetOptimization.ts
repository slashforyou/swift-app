/**
 * Asset Optimization Utilities
 * 
 * Centralise les bonnes pratiques pour l'optimisation des assets dans l'app.
 * 
 * ✅ AUDIT ASSETS (2 Jan 2026):
 * - Images statiques: Aucune (assets/images vide)
 * - Fonts: SpaceMono-Regular.ttf (non utilisée, font système préférée)
 * - Android: Splash screens + launcher icons déjà en WebP (optimisé)
 * - Runtime: expo-image v3.0.11 installé avec caching natif
 * 
 * @see imageCompression.ts pour la compression d'images runtime
 */

import { Image } from 'expo-image';

// ============================================================================
// CONFIGURATION DU CACHE D'IMAGES (expo-image)
// ============================================================================

/**
 * Stratégies de cache pour expo-image
 * @see https://docs.expo.dev/versions/latest/sdk/image/#cachepoilcy
 */
export const IMAGE_CACHE_POLICIES = {
    /** Cache en mémoire uniquement (rapide, volatile) */
    MEMORY_ONLY: 'memory',
    
    /** Cache disque + mémoire (persistant, recommandé) */
    DISK: 'disk',
    
    /** Cache disque + mémoire avec priorité à la fraîcheur */
    MEMORY_AND_DISK: 'memory-disk',
    
    /** Pas de cache (à éviter sauf cas spécifiques) */
    NONE: 'none',
} as const;

/**
 * Configuration par défaut pour les images de l'app
 */
export const DEFAULT_IMAGE_CONFIG = {
    /** Politique de cache par défaut */
    cachePolicy: IMAGE_CACHE_POLICIES.DISK,
    
    /** Transition de chargement (ms) */
    transition: 200,
    
    /** Placeholder pendant le chargement */
    placeholder: undefined, // Utilise le blurhash si disponible
    
    /** Content fit par défaut */
    contentFit: 'cover' as const,
};

// ============================================================================
// PRÉCHARGEMENT D'IMAGES
// ============================================================================

/**
 * Précharge une liste d'images pour améliorer le temps d'affichage
 * Utile pour les images critiques comme les logos, avatars, etc.
 * 
 * @param urls Liste des URLs à précharger
 * @returns Promise qui se résout quand toutes les images sont en cache
 * 
 * @example
 * ```typescript
 * // Précharger les images du job avant navigation
 * await preloadImages(job.photos.map(p => p.url));
 * navigation.navigate('JobDetails', { jobId: job.id });
 * ```
 */
export async function preloadImages(urls: string[]): Promise<void> {
    if (!urls || urls.length === 0) return;
    
    try {
        await Promise.all(
            urls.map(url => Image.prefetch(url))
        );
        console.log(`✅ [AssetOptimization] Preloaded ${urls.length} images`);
    } catch (error) {
        console.warn('⚠️ [AssetOptimization] Some images failed to preload:', error);
    }
}

/**
 * Précharge une seule image
 * 
 * @param url URL de l'image à précharger
 */
export async function preloadImage(url: string): Promise<boolean> {
    if (!url) return false;
    
    try {
        await Image.prefetch(url);
        return true;
    } catch {
        return false;
    }
}

// ============================================================================
// GESTION DU CACHE
// ============================================================================

/**
 * Vide le cache d'images (utile pour le debugging ou la mise à jour forcée)
 * 
 * @returns Promise qui se résout quand le cache est vidé
 */
export async function clearImageCache(): Promise<void> {
    try {
        await Image.clearDiskCache();
        await Image.clearMemoryCache();
        console.log('✅ [AssetOptimization] Image cache cleared');
    } catch (error) {
        console.error('❌ [AssetOptimization] Failed to clear cache:', error);
    }
}

/**
 * Vide uniquement le cache mémoire (garde le cache disque)
 * Utile quand l'app utilise trop de RAM
 */
export async function clearMemoryCache(): Promise<void> {
    try {
        await Image.clearMemoryCache();
        console.log('✅ [AssetOptimization] Memory cache cleared');
    } catch (error) {
        console.error('❌ [AssetOptimization] Failed to clear memory cache:', error);
    }
}

// ============================================================================
// OPTIMISATION DES URLs D'IMAGES
// ============================================================================

/**
 * Construit une URL optimisée pour les images de storage Google Cloud
 * Ajoute les paramètres de redimensionnement si supportés
 * 
 * @param baseUrl URL de base de l'image
 * @param width Largeur souhaitée
 * @param height Hauteur souhaitée (optionnel)
 * @returns URL optimisée
 * 
 * @example
 * ```typescript
 * const optimizedUrl = getOptimizedImageUrl(photo.url, 400);
 * // Retourne: https://storage.googleapis.com/.../image.jpg?width=400
 * ```
 */
export function getOptimizedImageUrl(
    baseUrl: string,
    width: number,
    height?: number
): string {
    if (!baseUrl) return '';
    
    // Pour Google Cloud Storage, on peut utiliser les transformations d'image
    // Note: Cela nécessite Cloud CDN ou un service de transformation d'image
    // Pour l'instant, on retourne l'URL telle quelle
    // TODO: Implémenter avec Cloud CDN ou imgix si disponible
    
    return baseUrl;
}

// ============================================================================
// FORMATS D'IMAGES RECOMMANDÉS
// ============================================================================

/**
 * Formats d'images par priorité (le navigateur/app choisit le meilleur supporté)
 */
export const PREFERRED_IMAGE_FORMATS = [
    'webp',  // Meilleure compression, supporté par expo-image
    'avif',  // Encore meilleure compression, support limité
    'jpeg',  // Fallback universel
    'png',   // Pour les images avec transparence
];

/**
 * Vérifie si une URL pointe vers un format d'image optimisé
 */
export function isOptimizedFormat(url: string): boolean {
    if (!url) return false;
    
    const extension = url.split('.').pop()?.toLowerCase();
    return extension === 'webp' || extension === 'avif';
}

// ============================================================================
// BLURHASH
// ============================================================================

/**
 * Placeholder blurhash par défaut pour les images en chargement
 * Génère un fond dégradé gris discret
 */
export const DEFAULT_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

/**
 * Génère un placeholder de couleur unie basé sur une couleur hex
 * 
 * @param hexColor Couleur en format hex (#RRGGBB)
 * @returns Blurhash de couleur unie
 */
export function getSolidColorBlurhash(_hexColor: string): string {
    // Pour un placeholder solide, on utilise un blurhash très simple
    // Note: Un vrai blurhash solide nécessiterait une bibliothèque de génération
    return DEFAULT_BLURHASH;
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default {
    IMAGE_CACHE_POLICIES,
    DEFAULT_IMAGE_CONFIG,
    DEFAULT_BLURHASH,
    preloadImages,
    preloadImage,
    clearImageCache,
    clearMemoryCache,
    getOptimizedImageUrl,
    isOptimizedFormat,
};
