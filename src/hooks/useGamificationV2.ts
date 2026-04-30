/**
 * useGamificationV2
 * Hook React pour les données Gamification V2 (profil, leaderboard, historique).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    calcXpProgress,
    claimV2Quest,
    fetchV2History,
    fetchV2Leaderboard,
    fetchV2Profile,
    fetchV2Quests,
    GamificationV2HistoryEntry,
    GamificationV2LeaderboardEntry,
    GamificationV2Profile,
    GamificationV2Quest,
    V2Period,
} from '../services/gamificationV2';
import { isSessionDead } from '../utils/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Types publics
// ─────────────────────────────────────────────────────────────────────────────

export interface UseGamificationV2Return {
  // Profil
  profile: GamificationV2Profile | null;
  xpProgress: number;          // 0–100 dans le niveau courant
  isLoadingProfile: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;

  // Leaderboard
  leaderboard: GamificationV2LeaderboardEntry[];
  leaderboardPeriod: V2Period;
  setLeaderboardPeriod: (p: V2Period) => void;
  isLoadingLeaderboard: boolean;
  leaderboardError: string | null;
  refreshLeaderboard: () => Promise<void>;

  // Historique XP
  history: GamificationV2HistoryEntry[];
  historyPage: number;
  isLoadingHistory: boolean;
  historyError: string | null;
  loadMoreHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;

  // Quêtes
  quests: GamificationV2Quest[];
  questPeriods: { daily: string; weekly: string; monthly: string } | null;
  isLoadingQuests: boolean;
  questsError: string | null;
  refreshQuests: () => Promise<void>;
  claimQuest: (questCode: string, periodKey: string) => Promise<{ xp: number; trophies: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useGamificationV2(): UseGamificationV2Return {
  // ── Profile ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<GamificationV2Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (isSessionDead()) return;
    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      const data = await fetchV2Profile();
      setProfile(data);
    } catch (e: any) {
      setProfileError(e?.message ?? 'Erreur profil V2');
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const xpProgress =
    profile && profile.level_min_xp != null && profile.level_max_xp != null
      ? calcXpProgress(profile.experience ?? 0, profile.level_min_xp, profile.level_max_xp)
      : 0;

  // ── Leaderboard ──────────────────────────────────────────────────────────
  const [leaderboard, setLeaderboard] = useState<GamificationV2LeaderboardEntry[]>([]);
  const [leaderboardPeriod, setLeaderboardPeriodState] = useState<V2Period>('weekly');
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const periodRef = useRef<V2Period>('weekly');

  const loadLeaderboard = useCallback(async (period: V2Period) => {
    if (isSessionDead()) return;
    setIsLoadingLeaderboard(true);
    setLeaderboardError(null);
    try {
      const res = await fetchV2Leaderboard(period, 1);
      setLeaderboard(res.data);
    } catch (e: any) {
      setLeaderboardError(e?.message ?? 'Erreur leaderboard V2');
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, []);

  const setLeaderboardPeriod = useCallback((p: V2Period) => {
    periodRef.current = p;
    setLeaderboardPeriodState(p);
    loadLeaderboard(p);
  }, [loadLeaderboard]);

  useEffect(() => { loadLeaderboard(periodRef.current); }, [loadLeaderboard]);

  const refreshLeaderboard = useCallback(() => loadLeaderboard(periodRef.current), [loadLeaderboard]);

  // ── History ──────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<GamificationV2HistoryEntry[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadHistory = useCallback(async (page: number, append = false) => {
    if (isSessionDead()) return;
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await fetchV2History(page);
      setHistory(prev => append ? [...prev, ...res.data] : res.data);
      setHistoryPage(page);
    } catch (e: any) {
      setHistoryError(e?.message ?? 'Erreur historique V2');
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => { loadHistory(1); }, [loadHistory]);

  const loadMoreHistory = useCallback(async () => {
    if (isLoadingHistory) return;
    await loadHistory(historyPage + 1, true);
  }, [isLoadingHistory, historyPage, loadHistory]);

  const refreshHistory = useCallback(() => loadHistory(1), [loadHistory]);

  // ── Quêtes ───────────────────────────────────────────────────────────────
  const [quests, setQuests] = useState<GamificationV2Quest[]>([]);
  const [questPeriods, setQuestPeriods] = useState<{ daily: string; weekly: string; monthly: string } | null>(null);
  const [isLoadingQuests, setIsLoadingQuests] = useState(false);
  const [questsError, setQuestsError] = useState<string | null>(null);

  const loadQuests = useCallback(async () => {
    if (isSessionDead()) return;
    setIsLoadingQuests(true);
    setQuestsError(null);
    try {
      const res = await fetchV2Quests();
      setQuests(res.data);
      setQuestPeriods(res.periods);
    } catch (e: any) {
      setQuestsError(e?.message ?? 'Erreur quêtes V2');
    } finally {
      setIsLoadingQuests(false);
    }
  }, []);

  useEffect(() => { loadQuests(); }, [loadQuests]);

  const refreshQuests = useCallback(() => loadQuests(), [loadQuests]);

  const claimQuest = useCallback(async (questCode: string, periodKey: string) => {
    const result = await claimV2Quest(questCode, periodKey);
    // Rafraîchir la liste après claim
    await loadQuests();
    return result;
  }, [loadQuests]);

  return {
    profile,
    xpProgress,
    isLoadingProfile,
    profileError,
    refreshProfile: loadProfile,
    leaderboard,
    leaderboardPeriod,
    setLeaderboardPeriod,
    isLoadingLeaderboard,
    leaderboardError,
    refreshLeaderboard,
    history,
    historyPage,
    isLoadingHistory,
    historyError,
    loadMoreHistory,
    refreshHistory,
    quests,
    questPeriods,
    isLoadingQuests,
    questsError,
    refreshQuests,
    claimQuest,
  };
}
