/**
 * FirstXPGuide
 * Modal de célébration affiché la première fois que l'utilisateur gagne de l'XP
 * (après sa première journée de travail complète).
 *
 * Déclenchement :
 *   - AsyncStorage key `gamification_first_xp_shown` absente
 *   - XP de l'utilisateur > 0
 *
 * Animation :
 *   1. Fade-in overlay
 *   2. Barre XP monte de 0 → xpProgress
 *   3. Trophées apparaissent avec un bounce
 *   4. Texte de félicitation apparaît
 */
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { useTheme } from '../../context/ThemeProvider';
import { useGamificationV2 } from '../../hooks/useGamificationV2';

export const FIRST_XP_GUIDE_KEY = 'gamification_first_xp_shown';

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const FirstXPGuide: React.FC = () => {
  const { colors } = useTheme();
  const { profile, xpProgress, isLoadingProfile } = useGamificationV2();

  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Animations
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const xpBarWidth    = useRef(new Animated.Value(0)).current;
  const trophyScale   = useRef(new Animated.Value(0)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;

  // Vérifie si le guide doit s'afficher
  useEffect(() => {
    if (isLoadingProfile || dismissed) return;
    if (!profile) return;

    const totalXp = profile.total_xp ?? profile.experience ?? 0;
    if (totalXp <= 0) return;

    (async () => {
      try {
        const seen = await AsyncStorage.getItem(FIRST_XP_GUIDE_KEY);
        if (!seen) {
          setVisible(true);
        }
      } catch {
        // Non-critical
      }
    })();
  }, [profile, isLoadingProfile, dismissed]);

  // Lance la séquence d'animation quand le modal s'ouvre
  useEffect(() => {
    if (!visible) return;

    // Réinitialiser
    overlayOpacity.setValue(0);
    xpBarWidth.setValue(0);
    trophyScale.setValue(0);
    textOpacity.setValue(0);

    Animated.sequence([
      // 1. Fade-in overlay
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 2. XP bar monte
      Animated.timing(xpBarWidth, {
        toValue: Math.max(0, Math.min(100, xpProgress)),
        duration: 1200,
        useNativeDriver: false,
      }),
      // 3. Trophées bounce
      Animated.spring(trophyScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      // 4. Texte apparaît
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, xpProgress]);

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(FIRST_XP_GUIDE_KEY, '1');
    } catch {
      // Non-critical
    }
    setDismissed(true);
    setVisible(false);
  };

  if (!visible) return null;

  const level    = profile?.level ?? 1;
  const label    = profile?.level_label ?? null;
  const trophies = profile?.total_trophies ?? 0;
  const totalXp  = (profile?.total_xp ?? profile?.experience ?? 0).toLocaleString();

  return (
    <Modal
      testID="first-xp-guide-modal"
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={handleDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          {/* Emoji décoratif */}
          <Text style={styles.emoji}>🎉</Text>

          {/* Titre */}
          <Text style={[styles.title, { color: colors.text }]}>
            Première journée terminée !
          </Text>

          {/* Niveau + label */}
          <Text style={[styles.levelText, { color: colors.primary }]}>
            Niveau {level}{label ? ` · ${label}` : ''}
          </Text>

          {/* XP bar animée */}
          <View style={styles.xpBarContainer}>
            <View style={[styles.xpBarTrack, { backgroundColor: colors.border }]}>
              <Animated.View
                testID="first-xp-bar-fill"
                style={[
                  styles.xpBarFill,
                  {
                    backgroundColor: colors.primary,
                    width: xpBarWidth.interpolate({
                      inputRange:  [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.xpLabel, { color: colors.textMuted }]}>
              {totalXp} XP gagnés
            </Text>
          </View>

          {/* Trophées */}
          {trophies > 0 && (
            <Animated.View
              testID="first-xp-trophies"
              style={[styles.trophyRow, { transform: [{ scale: trophyScale }] }]}
            >
              <Text style={styles.trophyIcon}>🏆</Text>
              <Text style={[styles.trophyCount, { color: '#f59e0b' }]}>
                {trophies} trophée{trophies > 1 ? 's' : ''} débloqué{trophies > 1 ? 's' : ''} !
              </Text>
            </Animated.View>
          )}

          {/* Message de félicitation */}
          <Animated.Text
            testID="first-xp-congrats-text"
            style={[styles.congrats, { color: colors.textSecondary, opacity: textOpacity }]}
          >
            Continuez comme ça ! Chaque mission accomplie vous rapproche du sommet.
          </Animated.Text>

          {/* CTA */}
          <Pressable
            testID="first-xp-guide-dismiss"
            onPress={handleDismiss}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.ctaText, { color: colors.buttonPrimaryText }]}>
              Voir ma progression ⚡
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default FirstXPGuide;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DESIGN_TOKENS.spacing.xl,
  },
  card: {
    width: '100%',
    borderRadius: DESIGN_TOKENS.radius.xl,
    borderWidth: 1,
    padding: DESIGN_TOKENS.spacing.xl,
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.md,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  levelText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  xpBarContainer: {
    width: '100%',
    gap: 6,
  },
  xpBarTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  xpLabel: {
    fontSize: 12,
    textAlign: 'right',
  },
  trophyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trophyIcon: {
    fontSize: 24,
  },
  trophyCount: {
    fontSize: 15,
    fontWeight: '700',
  },
  congrats: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  cta: {
    borderRadius: DESIGN_TOKENS.radius.lg,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    paddingHorizontal: DESIGN_TOKENS.spacing.xl,
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
