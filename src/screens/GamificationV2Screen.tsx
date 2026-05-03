/**
 * GamificationV2Screen — "Ma progression"
 * Carte de stats + quêtes intégrées (filtres catégorie + temps restant).
 */
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FirstXPGuide from '../components/gamification/FirstXPGuide';
import { GamificationV2StatsCard } from '../components/gamification/GamificationV2StatsCard';
import { Screen } from '../components/primitives/Screen';
import { HStack, VStack } from '../components/primitives/Stack';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useTheme } from '../context/ThemeProvider';
import { useGamificationV2 } from '../hooks/useGamificationV2';
import { TranslationFunction } from '../localization/types';
import { useLocalization } from '../localization/useLocalization';
import {
    GamificationV2Quest,
    QuestEventInfo,
    QuestType,
    TrophiesResponse,
    TrophySeasonArchive,
    fetchV2Trophies,
} from '../services/gamificationV2';

// ─────────────────────────────────────────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────────────────────────────────────────

type TFunc = TranslationFunction;

type QuestSection = {
  title: string;
  type: QuestType;
  data: GamificationV2Quest[];
  eventInfo?: QuestEventInfo;
};

const CATEGORY_ORDER: QuestType[] = ['intro', 'daily', 'weekly', 'monthly', 'event'];

/** Maps de type → clé de traduction */
const FILTER_LABEL_KEYS: Record<QuestType | 'all', string> = {
  all:     'gamification.filterAll',
  intro:   'gamification.filterIntro',
  daily:   'gamification.filterDaily',
  weekly:  'gamification.filterWeekly',
  monthly: 'gamification.filterMonthly',
  event:   'gamification.filterEvent',
};

const CATEGORY_LABEL_KEYS: Record<QuestType, string> = {
  intro:   'gamification.categoryIntro',
  daily:   'gamification.categoryDaily',
  weekly:  'gamification.categoryWeekly',
  monthly: 'gamification.categoryMonthly',
  event:   'gamification.categoryEvent',
};

function groupQuestsByCategory(quests: GamificationV2Quest[]): QuestSection[] {
  const map: Partial<Record<QuestType, GamificationV2Quest[]>> = {};

  for (const q of quests) {
    const cat = q.category ?? q.type ?? 'daily';
    if (!map[cat]) map[cat] = [];
    map[cat]!.push(q);
  }

  const sections: QuestSection[] = [];

  for (const cat of CATEGORY_ORDER) {
    const items = map[cat];
    if (!items || items.length === 0) continue;

    if (cat === 'event') {
      const byEvent: Record<string, GamificationV2Quest[]> = {};
      for (const q of items) {
        const key = q.event_info?.name ?? 'Event';
        if (!byEvent[key]) byEvent[key] = [];
        byEvent[key].push(q);
      }
      for (const [eventName, eventQuests] of Object.entries(byEvent)) {
        const info = eventQuests[0]?.event_info ?? null;
        sections.push({
          title: info ? `${info.icon} ${info.name}` : eventName,
          type: 'event',
          data: eventQuests,
          eventInfo: info ?? undefined,
        });
      }
    } else {
      sections.push({ title: cat, type: cat, data: items });
    }
  }

  return sections;
}

/** Compte à rebours affiché dans l'en-tête de section (ex. "encore 3h 42min") */
function timeRemaining(type: QuestType, t: TFunc, eventEndDate?: string): string | null {
  const now = new Date();
  if (type === 'intro') return null;

  let end: Date;
  if (type === 'event') {
    if (!eventEndDate) return null;
    end = new Date(eventEndDate);
  } else if (type === 'daily') {
    end = new Date(now);
    end.setHours(24, 0, 0, 0);
  } else if (type === 'weekly') {
    end = new Date(now);
    const dow = end.getDay();
    end.setDate(end.getDate() + (dow === 0 ? 1 : 8 - dow));
    end.setHours(0, 0, 0, 0);
  } else {
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  }

  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return t('gamification.time.ended');

  const totalSec = Math.floor(diffMs / 1000);
  const days    = Math.floor(totalSec / 86400);
  const hours   = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);

  if (days > 0)   return t(hours > 0   ? 'gamification.time.daysHoursLeft'    : 'gamification.time.daysLeft',    { d: days, h: hours });
  if (hours > 0)  return t(minutes > 0 ? 'gamification.time.hoursMinutesLeft' : 'gamification.time.hoursLeft',  { h: hours, m: minutes });
  return t('gamification.time.minutesLeft', { m: minutes });
}

/** Date de fin affichée sur les cartes quête event */
function formatEndDate(endDate: string, t: TFunc): string {
  const end = new Date(endDate);
  const diffDays = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return t('gamification.time.ended');
  if (diffDays === 1) return t('gamification.time.endsTomorrow');
  if (diffDays <= 7)  return t('gamification.time.daysRemaining', { d: diffDays });
  return t('gamification.time.endsOn', {
    date: end.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// EventQuestBanner
// ─────────────────────────────────────────────────────────────────────────────

interface EventQuestBannerProps {
  eventInfo: QuestEventInfo;
  t: TFunc;
}

const EventQuestBanner: React.FC<EventQuestBannerProps> = ({ eventInfo, t }) => {
  const bonusPct = Math.round((eventInfo.xp_bonus_multiplier - 1) * 100);
  return (
    <View style={[bannerStyles.container, { backgroundColor: eventInfo.color + '18', borderColor: eventInfo.color + '60' }]}>
      <View style={bannerStyles.left}>
        <Text style={bannerStyles.eventName}>{eventInfo.name}</Text>
        <Text style={[bannerStyles.eventEnd, { color: eventInfo.color }]}>
          {formatEndDate(eventInfo.end_date, t)}
        </Text>
      </View>
      {bonusPct > 0 && (
        <View style={[bannerStyles.bonusPill, { backgroundColor: eventInfo.color }]}>
          <Text style={bannerStyles.bonusText}>{t('gamification.xpBonus', { pct: bonusPct })}</Text>
        </View>
      )}
    </View>
  );
};

const bannerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: DESIGN_TOKENS.radius.md,
    borderWidth: 1,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    marginBottom: DESIGN_TOKENS.spacing.sm,
  },
  left:      { flex: 1, gap: 2 },
  eventName: { fontSize: 13, fontWeight: '700', color: '#fff' },
  eventEnd:  { fontSize: 11, fontWeight: '500' },
  bonusPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  bonusText: { fontSize: 11, fontWeight: '800', color: '#fff' },
});

// ─────────────────────────────────────────────────────────────────────────────
// TrophySeasonCard
// ─────────────────────────────────────────────────────────────────────────────

interface TrophySeasonCardProps {
  data: TrophiesResponse;
  t: TFunc;
}

const SEASON_ICON_MAP: Record<string, string> = {
  snowflake: '❄️',
  sunny:     '☀️',
};

const TrophySeasonCard: React.FC<TrophySeasonCardProps> = ({ data, t }) => {
  const { colors } = useTheme();
  const { current_season, archives } = data;
  const icon = SEASON_ICON_MAP[current_season.icon] ?? '🏆';
  const end  = new Date(current_season.end_date);
  const endLabel = end.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={[
      trophyStyles.card,
      { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
    ]}>
      {/* Header saison courante */}
      <View style={trophyStyles.header}>
        <Text style={trophyStyles.headerIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[trophyStyles.sectionTitle, { color: colors.text }]}>
            {t('gamification.trophy.currentSeason')}
          </Text>
          <Text style={[trophyStyles.seasonName, { color: colors.textMuted }]}>
            {current_season.name}
          </Text>
        </View>
        <View style={trophyStyles.countContainer}>
          <Text style={[trophyStyles.countNumber, { color: colors.text }]}>
            {current_season.trophies}
          </Text>
          <Text style={[trophyStyles.countLabel, { color: colors.textMuted }]}>🏆</Text>
        </View>
      </View>

      <Text style={[trophyStyles.endDate, { color: colors.textMuted }]}>
        {t('gamification.trophy.seasonEnds', { date: endLabel })}
      </Text>

      {/* Archives */}
      {archives.length > 0 && (
        <>
          <View style={[trophyStyles.divider, { backgroundColor: colors.border }]} />
          <Text style={[trophyStyles.archiveTitle, { color: colors.text }]}>
            {t('gamification.trophy.pastSeasons')}
          </Text>
          {archives.map((arch: TrophySeasonArchive) => {
            const archIcon = SEASON_ICON_MAP[arch.icon] ?? '🏆';
            return (
              <View key={arch.code} style={trophyStyles.archiveRow}>
                <Text style={trophyStyles.archiveIcon}>{archIcon}</Text>
                <Text style={[trophyStyles.archiveName, { color: colors.textMuted }]} numberOfLines={1}>
                  {arch.name}
                </Text>
                <Text style={[trophyStyles.archiveTrophies, { color: colors.text }]}>
                  🏆 {arch.trophies}
                </Text>
                {arch.rank != null && (
                  <View style={[trophyStyles.rankPill, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[trophyStyles.rankText, { color: colors.primary }]}>
                      {t('gamification.trophy.rankLabel', { rank: arch.rank })}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}
    </View>
  );
};

const trophyStyles = StyleSheet.create({
  card: {
    borderRadius: DESIGN_TOKENS.radius.lg,
    borderWidth: 1,
    padding: DESIGN_TOKENS.spacing.md,
    marginBottom: DESIGN_TOKENS.spacing.md,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  header:       { flexDirection: 'row', alignItems: 'center', gap: DESIGN_TOKENS.spacing.sm },
  headerIcon:   { fontSize: 28 },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  seasonName:   { fontSize: 14, fontWeight: '500', marginTop: 2 },
  countContainer: { alignItems: 'flex-end' },
  countNumber:  { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  countLabel:   { fontSize: 14 },
  endDate:      { fontSize: 12, fontWeight: '500' },
  divider:      { height: 1, marginVertical: DESIGN_TOKENS.spacing.xs },
  archiveTitle: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  archiveRow:   { flexDirection: 'row', alignItems: 'center', gap: DESIGN_TOKENS.spacing.sm, paddingVertical: 3 },
  archiveIcon:  { fontSize: 16, width: 22 },
  archiveName:  { flex: 1, fontSize: 13 },
  archiveTrophies: { fontSize: 13, fontWeight: '700' },
  rankPill:     { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  rankText:     { fontSize: 11, fontWeight: '700' },
});

// ─────────────────────────────────────────────────────────────────────────────
// QuestCard
// ─────────────────────────────────────────────────────────────────────────────

interface QuestCardProps {
  quest: GamificationV2Quest;
  onClaim: (quest: GamificationV2Quest) => void;
  isClaiming: boolean;
  t: TFunc;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, onClaim, isClaiming, t }) => {
  const { colors } = useTheme();

  const progress   = quest.target_count > 0 ? Math.min(1, quest.current_count / quest.target_count) : 0;
  const isClaimed  = quest.status === 'claimed';
  const isComplete = quest.status === 'completed';
  const isExpired  = quest.status === 'expired';
  const isEvent    = (quest.category ?? quest.type) === 'event';
  const eventColor = quest.event_info?.color;

  return (
    <View style={[
      cardStyles.card,
      {
        backgroundColor: colors.backgroundSecondary,
        borderColor: isComplete
          ? colors.primary
          : (isEvent && eventColor ? eventColor + '60' : colors.border),
        opacity: isClaimed || isExpired ? 0.55 : 1,
      },
    ]}>
      {/* Header */}
      <View style={cardStyles.header}>
        <Text style={cardStyles.icon}>{quest.icon ?? '🎯'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[cardStyles.title, { color: colors.text }]} numberOfLines={2}>{quest.title}</Text>
          {quest.description ? (
            <Text style={[cardStyles.desc, { color: colors.textMuted }]} numberOfLines={2}>{quest.description}</Text>
          ) : null}
          {quest.end_date && !isClaimed && !isExpired && (
            <Text style={[cardStyles.endDateLabel, { color: eventColor ?? colors.textMuted }]}>
              {formatEndDate(quest.end_date, t)}
            </Text>
          )}
        </View>
        <View style={cardStyles.rewards}>
          {isEvent && quest.event_info && quest.event_info.xp_bonus_multiplier > 1 && (
            <View style={[cardStyles.rewardBadge, { backgroundColor: eventColor ? eventColor + '25' : '#f59e0b20' }]}>
              <Text style={[cardStyles.rewardText, { color: eventColor ?? '#f59e0b' }]}>
                ⚡ +{Math.round((quest.event_info.xp_bonus_multiplier - 1) * 100)}% XP
              </Text>
            </View>
          )}
          {quest.xp_reward > 0 && (
            <View style={[cardStyles.rewardBadge, { backgroundColor: isEvent && eventColor ? eventColor + '25' : colors.primary + '20' }]}>
              <Text style={[cardStyles.rewardText, { color: isEvent && eventColor ? eventColor : colors.primary }]}>
                +{quest.xp_reward} XP
              </Text>
            </View>
          )}
          {(quest.trophy_count ?? quest.trophy_reward ?? 0) > 0 && (
            <View style={[cardStyles.rewardBadge, { backgroundColor: '#f59e0b20' }]}>
              <Text style={[cardStyles.rewardText, { color: '#f59e0b' }]}>
                🏆 {quest.trophy_count ?? quest.trophy_reward}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress bar */}
      {quest.target_count > 1 && (
        <View style={cardStyles.progressRow}>
          <View style={[cardStyles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[
              cardStyles.progressFill,
              {
                backgroundColor: isClaimed ? colors.textMuted : (isEvent && eventColor ? eventColor : colors.primary),
                width: `${Math.round(progress * 100)}%`,
              },
            ]} />
          </View>
          <Text style={[cardStyles.progressText, { color: colors.textMuted }]}>
            {quest.current_count} / {quest.target_count}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={cardStyles.footer}>
        {isComplete && (
          <TouchableOpacity
            style={[cardStyles.claimBtn, { backgroundColor: isEvent && eventColor ? eventColor : colors.primary }]}
            onPress={() => onClaim(quest)}
            disabled={isClaiming}
          >
            {isClaiming
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={cardStyles.claimBtnText}>{t('gamification.claim')}</Text>
            }
          </TouchableOpacity>
        )}
        {isClaimed && (
          <View style={[cardStyles.statusBadge, { backgroundColor: '#10b98120' }]}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={[cardStyles.statusText, { color: '#10b981' }]}>{t('gamification.claimed')}</Text>
          </View>
        )}
        {isExpired && (
          <View style={[cardStyles.statusBadge, { backgroundColor: colors.border }]}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={[cardStyles.statusText, { color: colors.textMuted }]}>{t('gamification.expired')}</Text>
          </View>
        )}
        {quest.status === 'in_progress' && quest.target_count === 1 && (
          <Text style={[cardStyles.hint, { color: colors.textMuted }]}>{t('gamification.inProgress')}</Text>
        )}
        {quest.status === 'not_started' && (
          <Text style={[cardStyles.hint, { color: colors.textMuted }]}>{t('gamification.notStarted')}</Text>
        )}
      </View>
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: DESIGN_TOKENS.radius.lg,
    borderWidth: 1,
    padding: DESIGN_TOKENS.spacing.md,
    marginBottom: DESIGN_TOKENS.spacing.sm,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  header:       { flexDirection: 'row', alignItems: 'flex-start', gap: DESIGN_TOKENS.spacing.sm },
  icon:         { fontSize: 28, lineHeight: 34 },
  title:        { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  desc:         { fontSize: 12, lineHeight: 16, marginTop: 2 },
  endDateLabel: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  rewards:      { alignItems: 'flex-end', gap: 4 },
  rewardBadge:  { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  rewardText:   { fontSize: 11, fontWeight: '700' },
  progressRow:  { flexDirection: 'row', alignItems: 'center', gap: DESIGN_TOKENS.spacing.sm },
  progressTrack:{ flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 11, minWidth: 40, textAlign: 'right' },
  footer:       { flexDirection: 'row', alignItems: 'center' },
  claimBtn: {
    borderRadius: DESIGN_TOKENS.radius.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    alignItems: 'center',
    minWidth: 110,
  },
  claimBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText:   { fontSize: 12, fontWeight: '600' },
  hint:         { fontSize: 12 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

const GamificationV2Screen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { t } = useLocalization();

  const {
    profile,
    xpProgress,
    isLoadingProfile,
    profileError,
    refreshProfile,
    quests,
    isLoadingQuests,
    refreshQuests,
    claimQuest,
  } = useGamificationV2();

  const [activeFilter, setActiveFilter] = useState<QuestType | 'all'>('all');
  const [trophies, setTrophies] = useState<TrophiesResponse | null>(null);
  const [isLoadingTrophies, setIsLoadingTrophies] = useState(false);

  const fetchTrophies = useCallback(async () => {
    setIsLoadingTrophies(true);
    try {
      const data = await fetchV2Trophies();
      setTrophies(data);
    } catch {
      // silently ignore — trophies are optional
    } finally {
      setIsLoadingTrophies(false);
    }
  }, []);
  const [claimingCode, setClaimingCode] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    await Promise.all([refreshProfile(), refreshQuests(), fetchTrophies()]);
  }, [refreshProfile, refreshQuests, fetchTrophies]);

  const handleClaim = useCallback(async (quest: GamificationV2Quest) => {
    if (!quest.period_key) return;
    setClaimingCode(quest.code);
    try {
      const result = await claimQuest(quest.code, quest.period_key);
      Alert.alert(
        t('gamification.claimSuccessTitle'),
        result.trophies > 0
          ? t('gamification.claimSuccessMessageTrophies', { xp: result.xp, trophies: result.trophies })
          : t('gamification.claimSuccessMessage', { xp: result.xp }),
        [{ text: t('gamification.claimOk') }],
      );
    } catch (e: any) {
      Alert.alert(t('gamification.error'), e?.message ?? t('gamification.claimError'));
    } finally {
      setClaimingCode(null);
    }
  }, [claimQuest, t]);

  // Fetch trophies on mount
  React.useEffect(() => { fetchTrophies(); }, [fetchTrophies]);

  const allSections = useMemo(() => groupQuestsByCategory(quests), [quests]);

  const visibleSections = useMemo(
    () => activeFilter === 'all' ? allSections : allSections.filter(s => s.type === activeFilter),
    [allSections, activeFilter],
  );

  const availableFilters = useMemo<(QuestType | 'all')[]>(() => {
    const types = new Set(allSections.map(s => s.type));
    return (['all', ...CATEGORY_ORDER] as (QuestType | 'all')[]).filter(t => t === 'all' || types.has(t));
  }, [allSections]);

  return (
    <Screen>
      {/* Guide first-XP — s'affiche automatiquement la première fois */}
      <FirstXPGuide />

      {/* ── Sticky Header : saison + progrès + filtres ───────────────────── */}
      <View style={[styles.stickyHeader, { backgroundColor: colors.background, borderBottomColor: colors.border, paddingTop: insets.top + DESIGN_TOKENS.spacing.sm }]}>
        <View style={{ paddingHorizontal: DESIGN_TOKENS.gutters?.horizontal ?? DESIGN_TOKENS.spacing.lg }}>
          {/* Back + titre + leaderboard */}
          <HStack gap="sm" align="center" style={{ marginBottom: DESIGN_TOKENS.spacing.md }}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={DESIGN_TOKENS.touch.hitSlop}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>
            <Text style={[styles.screenTitle, { color: colors.text, flex: 1 }]}>
              {t('gamification.title')}
            </Text>
            <Pressable
              onPress={() => (navigation as any).navigate('Leaderboard')}
              hitSlop={DESIGN_TOKENS.touch.hitSlop}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flexDirection: 'row', alignItems: 'center', gap: 4 })}
            >
              <Ionicons name="trophy-outline" size={20} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                {t('gamification.leaderboard') || 'Leaderboard'}
              </Text>
            </Pressable>
          </HStack>

          {/* Carte de stats (progrès utilisateur) */}
          {isLoadingProfile && !profile ? (
            <ActivityIndicator color={colors.primary} style={{ marginBottom: DESIGN_TOKENS.spacing.md }} />
          ) : profileError ? (
            <Text style={{ color: colors.error, textAlign: 'center', marginBottom: DESIGN_TOKENS.spacing.md }}>
              {profileError}
            </Text>
          ) : (
            <GamificationV2StatsCard
              profile={profile}
              xpProgress={xpProgress}
              colorAccent={colors.primary}
              seasonTrophies={trophies?.current_season?.trophies}
            />
          )}

          {/* Saison en cours */}
          {isLoadingTrophies && !trophies ? (
            <ActivityIndicator color={colors.primary} style={{ marginBottom: DESIGN_TOKENS.spacing.sm }} />
          ) : trophies ? (
            <TrophySeasonCard data={trophies} t={t} />
          ) : null}
        </View>

        {/* Titre quêtes + filtres — pleine largeur */}
        <View style={{ paddingHorizontal: DESIGN_TOKENS.gutters?.horizontal ?? DESIGN_TOKENS.spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: DESIGN_TOKENS.spacing.sm }]}>
            {t('gamification.myQuests')}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterRow, { paddingHorizontal: DESIGN_TOKENS.gutters?.horizontal ?? DESIGN_TOKENS.spacing.lg }]}
          style={{ marginBottom: DESIGN_TOKENS.spacing.sm }}
        >
          {availableFilters.map(cat => {
            const active = activeFilter === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setActiveFilter(cat)}
                style={({ pressed }) => [
                  styles.filterPill,
                  {
                    backgroundColor: active ? colors.primary : colors.backgroundSecondary,
                    borderColor: active ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={[styles.filterPillText, { color: active ? '#fff' : colors.text }]}>
                  {t(FILTER_LABEL_KEYS[cat])}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Liste de quêtes scrollable ─────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: DESIGN_TOKENS.gutters?.horizontal ?? DESIGN_TOKENS.spacing.lg,
          paddingTop: DESIGN_TOKENS.spacing.md,
          paddingBottom: insets.bottom + DESIGN_TOKENS.spacing.xxl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingProfile || isLoadingQuests}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Sections de quêtes */}
        {isLoadingQuests && quests.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: DESIGN_TOKENS.spacing.lg }} />
        ) : visibleSections.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {t('gamification.noQuestsInCategory')}
          </Text>
        ) : (
          <VStack gap="sm">
            {visibleSections.map((section, si) => {
              const timer = timeRemaining(section.type, t, section.eventInfo?.end_date);
              return (
                <View key={`qs-${si}`}>
                  {section.type === 'event' && section.eventInfo ? (
                    <EventQuestBanner eventInfo={section.eventInfo} t={t} />
                  ) : (
                    <View style={styles.sectionHeaderRow}>
                      <Text style={[styles.sectionLabel, { color: colors.text }]}>
                        {t(CATEGORY_LABEL_KEYS[section.type])}
                      </Text>
                      {timer ? (
                        <Text style={[styles.timerText, { color: colors.textMuted }]}>{timer}</Text>
                      ) : null}
                    </View>
                  )}
                  {section.data.map(q => (
                    <QuestCard
                      key={q.code}
                      quest={q}
                      onClaim={handleClaim}
                      isClaiming={claimingCode === q.code}
                      t={t}
                    />
                  ))}
                </View>
              );
            })}
          </VStack>
        )}
      </ScrollView>
    </Screen>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  stickyHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 0,    // insets.top appliqué inline via paddingTop dynamique
  },
  stickyInner: {
    paddingHorizontal: 0,   // Les composants internes appliquent leur propre padding
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: DESIGN_TOKENS.spacing.sm,
    paddingBottom: DESIGN_TOKENS.spacing.sm,
  },
  filterPill: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: DESIGN_TOKENS.spacing.md,
    paddingVertical: 6,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DESIGN_TOKENS.spacing.sm,
    marginTop: DESIGN_TOKENS.spacing.xs,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: DESIGN_TOKENS.spacing.lg,
    fontSize: 14,
  },
});

export default GamificationV2Screen;
