/**
 * Gamification API Service
 * Intégration avec l'API backend pour le système de gamification (Level, XP, Badges)
 */
import { ServerData } from '../constants/ServerData';
import { authenticatedFetch } from '../utils/auth';

const API = ServerData.serverUrl;

// ============== INTERFACES ==============

export interface GamificationRank {
  name: string;
  emoji: string;
  color: string;
}

export interface BadgeDetailed {
  code: string;
  name: string;
  description: string;
  category: 'driver' | 'offsider' | 'business' | 'rating' | 'streak' | 'level' | 'special';
  earnedAt?: string;
  requirementType?: string;
  requirementValue?: number;
  earned?: boolean;
}

export interface XpHistoryEntry {
  action: string;
  xp: number;
  date: string;
}

export interface LevelThreshold {
  level: number;
  xp_required: number;
  title: string;
}

export interface XpRewards {
  job_completed: number;
  five_star_rating: number;
  first_job_of_day: number;
  no_incident: number;
  photo_added: number;
  note_added: number;
  signature_collected: number;
  streak_bonus_7: number;
  streak_bonus_30: number;
  streak_bonus_100: number;
  referral_bonus: number;
  training_completed: number;
  profile_completed: number;
  verification_completed: number;
}

export interface GamificationData {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  totalExperienceForNextLevel: number;
  xpProgress: number;
  title: string;
  rank: GamificationRank;
  completedJobs: number;
  streak: number;
  lastActivity?: string;
  lastLevelUp?: string;
  badges: string[];
  badgesDetailed?: BadgeDetailed[];
  recentXp?: XpHistoryEntry[];
  xpRewards?: XpRewards;
  levelThresholds?: LevelThreshold[];
  availableBadges?: BadgeDetailed[];
}

export interface GamificationResponse {
  success: boolean;
  data: GamificationData;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  firstName: string;
  lastName: string;
  level: number;
  title: string;
  experience: number;
  completedJobs: number;
}

export interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntry[];
  userRank: number;
}

export interface XpHistoryResponse {
  success: boolean;
  history: {
    id: number;
    action: string;
    xpEarned: number;
    jobId?: number;
    createdAt: string;
  }[];
  total: number;
}

// ============== API FUNCTIONS ==============

/**
 * Récupère les données complètes de gamification
 */
export async function fetchGamification(): Promise<GamificationData> {
  const res = await authenticatedFetch(`${API}v1/user/gamification`, {
    method: 'GET',
  });

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status} response for gamification`);
    const error = await res.json().catch(() => ({ message: 'Failed to fetch gamification data' }));
    throw new Error(error.message || 'Failed to fetch gamification data');
  }

  const response: GamificationResponse = await res.json();
  return response.data;
}

/**
 * Récupère le leaderboard
 */
export async function fetchLeaderboard(limit: number = 20): Promise<LeaderboardResponse> {
  const res = await authenticatedFetch(`${API}v1/user/gamification/leaderboard?limit=${limit}`, {
    method: 'GET',
  });

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status} response for leaderboard`);
    const error = await res.json().catch(() => ({ message: 'Failed to fetch leaderboard' }));
    throw new Error(error.message || 'Failed to fetch leaderboard');
  }

  return await res.json();
}

/**
 * Récupère l'historique des gains d'XP
 */
export async function fetchXpHistory(limit: number = 50, offset: number = 0): Promise<XpHistoryResponse> {
  const res = await authenticatedFetch(`${API}v1/user/gamification/history?limit=${limit}&offset=${offset}`, {
    method: 'GET',
  });

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status} response for XP history`);
    const error = await res.json().catch(() => ({ message: 'Failed to fetch XP history' }));
    throw new Error(error.message || 'Failed to fetch XP history');
  }

  return await res.json();
}

// ============== HELPER FUNCTIONS ==============

/**
 * Calcule le pourcentage de progression vers le prochain niveau
 */
export function calculateProgressPercent(
  experience: number,
  currentLevel: number,
  levelThresholds?: LevelThreshold[]
): number {
  if (!levelThresholds || levelThresholds.length === 0) {
    return 0;
  }

  const currentLevelData = levelThresholds.find(l => l.level === currentLevel);
  const nextLevelData = levelThresholds.find(l => l.level === currentLevel + 1);

  if (!currentLevelData) return 0;
  if (!nextLevelData) return 100; // Max level

  const currentLevelXP = currentLevelData.xp_required;
  const nextLevelXP = nextLevelData.xp_required;
  const xpInCurrentLevel = experience - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;

  return Math.min(100, (xpInCurrentLevel / xpNeededForNext) * 100);
}

/**
 * Obtient les badges d'une catégorie spécifique
 */
export function getBadgesByCategory(
  badges: BadgeDetailed[],
  category: BadgeDetailed['category']
): BadgeDetailed[] {
  return badges.filter(badge => badge.category === category);
}

/**
 * Formate l'action XP en texte lisible
 */
export function formatXpAction(action: string): string {
  const actionLabels: Record<string, string> = {
    job_completed: 'Job complété',
    five_star_rating: 'Note 5 étoiles',
    first_job_of_day: 'Premier job du jour',
    no_incident: 'Sans incident',
    photo_added: 'Photo ajoutée',
    note_added: 'Note ajoutée',
    signature_collected: 'Signature collectée',
    streak_bonus_7: 'Bonus 7 jours',
    streak_bonus_30: 'Bonus 30 jours',
    streak_bonus_100: 'Bonus 100 jours',
    referral_bonus: 'Parrainage',
    training_completed: 'Formation terminée',
    profile_completed: 'Profil complété',
    verification_completed: 'Vérification terminée',
  };

  return actionLabels[action] || action;
}

// ============== RANK CONFIGURATION ==============

export const RANK_CONFIG = [
  { name: 'Starter', minLevel: 1, emoji: '⭐', color: '#808080' },
  { name: 'Member', minLevel: 5, emoji: '⭐⭐', color: '#4A90D9' },
  { name: 'Bronze', minLevel: 9, emoji: '🥉', color: '#CD7F32' },
  { name: 'Silver', minLevel: 13, emoji: '🥈', color: '#C0C0C0' },
  { name: 'Gold', minLevel: 17, emoji: '🥇', color: '#FFD700' },
  { name: 'Platinum', minLevel: 21, emoji: '💎', color: '#E5E4E2' },
  { name: 'Diamond', minLevel: 25, emoji: '👑', color: '#B9F2FF' },
];

/**
 * Obtient le rang basé sur le niveau (fallback si l'API ne le fournit pas)
 */
export function getRankFromLevel(level: number): GamificationRank {
  const rank = [...RANK_CONFIG].reverse().find(r => level >= r.minLevel) || RANK_CONFIG[0];
  return {
    name: rank.name,
    emoji: rank.emoji,
    color: rank.color,
  };
}
