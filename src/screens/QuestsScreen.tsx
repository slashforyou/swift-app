/**
 * QuestsScreen
 * Affiche les quêtes de l'utilisateur groupées par catégorie :
 * Intro → Daily → Weekly → Monthly → Events (temporaires)
 */
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../components/primitives/Screen';
import { DESIGN_TOKENS } from '../constants/Styles';
import { useTheme } from '../context/ThemeProvider';
import { useGamificationV2 } from '../hooks/useGamificationV2';
import { GamificationV2Quest, QuestEventInfo, QuestType } from '../services/gamificationV2';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<QuestType, string> = {
  intro:   '🚀 Découverte',
  daily:   '📅 Quotidiennes',
  weekly:  '📆 Hebdomadaires',
  monthly: '🗓️ Mensuelles',
  event:   '🎪 Événement',
};

/** Ordre d'affichage des catégories dans l'écran */
const CATEGORY_ORDER: QuestType[] = ['intro', 'daily', 'weekly', 'monthly', 'event'];

type QuestSection = {
  title: string;
  type: QuestType;
  data: GamificationV2Quest[];
  eventInfo?: QuestEventInfo;
};

function groupQuestsByCategory(quests: GamificationV2Quest[]): QuestSection[] {
  const map: Partial<Record<QuestType, GamificationV2Quest[]>> = {};
  const eventInfoMap: Partial<Record<string, QuestEventInfo>> = {};

  for (const q of quests) {
    const cat = q.category ?? q.type ?? 'daily';
    if (!map[cat]) map[cat] = [];
    map[cat]!.push(q);
    // Récupérer les infos event de la première quête event_info disponible
    if (cat === 'event' && q.event_info && !eventInfoMap[q.event_info.name]) {
      eventInfoMap[q.event_info.name] = q.event_info;
    }
  }

  const sections: QuestSection[] = [];

  for (const cat of CATEGORY_ORDER) {
    const items = map[cat];
    if (!items || items.length === 0) continue;

    if (cat === 'event') {
      // Grouper les quêtes event par événement
      const byEvent: Record<string, GamificationV2Quest[]> = {};
      for (const q of items) {
        const key = q.event_info?.name ?? 'Événement';
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
      sections.push({ title: CATEGORY_LABELS[cat], type: cat, data: items });
    }
  }

  return sections;
}

/** Formate une date de fin en "Finit le 31 juil." ou compte à rebours */
function formatEndDate(endDate: string): string {
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Terminé';
  if (diffDays === 1) return 'Finit demain';
  if (diffDays <= 7) return `${diffDays} jours restants`;
  return `Finit le ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// EventQuestBanner
// ─────────────────────────────────────────────────────────────────────────────

interface EventQuestBannerProps {
  eventInfo: QuestEventInfo;
}

const EventQuestBanner: React.FC<EventQuestBannerProps> = ({ eventInfo }) => {
  const bonusPct = Math.round((eventInfo.xp_bonus_multiplier - 1) * 100);
  return (
    <View style={[bannerStyles.container, { backgroundColor: eventInfo.color + '18', borderColor: eventInfo.color + '60' }]}>
      <View style={bannerStyles.left}>
        <Text style={bannerStyles.eventName}>{eventInfo.name}</Text>
        <Text style={[bannerStyles.endDate, { color: eventInfo.color }]}>
          {formatEndDate(eventInfo.end_date)}
        </Text>
      </View>
      {bonusPct > 0 && (
        <View style={[bannerStyles.bonusPill, { backgroundColor: eventInfo.color }]}>
          <Text style={bannerStyles.bonusText}>⚡ +{bonusPct}% XP</Text>
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
  left: { flex: 1, gap: 2 },
  eventName: { fontSize: 13, fontWeight: '700', color: '#fff' },
  endDate: { fontSize: 11, fontWeight: '500' },
  bonusPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bonusText: { fontSize: 11, fontWeight: '800', color: '#fff' },
});

// ─────────────────────────────────────────────────────────────────────────────
// QuestCard
// ─────────────────────────────────────────────────────────────────────────────

interface QuestCardProps {
  quest: GamificationV2Quest;
  onClaim: (quest: GamificationV2Quest) => void;
  isClaiming: boolean;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, onClaim, isClaiming }) => {
  const { colors } = useTheme();

  const progress = quest.target_count > 0
    ? Math.min(1, quest.current_count / quest.target_count)
    : 0;

  const isClaimed   = quest.status === 'claimed';
  const isCompleted = quest.status === 'completed';
  const isExpired   = quest.status === 'expired';

  const isEvent = (quest.category ?? quest.type) === 'event';
  const eventColor = quest.event_info?.color;
  const cardOpacity = isClaimed || isExpired ? 0.55 : 1;

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.backgroundSecondary,
        borderColor: isCompleted
          ? colors.primary
          : (isEvent && eventColor ? eventColor + '60' : colors.border),
        opacity: cardOpacity,
      },
    ]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.questIcon}>{quest.icon ?? '🎯'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.questTitle, { color: colors.text }]} numberOfLines={2}>
            {quest.title}
          </Text>
          {quest.description ? (
            <Text style={[styles.questDesc, { color: colors.textMuted }]} numberOfLines={2}>
              {quest.description}
            </Text>
          ) : null}
          {/* Date de fin pour les quêtes event */}
          {isEvent && quest.end_date && !isClaimed && !isExpired && (
            <Text style={[styles.endDateLabel, { color: eventColor ?? colors.textMuted }]}>
              {formatEndDate(quest.end_date)}
            </Text>
          )}
        </View>
        {/* Récompenses */}
        <View style={styles.rewards}>
          {quest.xp_reward > 0 && (
            <View style={[styles.rewardBadge, { backgroundColor: (isEvent && eventColor ? eventColor + '25' : colors.primary + '20') }]}>
              <Text style={[styles.rewardText, { color: isEvent && eventColor ? eventColor : colors.primary }]}>
                +{quest.xp_reward} XP
              </Text>
            </View>
          )}
          {(quest.trophy_count ?? quest.trophy_reward ?? 0) > 0 && (
            <View style={[styles.rewardBadge, { backgroundColor: '#f59e0b20' }]}>
              <Text style={[styles.rewardText, { color: '#f59e0b' }]}>🏆 {quest.trophy_count ?? quest.trophy_reward}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Barre de progression */}
      {quest.target_count > 1 && (
        <View style={styles.progressSection}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: isClaimed
                    ? colors.textMuted
                    : (isEvent && eventColor ? eventColor : colors.primary),
                  width: `${Math.round(progress * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>
            {quest.current_count} / {quest.target_count}
          </Text>
        </View>
      )}

      {/* Bouton claim / statut */}
      <View style={styles.cardFooter}>
        {isCompleted && (
          <TouchableOpacity
            style={[styles.claimBtn, { backgroundColor: isEvent && eventColor ? eventColor : colors.primary }]}
            onPress={() => onClaim(quest)}
            disabled={isClaiming}
          >
            {isClaiming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.claimBtnText}>Réclamer</Text>
            )}
          </TouchableOpacity>
        )}
        {isClaimed && (
          <View style={[styles.statusBadge, { backgroundColor: '#10b98120' }]}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={[styles.statusText, { color: '#10b981' }]}>Réclamé</Text>
          </View>
        )}
        {isExpired && (
          <View style={[styles.statusBadge, { backgroundColor: colors.border }]}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.statusText, { color: colors.textMuted }]}>Expiré</Text>
          </View>
        )}
        {quest.status === 'in_progress' && quest.target_count === 1 && (
          <Text style={[styles.progressHint, { color: colors.textMuted }]}>En cours…</Text>
        )}
        {quest.status === 'not_started' && (
          <Text style={[styles.progressHint, { color: colors.textMuted }]}>Pas encore commencé</Text>
        )}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

const QuestsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  const { quests, isLoadingQuests, questsError, refreshQuests, claimQuest } =
    useGamificationV2();

  const [claimingCode, setClaimingCode] = useState<string | null>(null);

  const sections = groupQuestsByCategory(quests);

  const handleClaim = useCallback(async (quest: GamificationV2Quest) => {
    if (!quest.period_key) return;
    setClaimingCode(quest.code);
    try {
      const result = await claimQuest(quest.code, quest.period_key);
      Alert.alert(
        '🎉 Récompense réclamée !',
        `+${result.xp} XP${result.trophies > 0 ? ` · 🏆 ${result.trophies} trophée(s)` : ''}`,
        [{ text: 'Super !' }]
      );
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de réclamer la récompense');
    } finally {
      setClaimingCode(null);
    }
  }, [claimQuest]);

  if (isLoadingQuests && quests.length === 0) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (questsError && quests.length === 0) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={40} color={colors.textMuted} />
          <Text style={[styles.errorText, { color: colors.textMuted }]}>{questsError}</Text>
          <TouchableOpacity onPress={refreshQuests} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const ListHeader = (
    <View style={[styles.screenHeader, { paddingTop: insets.top + DESIGN_TOKENS.spacing.sm }]}>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={DESIGN_TOKENS.touch?.hitSlop}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <Text style={[styles.screenTitle, { color: colors.text }]}>⚔️ Quêtes</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  return (
    <Screen>
      <SectionList
        sections={sections}
        keyExtractor={item => item.code}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListHeaderComponent={<>{ListHeader}</>}
        refreshControl={
          <RefreshControl refreshing={isLoadingQuests} onRefresh={refreshQuests} tintColor={colors.primary} />
        }
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            {section.type === 'event' && section.eventInfo ? (
              <EventQuestBanner eventInfo={section.eventInfo} />
            ) : (
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <QuestCard
            quest={item}
            onClaim={handleClaim}
            isClaiming={claimingCode === item.code}
          />
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Aucune quête disponible</Text>
          </View>
        }
      />
    </Screen>
  );
};

export default QuestsScreen;

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: DESIGN_TOKENS.spacing.xl,
    gap: DESIGN_TOKENS.spacing.md,
  },
  list: {
    paddingHorizontal: DESIGN_TOKENS.gutters.horizontal,
    paddingTop: DESIGN_TOKENS.spacing.md,
  },
  sectionHeader: {
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    marginTop: DESIGN_TOKENS.spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: DESIGN_TOKENS.radius.lg,
    borderWidth: 1,
    padding: DESIGN_TOKENS.spacing.md,
    marginBottom: DESIGN_TOKENS.spacing.sm,
    gap: DESIGN_TOKENS.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DESIGN_TOKENS.spacing.sm,
  },
  questIcon: {
    fontSize: 28,
    lineHeight: 34,
  },
  questTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  questDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  endDateLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  rewards: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rewardBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_TOKENS.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    minWidth: 40,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  claimBtn: {
    borderRadius: DESIGN_TOKENS.radius.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.lg,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
    alignItems: 'center',
    minWidth: 110,
  },
  claimBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressHint: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    borderRadius: DESIGN_TOKENS.radius.md,
    paddingHorizontal: DESIGN_TOKENS.spacing.xl,
    paddingVertical: DESIGN_TOKENS.spacing.sm,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DESIGN_TOKENS.gutters.horizontal,
    paddingBottom: DESIGN_TOKENS.spacing.md,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
});
