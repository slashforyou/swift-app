/**
 * useGamification - Version corrigée sans useEffect problématique
 */
import { useState } from 'react';

interface GamificationData {
    firstName: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    totalXpForNextLevel: number;
    role: string;
    completedJobs: number;
    streak: number;
    lastActivity: string;
}

interface UseGamificationReturn {
    data: GamificationData | null;
    isLoading: boolean;
    error: string | null;
    addXP: (amount: number, reason: string) => void;
    updateLevel: () => void;
    resetStreak: () => void;
}

// Niveaux et XP requis
const LEVELS = [
    { level: 1, xpRequired: 0, title: 'Rookie Driver' },
    { level: 2, xpRequired: 100, title: 'Rookie Driver' },
    { level: 3, xpRequired: 250, title: 'Rookie Driver' },
    { level: 4, xpRequired: 500, title: 'Driver' },
    { level: 5, xpRequired: 800, title: 'Driver' },
    { level: 6, xpRequired: 1200, title: 'Driver' },
    { level: 7, xpRequired: 1700, title: 'Driver' },
    { level: 8, xpRequired: 2300, title: 'Senior Driver' },
    { level: 9, xpRequired: 3000, title: 'Senior Driver' },
    { level: 10, xpRequired: 3800, title: 'Senior Driver' },
    { level: 11, xpRequired: 4700, title: 'Senior Driver' },
    { level: 12, xpRequired: 5700, title: 'Senior Driver' },
    { level: 13, xpRequired: 6800, title: 'Expert Driver' },
    { level: 14, xpRequired: 8000, title: 'Expert Driver' },
    { level: 15, xpRequired: 9300, title: 'Expert Driver' },
    { level: 16, xpRequired: 10700, title: 'Expert Driver' },
    { level: 17, xpRequired: 12200, title: 'Expert Driver' },
    { level: 18, xpRequired: 13800, title: 'Expert Driver' },
    { level: 19, xpRequired: 15500, title: 'Master Driver' },
    { level: 20, xpRequired: 17300, title: 'Master Driver' },
];

export const useGamificationFixed = (): UseGamificationReturn => {
    // Données par défaut calculées une seule fois
    const defaultData: GamificationData = {
        firstName: 'Marie',
        level: 8,
        xp: 1247,
        xpToNextLevel: 353,
        totalXpForNextLevel: 500,
        role: 'Senior Driver',
        completedJobs: 42,
        streak: 7,
        lastActivity: new Date().toISOString(),
    };

    const [data, setData] = useState<GamificationData>(defaultData);
    const [isLoading] = useState(false); // Pas de loading pour l'instant
    const [error] = useState<string | null>(null);

    const calculateLevel = (totalXP: number) => {
        let currentLevel = 1;
        let currentRole = 'Rookie Driver';
        
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (totalXP >= LEVELS[i].xpRequired) {
                currentLevel = LEVELS[i].level;
                currentRole = LEVELS[i].title;
                break;
            }
        }
        
        // Calculer XP pour le prochain niveau
        const nextLevelIndex = LEVELS.findIndex(l => l.level === currentLevel + 1);
        let xpToNextLevel = 0;
        let totalXpForNextLevel = 500;
        
        if (nextLevelIndex !== -1) {
            const nextLevelXP = LEVELS[nextLevelIndex].xpRequired;
            xpToNextLevel = nextLevelXP - totalXP;
            const currentLevelXP = LEVELS.find(l => l.level === currentLevel)?.xpRequired || 0;
            totalXpForNextLevel = nextLevelXP - currentLevelXP;
        }
        
        return {
            level: currentLevel,
            role: currentRole,
            xpToNextLevel: Math.max(0, xpToNextLevel),
            totalXpForNextLevel,
        };
    };

    const addXP = (amount: number, reason: string) => {
        if (!data) return;
        
        const newTotalXP = data.xp + amount;
        const levelInfo = calculateLevel(newTotalXP);
        
        const newData: GamificationData = {
            ...data,
            xp: newTotalXP,
            level: levelInfo.level,
            role: levelInfo.role,
            xpToNextLevel: levelInfo.xpToNextLevel,
            totalXpForNextLevel: levelInfo.totalXpForNextLevel,
            lastActivity: new Date().toISOString(),
        };
        
        // Si niveau up, on affiche un log
        const leveledUp = levelInfo.level > data.level;
        if (leveledUp) {
            console.log(`🎉 Level Up! Vous êtes maintenant ${levelInfo.role} niveau ${levelInfo.level}!`);
        }
        
        setData(newData);
        console.log(`+${amount} XP: ${reason}`);
    };

    const updateLevel = () => {
        if (!data) return;
        
        const levelInfo = calculateLevel(data.xp);
        const newData: GamificationData = {
            ...data,
            level: levelInfo.level,
            role: levelInfo.role,
            xpToNextLevel: levelInfo.xpToNextLevel,
            totalXpForNextLevel: levelInfo.totalXpForNextLevel,
        };
        
        setData(newData);
    };

    const resetStreak = () => {
        if (!data) return;
        
        const newData: GamificationData = {
            ...data,
            streak: 0,
        };
        
        setData(newData);
    };

    return {
        data,
        isLoading,
        error,
        addXP,
        updateLevel,
        resetStreak,
    };
};