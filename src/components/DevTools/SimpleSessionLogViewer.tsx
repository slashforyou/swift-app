// src/components/DevTools/SimpleSessionLogViewer.tsx
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useTranslation } from "../../localization";
import simpleSessionLogger from "../../services/simpleSessionLogger"; // eslint-disable-line no-restricted-imports

interface SimpleSessionLogViewerProps {
  visible: boolean;
  onClose: () => void;
}

export const SimpleSessionLogViewer: React.FC<SimpleSessionLogViewerProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const [logContent, setLogContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const content = simpleSessionLogger.getFormattedLogs();
      setLogContent(content);
    } catch (_error) {
      Alert.alert(
        t("devTools.sessionLogs.readErrorTitle"),
        t("devTools.sessionLogs.readErrorMessage"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const shareLogs = async () => {
    try {
      if (logContent) {
        await Share.share({
          message: logContent,
          title: "Cobbr Session Logs (Simple)",
        });
      }
    } catch (_error) {
      Alert.alert(
        t("devTools.sessionLogs.shareErrorTitle"),
        t("devTools.sessionLogs.shareErrorMessage"),
      );
    }
  };

  const clearLogs = () => {
    Alert.alert(
      t("devTools.sessionLogs.clearTitle"),
      t("devTools.sessionLogs.clearMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("devTools.sessionLogs.clearButton"),
          style: "destructive",
          onPress: () => {
            simpleSessionLogger.clearLogs();
            simpleSessionLogger.logInfo(
              "Logs cleared by user",
              "log-management",
            );
            loadLogs();
          },
        },
      ],
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
          <Text style={styles.title}>📄 Session Logs (Simple)</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.button, styles.refreshButton]}
              onPress={loadLogs}
            >
              <Text style={styles.buttonText}>🔄</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.shareButton]}
              onPress={shareLogs}
            >
              <Text style={styles.buttonText}>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearLogs}
            >
              <Text style={styles.buttonText}>🗑️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>✕</Text>
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
            Logs en mémoire • Total: {simpleSessionLogger.getAllLogs().length}{" "}
            entrées
          </Text>
        </View>
      </View>
    </Modal>
  );
};

// Composant bouton pour ouvrir les logs (version simple)
export const SimpleSessionLogButton: React.FC = () => {
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
        <Text style={logButtonStyles.logButtonText}>📄 Logs</Text>
      </TouchableOpacity>

      <SimpleSessionLogViewer
        visible={showLogs}
        onClose={() => setShowLogs(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: "#2a2a2a",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 40,
    alignItems: "center",
  },
  refreshButton: {
    backgroundColor: "#007AFF",
  },
  shareButton: {
    backgroundColor: "#34C759",
  },
  clearButton: {
    backgroundColor: "#FF9500",
  },
  closeButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#999",
    fontSize: 16,
  },
  logContainer: {
    flex: 1,
    padding: 12,
  },
  logText: {
    color: "#00ff00",
    fontSize: 10,
    fontFamily: Platform.select({
      ios: "Courier",
      android: "monospace",
    }),
    lineHeight: 14,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
    backgroundColor: "#2a2a2a",
  },
  footerText: {
    color: "#999",
    fontSize: 10,
    textAlign: "center",
  },
});

const logButtonStyles = StyleSheet.create({
  logButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000,
  },
  logButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});

export { logButtonStyles };
