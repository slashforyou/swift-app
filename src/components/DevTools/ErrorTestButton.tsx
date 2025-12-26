// src/components/DevTools/ErrorTestButton.tsx
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { logDebug, logError, logInfo, logWarning } from '../../services/simpleSessionLogger';

export const ErrorTestButton: React.FC = () => {
  if (!__DEV__) {
    return null; // Seulement en développement
  }

  const testDifferentErrors = () => {
    Alert.alert(
      'Test Session Logger',
      'Choisir le type d\'erreur à tester:',
      [
        {
          text: 'JavaScript Error',
          onPress: () => testJavaScriptError()
        },
        {
          text: 'Promise Rejection',
          onPress: () => testPromiseRejection()
        },
        {
          text: 'Network Error',
          onPress: () => testNetworkError()
        },
        {
          text: 'Stripe Error',
          onPress: () => testStripeError()
        },
        {
          text: 'All Log Levels',
          onPress: () => testAllLogLevels()
        },
        {
          text: 'Annuler',
          style: 'cancel'
        }
      ]
    );
  };

  const testJavaScriptError = () => {
    try {
      // Erreur volontaire
      const obj: any = null;
      obj.nonExistentProperty.value; // TypeError
    } catch (error) {
      logError('Test JavaScript Error - Exception attrapée', error, 'error-test');
    }
  };

  const testPromiseRejection = () => {
    // Promise qui sera rejetée (non gérée pour tester le global handler)
    Promise.reject(new Error('Test Promise Rejection Error - Non gérée volontairement'))
      .catch(() => {
        // On catch mais on log quand même pour le test
        logError('Test Promise Rejection - Gérée dans catch', new Error('Promise rejection test'), 'error-test');
      });
  };

  const testNetworkError = async () => {
    try {
      // Simulation d'une erreur réseau
      const response = await fetch('https://nonexistent-url-test-error.com/api/test');
      await response.json();
    } catch (error) {
      logError('Test Network Error - Erreur de connectivité simulée', {
        message: 'Network request failed',
        url: 'https://nonexistent-url-test-error.com/api/test',
        type: 'NetworkError',
        originalError: error
      }, 'network-error-test');
    }
  };

  const testStripeError = () => {
    // Simulation d'une erreur Stripe typique
    const stripeError = {
      type: 'card_error',
      code: 'card_declined',
      message: 'Your card was declined.',
      param: 'card',
      charge: 'ch_test_123456789',
      decline_code: 'generic_decline'
    };

    logError('Test Stripe Error - Carte refusée simulée', stripeError, 'stripe-error-test');
  };

  const testAllLogLevels = async () => {
    // Test tous les niveaux de log
    await logDebug('Test Debug Log', { 
      testData: { id: 123, active: true },
      timestamp: Date.now()
    }, 'log-level-test');

    await logInfo('Test Info Log - Session logger fonctionnel', 'log-level-test');
    
    await logWarning('Test Warning Log - Attention configuration', 'log-level-test');
    
    await logError('Test Error Log - Erreur simulée', {
      errorCode: 'TEST_ERROR',
      severity: 'high',
      details: 'Ceci est une erreur de test pour valider le logger'
    }, 'log-level-test');

    Alert.alert(
      'Tests terminés',
      'Tous les niveaux de log ont été testés. Vérifiez les logs de session.'
    );
  };

  return (
    <TouchableOpacity
      style={styles.errorTestButton}
      onPress={testDifferentErrors}
    >
      <Text style={styles.errorTestButtonText}>🧪 Test Errors</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  errorTestButton: {
    position: 'absolute',
    bottom: 160, // Au-dessus du bouton Session Logs
    right: 20,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  errorTestButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});