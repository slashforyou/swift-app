/**
 * useAnalytics Hook - Hook React pour intégrer facilement les analytics avec logging
 */

import { useCallback, useEffect, useRef } from 'react';
import { analytics, trackButtonPress, trackFormEvent, trackJobStep, trackNavigation, trackPayment } from '../services/analytics';
import { logger } from '../services/logger';

export const useAnalytics = (screenName?: string, previousScreen?: string) => {
  const screenStartTime = useRef<number>(Date.now());
  
  // Track screen view automatically when hook is used
  useEffect(() => {
    if (screenName) {
      logger.debug('Screen view tracked via hook', { screenName, previousScreen });
      trackNavigation(screenName, previousScreen);
      screenStartTime.current = Date.now();
    }

    // Cleanup: track screen time when component unmounts
    return () => {
      if (screenName) {
        const timeSpent = Date.now() - screenStartTime.current;
        if (timeSpent > 1000) { // Minimum 1 second
          analytics.trackScreenTime(screenName, timeSpent);
          logger.debug('Screen time tracked on unmount', { 
            screenName, 
            timeSpent: `${(timeSpent / 1000).toFixed(1)}s` 
          });
        }
      }
    };
  }, [screenName, previousScreen]);

  // Convenience methods for common tracking
  const track = {
    // Job related events
    jobStep: useCallback((jobId: string, currentStep: number, totalSteps: number, notes?: string) => {
      try {
        trackJobStep(jobId, currentStep, totalSteps, notes);
        logger.debug('Job step tracked via hook', { jobId, currentStep, totalSteps });
      } catch (error) {

        logger.error('Failed to track job step via hook', {
          error: error instanceof Error ? error.message : 'Unknown error',
          jobId,
          currentStep
        });
      }
    }, []),

    // Payment events
    payment: useCallback((action: 'initiated' | 'completed' | 'failed', amount: number, jobId?: string) => {
      try {
        trackPayment(action, amount, jobId);
        logger.debug('Payment event tracked via hook', { action, amount, jobId });
      } catch (error) {

        logger.error('Failed to track payment via hook', {
          error: error instanceof Error ? error.message : 'Unknown error',
          action,
          amount
        });
      }
    }, []),

    // Navigation events
    navigation: useCallback((newScreen: string, previousScreen?: string) => {
      try {
        trackNavigation(newScreen, previousScreen);
        logger.debug('Navigation tracked via hook', { newScreen, previousScreen });
      } catch (error) {

        logger.error('Failed to track navigation via hook', {
          error: error instanceof Error ? error.message : 'Unknown error',
          newScreen
        });
      }
    }, []),

    // Custom events
    event: useCallback((eventType: string, category: 'user_action' | 'business' | 'technical' | 'error', data?: Record<string, any>) => {
      try {
        analytics.trackCustomEvent(eventType, category, data);
        logger.debug('Custom event tracked via hook', { eventType, category });
      } catch (error) {

        logger.error('Failed to track custom event via hook', {
          error: error instanceof Error ? error.message : 'Unknown error',
          eventType,
          category
        });
      }
    }, []),

    // Press / tap on any element
    press: useCallback((elementName: string, context?: Record<string, any>) => {
      try {
        analytics.trackCustomEvent(`press_${elementName}`, 'user_action', {
          screen: screenName,
          ...context,
        });
        logger.debug('Press tracked via hook', { elementName, screenName });
      } catch (error) {
        logger.error('Failed to track press via hook', {
          error: error instanceof Error ? error.message : 'Unknown error',
          elementName,
        });
      }
    }, [screenName]),

    // User actions
    userAction: useCallback((action: string, context?: Record<string, any>) => {
      try {
        analytics.trackCustomEvent(`user_${action}`, 'user_action', context);
        logger.debug('User action tracked via hook', { action, context });
      } catch (error) {

        logger.error('Failed to track user action via hook', {
          error: error instanceof Error ? error.message : 'Unknown error',
          action
        });
      }
    }, []),

    // Business events
    businessEvent: useCallback((event: string, data?: Record<string, any>) => {
      analytics.trackCustomEvent(event, 'business', data);
    }, []),

    // Performance tracking
    performance: useCallback((metricName: string, value: number, unit: 'ms' | 'seconds' | 'bytes' | 'count', context?: Record<string, any>) => {
      analytics.trackPerformance({
        metric_name: metricName,
        value: value,
        unit: unit,
        context: context
      });
    }, []),

    // Error tracking
    error: useCallback((errorType: 'api_error' | 'app_crash' | 'validation_error' | 'network_error', message: string, context?: Record<string, any>) => {
      analytics.trackError({
        error_type: errorType,
        error_message: message,
        context: context
      });
    }, []),

    // Button press (tracked with button_id for grouping in analytics dashboard)
    button: useCallback((buttonId: string, extraData?: Record<string, any>) => {
      trackButtonPress(buttonId, screenName, extraData);
    }, [screenName]),

    // Form field interaction
    form: useCallback((formName: string, fieldName: string, action: 'focus' | 'blur' | 'error' | 'submit') => {
      trackFormEvent(formName, fieldName, action, screenName);
    }, [screenName]),
  };

  // Performance measurement helper
  const measureAsync = useCallback(async <T>(
    functionName: string,
    asyncFunction: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> => {
    return analytics.measureExecutionTime(functionName, asyncFunction, context);
  }, []);

  /**
   * Wrap an onPress handler to automatically track the interaction.
   * Usage: <Button onPress={withTracking(handleSubmit, 'submit_form')} />
   */
  const withTracking = useCallback(<T extends (...args: any[]) => any>(
    handler: T,
    actionName: string,
    context?: Record<string, any>,
  ): T => {
    return ((...args: any[]) => {
      track.press(actionName, context);
      return handler(...args);
    }) as T;
  }, [track]);

  return {
    track,
    withTracking,
    measureAsync,
    analytics: analytics // Direct access for advanced usage
  };
};