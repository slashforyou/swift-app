/**
 * usePerformanceMetrics - Hook pour mesurer les performances des écrans React
 * 
 * Mesure automatiquement :
 * - Temps de mount du composant
 * - Temps jusqu'à l'interactivité
 * - Temps de démontage
 * 
 * @example
 * ```tsx
 * function MyScreen() {
 *   const perf = usePerformanceMetrics('MyScreen');
 *   
 *   useEffect(() => {
 *     // Après le chargement des données
 *     perf.markInteractive();
 *   }, [data]);
 *   
 *   return <View>...</View>;
 * }
 * ```
 */

import { useEffect, useRef } from 'react';
import { performanceMonitor } from '../utils/performanceMonitoring';
import { analytics } from '../services/analytics';

interface PerformanceMetricsResult {
    /**
     * Marque l'écran comme interactif (données chargées, prêt pour l'utilisateur)
     */
    markInteractive: () => void;
    
    /**
     * Marque un événement personnalisé
     */
    markCustomEvent: (eventName: string) => void;
    
    /**
     * Obtient le temps écoulé depuis le mount
     */
    getElapsedTime: () => number;
}

/**
 * Hook pour mesurer les performances d'un écran
 * 
 * @param screenName Nom de l'écran (ex: 'JobDetails', 'Home')
 * @param options Options de configuration
 */
export function usePerformanceMetrics(
    screenName: string,
    options?: {
        /** Désactiver le tracking (utile pour les tests) */
        disabled?: boolean;
        /** Données supplémentaires à inclure dans les métriques */
        context?: Record<string, any>;
    }
): PerformanceMetricsResult {
    const mountTimeRef = useRef<number>(Date.now());
    const hasMarkedInteractive = useRef<boolean>(false);
    const isDisabled = options?.disabled ?? false;
    
    // Marquer le début du rendu au mount
    useEffect(() => {
        if (isDisabled) return;
        
        const startTime = mountTimeRef.current;
        const mountTime = Date.now() - startTime;
        
        // Tracker le temps de mount
        performanceMonitor.measureComponentMount(screenName, mountTime);
        performanceMonitor.markScreenStart(screenName);
        
        console.log(`📊 [PERF] Screen mounted: ${screenName} in ${mountTime}ms`);
        
        // Cleanup au démontage
        return () => {
            const totalTime = Date.now() - startTime;
            
            // Tracker le temps total passé sur l'écran
            analytics.trackScreenTime(screenName, totalTime);
            
            console.log(`📊 [PERF] Screen unmounted: ${screenName} after ${totalTime}ms`);
        };
    }, [screenName, isDisabled]);
    
    const markInteractive = () => {
        if (isDisabled || hasMarkedInteractive.current) return;
        
        hasMarkedInteractive.current = true;
        performanceMonitor.markScreenInteractive(screenName);
        
        const timeToInteractive = Date.now() - mountTimeRef.current;
        console.log(`📊 [PERF] Screen interactive: ${screenName} in ${timeToInteractive}ms`);
    };
    
    const markCustomEvent = (eventName: string) => {
        if (isDisabled) return;
        
        const elapsed = Date.now() - mountTimeRef.current;
        performanceMonitor.mark(`${screenName}_${eventName}`, {
            screen: screenName,
            elapsed,
            ...options?.context,
        });
    };
    
    const getElapsedTime = () => {
        return Date.now() - mountTimeRef.current;
    };
    
    return {
        markInteractive,
        markCustomEvent,
        getElapsedTime,
    };
}

/**
 * Hook simplifié pour tracker uniquement le temps passé sur un écran
 */
export function useScreenTime(screenName: string): void {
    const mountTimeRef = useRef<number>(Date.now());
    
    useEffect(() => {
        const startTime = mountTimeRef.current;
        
        return () => {
            const totalTime = Date.now() - startTime;
            analytics.trackScreenTime(screenName, totalTime);
        };
    }, [screenName]);
}

/**
 * Hook pour mesurer le temps d'exécution d'une opération async
 * 
 * @example
 * ```tsx
 * const { measureAsync } = useAsyncPerformance();
 * 
 * const loadData = async () => {
 *   const result = await measureAsync('fetchJobDetails', fetchJobDetails());
 *   setData(result);
 * };
 * ```
 */
export function useAsyncPerformance() {
    const measureAsync = async <T>(
        operationName: string,
        promise: Promise<T>,
        context?: Record<string, any>
    ): Promise<T> => {
        const startTime = Date.now();
        
        try {
            const result = await promise;
            const duration = Date.now() - startTime;
            
            analytics.trackPerformance({
                metric_name: operationName,
                value: duration,
                unit: 'ms',
                context: { ...context, success: true },
            });
            
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            
            analytics.trackPerformance({
                metric_name: `${operationName}_failed`,
                value: duration,
                unit: 'ms',
                context: { ...context, success: false },
            });
            
            throw error;
        }
    };
    
    return { measureAsync };
}

export default usePerformanceMetrics;
