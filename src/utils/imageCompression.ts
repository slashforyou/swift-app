/**
 * Image Compression Utility
 * 
 * Compresse les images pour optimiser le stockage et l'upload
 * - Limite la résolution max à 1920x1080
 * - Optimise la qualité pour ~400KB par image
 * - Préserve le ratio aspect original
 */

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface CompressionOptions {
    /**
     * Largeur maximale de l'image (défaut: 1920px)
     */
    maxWidth?: number;
    
    /**
     * Hauteur maximale de l'image (défaut: 1080px)
     */
    maxHeight?: number;
    
    /**
     * Qualité de compression (0-1, défaut: 0.6)
     * 0.6 = ~400KB pour image moyenne
     */
    quality?: number;
    
    /**
     * Format de sortie (défaut: JPEG)
     */
    format?: SaveFormat;
}

export interface CompressionResult {
    /**
     * URI de l'image compressée
     */
    uri: string;
    
    /**
     * Largeur de l'image compressée
     */
    width: number;
    
    /**
     * Hauteur de l'image compressée
     */
    height: number;
    
    /**
     * Taille estimée en octets
     */
    estimatedSize?: number;
}

/**
 * Compresse une image tout en préservant son ratio aspect
 * 
 * @param imageUri URI de l'image source
 * @param options Options de compression
 * @returns Image compressée
 * 
 * @example
 * ```typescript
 * const result = await compressImage('file:///path/to/image.jpg');
 * console.log(result.uri); // URI de l'image compressée
 * ```
 */
export async function compressImage(
    imageUri: string,
    options: CompressionOptions = {}
): Promise<CompressionResult> {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.6,
        format = SaveFormat.JPEG
    } = options;

    try {
        // Manipuler l'image (resize + compress)
        const manipulatedImage = await manipulateAsync(
            imageUri,
            [
                {
                    resize: {
                        width: maxWidth,
                        height: maxHeight,
                    }
                }
            ],
            {
                compress: quality,
                format: format,
            }
        );

        return {
            uri: manipulatedImage.uri,
            width: manipulatedImage.width,
            height: manipulatedImage.height,
        };
    } catch (error) {
        console.error('Error compressing image:', error);
        throw new Error('Failed to compress image');
    }
}

/**
 * Valide qu'une image ne dépasse pas les limites de taille
 * 
 * @param width Largeur de l'image
 * @param height Hauteur de l'image
 * @param maxWidth Largeur max autorisée
 * @param maxHeight Hauteur max autorisée
 * @returns true si l'image est dans les limites
 */
export function isImageWithinLimits(
    width: number,
    height: number,
    maxWidth: number = 1920,
    maxHeight: number = 1080
): boolean {
    return width <= maxWidth && height <= maxHeight;
}

/**
 * Calcule les dimensions optimales en préservant le ratio aspect
 * 
 * @param originalWidth Largeur originale
 * @param originalHeight Hauteur originale
 * @param maxWidth Largeur max
 * @param maxHeight Hauteur max
 * @returns Nouvelles dimensions
 */
export function calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number = 1920,
    maxHeight: number = 1080
): { width: number; height: number } {
    // Si l'image est déjà dans les limites, pas besoin de resize
    if (isImageWithinLimits(originalWidth, originalHeight, maxWidth, maxHeight)) {
        return { width: originalWidth, height: originalHeight };
    }

    // Calculer le ratio de scaling nécessaire
    const widthRatio = maxWidth / originalWidth;
    const heightRatio = maxHeight / originalHeight;
    
    // Utiliser le ratio le plus petit pour préserver le ratio aspect
    const scalingRatio = Math.min(widthRatio, heightRatio);

    return {
        width: Math.floor(originalWidth * scalingRatio),
        height: Math.floor(originalHeight * scalingRatio),
    };
}

/**
 * Estime la taille en octets d'une image compressée
 * Formule approximative basée sur la résolution et la qualité
 * 
 * @param width Largeur
 * @param height Hauteur
 * @param quality Qualité (0-1)
 * @returns Taille estimée en octets
 */
export function estimateCompressedSize(
    width: number,
    height: number,
    quality: number = 0.6
): number {
    // Formule approximative: pixels * quality * facteur compression JPEG (~0.1)
    const pixels = width * height;
    const estimatedBytes = pixels * quality * 0.1;
    return Math.floor(estimatedBytes);
}
