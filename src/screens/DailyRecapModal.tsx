/**
 * DailyRecapModal
 * Affiche le récap XP de fin de journée (appelé depuis home.tsx au focus).
 * Ne s'affiche qu'une fois par jour (AsyncStorage).
 * - Centré sur l'écran
 * - Entrée animée (scale + fade, 600ms)
 * - Lignes de breakdown animées en stagger
 * - Clé "seen" écrite au mount pour éviter le re-affichage si on quitte sans fermer
 */
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useTheme } from '../context/ThemeProvider';
import { useLocalization } from '../localization/useLocalization';
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
  const { t, currentLanguage } = useLocalization();
  const [visible, setVisible] = useState(true);
  const breakdown = data.breakdown ?? [];

  // ── Marquer immédiatement comme vu au mount ─────────────────────────────
  // Évite le re-affichage si l'utilisateur navigue hors de Home sans fermer.
  useEffect(() => {
    AsyncStorage.setItem(recapSeenKey(data.date), '1').catch(() => {});
  }, [data.date]);

  // ── Valeurs d'animation ──────────────────────────────────────────────────
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale       = useRef(new Animated.Value(0.86)).current;
  const cardOpacity     = useRef(new Animated.Value(0)).current;
  const rowAnims        = useRef(breakdown.map(() => new Animated.Value(0))).current;

  // ── Animation d'entrée ───────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(backdropOpacity, {
      toValue: 1, duration: 380, useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();

    Animated.parallel([
      Animated.timing(cardScale, {
        toValue: 1, duration: 620, useNativeDriver: true,
        easing: Easing.out(Easing.back(1.04)),
      }),
      Animated.timing(cardOpacity, {
        toValue: 1, duration: 500, useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start(() => {
      if (rowAnims.length > 0) {
        Animated.stagger(
          120,
          rowAnims.map(a =>
            Animated.timing(a, {
              toValue: 1, duration: 270, useNativeDriver: true,
              easing: Easing.out(Easing.ease),
            })
          )
        ).start();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fermeture avec animation de sortie ───────────────────────────────────
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(cardOpacity,     { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(cardScale,       { toValue: 0.92, duration: 260, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop semi-transparent */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        {/* Tap en dehors = fermer */}
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />

        {/* Card centré */}
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.backgroundSecondary },
            { opacity: cardOpacity, transform: [{ scale: cardScale }] },
          ]}
        >
          {/* Titre */}
          <Text style={[styles.title, { color: colors.text }]}>{t('gamification.recap.title')}</Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {new Date(data.date + 'T12:00:00').toLocaleDateString(currentLanguage ?? undefined, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>

          {/* Gros chiffre XP */}
          <View style={styles.xpRow}>
            <Text style={[styles.xpValue, { color: colors.primary }]}>
              +{data.total_xp_gained}
            </Text>
            <Text style={[styles.xpUnit, { color: colors.textSecondary }]}> XP</Text>
          </View>

          {/* Nombre de jobs */}
          <Text style={[styles.jobsLine, { color: colors.textSecondary }]}>
            {t(data.jobs_completed > 1 ? 'gamification.recap.jobsCompleted_other' : 'gamification.recap.jobsCompleted_one', { count: data.jobs_completed })}
          </Text>

          {/* Badge level up */}
          {data.level_up && (
            <View style={[styles.levelUpBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '55' }]}>
              <Ionicons name="arrow-up-circle" size={18} color={colors.primary} />
              <Text style={[styles.levelUpText, { color: colors.primary }]}>
                {t('gamification.recap.levelUp', { before: data.level_before, after: data.level_after })}
              </Text>
            </View>
          )}

          {/* Breakdown — lignes animées une par une */}
          {breakdown.length > 0 && (
            <View style={[styles.breakdownBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
              {breakdown.map((item, idx) => (
                <Animated.View
                  key={item.action}
                  style={[
                    styles.breakdownRow,
                    idx < breakdown.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                    {
                      opacity: rowAnims[idx] ?? 1,
                      transform: [{
                        translateY: (rowAnims[idx] ?? new Animated.Value(1)).interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      }],
                    },
                  ]}
                >
                  <Text style={[styles.breakdownLabel, { color: colors.text }]} numberOfLines={1}>
                    {xpActionLabel(item.action, t)}
                    {item.cnt > 1 ? ` ×${item.cnt}` : ''}
                  </Text>
                  <Text style={[styles.breakdownXp, { color: colors.primary }]}>
                    +{item.xp} XP
                  </Text>
                </Animated.View>
              ))}
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
            <Text style={styles.ctaText}>{t('gamification.recap.cta')}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingTop: DESIGN_TOKENS.spacing.xl,
    paddingBottom: DESIGN_TOKENS.spacing.xl,
    gap: DESIGN_TOKENS.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: DESIGN_TOKENS.spacing.sm,
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
  },
  levelUpText: {
    fontSize: 14,
    fontWeight: '700',
  },
  breakdownBox: {
    borderWidth: 1,
    borderRadius: DESIGN_TOKENS.radius.md,
    overflow: 'hidden',
    marginTop: DESIGN_TOKENS.spacing.xs,
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
  ctaButton: {
    borderRadius: DESIGN_TOKENS.radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: DESIGN_TOKENS.spacing.sm,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
