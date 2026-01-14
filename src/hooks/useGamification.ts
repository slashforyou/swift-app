/**
 * useGamification - Hook pour gérer les données de gamification
 * Intégration avec l'API backend pour Level, XP, Badges
 */
import { useState, useEffect, useCallback } from 'react';
import { 
    fetchGamification, 
    fetchLeaderboard,
    fetchXpHistory,
    GamificationData, 
    GamificationRank,
    LeaderboardEntry,
    BadgeDetailed,
    getRankFromLevel 
} from '../services/gamification';

// Interface pour la rétro-compatibilité avec l'ancien format
export interface GamificationDisplayData {
    firstName?: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    totalXpForNextLevel: number;
    xpProgress: number;
    role: string;
    title: string;
    rank: GamificationRank;
    completedJobs: number;
    streak: number;
    lastActivity: string;
    badges: string[];
    badgesDetailed?: BadgeDetailed[];
}

export interface UseGamificationReturn {
    data: GamificationDisplayData | null;
    fullData: GamificationData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    // Leaderboard
    leaderboard: LeaderboardEntry[] | null;
    userRank: number | null;
    fetchLeaderboardData: (limit?: number) => Promise<void>;
    // Legacy functions (now no-ops, XP is managed by backend)
    addXP: (amount: number, reason: string) => void;
    updateLevel: () => void;
    resetStreak: () => void;
}

// Données par défaut pour le fallback
const DEFAULT_DATA: GamificationDisplayData = {
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalXpForNextLevel: 100,
    xpProgress: 0,
    role: 'Newcomer',
    title: 'Newcomer',
    rank: { name: 'Starter', emoji: '⭐', color: '#808080' },
    completedJobs: 0,
    streak: 0,
    lastActivity: new Date().toISOString(),
    badges: [],
};

export const useGamification = (): UseGamificationReturn => {
    const [data, setData] = useState<GamificationDisplayData | null>(null);
    const [fullData, setFullData] = useState<GamificationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
    const [userRank, setUserRank] = useState<number | null>(null);

    // Convertir les données API en format d'affichage
    const transformApiData = (apiData: GamificationData): GamificationDisplayData => {
        return {
            level: apiData.level,
            xp: apiData.experience,
            xpToNextLevel: apiData.experienceToNextLevel - apiData.experience,
            totalXpForNextLevel: apiData.totalExperienceForNextLevel,
            xpProgress: apiData.xpProgress,
            role: apiData.title,
            title: apiData.title,
            rank: apiData.rank || getRankFromLevel(apiData.level),
            completedJobs: apiData.completedJobs,
            streak: apiData.streak,
            lastActivity: apiData.lastActivity || new Date().toISOString(),
            badges: apiData.badges,
            badgesDetailed: apiData.badgesDetailed,
        };
    };

    // Charger les données de gamification
    const loadGamificationData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const apiData = await fetchGamification();
            setFullData(apiData);
            setData(transformApiData(apiData));
        } catch (err) {
            console.error('❌ Erreur lors du chargement de la gamification:', err);
            setError(err instanceof Error ? err.message : 'Erreur de chargement');
            // Utiliser les données par défaut en cas d'erreur
            setData(DEFAULT_DATA);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Charger le leaderboard
    const fetchLeaderboardData = useCallback(async (limit: number = 20) => {
        try {
            const response = await fetchLeaderboard(limit);
            setLeaderboard(response.leaderboard);
            setUserRank(response.userRank);
        } catch (err) {
            console.error('❌ Erreur lors du chargement du leaderboard:', err);
        }
    }, []);

    // Charger les données au démarrage
    useEffect(() => {
        loadGamificationData();
    }, [loadGamificationData]);

    // ============== LEGACY FUNCTIONS (no-ops) ==============
    // Ces fonctions sont conservées pour la rétro-compatibilité
    // L'XP est maintenant géré entièrement par le backend

    const addXP = (_amount: number, _reason: string) => {
        // L'XP est maintenant géré par le backend
        // Cette fonction peut déclencher un refetch si nécessaire
        console.log('ℹ️ addXP appelé - L\'XP est géré par le backend, refetch des données...');
        loadGamificationData();
    };

    const updateLevel = () => {
        // Le niveau est calculé par le backend
        loadGamificationData();
    };

    const resetStreak = () => {
        // Le streak est géré par le backend
        loadGamificationData();
    };

    return {
        data,
        fullData,
        isLoading,
        error,
        refetch: loadGamificationData,
        leaderboard,
        userRank,
        fetchLeaderboardData,
        addXP,
        updateLevel,
        resetStreak,
    };
};