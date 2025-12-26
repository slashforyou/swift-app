/**
 * Navigation service avec analytics intégré
 * Gère les transitions d'écrans et tracking automatique
 */

import { analytics } from './analytics';
import { logger } from './logger';

interface NavigationOptions {
  params?: Record<string, any>;
  trackAnalytics?: boolean;
  replace?: boolean;
}

interface NavigationEvent {
  from: string;
  to: string;
  timestamp: string;
  duration?: number;
  params?: Record<string, any>;
}

export class NavigationService {
  private static instance: NavigationService;
  private currentScreen: string = 'Home';
  private navigationHistory: NavigationEvent[] = [];
  private screenStartTime: number = Date.now();
  
  public static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  /**
   * Naviguer vers un écran avec tracking automatique
   */
  async navigate(
    screenName: string, 
    options: NavigationOptions = {}
  ): Promise<void> {
    try {
      const previousScreen = this.currentScreen;
      const now = Date.now();
      const timeOnScreen = now - this.screenStartTime;

      // Logger la navigation
      logger.info('Screen navigation', {
        from: previousScreen,
        to: screenName,
        timeOnPreviousScreen: timeOnScreen,
        params: options.params
      });

      // Track analytics si activé (par défaut oui)
      if (options.trackAnalytics !== false) {
        // Track le temps passé sur l'écran précédent
        if (timeOnScreen > 1000) { // Minimum 1 seconde
          analytics.trackScreenTime(previousScreen, timeOnScreen);
        }

        // Track la vue du nouvel écran
        analytics.trackScreenView(screenName, previousScreen);
      }

      // Sauvegarder l'événement de navigation
      const navigationEvent: NavigationEvent = {
        from: previousScreen,
        to: screenName,
        timestamp: new Date().toISOString(),
        duration: timeOnScreen,
        params: options.params
      };

      this.navigationHistory.push(navigationEvent);

      // Garder seulement les 50 dernières navigations
      if (this.navigationHistory.length > 50) {
        this.navigationHistory = this.navigationHistory.slice(-50);
      }

      // Mettre à jour l'état
      this.currentScreen = screenName;
      this.screenStartTime = now;

      // TEMP_DISABLED: console.log(`🧭 [NAVIGATION] ${previousScreen} → ${screenName}`, {
        // timeOnScreen: `${(timeOnScreen / 1000).toFixed(1)}s`,
        // params: options.params
      // });

    } catch (error) {
      logger.error('Navigation error', {
        targetScreen: screenName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('Navigation error:', error);
    }
  }

  /**
   * Navigation avec remplacement (pas de retour possible)
   */
  async replace(
    screenName: string, 
    options: Omit<NavigationOptions, 'replace'> = {}
  ): Promise<void> {
    return this.navigate(screenName, { ...options, replace: true });
  }

  /**
   * Navigation arrière avec analytics
   */
  async goBack(): Promise<void> {
    try {
      const currentTime = Date.now();
      const timeOnScreen = currentTime - this.screenStartTime;
      
      logger.info('Navigation back', {
        currentScreen: this.currentScreen,
        timeOnScreen
      });

      // Track le temps passé sur l'écran actuel
      if (timeOnScreen > 1000) {
        analytics.trackScreenTime(this.currentScreen, timeOnScreen);
      }

      // Track l'action de retour
      analytics.trackUserAction('navigation_back', {
        current_screen: this.currentScreen,
        time_on_screen_seconds: Math.round(timeOnScreen / 1000)
      });

      // Retrouver l'écran précédent dans l'historique
      const history = this.getNavigationHistory();
      const previousScreen = history.length >= 2 ? history[history.length - 2].to : 'Home';

      this.currentScreen = previousScreen;
      this.screenStartTime = currentTime;

      // TEMP_DISABLED: console.log(`🔙 [NAVIGATION] Back to ${previousScreen}`);

    } catch (error) {
      logger.error('Navigation back error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Obtenir l'écran actuel
   */
  getCurrentScreen(): string {
    return this.currentScreen;
  }

  /**
   * Obtenir l'historique de navigation
   */
  getNavigationHistory(): NavigationEvent[] {
    return [...this.navigationHistory];
  }

  /**
   * Obtenir les statistiques de navigation
   */
  getNavigationStats() {
    const history = this.navigationHistory;
    const screenCounts: Record<string, number> = {};
    const screenTimes: Record<string, number[]> = {};

    history.forEach(nav => {
      // Compter les visites
      screenCounts[nav.to] = (screenCounts[nav.to] || 0) + 1;
      
      // Accumuler les temps
      if (nav.duration && nav.duration > 1000) {
        if (!screenTimes[nav.from]) {
          screenTimes[nav.from] = [];
        }
        screenTimes[nav.from].push(nav.duration);
      }
    });

    // Calculer les temps moyens
    const averageScreenTimes: Record<string, number> = {};
    Object.entries(screenTimes).forEach(([screen, times]) => {
      const average = times.reduce((a, b) => a + b, 0) / times.length;
      averageScreenTimes[screen] = Math.round(average);
    });

    return {
      totalNavigations: history.length,
      screenVisitCounts: screenCounts,
      averageTimePerScreen: averageScreenTimes,
      currentSession: {
        currentScreen: this.currentScreen,
        timeOnCurrentScreen: Date.now() - this.screenStartTime
      }
    };
  }

  /**
   * Effacer l'historique de navigation
   */
  clearHistory(): void {
    logger.info('Navigation history cleared');
    this.navigationHistory = [];
  }

  /**
   * Initialiser le service avec l'écran de démarrage
   */
  initialize(startScreen: string = 'Home'): void {
    this.currentScreen = startScreen;
    this.screenStartTime = Date.now();
    this.navigationHistory = [];
    
    logger.info('Navigation service initialized', { startScreen });
    // TEMP_DISABLED: console.log(`🧭 [NAVIGATION] Service initialized on ${startScreen}`);
  }
}

// Export de l'instance singleton
export const navigationService = NavigationService.getInstance();