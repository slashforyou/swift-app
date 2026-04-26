/**
 * GamificationV2StatsCard
 * Carte compact affichant les nouvelles statistiques V2 :
 * streak, trophées, compteurs d'activité, rang.
 *
 * Usage:
 *   const { profile, xpProgress } = useGamificationV2();
 *   <GamificationV2StatsCard profile={profile} xpProgress={xpProgress} />
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DESIGN_TOKENS } from '../../constants/Styles';
import { GamificationV2Profile } from '../../services/gamificationV2';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  profile: GamificationV2Profile | null;
  xpProgress: number; // 0–100
  colorAccent?: string;
  /** Trophées de la saison courante (depuis TrophySeasonCard). Si fourni, remplace total_trophies. */
  seasonTrophies?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const GamificationV2StatsCard: React.FC<Props> = ({
  profile,
  xpProgress,
  colorAccent = '#6C5CE7',
  seasonTrophies,
}) => {
  if (!profile) return null;

  const trophyValue = seasonTrophies != null
    ? String(seasonTrophies)
    : String(profile.total_trophies ?? 0);

  const stats = [
    {
      emoji: '🔥',
      label: 'Streak',
      value: `${profile.current_streak_days ?? 0}j`,
    },
    {
      emoji: '🏆',
      label: 'Trophées',
      value: trophyValue,
    },
    {
      emoji: '✅',
      label: 'Jobs',
      value: String(profile.jobs_completed_count ?? 0),
    },
    {
      emoji: '📸',
      label: 'Photos',
      value: String(profile.photos_uploaded_count ?? 0),
    },
  ];

  return (
    <View style={styles.card}>
      {/* Header: XP + rank */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.xpValue}>{profile.total_xp ?? 0} XP</Text>
          <Text style={styles.levelLabel}>
            Niv. {profile.level ?? 1}
            {profile.level_label ? ` · ${profile.level_label}` : ''}
          </Text>
        </View>
        {profile.rank_label ? (
          <View style={[styles.rankBadge, { backgroundColor: colorAccent + '22', borderColor: colorAccent }]}>
            <Text style={[styles.rankText, { color: colorAccent }]}>
              {profile.rank_label}
            </Text>
          </View>
        ) : null}
      </View>

      {/* XP Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${xpProgress}%` as any,
              backgroundColor: colorAccent,
            },
          ]}
        />
      </View>
      <Text style={styles.progressLabel}>{Math.round(xpProgress)}% vers le niveau suivant</Text>

      {/* Stats grid */}
      <View style={styles.statsRow}>
        {stats.map(({ emoji, label, value }) => (
          <View key={label} style={styles.statItem}>
            <Text style={styles.statEmoji}>{emoji}</Text>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: DESIGN_TOKENS.radius.lg,
    padding: DESIGN_TOKENS.spacing.lg,
    gap: DESIGN_TOKENS.spacing.md,
    ...DESIGN_TOKENS.shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  xpValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  levelLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  rankBadge: {
    borderRadius: DESIGN_TOKENS.radius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    borderRadius: DESIGN_TOKENS.radius.full,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: DESIGN_TOKENS.radius.full,
  },
  progressLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: -DESIGN_TOKENS.spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statEmoji: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
});
