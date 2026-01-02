/**
 * Performance Monitoring - Métriques de performance spécialisées
 * 
 * Système centralisé pour mesurer et tracker les performances de l'app :
 * - App startup time
 * - Screen render times
 * - Navigation transitions
 * - API response times
 * - Memory usage
 * - Bundle/Component load times
 * 
 * @see analytics.ts pour l'envoi des métriques au backend
 */

import { analytics } from '../services/analytics';

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMark {
    name: string;
    timestamp: number;
    context?: Record<string, any>;
}

export interface PerformanceMeasure {
    name: string;
    startMark: string;
    endMark: string;
    duration: number;
    context?: Record<string, any>;
}

export interface ScreenMetrics {
    screenName: string;
    renderTime: number;
    interactiveTime: number;
    mountTime: number;
}

export interface AppStartupMetrics {
    coldStartTime: number;
    timeToFirstRender: number;
    timeToInteractive: number;
    jsLoadTime: number;
}

// ============================================================================
// PERFORMANCE MONITORING CLASS
// ============================================================================

class PerformanceMonitor {
    private marks: Map<string, PerformanceMark> = new Map();
    private measures: PerformanceMeasure[] = [];
    private appStartTime: number = 0;
    private isEnabled: boolean = true;
    
    // Thresholds pour les alertes (en ms)
    private thresholds = {
        screenRender: 300,      // Max 300ms pour afficher un écran
        apiCall: 2000,          // Max 2s pour un appel API
        navigation: 500,        // Max 500ms pour une transition
        appStart: 3000,         // Max 3s pour le démarrage
        componentMount: 100,    // Max 100ms pour monter un composant
    };
    
    constructor() {
        this.appStartTime = Date.now();
    }
    
    // ========== MARKS (Points de mesure) ==========
    
    /**
     * Crée un mark de performance (point de départ ou d'arrivée)
     */
    mark(name: string, context?: Record<string, any>): void {
        if (!this.isEnabled) return;
        
        const mark: PerformanceMark = {
            name,
            timestamp: Date.now(),
            context,
        };
        
        this.marks.set(name, mark);
        console.log(`⏱️ [PERF] Mark: ${name}`);
    }
    
    /**
     * Mesure le temps entre deux marks
     */
    measure(name: string, startMarkName: string, endMarkName?: string): number | null {
        if (!this.isEnabled) return null;
        
        const startMark = this.marks.get(startMarkName);
        const endMark = endMarkName 
            ? this.marks.get(endMarkName) 
            : { timestamp: Date.now(), name: 'now', context: undefined };
        
        if (!startMark || !endMark) {
            console.warn(`⚠️ [PERF] Mark not found: start="${startMarkName}", end="${endMarkName || 'now'}"`);
            return null;
        }
        
        const duration = endMark.timestamp - startMark.timestamp;
        
        const measure: PerformanceMeasure = {
            name,
            startMark: startMarkName,
            endMark: endMarkName || 'now',
            duration,
            context: { ...startMark.context, ...endMark.context },
        };
        
        this.measures.push(measure);
        
        // Envoyer à analytics
        analytics.trackPerformance({
            metric_name: name,
            value: duration,
            unit: 'ms',
            context: measure.context,
        });
        
        console.log(`📊 [PERF] Measure: ${name} = ${duration}ms`);
        
        return duration;
    }
    
    // ========== APP STARTUP ==========
    
    /**
     * Marque le début du démarrage de l'app (appelé dans App.tsx)
     */
    markAppStart(): void {
        this.mark('app_start');
    }
    
    /**
     * Marque quand le premier écran est rendu
     */
    markFirstRender(): void {
        this.mark('first_render');
        this.measure('time_to_first_render', 'app_start', 'first_render');
    }
    
    /**
     * Marque quand l'app est interactive
     */
    markInteractive(): void {
        this.mark('app_interactive');
        const startupTime = this.measure('time_to_interactive', 'app_start', 'app_interactive');
        
        if (startupTime && startupTime > this.thresholds.appStart) {
            console.warn(`⚠️ [PERF] Slow app startup: ${startupTime}ms (threshold: ${this.thresholds.appStart}ms)`);
        }
    }
    
    // ========== SCREEN METRICS ==========
    
    /**
     * Marque le début du rendu d'un écran
     */
    markScreenStart(screenName: string): void {
        this.mark(`screen_start_${screenName}`, { screen: screenName });
    }
    
    /**
     * Marque la fin du rendu d'un écran
     */
    markScreenEnd(screenName: string): void {
        this.mark(`screen_end_${screenName}`, { screen: screenName });
        const renderTime = this.measure(
            `screen_render_${screenName}`,
            `screen_start_${screenName}`,
            `screen_end_${screenName}`
        );
        
        if (renderTime && renderTime > this.thresholds.screenRender) {
            console.warn(`⚠️ [PERF] Slow screen render: ${screenName} = ${renderTime}ms (threshold: ${this.thresholds.screenRender}ms)`);
        }
    }
    
    /**
     * Marque quand un écran devient interactif
     */
    markScreenInteractive(screenName: string): void {
        this.mark(`screen_interactive_${screenName}`, { screen: screenName });
        this.measure(
            `screen_time_to_interactive_${screenName}`,
            `screen_start_${screenName}`,
            `screen_interactive_${screenName}`
        );
    }
    
    // ========== NAVIGATION ==========
    
    /**
     * Marque le début d'une navigation
     */
    markNavigationStart(from: string, to: string): void {
        this.mark(`nav_${from}_to_${to}`, { from, to });
    }
    
    /**
     * Marque la fin d'une navigation
     */
    markNavigationEnd(from: string, to: string): void {
        const markName = `nav_${from}_to_${to}`;
        const duration = this.measure(`navigation_${from}_to_${to}`, markName);
        
        if (duration && duration > this.thresholds.navigation) {
            console.warn(`⚠️ [PERF] Slow navigation: ${from} → ${to} = ${duration}ms`);
        }
    }
    
    // ========== API CALLS ==========
    
    /**
     * Wrapper pour mesurer un appel API
     */
    async measureAPI<T>(
        endpoint: string,
        method: string,
        apiCall: () => Promise<T>
    ): Promise<T> {
        const markName = `api_${method}_${endpoint.replace(/\//g, '_')}`;
        this.mark(markName, { endpoint, method });
        
        const startTime = Date.now();
        
        try {
            const result = await apiCall();
            const duration = Date.now() - startTime;
            
            analytics.trackAPICall(endpoint, method, duration, 200);
            
            if (duration > this.thresholds.apiCall) {
                console.warn(`⚠️ [PERF] Slow API: ${method} ${endpoint} = ${duration}ms`);
            }
            
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            analytics.trackAPICall(endpoint, method, duration, 500);
            throw error;
        }
    }
    
    // ========== COMPONENT METRICS ==========
    
    /**
     * Mesure le temps de mount d'un composant
     */
    measureComponentMount(componentName: string, mountTime: number): void {
        analytics.trackPerformance({
            metric_name: `component_mount_${componentName}`,
            value: mountTime,
            unit: 'ms',
        });
        
        if (mountTime > this.thresholds.componentMount) {
            console.warn(`⚠️ [PERF] Slow component mount: ${componentName} = ${mountTime}ms`);
        }
    }
    
    // ========== UTILITIES ==========
    
    /**
     * Retourne toutes les mesures collectées
     */
    getMeasures(): PerformanceMeasure[] {
        return [...this.measures];
    }
    
    /**
     * Retourne un résumé des performances
     */
    getSummary(): Record<string, any> {
        const summary: Record<string, any> = {
            totalMeasures: this.measures.length,
            appUptime: Date.now() - this.appStartTime,
        };
        
        // Calculer les moyennes par catégorie
        const screenRenders = this.measures.filter(m => m.name.startsWith('screen_render_'));
        const navigations = this.measures.filter(m => m.name.startsWith('navigation_'));
        
        if (screenRenders.length > 0) {
            summary.avgScreenRender = Math.round(
                screenRenders.reduce((sum, m) => sum + m.duration, 0) / screenRenders.length
            );
        }
        
        if (navigations.length > 0) {
            summary.avgNavigation = Math.round(
                navigations.reduce((sum, m) => sum + m.duration, 0) / navigations.length
            );
        }
        
        return summary;
    }
    
    /**
     * Vide les mesures (utile pour les tests)
     */
    clear(): void {
        this.marks.clear();
        this.measures = [];
    }
    
    /**
     * Active/désactive le monitoring
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const performanceMonitor = new PerformanceMonitor();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * HOC/Wrapper pour mesurer automatiquement le temps de rendu
 * Utilisation: Appeler au début et à la fin de useEffect dans un écran
 */
export function useScreenPerformance(screenName: string) {
    const startTime = Date.now();
    
    return {
        markMounted: () => {
            const mountTime = Date.now() - startTime;
            performanceMonitor.measureComponentMount(screenName, mountTime);
        },
        markInteractive: () => {
            performanceMonitor.markScreenInteractive(screenName);
        },
    };
}

/**
 * Décorateur pour mesurer le temps d'exécution d'une fonction async
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    metricName: string
): T {
    return (async (...args: Parameters<T>) => {
        const startTime = Date.now();
        try {
            const result = await fn(...args);
            const duration = Date.now() - startTime;
            
            analytics.trackPerformance({
                metric_name: metricName,
                value: duration,
                unit: 'ms',
            });
            
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            
            analytics.trackPerformance({
                metric_name: `${metricName}_failed`,
                value: duration,
                unit: 'ms',
            });
            
            throw error;
        }
    }) as T;
}

export default performanceMonitor;
