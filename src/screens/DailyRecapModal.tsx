/**
 * DailyRecapModal
 * Affiche le récap XP de fin de journée (appelé depuis home.tsx au focus).
 * Ne s'affiche qu'une fois par jour (AsyncStorage).
 */
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useTheme } from '../context/ThemeProvider';
import {
    DailyRecapData,
    xpActionLabel,
} from '../services/gamificationV2';

// Clé de stockage pour éviter d'afficher 2x par jour
export function recapSeenKey(date: string): string {
  return `daily_recap_seen_${date}`;
}

interface DailyRecapModalProps {
  data: DailyRecapData;
  onClose: () => void;
}

export default function DailyRecapModal({ data, onClose }: DailyRecapModalProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(true);

  const handleClose = async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(recapSeenKey(data.date), '1');
    } catch {}
    onClose();
  };

  if (!visible) return null;

  const levelUpBadge = data.level_up && (
    <View style={[styles.levelUpBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '55' }]}>
      <Ionicons name="arrow-up-circle" size={18} color={colors.primary} />
      <Text style={[styles.levelUpText, { color: colors.primary }]}>
        Niveau {data.level_before} → {data.level_after}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={handleClose}>
        {/* Sheet — stop propagation so it doesn't close when tapping inside */}
        <Pressable onPress={() => {}} style={[styles.sheet, { backgroundColor: colors.backgroundSecondary }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            Bilan du jour
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {new Date(data.date + 'T12:00:00').toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>

          {/* Big XP number */}
          <View style={styles.xpRow}>
            <Text style={[styles.xpValue, { color: colors.primary }]}>
              +{data.total_xp_gained}
            </Text>
            <Text style={[styles.xpUnit, { color: colors.textSecondary }]}> XP</Text>
          </View>

          {/* Jobs count */}
          <Text style={[styles.jobsLine, { color: colors.textSecondary }]}>
            {data.jobs_completed} job{data.jobs_completed > 1 ? 's' : ''} complété{data.jobs_completed > 1 ? 's' : ''} aujourd&apos;hui
          </Text>

          {/* Level up badge */}
          {levelUpBadge}

          {/* Breakdown */}
          {(data.breakdown ?? []).length > 0 && (
            <View style={[styles.breakdownBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <FlatList
                data={data.breakdown ?? []}
                keyExtractor={(item) => item.action}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
                renderItem={({ item }) => (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: colors.text }]} numberOfLines={1}>
                      {xpActionLabel(item.action)}
                      {item.cnt > 1 ? ` ×${item.cnt}` : ''}
                    </Text>
                    <Text style={[styles.breakdownXp, { color: colors.primary }]}>
                      +{item.xp} XP
                    </Text>
                  </View>
                )}
              />
            </View>
          )}

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer le récap du jour"
          >
            <Text style={styles.ctaText}>Super !</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingTop: 12,
    paddingBottom: DESIGN_TOKENS.spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
    textTransform: 'capitalize',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 4,
  },
  xpValue: {
    fontSize: 52,
    fontWeight: '800',
    lineHeight: 58,
  },
  xpUnit: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  jobsLine: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  levelUpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: DESIGN_TOKENS.spacing.md,
  },
  levelUpText: {
    fontSize: 14,
    fontWeight: '700',
  },
  breakdownBox: {
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.md,
    marginBottom: DESIGN_TOKENS.spacing.md,
    overflow: 'hidden',
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: 10,
  },
  breakdownLabel: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  breakdownXp: {
    fontSize: 14,
    fontWeight: '700',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  ctaButton: {
    borderRadius: DESIGN_TOKENS.radius.md,
    paddingVertical: DESIGN_TOKENS.spacing.md,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
