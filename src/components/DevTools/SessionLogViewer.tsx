// src/components/DevTools/SessionLogViewer.tsx
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { sessionLogger } from '../../services/sessionLogger';

interface SessionLogViewerProps {
  visible: boolean;
  onClose: () => void;
}

export const SessionLogViewer: React.FC<SessionLogViewerProps> = ({
  visible,
  onClose,
}) => {
  const [logContent, setLogContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const content = await sessionLogger.readLogContent();
      setLogContent(content);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de lire les logs de session');
    } finally {
      setIsLoading(false);
    }
  };

  const shareLogs = async () => {
    try {
      if (logContent) {
        await Share.share({
          message: logContent,
          title: 'SwiftApp Session Logs'
        });
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager les logs');
    }
  };

  const clearLogs = () => {
    Alert.alert(
      'Effacer les logs',
      'Voulez-vous effacer les logs de la session actuelle ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => {
            setLogContent('Logs effacés - Redémarrer l\'app pour de nouveaux logs');
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (visible) {
      loadLogs();
    }
  }, [visible]);

  if (!__DEV__) {
    return null; // Composant disponible seulement en dev
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📄 Session Logs</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.button, styles.refreshButton]}
              onPress={loadLogs}
            >
              <Text style={styles.buttonText}>🔄 Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.shareButton]}
              onPress={shareLogs}
            >
              <Text style={styles.buttonText}>📤 Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearLogs}
            >
              <Text style={styles.buttonText}>🗑️ Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement des logs...</Text>
            </View>
          ) : (
            <ScrollView style={styles.logContainer}>
              <Text style={styles.logText}>{logContent}</Text>
            </ScrollView>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Fichier: {sessionLogger.getLogFilePath()}
          </Text>
        </View>
      </View>
    </Modal>
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
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
  },
  shareButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF9500',
  },
  closeButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
  },
  logContainer: {
    flex: 1,
    padding: 12,
  },
  logText: {
    color: '#00ff00',
    fontSize: 10,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
    }),
    lineHeight: 14,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#2a2a2a',
  },
  footerText: {
    color: '#999',
    fontSize: 10,
    textAlign: 'center',
  },
});// Composant bouton pour ouvrir les logs (à placer dans un menu dev)
export const SessionLogButton: React.FC = () => {
  const [showLogs, setShowLogs] = useState(false);

  if (!__DEV__) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={logButtonStyles.logButton}
        onPress={() => setShowLogs(true)}
      >
        <Text style={logButtonStyles.logButtonText}>📄 Session Logs</Text>
      </TouchableOpacity>

      <SessionLogViewer
        visible={showLogs}
        onClose={() => setShowLogs(false)}
      />
    </>
  );
};

const logButtonStyles = StyleSheet.create({
  logButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});// Export des styles pour usage externe si nécessaire
export { logButtonStyles };
