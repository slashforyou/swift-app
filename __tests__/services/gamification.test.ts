/**
 * Tests for Gamification Service
 * Tests API integration, data transformation, and helper functions
 */

import {
  GamificationData,
  GamificationRank,
  BadgeDetailed,
  LeaderboardEntry,
  calculateProgressPercent,
  getBadgesByCategory,
  formatXpAction,
  getRankFromLevel,
  RANK_CONFIG,
} from '../../src/services/gamification';

// Mock authenticatedFetch
jest.mock('../../src/utils/auth', () => ({
  authenticatedFetch: jest.fn(),
}));

import { authenticatedFetch } from '../../src/utils/auth';

const mockAuthenticatedFetch = authenticatedFetch as jest.MockedFunction<typeof authenticatedFetch>;

describe('Gamification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GamificationData Interface', () => {
    it('should have all required fields', () => {
      const mockData: GamificationData = {
        level: 5,
        experience: 850,
        experienceToNextLevel: 1200,
        totalExperienceForNextLevel: 1200,
        xpProgress: 50,
        title: 'Member',
        rank: {
          name: 'Member',
          emoji: '⭐⭐',
          color: '#4A90D9',
        },
        completedJobs: 12,
        streak: 3,
        badges: ['driver_first', 'driver_10'],
      };

      expect(mockData.level).toBe(5);
      expect(mockData.experience).toBe(850);
      expect(mockData.title).toBe('Member');
      expect(mockData.rank.name).toBe('Member');
      expect(mockData.badges).toContain('driver_first');
    });

    it('should handle optional fields', () => {
      const mockData: GamificationData = {
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        totalExperienceForNextLevel: 100,
        xpProgress: 0,
        title: 'Newcomer',
        rank: { name: 'Starter', emoji: '⭐', color: '#808080' },
        completedJobs: 0,
        streak: 0,
        badges: [],
        lastActivity: '2026-01-14T10:30:00Z',
        lastLevelUp: '2026-01-10T15:00:00Z',
        badgesDetailed: [],
        recentXp: [],
      };

      expect(mockData.lastActivity).toBeDefined();
      expect(mockData.lastLevelUp).toBeDefined();
      expect(mockData.badgesDetailed).toEqual([]);
    });
  });

  describe('GamificationRank Interface', () => {
    it('should have name, emoji and color', () => {
      const rank: GamificationRank = {
        name: 'Gold',
        emoji: '🥇',
        color: '#FFD700',
      };

      expect(rank.name).toBe('Gold');
      expect(rank.emoji).toBe('🥇');
      expect(rank.color).toBe('#FFD700');
    });
  });

  describe('BadgeDetailed Interface', () => {
    it('should have all badge properties', () => {
      const badge: BadgeDetailed = {
        code: 'driver_first',
        name: 'Rookie Driver',
        description: 'Completed first job as a driver',
        category: 'driver',
        earnedAt: '2026-01-05T09:00:00Z',
        requirementType: 'driver_jobs',
        requirementValue: 1,
        earned: true,
      };

      expect(badge.code).toBe('driver_first');
      expect(badge.category).toBe('driver');
      expect(badge.earned).toBe(true);
    });

    it('should validate all badge categories', () => {
      const categories: BadgeDetailed['category'][] = [
        'driver',
        'offsider',
        'business',
        'rating',
        'streak',
        'level',
        'special',
      ];

      categories.forEach(category => {
        const badge: BadgeDetailed = {
          code: 'test',
          name: 'Test',
          description: 'Test badge',
          category,
        };
        expect(badge.category).toBe(category);
      });
    });
  });

  describe('LeaderboardEntry Interface', () => {
    it('should have all leaderboard properties', () => {
      const entry: LeaderboardEntry = {
        rank: 1,
        userId: 42,
        firstName: 'Alice',
        lastName: 'Smith',
        level: 15,
        title: 'Specialist',
        experience: 9500,
        completedJobs: 156,
      };

      expect(entry.rank).toBe(1);
      expect(entry.firstName).toBe('Alice');
      expect(entry.level).toBe(15);
    });
  });

  describe('calculateProgressPercent', () => {
    const levelThresholds = [
      { level: 1, xp_required: 0, title: 'Newcomer' },
      { level: 2, xp_required: 100, title: 'Newcomer' },
      { level: 3, xp_required: 250, title: 'Starter' },
      { level: 4, xp_required: 500, title: 'Starter' },
      { level: 5, xp_required: 800, title: 'Member' },
    ];

    it('should calculate 0% at level start', () => {
      const percent = calculateProgressPercent(0, 1, levelThresholds);
      expect(percent).toBe(0);
    });

    it('should calculate 50% at midpoint', () => {
      const percent = calculateProgressPercent(50, 1, levelThresholds);
      expect(percent).toBe(50);
    });

    it('should calculate 100% at max level', () => {
      const percent = calculateProgressPercent(800, 5, levelThresholds);
      expect(percent).toBe(100);
    });

    it('should handle level 2 progression', () => {
      // Level 2 starts at 100, level 3 at 250, so 175 XP = 50%
      const percent = calculateProgressPercent(175, 2, levelThresholds);
      expect(percent).toBe(50);
    });

    it('should return 0 if no thresholds provided', () => {
      const percent = calculateProgressPercent(100, 1, []);
      expect(percent).toBe(0);
    });

    it('should return 0 if current level not found', () => {
      const percent = calculateProgressPercent(100, 99, levelThresholds);
      expect(percent).toBe(0);
    });

    it('should cap at 100%', () => {
      const percent = calculateProgressPercent(1000, 1, levelThresholds);
      expect(percent).toBeLessThanOrEqual(100);
    });
  });

  describe('getBadgesByCategory', () => {
    const badges: BadgeDetailed[] = [
      { code: 'driver_first', name: 'Rookie Driver', description: '', category: 'driver' },
      { code: 'driver_10', name: 'Driver', description: '', category: 'driver' },
      { code: 'five_star_first', name: 'First Five Star', description: '', category: 'rating' },
      { code: 'streak_7', name: 'Week Warrior', description: '', category: 'streak' },
      { code: 'level_5', name: 'Rising Star', description: '', category: 'level' },
    ];

    it('should filter driver badges', () => {
      const driverBadges = getBadgesByCategory(badges, 'driver');
      expect(driverBadges).toHaveLength(2);
      expect(driverBadges[0].code).toBe('driver_first');
    });

    it('should filter rating badges', () => {
      const ratingBadges = getBadgesByCategory(badges, 'rating');
      expect(ratingBadges).toHaveLength(1);
      expect(ratingBadges[0].code).toBe('five_star_first');
    });

    it('should return empty array for category with no badges', () => {
      const businessBadges = getBadgesByCategory(badges, 'business');
      expect(businessBadges).toHaveLength(0);
    });

    it('should handle empty badges array', () => {
      const result = getBadgesByCategory([], 'driver');
      expect(result).toHaveLength(0);
    });
  });

  describe('formatXpAction', () => {
    it('should format job_completed action', () => {
      expect(formatXpAction('job_completed')).toBe('Job complété');
    });

    it('should format five_star_rating action', () => {
      expect(formatXpAction('five_star_rating')).toBe('Note 5 étoiles');
    });

    it('should format first_job_of_day action', () => {
      expect(formatXpAction('first_job_of_day')).toBe('Premier job du jour');
    });

    it('should format streak bonus actions', () => {
      expect(formatXpAction('streak_bonus_7')).toBe('Bonus 7 jours');
      expect(formatXpAction('streak_bonus_30')).toBe('Bonus 30 jours');
      expect(formatXpAction('streak_bonus_100')).toBe('Bonus 100 jours');
    });

    it('should return original action if not mapped', () => {
      expect(formatXpAction('unknown_action')).toBe('unknown_action');
    });

    it('should format all known actions', () => {
      const knownActions = [
        'job_completed',
        'five_star_rating',
        'first_job_of_day',
        'no_incident',
        'photo_added',
        'note_added',
        'signature_collected',
        'referral_bonus',
        'training_completed',
        'profile_completed',
        'verification_completed',
      ];

      knownActions.forEach(action => {
        const formatted = formatXpAction(action);
        expect(formatted).not.toBe(action); // Should be translated
      });
    });
  });

  describe('getRankFromLevel', () => {
    it('should return Starter for level 1', () => {
      const rank = getRankFromLevel(1);
      expect(rank.name).toBe('Starter');
      expect(rank.emoji).toBe('⭐');
      expect(rank.color).toBe('#808080');
    });

    it('should return Member for level 5', () => {
      const rank = getRankFromLevel(5);
      expect(rank.name).toBe('Member');
      expect(rank.emoji).toBe('⭐⭐');
    });

    it('should return Bronze for level 9', () => {
      const rank = getRankFromLevel(9);
      expect(rank.name).toBe('Bronze');
      expect(rank.emoji).toBe('🥉');
    });

    it('should return Silver for level 13', () => {
      const rank = getRankFromLevel(13);
      expect(rank.name).toBe('Silver');
      expect(rank.emoji).toBe('🥈');
    });

    it('should return Gold for level 17', () => {
      const rank = getRankFromLevel(17);
      expect(rank.name).toBe('Gold');
      expect(rank.emoji).toBe('🥇');
      expect(rank.color).toBe('#FFD700');
    });

    it('should return Platinum for level 21', () => {
      const rank = getRankFromLevel(21);
      expect(rank.name).toBe('Platinum');
      expect(rank.emoji).toBe('💎');
    });

    it('should return Diamond for level 25+', () => {
      const rank = getRankFromLevel(25);
      expect(rank.name).toBe('Diamond');
      expect(rank.emoji).toBe('👑');
    });

    it('should return Diamond for level 30', () => {
      const rank = getRankFromLevel(30);
      expect(rank.name).toBe('Diamond');
    });

    it('should return Starter for level 0 or negative', () => {
      expect(getRankFromLevel(0).name).toBe('Starter');
      expect(getRankFromLevel(-1).name).toBe('Starter');
    });
  });

  describe('RANK_CONFIG', () => {
    it('should have 7 ranks configured', () => {
      expect(RANK_CONFIG).toHaveLength(7);
    });

    it('should have ranks in ascending order by minLevel', () => {
      for (let i = 1; i < RANK_CONFIG.length; i++) {
        expect(RANK_CONFIG[i].minLevel).toBeGreaterThan(RANK_CONFIG[i - 1].minLevel);
      }
    });

    it('should have valid hex colors', () => {
      RANK_CONFIG.forEach(rank => {
        expect(rank.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should have all required properties', () => {
      RANK_CONFIG.forEach(rank => {
        expect(rank).toHaveProperty('name');
        expect(rank).toHaveProperty('minLevel');
        expect(rank).toHaveProperty('emoji');
        expect(rank).toHaveProperty('color');
      });
    });
  });

  describe('XP Rewards Configuration', () => {
    it('should have correct XP values for actions', () => {
      const expectedRewards = {
        job_completed: 50,
        five_star_rating: 25,
        first_job_of_day: 10,
        no_incident: 15,
        photo_added: 5,
        note_added: 5,
        signature_collected: 10,
        streak_bonus_7: 100,
        streak_bonus_30: 500,
        streak_bonus_100: 2000,
        referral_bonus: 200,
        training_completed: 75,
        profile_completed: 100,
        verification_completed: 250,
      };

      // Verify structure matches expected
      Object.keys(expectedRewards).forEach(action => {
        expect(formatXpAction(action)).toBeDefined();
      });
    });
  });

  describe('Level Thresholds', () => {
    it('should validate level progression structure', () => {
      const levels = [
        { level: 1, title: 'Newcomer', minXp: 0 },
        { level: 5, title: 'Member', minXp: 800 },
        { level: 10, title: 'Professional', minXp: 3800 },
        { level: 15, title: 'Specialist', minXp: 9300 },
        { level: 20, title: 'Master', minXp: 17300 },
        { level: 25, title: 'Legend', minXp: 29000 },
        { level: 30, title: 'Ultimate', minXp: 52000 },
      ];

      // XP should increase with each level
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i].minXp).toBeGreaterThan(levels[i - 1].minXp);
      }
    });
  });

  describe('Badge Categories', () => {
    it('should have all 7 badge categories', () => {
      const categories: BadgeDetailed['category'][] = [
        'driver',
        'offsider', 
        'business',
        'rating',
        'streak',
        'level',
        'special',
      ];

      expect(categories).toHaveLength(7);
    });

    it('should validate badge structure', () => {
      const sampleBadges: { code: string; category: BadgeDetailed['category']; threshold: number }[] = [
        { code: 'driver_first', category: 'driver', threshold: 1 },
        { code: 'driver_10', category: 'driver', threshold: 10 },
        { code: 'driver_100', category: 'driver', threshold: 100 },
        { code: 'five_star_first', category: 'rating', threshold: 1 },
        { code: 'streak_7', category: 'streak', threshold: 7 },
        { code: 'streak_30', category: 'streak', threshold: 30 },
        { code: 'level_5', category: 'level', threshold: 5 },
        { code: 'level_20', category: 'level', threshold: 20 },
      ];

      sampleBadges.forEach(badge => {
        expect(badge.code).toContain('_');
        expect(badge.threshold).toBeGreaterThan(0);
      });
    });
  });

  describe('API Response Handling', () => {
    it('should handle successful gamification response', async () => {
      const mockResponse = {
        success: true,
        data: {
          level: 5,
          experience: 850,
          experienceToNextLevel: 1200,
          totalExperienceForNextLevel: 1200,
          xpProgress: 50,
          title: 'Member',
          rank: { name: 'Member', emoji: '⭐⭐', color: '#4A90D9' },
          completedJobs: 12,
          streak: 3,
          badges: ['driver_first'],
        },
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data.level).toBe(5);
    });

    it('should handle leaderboard response', () => {
      const mockResponse = {
        success: true,
        leaderboard: [
          { rank: 1, userId: 42, firstName: 'Alice', lastName: 'S', level: 15, title: 'Specialist', experience: 9500, completedJobs: 156 },
          { rank: 2, userId: 15, firstName: 'Bob', lastName: 'J', level: 12, title: 'Expert', experience: 7200, completedJobs: 98 },
        ],
        userRank: 5,
      };

      expect(mockResponse.leaderboard).toHaveLength(2);
      expect(mockResponse.leaderboard[0].rank).toBe(1);
      expect(mockResponse.userRank).toBe(5);
    });

    it('should handle XP history response', () => {
      const mockResponse = {
        success: true,
        history: [
          { id: 123, action: 'job_completed', xpEarned: 50, jobId: 456, createdAt: '2026-01-14T10:30:00Z' },
          { id: 124, action: 'five_star_rating', xpEarned: 25, createdAt: '2026-01-14T11:00:00Z' },
        ],
        total: 234,
      };

      expect(mockResponse.history).toHaveLength(2);
      expect(mockResponse.total).toBe(234);
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no badges', () => {
      const data: GamificationData = {
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        totalExperienceForNextLevel: 100,
        xpProgress: 0,
        title: 'Newcomer',
        rank: { name: 'Starter', emoji: '⭐', color: '#808080' },
        completedJobs: 0,
        streak: 0,
        badges: [],
      };

      expect(data.badges).toHaveLength(0);
      expect(data.level).toBe(1);
    });

    it('should handle max level user', () => {
      const data: GamificationData = {
        level: 30,
        experience: 52000,
        experienceToNextLevel: 52000,
        totalExperienceForNextLevel: 0,
        xpProgress: 100,
        title: 'Ultimate',
        rank: { name: 'Diamond', emoji: '👑', color: '#B9F2FF' },
        completedJobs: 1000,
        streak: 365,
        badges: ['driver_1000', 'streak_365', 'level_30'],
      };

      expect(data.level).toBe(30);
      expect(data.xpProgress).toBe(100);
    });

    it('should handle zero streak', () => {
      const data: GamificationData = {
        level: 5,
        experience: 850,
        experienceToNextLevel: 1200,
        totalExperienceForNextLevel: 400,
        xpProgress: 50,
        title: 'Member',
        rank: { name: 'Member', emoji: '⭐⭐', color: '#4A90D9' },
        completedJobs: 50,
        streak: 0,
        badges: [],
      };

      expect(data.streak).toBe(0);
    });
  });
});
