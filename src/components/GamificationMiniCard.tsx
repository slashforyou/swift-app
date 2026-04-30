/**
 * GamificationMiniCard
 * Card compacte affiché sur la home — XP progress, level, streak, trophies.
 * Tapable → navigue vers GamificationV2.
 */
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useTheme } from '../context/ThemeProvider';
import { useGamificationV2 } from '../hooks/useGamificationV2';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface StatPillProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string | number;
  label: string;
  color: string;
}

const StatPill: React.FC<StatPillProps> = ({ icon, value, label, color }) => {
  const { colors } = useTheme();
  return (
    <View
      testID={`gamification-stat-${label}`}
      style={{
        alignItems: 'center',
        gap: 2,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: color + '18',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: DESIGN_TOKENS.radius.full,
        }}
      >
        <Ionicons name={icon} size={13} color={color} />
        <Text style={{ fontSize: 13, fontWeight: '700', color }}>
          {value}
        </Text>
      </View>
      <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '500' }}>
        {label}
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// XP Progress Bar
// ─────────────────────────────────────────────────────────────────────────────

interface XpBarProps {
  progress: number; // 0–100
  color: string;
  totalXp: number;
  levelMinXp: number;
  levelMaxXp: number;
}

const XpBar: React.FC<XpBarProps> = ({ progress, color, totalXp, levelMinXp, levelMaxXp }) => {
  const { colors } = useTheme();
  const clampedPct = Math.max(0, Math.min(100, progress));
  const xpInLevel = totalXp - levelMinXp;
  const xpNeeded  = levelMaxXp - levelMinXp;

  return (
    <View testID="gamification-xp-bar" style={{ gap: 4 }}>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.border,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${clampedPct}%`,
            backgroundColor: color,
            borderRadius: 3,
          }}
        />
      </View>
      <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: 'right' }}>
        {xpInLevel} / {xpNeeded} XP
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GamificationMiniCard
// ─────────────────────────────────────────────────────────────────────────────

interface GamificationMiniCardProps {
  /** Permet de surcharger la navigation cible (utile pour les tests) */
  onPress?: () => void;
}

export const GamificationMiniCard: React.FC<GamificationMiniCardProps> = ({ onPress }) => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { profile, xpProgress, isLoadingProfile, refreshProfile } = useGamificationV2();

  // Charger le profil à l'affichage du composant
  useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePress = onPress ?? (() => navigation.navigate('GamificationV2'));

  // Couleur thématique par niveau
  const levelColor =
    (profile?.level ?? 1) >= 20 ? '#9B59B6'
    : (profile?.level ?? 1) >= 10 ? '#F59E0B'
    : '#4A90D9';

  if (isLoadingProfile || !profile) {
    // Skeleton compact
    return (
      <View
        testID="gamification-mini-card-skeleton"
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderRadius: DESIGN_TOKENS.radius.lg,
          padding: DESIGN_TOKENS.spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          height: 72,
        }}
      />
    );
  }

  const levelMinXp = profile.level_min_xp ?? 0;
  const levelMaxXp = profile.level_max_xp ?? 100;

  return (
    <Pressable
      testID="gamification-mini-card"
      onPress={handlePress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.backgroundTertiary : colors.backgroundSecondary,
        borderRadius: DESIGN_TOKENS.radius.lg,
        padding: DESIGN_TOKENS.spacing.md,
        borderWidth: 1,
        borderColor: levelColor + '40',
        gap: DESIGN_TOKENS.spacing.sm,
        shadowColor: levelColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 2,
      })}
      accessibilityRole="button"
      accessibilityLabel={`Niveau ${profile.level} — ${profile.total_xp} XP total`}
    >
      {/* Row 1 : Level + rank + stats pills */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Level badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: levelColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>
              {profile.level}
            </Text>
          </View>
          <View>
            <Text
              testID="gamification-level-label"
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: colors.text,
              }}
            >
              {profile.level_label ?? `Niveau ${profile.level}`}
            </Text>
            {profile.rank_label && (
              <Text style={{ fontSize: 11, color: levelColor, fontWeight: '600' }}>
                {profile.rank_icon ?? ''} {profile.rank_label}
              </Text>
            )}
          </View>
        </View>

        {/* Stats pills */}
        <View style={{ flexDirection: 'row', gap: DESIGN_TOKENS.spacing.sm }}>
          {profile.current_streak_days > 0 && (
            <StatPill
              icon="flame"
              value={profile.current_streak_days}
              label="streak"
              color="#E74C3C"
            />
          )}
          {profile.total_trophies > 0 && (
            <StatPill
              icon="trophy"
              value={profile.total_trophies}
              label="trophées"
              color="#F59E0B"
            />
          )}
          <StatPill
            icon="star"
            value={profile.total_xp}
            label="XP total"
            color={levelColor}
          />
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>

      {/* Row 2 : XP progress bar */}
      <XpBar
        progress={xpProgress}
        color={levelColor}
        totalXp={profile.total_xp}
        levelMinXp={levelMinXp}
        levelMaxXp={levelMaxXp}
      />
    </Pressable>
  );
};

export default GamificationMiniCard;
