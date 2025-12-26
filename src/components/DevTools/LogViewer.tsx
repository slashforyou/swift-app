// src/components/DevTools/LogViewer.tsx
/**
 * LogViewer - Interface avancée pour visualiser et gérer les logs
 * Avec pagination, filtres, recherche et export
 */

import React, { useEffect, useState } from 'react';
import {
    Alert,
    Clipboard,
    Modal,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { simpleSessionLogger } from '../../services/simpleSessionLogger';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARNING' | 'DEBUG';
  message: string;
  context?: string;
  data?: any;
}

interface LogViewerProps {
  visible: boolean;
  onClose: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedContext, setSelectedContext] = useState<string>('ALL');
  
  const LOGS_PER_PAGE = 20;
  const logLevels = ['ALL', 'INFO', 'ERROR', 'WARNING', 'DEBUG'];
  
  useEffect(() => {
    if (visible) {
      refreshLogs();
    }
  }, [visible]);

  useEffect(() => {
    applyFilters();
  }, [logs, searchQuery, selectedLevel, selectedContext]);

  const refreshLogs = () => {
    try {
      // Récupérer les logs du session logger
      const allLogs = (simpleSessionLogger as any).logs || [];
      setLogs(allLogs);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error refreshing logs:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];
    
    // Filtrer par niveau
    if (selectedLevel !== 'ALL') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }
    
    // Filtrer par contexte
    if (selectedContext !== 'ALL') {
      filtered = filtered.filter(log => log.context === selectedContext);
    }
    
    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(query) ||
        (log.context && log.context.toLowerCase().includes(query)) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(query))
      );
    }
    
    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const getContexts = () => {
    const contexts = new Set(logs.map(log => log.context).filter(Boolean));
    return ['ALL', ...Array.from(contexts)];
  };

  const getPaginatedLogs = () => {
    const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
    const endIndex = startIndex + LOGS_PER_PAGE;
    return filteredLogs.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  };

  const exportLogs = async () => {
    try {
      const formattedLogs = simpleSessionLogger.getFormattedLogs();
      
      Alert.alert(
        'Exporter les logs',
        'Comment souhaitez-vous exporter les logs ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Copier', 
            onPress: () => {
              Clipboard.setString(formattedLogs);
              Alert.alert('✅ Copié', 'Les logs ont été copiés dans le presse-papier');
            }
          },
          { 
            text: 'Partager', 
            onPress: async () => {
              try {
                await Share.share({
                  message: formattedLogs,
                  title: 'SwiftApp Session Logs'
                });
              } catch (error) {
                Alert.alert('❌ Erreur', 'Impossible de partager les logs');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('❌ Erreur', 'Impossible d\'exporter les logs');
    }
  };

  const clearAllLogs = () => {
    Alert.alert(
      'Effacer les logs',
      'Êtes-vous sûr de vouloir effacer tous les logs ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Effacer', 
          style: 'destructive',
          onPress: () => {
            simpleSessionLogger.clearLogs();
            refreshLogs();
          }
        }
      ]
    );
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return '#FF3B30';
      case 'WARNING': return '#FF9500';
      case 'INFO': return '#007AFF';
      case 'DEBUG': return '#5856D6';
      default: return '#999';
    }
  };

  const formatLogData = (data: any) => {
    if (!data) return '';
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📄 Session Logs ({filteredLogs.length})</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.exportButton} onPress={exportLogs}>
              <Text style={styles.headerButtonText}>📤 Export</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.headerButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          {/* Search */}
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans les logs..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          {/* Level Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {logLevels.map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.filterButton,
                  selectedLevel === level && styles.filterButtonActive
                ]}
                onPress={() => setSelectedLevel(level)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedLevel === level && styles.filterButtonTextActive
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Context Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {getContexts().map(context => (
              <TouchableOpacity
                key={context}
                style={[
                  styles.filterButton,
                  selectedContext === context && styles.filterButtonActive
                ]}
                onPress={() => setSelectedContext(context || 'ALL')}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedContext === context && styles.filterButtonTextActive
                ]}>
                  {context || 'ALL'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Logs List */}
        <ScrollView style={styles.logsContainer}>
          {getPaginatedLogs().map((log, index) => (
            <View key={`${log.timestamp}-${index}`} style={styles.logItem}>
              <View style={styles.logHeader}>
                <Text style={styles.logTimestamp}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Text>
                <View style={[styles.logLevel, { backgroundColor: getLevelColor(log.level) }]}>
                  <Text style={styles.logLevelText}>{log.level}</Text>
                </View>
                {log.context && (
                  <Text style={styles.logContext}>[{log.context}]</Text>
                )}
              </View>
              <Text style={styles.logMessage}>{log.message}</Text>
              {log.data && (
                <View style={styles.logDataContainer}>
                  <Text style={styles.logData}>{formatLogData(log.data)}</Text>
                </View>
              )}
            </View>
          ))}
          
          {filteredLogs.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun log trouvé</Text>
            </View>
          )}
        </ScrollView>

        {/* Pagination */}
        {getTotalPages() > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <Text style={styles.paginationButtonText}>◀</Text>
            </TouchableOpacity>
            
            <Text style={styles.paginationText}>
              Page {currentPage} / {getTotalPages()}
            </Text>
            
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === getTotalPages() && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage(Math.min(getTotalPages(), currentPage + 1))}
              disabled={currentPage === getTotalPages()}
            >
              <Text style={styles.paginationButtonText}>▶</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer Actions */}
        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshLogs}>
            <Text style={styles.footerButtonText}>🔄 Rafraîchir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={clearAllLogs}>
            <Text style={styles.footerButtonText}>🗑️ Effacer Tout</Text>
          </TouchableOpacity>
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
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#2a2a2a',
  },
  searchInput: {
    backgroundColor: '#333',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  logsContainer: {
    flex: 1,
    padding: 12,
  },
  logItem: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logTimestamp: {
    color: '#999',
    fontSize: 12,
    marginRight: 8,
  },
  logLevel: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  logLevelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logContext: {
    color: '#666',
    fontSize: 11,
    fontStyle: 'italic',
  },
  logMessage: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  logDataContainer: {
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  logData: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#2a2a2a',
  },
  paginationButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: '#222',
    opacity: 0.5,
  },
  paginationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paginationText: {
    color: '#ccc',
    fontSize: 14,
    marginHorizontal: 16,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#2a2a2a',
  },
  refreshButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});