// src/components/DevTools/AutoTestInterface.tsx
/**
 * AutoTestInterface - Interface pour contrôler et voir les tests automatisés
 * Permet de lancer des tests, voir les résultats et monitorer l'exécution
 */

import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { testController, TestResult, TestSession } from '../../services/testController';
import { LogViewer } from './LogViewer';

interface AutoTestInterfaceProps {
  visible: boolean;
  onClose: () => void;
}

export const AutoTestInterface: React.FC<AutoTestInterfaceProps> = ({
  visible,
  onClose,
}) => {
  const [currentSession, setCurrentSession] = useState<TestSession | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [autoTestEnabled, setAutoTestEnabled] = useState(true);
  const [showLogViewer, setShowLogViewer] = useState(false);

  useEffect(() => {
    if (visible) {
      refreshStatus();
      
      // Setup listener for test events
      const unsubscribe = testController.addEventListener((event) => {
        handleTestEvent(event);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [visible]);

  const refreshStatus = () => {
    const session = testController.getCurrentSession();
    const sessionStats = testController.getSessionStats();
    const running = testController.isSessionRunning();
    
    setCurrentSession(session);
    setStats(sessionStats);
    setIsRunning(running);
    
    if (session) {
      setResults(session.results);
    }
  };

  const handleTestEvent = (event: any) => {
    if (event.type === 'sessionStarted' || event.type === 'commandCompleted' || event.type === 'commandFailed') {
      refreshStatus();
    }
  };

  // Quick test methods
  const runQuickNavigationTest = async () => {
    try {
      await (global as any).copilotAPI.quickTest.navigateToBusinessPage();
      Alert.alert('✅ Test Terminé', 'Navigation vers Business Page réussie');
    } catch (error: any) {
      Alert.alert('❌ Test Échoué', error.message);
    }
  };

  const runSessionLoggerTest = async () => {
    try {
      const results = await (global as any).copilotAPI.quickTest.testSessionLogger();
      Alert.alert('✅ Test Terminé', `Session Logger test: ${results.filter((r: any) => r.success).length}/${results.length} réussis`);
    } catch (error: any) {
      Alert.alert('❌ Test Échoué', error.message);
    }
  };

  const runFullAppTest = async () => {
    try {
      const results = await (global as any).copilotAPI.quickTest.fullAppTest();
      const passed = results.filter((r: any) => r.success).length;
      Alert.alert('✅ Test Complet Terminé', `${passed}/${results.length} commandes réussies`);
    } catch (error: any) {
      Alert.alert('❌ Test Échoué', error.message);
    }
  };

  const stopCurrentTest = () => {
    testController.stopTestSession();
    Alert.alert('🛑 Test Arrêté', 'Exécution des tests interrompue');
  };

  const clearResults = () => {
    setResults([]);
    setCurrentSession(null);
    setStats(null);
  };

  if (!__DEV__) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🤖 Auto Test Interface</Text>
          <TouchableOpacity
            style={[styles.button, styles.closeButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Status Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Status</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Auto Test:</Text>
                <Switch
                  value={autoTestEnabled}
                  onValueChange={setAutoTestEnabled}
                  trackColor={{ false: '#767577', true: '#34C759' }}
                />
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>État:</Text>
                <Text style={[styles.statusValue, { color: isRunning ? '#FF9500' : '#34C759' }]}>
                  {isRunning ? '🏃 En cours' : '⏸️ Arrêté'}
                </Text>
              </View>
              {currentSession && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Session:</Text>
                  <Text style={styles.statusValue}>{currentSession.sessionId}</Text>
                </View>
              )}
              {stats && (
                <>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Commandes:</Text>
                    <Text style={styles.statusValue}>
                      {stats.passed}/{stats.total} ✅
                    </Text>
                  </View>
                  {stats.failed > 0 && (
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Échecs:</Text>
                      <Text style={[styles.statusValue, { color: '#FF3B30' }]}>
                        {stats.failed} ❌
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Quick Tests Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Tests Rapides</Text>
            <View style={styles.buttonGrid}>
              <TouchableOpacity
                style={[styles.testButton, styles.navTestButton]}
                onPress={runQuickNavigationTest}
                disabled={isRunning}
              >
                <Text style={styles.testButtonText}>🧭 Navigation</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.testButton, styles.logTestButton]}
                onPress={runSessionLoggerTest}
                disabled={isRunning}
              >
                <Text style={styles.testButtonText}>📄 Session Logger</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.testButton, styles.fullTestButton]}
                onPress={runFullAppTest}
                disabled={isRunning}
              >
                <Text style={styles.testButtonText}>🚀 Test Complet</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Control Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎛️ Contrôles</Text>
            <View style={styles.buttonGrid}>
              <TouchableOpacity
                style={[styles.controlButton, styles.refreshButton]}
                onPress={refreshStatus}
              >
                <Text style={styles.controlButtonText}>🔄 Rafraîchir</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, styles.logsButton]}
                onPress={() => setShowLogViewer(true)}
              >
                <Text style={styles.controlButtonText}>📄 Logs Détaillés</Text>
              </TouchableOpacity>
              
              {isRunning && (
                <TouchableOpacity
                  style={[styles.controlButton, styles.stopButton]}
                  onPress={stopCurrentTest}
                >
                  <Text style={styles.controlButtonText}>🛑 Arrêter</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.controlButton, styles.clearButton]}
                onPress={clearResults}
              >
                <Text style={styles.controlButtonText}>🗑️ Effacer</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Results Section */}
          {results.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Résultats ({results.length})</Text>
              <ScrollView style={styles.resultsContainer}>
                {results.map((result, index) => (
                  <View
                    key={result.commandId}
                    style={[
                      styles.resultItem,
                      { backgroundColor: result.success ? '#1a4d1a' : '#4d1a1a' }
                    ]}
                  >
                    <View style={styles.resultHeader}>
                      <Text style={styles.resultIndex}>#{index + 1}</Text>
                      <Text style={styles.resultStatus}>
                        {result.success ? '✅' : '❌'}
                      </Text>
                      <Text style={styles.resultDuration}>
                        {result.duration}ms
                      </Text>
                    </View>
                    <Text style={styles.resultCommand}>
                      ID: {result.commandId}
                    </Text>
                    {result.error && (
                      <Text style={styles.resultError}>
                        Erreur: {result.error}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Copilot Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 Instructions Copilot</Text>
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionText}>
                • global.copilotAPI.sendCommand(command)
              </Text>
              <Text style={styles.instructionText}>
                • global.copilotAPI.sendBatch(commands)
              </Text>
              <Text style={styles.instructionText}>
                • global.copilotAPI.quickTest.navigateToBusinessPage()
              </Text>
              <Text style={styles.instructionText}>
                • global.copilotAPI.quickTest.testSessionLogger()
              </Text>
              <Text style={styles.instructionText}>
                • global.copilotAPI.quickTest.fullAppTest()
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
      
      {/* Log Viewer Modal */}
      <LogViewer
        visible={showLogViewer}
        onClose={() => setShowLogViewer(false)}
      />
    </Modal>
  );
};

// Bouton pour ouvrir l'interface Auto Test
export const AutoTestButton: React.FC = () => {
  const [showInterface, setShowInterface] = useState(false);

  if (!__DEV__) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={buttonStyles.autoTestButton}
        onPress={() => setShowInterface(true)}
      >
        <Text style={buttonStyles.autoTestButtonText}>🤖 Auto Test</Text>
      </TouchableOpacity>

      <AutoTestInterface
        visible={showInterface}
        onClose={() => setShowInterface(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#2a2a2a',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusCard: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    color: '#999',
    fontSize: 14,
  },
  statusValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  testButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  navTestButton: {
    backgroundColor: '#007AFF',
  },
  logTestButton: {
    backgroundColor: '#34C759',
  },
  fullTestButton: {
    backgroundColor: '#FF9500',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  controlButton: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#5856D6',
  },
  logsButton: {
    backgroundColor: '#007AFF',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  clearButton: {
    backgroundColor: '#8E8E93',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  resultsContainer: {
    maxHeight: 200,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 8,
  },
  resultItem: {
    padding: 8,
    marginBottom: 4,
    borderRadius: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultIndex: {
    color: '#999',
    fontSize: 12,
    marginRight: 8,
  },
  resultStatus: {
    fontSize: 14,
    marginRight: 8,
  },
  resultDuration: {
    color: '#999',
    fontSize: 12,
    marginLeft: 'auto',
  },
  resultCommand: {
    color: '#fff',
    fontSize: 12,
  },
  resultError: {
    color: '#ff6b6b',
    fontSize: 11,
    fontStyle: 'italic',
  },
  instructionsCard: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
  },
  instructionText: {
    color: '#00ff00',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});

const buttonStyles = StyleSheet.create({
  autoTestButton: {
    position: 'absolute',
    bottom: 160,
    left: 20,
    backgroundColor: '#5856D6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  autoTestButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export { buttonStyles as autoTestButtonStyles };
