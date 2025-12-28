/**
 * JobStepHistoryCard - Affiche l'historique détaillé des étapes avec durées réelles
 * Utilise step_history depuis l'API au lieu du timer local
 */

import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeProvider';

export interface JobStepHistory {
  step: number;
  step_name: string;
  started_at: string | null;
  completed_at: string | null;
  duration_hours: number | null;
  is_current: boolean;
}

export interface JobTimerInfo {
  step_history: JobStepHistory[];
  timer_billable_hours: number;
  timer_break_hours: number;
  timer_is_running: boolean;
  timer_started_at: string | null;
  timer_completed_at: string | null;
}

interface JobStepHistoryCardProps {
  timerInfo: JobTimerInfo;
}

export const JobStepHistoryCard: React.FC<JobStepHistoryCardProps> = ({ timerInfo }) => {
  const { colors } = useTheme();
  const { step_history, timer_billable_hours, timer_break_hours, timer_is_running } = timerInfo;

  // Styles dynamiques basés sur le thème
  const styles = {
    container: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      marginHorizontal: 16,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold' as const,
      color: colors.text,
    },
    runningBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: `${colors.success}20`,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    pulseDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.success,
      marginRight: 6,
    },
    runningText: {
      fontSize: 12,
      color: colors.success,
      fontWeight: '600' as const,
    },
    stepList: {
      gap: 12,
    },
    stepItem: {
      backgroundColor: colors.backgroundTertiary || colors.backgroundSecondary,
      borderRadius: 8,
      padding: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.textSecondary,
    },
    stepItemCurrent: {
      backgroundColor: `${colors.warning}20`,
      borderLeftColor: colors.warning,
    },
    stepItemCompleted: {
      backgroundColor: `${colors.success}20`,
      borderLeftColor: colors.success,
    },
    stepHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    stepNumberContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: 12,
    },
    stepNumber: {
      fontSize: 16,
      fontWeight: 'bold' as const,
      color: colors.text,
    },
    stepInfo: {
      flex: 1,
    },
    stepName: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 2,
    },
    currentLabel: {
      fontSize: 12,
      color: colors.warning,
      fontWeight: '500' as const,
    },
    completedLabel: {
      fontSize: 12,
      color: colors.success,
      fontWeight: '500' as const,
    },
    durationRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginTop: 4,
    },
    durationLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    durationValue: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.text,
    },
    timestampRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginTop: 2,
    },
    timestampLabel: {
      fontSize: 11,
      color: colors.textMuted || colors.textSecondary,
    },
    timestampValue: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center' as const,
      paddingVertical: 32,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    emptyHint: {
      fontSize: 12,
      color: colors.textMuted || colors.textSecondary,
    },
    footer: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    summaryRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: colors.text,
    },
    summaryLabelBold: {
      fontSize: 14,
      fontWeight: 'bold' as const,
      color: colors.text,
    },
    summaryValueBold: {
      fontSize: 14,
      fontWeight: 'bold' as const,
      color: colors.warning,
    },
    separatorLine: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 8,
    },
  };

  const formatDuration = (hours: number | null) => {
    if (hours === null || hours === 0) return '-';
    
    if (hours < 1) {
      // Moins d'une heure: afficher en minutes
      const minutes = Math.round(hours * 60);
      return `${minutes}min`;
    } else if (hours < 24) {
      // Moins de 24h: afficher en heures avec décimales
      return `${hours.toFixed(1)}h`;
    } else {
      // Plus de 24h: afficher jours + heures
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}j ${remainingHours}h`;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Historique des étapes</Text>
        {timer_is_running && (
          <View style={styles.runningBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.runningText}>En cours</Text>
          </View>
        )}
      </View>

      {/* Step History List */}
      {step_history && step_history.length > 0 ? (
        <View style={styles.stepList}>
          {step_history.map((stepItem, index) => (
            <View 
              key={`step-history-${stepItem.step}-${index}`} 
              style={[
                styles.stepItem,
                stepItem.is_current && styles.stepItemCurrent,
                stepItem.completed_at && styles.stepItemCompleted
              ]}
            >
              {/* Step Number & Name */}
              <View style={styles.stepHeader}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>{stepItem.step}</Text>
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepName}>{stepItem.step_name}</Text>
                  {stepItem.is_current && (
                    <Text style={styles.currentLabel}>⏱️ Étape actuelle</Text>
                  )}
                  {stepItem.completed_at && (
                    <Text style={styles.completedLabel}>✅ Terminée</Text>
                  )}
                </View>
              </View>

              {/* Duration */}
              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>Durée:</Text>
                <Text style={styles.durationValue}>
                  {formatDuration(stepItem.duration_hours)}
                </Text>
              </View>

              {/* Timestamps */}
              {stepItem.started_at && (
                <View style={styles.timestampRow}>
                  <Text style={styles.timestampLabel}>Démarré:</Text>
                  <Text style={styles.timestampValue}>
                    {formatDateTime(stepItem.started_at)}
                  </Text>
                </View>
              )}
              {stepItem.completed_at && (
                <View style={styles.timestampRow}>
                  <Text style={styles.timestampLabel}>Terminé:</Text>
                  <Text style={styles.timestampValue}>
                    {formatDateTime(stepItem.completed_at)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aucun historique disponible</Text>
          <Text style={styles.emptyHint}>
            Les étapes apparaîtront ici une fois le timer démarré
          </Text>
        </View>
      )}

      {/* Summary Footer */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>💰 Heures facturables:</Text>
          <Text style={styles.summaryValue}>
            {formatDuration(timer_billable_hours)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>⏸️ Temps de pause:</Text>
          <Text style={styles.summaryValue}>
            {formatDuration(timer_break_hours)}
          </Text>
        </View>
        <View style={styles.separatorLine} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelBold}>⏱️ Total:</Text>
          <Text style={styles.summaryValueBold}>
            {formatDuration(timer_billable_hours + timer_break_hours)}
          </Text>
        </View>
      </View>
    </View>
  );
};
