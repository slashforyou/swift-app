/**
 * Gamification V2 API Service
 * Utilise les nouveaux endpoints /v1/user/gamification/v2/
 */
import { ServerData } from '../constants/ServerData';
import { authenticatedFetch } from '../utils/auth';

const API = ServerData.serverUrl;

// ============================================================
//  TYPES
// ============================================================

export interface GamificationV2Profile {
  // XP / trophies
  total_xp: number;
  total_trophies: number;

  // Streaks
  current_streak_days: number;
  longest_streak_days: number;

  // Compteurs activité
  jobs_completed_count: number;
  photos_uploaded_count: number;
  signatures_collected_count: number;
  notes_added_count: number;
  reviews_received_count: number;

  // Timestamps
  last_active_date: string | null;
  updated_at: string;

  // Niveau (legacy sync)
  level: number;
  experience: number;

  // Labels enrichis
  level_label?: string;
  level_min_xp?: number;
  level_max_xp?: number;
  rank_label?: string;
  rank_icon?: string | null;
}

export interface GamificationV2LeaderboardEntry {
  id: number;
  first_name: string;
  last_name: string;
  profile_picture_url?: string | null;
  period_xp: number;
  total_trophies: number;
  current_streak_days: number;
  level: number;
  rank_label?: string | null;
}

export interface GamificationV2HistoryEntry {
  action_code: string;
  xp_awarded: number;
  reference_type: string | null;
  reference_id: number | null;
  created_at: string;
}

export type V2Period = 'all_time' | 'weekly' | 'monthly';

export type QuestType = 'intro' | 'daily' | 'weekly' | 'monthly' | 'event';
export type QuestStatus = 'not_started' | 'in_progress' | 'completed' | 'claimed' | 'expired';

/** Informations sur l'événement associé à une quête de catégorie 'event' */
export interface QuestEventInfo {
  name: string;
  icon: string;
  color: string;
  xp_bonus_multiplier: number;
  end_date: string;
}

export interface GamificationV2Quest {
  id: number;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  /** Catégorie de la quête : intro / daily / weekly / monthly / event */
  category: QuestType;
  /** Alias de category — conservé pour compatibilité avec l'ancien schéma */
  type: QuestType;
  xp_reward: number;
  /** Trophées associés à la quête — 0 pour la plupart (les trophées viennent des jobs) */
  trophy_reward: number;
  trophy_count: number;
  target_count: number;
  event_trigger: string;
  sort_order: number;
  current_count: number;
  status: QuestStatus;
  period_key: string | null;
  completed_at: string | null;
  claimed_at: string | null;
  /** Date de fin de la quête. NULL = illimité (quêtes intro/daily/weekly/monthly) */
  end_date: string | null;
  /** Infos de l'événement associé (uniquement si category === 'event') */
  event_info: QuestEventInfo | null;
}

export interface GamificationV2QuestsResponse {
  ok: boolean;
  data: GamificationV2Quest[];
  periods: { daily: string; weekly: string; monthly: string };
}

// ============================================================
//  API CALLS
// ============================================================

/**
 * Récupère le profil V2 de l'utilisateur connecté.
 */
export async function fetchV2Profile(): Promise<GamificationV2Profile> {
  const res = await authenticatedFetch(`${API}v1/user/gamification/v2/profile`, {
    method: 'GET',
  });
  if (!res.ok) throw new Error(`fetchV2Profile: HTTP ${res.status}`);
  const json = await res.json();
  return json.data as GamificationV2Profile;
}

/**
 * Récupère le leaderboard V2.
 * @param period  'all_time' | 'weekly' | 'monthly'
 * @param page    Numéro de page (1-based)
 */
export async function fetchV2Leaderboard(
  period: V2Period = 'all_time',
  page: number = 1
): Promise<{ data: GamificationV2LeaderboardEntry[]; page: number; period: V2Period }> {
  const params = new URLSearchParams({ period, page: String(page) });
  const res = await authenticatedFetch(`${API}v1/user/gamification/v2/leaderboard?${params}`, {
    method: 'GET',
  });
  if (!res.ok) throw new Error(`fetchV2Leaderboard: HTTP ${res.status}`);
  return res.json();
}

/**
 * Récupère l'historique des récompenses XP de l'utilisateur.
 * @param page  Numéro de page (1-based)
 */
export async function fetchV2History(
  page: number = 1
): Promise<{ data: GamificationV2HistoryEntry[]; page: number }> {
  const params = new URLSearchParams({ page: String(page) });
  const res = await authenticatedFetch(`${API}v1/user/gamification/v2/history?${params}`, {
    method: 'GET',
  });
  if (!res.ok) throw new Error(`fetchV2History: HTTP ${res.status}`);
  return res.json();
}

// ============================================================
//  HELPERS
// ============================================================

/**
 * Calcule le pourcentage de progression XP dans le niveau actuel.
 */
export function calcXpProgress(
  experience: number,
  levelMinXp: number,
  levelMaxXp: number
): number {
  if (levelMaxXp <= levelMinXp) return 100;
  const progress = ((experience - levelMinXp) / (levelMaxXp - levelMinXp)) * 100;
  return Math.max(0, Math.min(100, progress));
}

/**
 * Retourne le label lisible d'un action_code.
 */
/**
 * Retourne le label traduit d'une action XP.
 * @param actionCode  Code action (ex: 'job_completed')
 * @param t           Fonction de traduction (useLocalization().t)
 */
export function xpActionLabel(actionCode: string, t?: (key: string) => string): string {
  if (t) {
    const key = `gamification.actionLabels.${actionCode}`;
    const translated = t(key);
    // Si la clé n'est pas trouvée, t() retourne la clé elle-même
    if (translated !== key) return translated;
  }
  return actionCode.replace(/_/g, ' ');
}

/**
 * Récupère la liste des quêtes avec la progression de l'utilisateur.
 */
export async function fetchV2Quests(): Promise<GamificationV2QuestsResponse> {
  const res = await authenticatedFetch(`${API}v1/user/gamification/v2/quests`, {
    method: 'GET',
  });
  if (!res.ok) throw new Error(`fetchV2Quests: HTTP ${res.status}`);
  return res.json();
}

/**
 * Réclame la récompense d'une quête complétée.
 */
export async function claimV2Quest(
  questCode: string,
  periodKey: string
): Promise<{ ok: boolean; xp: number; trophies: number }> {
  const res = await authenticatedFetch(
    `${API}v1/user/gamification/v2/quests/${encodeURIComponent(questCode)}/claim`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period_key: periodKey }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `claimV2Quest: HTTP ${res.status}`);
  return json;
}

// ============================================================
//  TROPHÉES SAISONNIERS
// ============================================================

export interface TrophySeason {
  /** Ex: 'season_winter_2026' */
  code: string;
  /** Ex: 'Saison Hiver 2026' */
  name: string;
  /** 'snowflake' | 'sunny' */
  icon: string;
  start_date: string;
  end_date: string;
  trophies: number;
}

export interface TrophySeasonArchive {
  code: string;
  name: string;
  icon: string;
  trophies: number;
  rank: number | null;
  archived_at: string;
}

export interface TrophiesResponse {
  ok: boolean;
  current_season: TrophySeason;
  archives: TrophySeasonArchive[];
}

/**
 * Récupère les trophées de la saison courante + archives des saisons passées.
 */
export async function fetchV2Trophies(): Promise<TrophiesResponse> {
  const res = await authenticatedFetch(`${API}v1/user/gamification/v2/trophies`, {
    method: 'GET',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `fetchV2Trophies: HTTP ${res.status}`);
  return json as TrophiesResponse;
}

// ============================================================
//  DAILY RECAP
// ============================================================

export interface DailyRecapBreakdownItem {
  action: string;
  cnt: number;
  xp: number;
}

export interface DailyRecapData {
  date: string;
  sent: boolean;
  total_xp_gained: number;
  jobs_completed: number;
  level_before: number;
  level_after: number;
  level_up: boolean;
  breakdown: DailyRecapBreakdownItem[];
}

/**
 * Récupère le récap XP de la journée pour l'utilisateur connecté.
 * @param date  Format YYYY-MM-DD (défaut: aujourd'hui)
 * @returns     DailyRecapData ou null si aucun XP gagné aujourd'hui
 */
export async function fetchDailyRecap(date?: string): Promise<DailyRecapData | null> {
  const params = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await authenticatedFetch(`${API}v1/user/gamification/v2/daily-recap${params}`, {
    method: 'GET',
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json?.ok || !json?.data) return null;
  const data: DailyRecapData = {
    ...json.data,
    breakdown: Array.isArray(json.data.breakdown) ? json.data.breakdown : [],
  };
  if (data.total_xp_gained <= 0) return null;
  return data;
}

// ============================================================
//  BADGES V2
// ============================================================

export type BadgeCategory = 'driver' | 'offsider' | 'business' | 'rating' | 'streak' | 'level' | 'special';

export interface V2Badge {
  code: string;
  name: string;
  description: string;
  icon: string | null;
  category: BadgeCategory;
  /** Non-null for earned badges */
  earnedAt: string | null;
  requirementType: string | null;
  requirementValue: number | null;
  /** Current progress toward the badge requirement (for available badges) */
  currentValue: number | null;
  xpBonus: number;
}

export interface V2BadgesData {
  earned: V2Badge[];
  available: V2Badge[];
  stats: Record<string, number>;
}

/**
 * Récupère les badges V2 de l'utilisateur connecté.
 * Retourne { earned, available, stats } depuis GET /v1/user/gamification/v2/badges
 */
export async function fetchV2Badges(): Promise<V2BadgesData> {
  const res = await authenticatedFetch(`${API}v1/user/gamification/v2/badges`, {
    method: 'GET',
  });
  if (!res.ok) throw new Error(`fetchV2Badges: HTTP ${res.status}`);
  const json = await res.json();
  return (json.data ?? { earned: [], available: [], stats: {} }) as V2BadgesData;
}
