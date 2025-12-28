/**
 * AlertsPanel Component - Panneau d'affichage des alertes critiques
 */

import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { Alert, alertService } from '../../services/alertService';

const AlertsPanel: React.FC = () => {
  const { colors } = useTheme();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = () => {
    const activeAlerts = alertService.getActiveAlerts();
    setAlerts(activeAlerts);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high' | 'critical') => {
    switch (severity) {
      case 'critical': return colors.error;
      case 'high': return colors.warning; // Orange tone from warning
      case 'medium': return colors.info;
      case 'low': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  const getSeverityIcon = (severity: 'low' | 'medium' | 'high' | 'critical') => {
    switch (severity) {
      case 'critical': return 'alert-circle';
      case 'high': return 'warning';
      case 'medium': return 'information-circle';
      case 'low': return 'checkmark-circle';
      default: return 'radio-button-off';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `il y a ${diffMins}min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `il y a ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `il y a ${diffDays}j`;
  };

  const handleSuppress = (alertId: string) => {
    alertService.suppressAlert(alertId);
    loadAlerts();
  };

  const AlertCard = ({ alert }: { alert: Alert }) => {
    const severityColor = getSeverityColor(alert.severity);
    const severityIcon = getSeverityIcon(alert.severity);

    return (
      <View style={[styles.alertCard, { borderLeftColor: severityColor }]}>
        <View style={styles.alertHeader}>
          <View style={styles.alertTitleRow}>
            <Ionicons 
              name={severityIcon} 
              size={20} 
              color={severityColor} 
              style={styles.alertIcon}
            />
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              {alert.title}
            </Text>
          </View>
          <View style={styles.alertActions}>
            <Text style={[styles.severityBadge, { 
              backgroundColor: severityColor + '20', 
              color: severityColor 
            }]}>
              {alert.severity.toUpperCase()}
            </Text>
            <TouchableOpacity
              onPress={() => handleSuppress(alert.id)}
              style={styles.suppressButton}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={[styles.alertDescription, { color: colors.textSecondary }]}>
          {alert.description}
        </Text>
        
        <View style={styles.alertMeta}>
          <Text style={[styles.alertTime, { color: colors.textSecondary }]}>
            {formatTimeAgo(alert.triggered_at)}
          </Text>
          <Text style={[styles.alertId, { color: colors.textSecondary }]}>
            ID: {alert.id.split('_')[1]}
          </Text>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name="checkmark-circle-outline" 
        size={64} 
        color={colors.success} 
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Tout va bien !
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Aucune alerte active en ce moment
      </Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: DESIGN_TOKENS.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    alertCount: {
      backgroundColor: alerts.length > 0 ? colors.error : colors.success,
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.radius.sm,
      minWidth: 24,
      alignItems: 'center',
    },
    alertCountText: {
      color: colors.background,
      fontSize: 12,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    alertCard: {
      backgroundColor: colors.background,
      borderLeftWidth: 4,
      borderRadius: DESIGN_TOKENS.radius.md,
      margin: DESIGN_TOKENS.spacing.md,
      padding: DESIGN_TOKENS.spacing.md,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    alertHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    alertTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    alertIcon: {
      marginRight: DESIGN_TOKENS.spacing.sm,
    },
    alertTitle: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
    },
    alertActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    severityBadge: {
      paddingHorizontal: DESIGN_TOKENS.spacing.sm,
      paddingVertical: DESIGN_TOKENS.spacing.xs,
      borderRadius: DESIGN_TOKENS.radius.sm,
      fontSize: 10,
      fontWeight: '600',
      marginRight: DESIGN_TOKENS.spacing.sm,
    },
    suppressButton: {
      padding: DESIGN_TOKENS.spacing.xs,
    },
    alertDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    alertMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    alertTime: {
      fontSize: 12,
      fontWeight: '500',
    },
    alertId: {
      fontSize: 11,
      fontFamily: 'monospace',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: DESIGN_TOKENS.spacing.xl,
    },
    emptyIcon: {
      marginBottom: DESIGN_TOKENS.spacing.lg,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      marginBottom: DESIGN_TOKENS.spacing.sm,
    },
    emptySubtitle: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Alertes Système</Text>
        <View style={styles.alertCount}>
          <Text style={styles.alertCountText}>{alerts.length}</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {alerts.length === 0 ? (
          <EmptyState />
        ) : (
          alerts
            .sort((a, b) => {
              // Sort by severity first, then by time
              const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
              const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
              if (severityDiff !== 0) return severityDiff;
              
              return new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime();
            })
            .map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))
        )}
      </ScrollView>
    </View>
  );
};

export default AlertsPanel;