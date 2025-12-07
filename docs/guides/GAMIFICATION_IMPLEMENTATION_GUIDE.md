# 🛠️ SwiftApp - Guide d'Implémentation Technique Gamification

**Date**: 7 Décembre 2025  
**Version**: 1.0  
**Scope**: Architecture complète Backend + Frontend  
**Estimation**: 5 semaines développement (3 devs)

---

## 📋 **Overview Implémentation**

### **Phase 1: Backend Foundation (2 semaines)**
- Base de données gamification 
- API endpoints core
- Système d'événements automatique
- Tests unitaires

### **Phase 2: Frontend Integration (2 semaines)**  
- Services & hooks React
- Composants UI gamification
- Integration avec app existante
- Tests E2E

### **Phase 3: Advanced Features (1 semaine)**
- Badges avancés & leaderboards
- Notifications push gamification
- Analytics & monitoring
- Polish UX/UI

---

## 🗄️ **Backend Implementation**

### **1. Schema Base de Données**

```sql
-- Table principale gamification utilisateur
CREATE TABLE user_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    total_points_earned INTEGER NOT NULL DEFAULT 0,
    current_streak_days INTEGER NOT NULL DEFAULT 0,
    longest_streak_days INTEGER NOT NULL DEFAULT 0,
    badges_earned JSONB NOT NULL DEFAULT '[]',
    last_action_date TIMESTAMPTZ,
    monthly_targets JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_gamification UNIQUE(user_id)
);

-- Historique des transactions points
CREATE TABLE points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    points_awarded INTEGER NOT NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES business_staff(id) ON DELETE SET NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Achievements utilisateur  
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(100) NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    progress INTEGER DEFAULT 100, -- Pour badges progressifs
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT unique_user_badge UNIQUE(user_id, badge_id)
);

-- Configuration des niveaux (admin)
CREATE TABLE gamification_levels (
    level INTEGER PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    experience_required INTEGER NOT NULL,
    benefits JSONB NOT NULL DEFAULT '[]',
    icon VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configuration des badges (admin)
CREATE TABLE gamification_badges (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL,
    rarity VARCHAR(20) NOT NULL DEFAULT 'common',
    requirements JSONB NOT NULL DEFAULT '{}',
    rewards JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index de performance
CREATE INDEX idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX idx_points_transactions_action_type ON points_transactions(action_type);
CREATE INDEX idx_points_transactions_created_at ON points_transactions(created_at);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_badge_id ON user_achievements(badge_id);
```

### **2. Backend Services (Node.js/TypeScript)**

```typescript
// services/gamification/core.ts
export class GamificationService {
    
    /**
     * Award points pour une action utilisateur
     */
    static async awardPoints(params: {
        userId: string;
        actionType: string;
        points: number;
        description: string;
        jobId?: string;
        staffId?: string;
        businessId?: string;
        metadata?: any;
    }): Promise<PointsTransaction> {
        
        const transaction = await db.transaction(async (trx) => {
            // 1. Créer transaction points
            const pointsTransaction = await trx.table('points_transactions').insert({
                user_id: params.userId,
                action_type: params.actionType,
                points_awarded: params.points,
                job_id: params.jobId,
                staff_id: params.staffId,
                business_id: params.businessId,
                description: params.description,
                metadata: params.metadata || {}
            }).returning('*').first();

            // 2. Mettre à jour profil gamification
            const currentProfile = await trx.table('user_gamification')
                .where('user_id', params.userId)
                .first();

            if (!currentProfile) {
                // Créer profil initial
                await trx.table('user_gamification').insert({
                    user_id: params.userId,
                    experience: params.points,
                    total_points_earned: params.points,
                    last_action_date: new Date()
                });
            } else {
                const newExperience = currentProfile.experience + params.points;
                const newLevel = this.calculateLevel(newExperience);
                
                await trx.table('user_gamification')
                    .where('user_id', params.userId)
                    .update({
                        experience: newExperience,
                        level: newLevel,
                        total_points_earned: currentProfile.total_points_earned + params.points,
                        last_action_date: new Date(),
                        updated_at: new Date()
                    });

                // 3. Vérifier nouveaux badges
                await this.checkForNewBadges(trx, params.userId, params.actionType);
            }

            return pointsTransaction;
        });

        // 4. Envoyer notifications
        await this.sendGamificationNotification(params.userId, {
            type: 'points_awarded',
            points: params.points,
            action: params.actionType,
            description: params.description
        });

        return transaction;
    }

    /**
     * Calculer niveau basé sur expérience
     */
    private static calculateLevel(experience: number): number {
        const levels = [
            { level: 1, exp: 0 },
            { level: 2, exp: 500 },
            { level: 3, exp: 1500 },
            { level: 4, exp: 3500 },
            { level: 5, exp: 7500 },
            { level: 6, exp: 15000 },
            { level: 7, exp: 30000 }
        ];

        for (let i = levels.length - 1; i >= 0; i--) {
            if (experience >= levels[i].exp) {
                return levels[i].level;
            }
        }
        return 1;
    }

    /**
     * Vérifier et débloquer nouveaux badges
     */
    private static async checkForNewBadges(
        trx: any, 
        userId: string, 
        actionType: string
    ): Promise<void> {
        const badgeCheckers = {
            'job_completed': this.checkJobCompletionBadges,
            'staff_created': this.checkTeamBadges,
            'payment_received': this.checkPaymentBadges,
            // ... autres checkers
        };

        const checker = badgeCheckers[actionType];
        if (checker) {
            await checker(trx, userId);
        }
    }

    /**
     * Vérifier badges liés aux jobs
     */
    private static async checkJobCompletionBadges(trx: any, userId: string): Promise<void> {
        // Badge Perfectionniste: 100 jobs sans réclamation
        const perfectJobs = await trx.table('jobs')
            .where('created_by', userId)
            .where('status', 'completed')
            .where('customer_satisfaction', '>=', 4)
            .count('* as count')
            .first();

        if (perfectJobs.count >= 100) {
            await this.unlockBadge(trx, userId, 'PERFECTIONIST');
        }

        // Badge Éclair: 50 jobs finis en avance
        const earlyJobs = await trx.table('jobs')
            .where('created_by', userId)
            .where('status', 'completed')
            .whereRaw('actual_end_time < estimated_end_time')
            .count('* as count')
            .first();

        if (earlyJobs.count >= 50) {
            await this.unlockBadge(trx, userId, 'SPEED_DEMON');
        }

        // ... autres vérifications badges
    }

    /**
     * Débloquer un badge
     */
    private static async unlockBadge(
        trx: any, 
        userId: string, 
        badgeId: string
    ): Promise<void> {
        // Vérifier si déjà débloqué
        const existing = await trx.table('user_achievements')
            .where('user_id', userId)
            .where('badge_id', badgeId)
            .first();

        if (!existing) {
            await trx.table('user_achievements').insert({
                user_id: userId,
                badge_id: badgeId,
                earned_at: new Date()
            });

            // Notification badge débloqué
            await this.sendGamificationNotification(userId, {
                type: 'badge_unlocked',
                badgeId: badgeId
            });
        }
    }

    /**
     * Récupérer profil gamification complet
     */
    static async getUserProfile(userId: string): Promise<UserGamificationProfile> {
        const [profile, recentTransactions, achievements] = await Promise.all([
            db.table('user_gamification').where('user_id', userId).first(),
            db.table('points_transactions')
                .where('user_id', userId)
                .orderBy('created_at', 'desc')
                .limit(10),
            db.table('user_achievements')
                .join('gamification_badges', 'user_achievements.badge_id', 'gamification_badges.id')
                .where('user_achievements.user_id', userId)
                .select('user_achievements.*', 'gamification_badges.name', 'gamification_badges.icon')
        ]);

        if (!profile) {
            // Créer profil initial
            await db.table('user_gamification').insert({
                user_id: userId
            });
            return this.getUserProfile(userId); // Récursion pour récupérer le nouveau profil
        }

        const nextLevelExp = this.getExperienceForLevel(profile.level + 1);
        
        return {
            userId: profile.user_id,
            level: profile.level,
            experience: profile.experience,
            experienceToNextLevel: nextLevelExp - profile.experience,
            totalPointsEarned: profile.total_points_earned,
            currentStreak: profile.current_streak_days,
            longestStreak: profile.longest_streak_days,
            badges: achievements,
            recentActivity: recentTransactions,
            levelInfo: await this.getLevelInfo(profile.level)
        };
    }

    /**
     * Envoyer notification gamification
     */
    private static async sendGamificationNotification(
        userId: string, 
        notification: any
    ): Promise<void> {
        // Integration avec système de notifications existant
        await NotificationService.send({
            userId,
            type: 'gamification',
            title: this.getNotificationTitle(notification),
            body: this.getNotificationBody(notification),
            data: notification
        });
    }
}

// services/gamification/events.ts
export class GamificationEventHandler {
    
    /**
     * Handler pour événements job
     */
    static async handleJobEvent(event: JobEvent): Promise<void> {
        switch (event.type) {
            case 'job_completed':
                await this.handleJobCompleted(event);
                break;
            case 'job_started_ontime':
                await this.handleJobStartedOntime(event);
                break;
            case 'job_photos_uploaded':
                await this.handleJobPhotosUploaded(event);
                break;
            // ... autres événements
        }
    }

    private static async handleJobCompleted(event: JobCompletedEvent): Promise<void> {
        const basePoints = 50;
        let bonusPoints = 0;
        let description = 'Job terminé avec succès';

        // Bonus si terminé en avance
        if (event.finishedEarly) {
            bonusPoints += 25;
            description += ' (en avance!)';
        }

        // Bonus si pas de réclamation
        if (event.customerSatisfaction >= 4) {
            bonusPoints += 30;
            description += ' (satisfaction client excellente)';
        }

        await GamificationService.awardPoints({
            userId: event.userId,
            actionType: 'job_completed',
            points: basePoints + bonusPoints,
            description: description,
            jobId: event.jobId,
            metadata: {
                estimatedDuration: event.estimatedDuration,
                actualDuration: event.actualDuration,
                customerSatisfaction: event.customerSatisfaction
            }
        });
    }

    /**
     * Handler pour événements paiement
     */
    static async handlePaymentEvent(event: PaymentEvent): Promise<void> {
        switch (event.type) {
            case 'payment_received_immediate':
                await GamificationService.awardPoints({
                    userId: event.userId,
                    actionType: 'payment_received_immediate',
                    points: 15,
                    description: 'Paiement encaissé immédiatement',
                    jobId: event.jobId
                });
                break;
            // ... autres événements paiement
        }
    }

    /**
     * Handler pour événements staff/équipe
     */
    static async handleStaffEvent(event: StaffEvent): Promise<void> {
        switch (event.type) {
            case 'staff_member_created':
                await GamificationService.awardPoints({
                    userId: event.userId,
                    actionType: 'staff_created',
                    points: 40,
                    description: `Nouveau membre d'équipe ajouté: ${event.staffName}`,
                    staffId: event.staffId
                });
                break;
            // ... autres événements staff
        }
    }
}
```

### **3. API Endpoints**

```typescript
// routes/gamification.ts
router.get('/profile/:userId', async (req, res) => {
    try {
        const profile = await GamificationService.getUserProfile(req.params.userId);
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/points/award', async (req, res) => {
    try {
        const transaction = await GamificationService.awardPoints(req.body);
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/leaderboards', async (req, res) => {
    try {
        const { period = 'monthly', limit = 50 } = req.query;
        const leaderboard = await GamificationService.getLeaderboard(period, limit);
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/badges/available/:userId', async (req, res) => {
    try {
        const badges = await GamificationService.getAvailableBadges(req.params.userId);
        res.json(badges);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/history/:userId', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const history = await GamificationService.getPointsHistory(
            req.params.userId, 
            limit, 
            offset
        );
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

---

## 📱 **Frontend Implementation**

### **1. Services & Types**

```typescript
// src/services/GamificationService.ts
export interface UserGamificationProfile {
  userId: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  totalPointsEarned: number;
  currentStreak: number;
  longestStreak: number;
  badges: UserBadge[];
  recentActivity: PointsTransaction[];
  levelInfo: LevelInfo;
}

export interface PointsTransaction {
  id: string;
  actionType: string;
  points: number;
  description: string;
  metadata: any;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface LevelInfo {
  level: number;
  title: string;
  icon: string;
  benefits: string[];
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  level: number;
  experience: number;
  position: number;
  avatar?: string;
}

export class GamificationService {
  
  static async getUserProfile(userId: string): Promise<UserGamificationProfile> {
    const response = await fetchWithAuth(`/api/v1/gamification/profile/${userId}`);
    return response.json();
  }

  static async awardPoints(params: {
    actionType: string;
    points: number;
    description: string;
    jobId?: string;
    staffId?: string;
    metadata?: any;
  }): Promise<PointsTransaction> {
    const response = await fetchWithAuth('/api/v1/gamification/points/award', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return response.json();
  }

  static async getLeaderboard(
    period: 'weekly' | 'monthly' | 'yearly' = 'monthly',
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    const response = await fetchWithAuth(
      `/api/v1/gamification/leaderboards?period=${period}&limit=${limit}`
    );
    return response.json();
  }

  static async getAvailableBadges(userId: string): Promise<any[]> {
    const response = await fetchWithAuth(`/api/v1/gamification/badges/available/${userId}`);
    return response.json();
  }

  static async getPointsHistory(
    userId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<PointsTransaction[]> {
    const response = await fetchWithAuth(
      `/api/v1/gamification/history/${userId}?limit=${limit}&offset=${offset}`
    );
    return response.json();
  }
}
```

### **2. React Hook Principal**

```typescript
// src/hooks/useGamification.ts
export interface UseGamificationResult {
  profile: UserGamificationProfile | null;
  recentPoints: PointsTransaction[];
  availableBadges: any[];
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  isAwardingPoints: boolean;
  error: string | null;

  // Actions
  awardPoints: (action: string, points: number, metadata?: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
  loadLeaderboard: (period?: string) => Promise<void>;
  checkForNewBadges: () => Promise<any[]>;
  clearError: () => void;
}

export const useGamification = (userId: string): UseGamificationResult => {
  const [profile, setProfile] = useState<UserGamificationProfile | null>(null);
  const [recentPoints, setRecentPoints] = useState<PointsTransaction[]>([]);
  const [availableBadges, setAvailableBadges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAwardingPoints, setIsAwardingPoints] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger profil initial
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const profileData = await GamificationService.getUserProfile(userId);
      setProfile(profileData);
      setRecentPoints(profileData.recentActivity || []);
      
      console.log('✅ [useGamification] Profile loaded:', profileData);
    } catch (error: any) {
      console.error('❌ [useGamification] Failed to load profile:', error);
      setError('Erreur lors du chargement du profil gamification');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Award points avec animation
  const awardPoints = useCallback(async (
    action: string, 
    points: number, 
    metadata: any = {}
  ) => {
    try {
      setIsAwardingPoints(true);
      setError(null);

      const transaction = await GamificationService.awardPoints({
        actionType: action,
        points: points,
        description: metadata.description || `+${points} points`,
        jobId: metadata.jobId,
        staffId: metadata.staffId,
        metadata: metadata
      });

      // Rafraîchir profil après award
      await loadProfile();

      // Montrer toast animation
      showPointsToast(points, action);

      console.log('✅ [useGamification] Points awarded:', transaction);
    } catch (error: any) {
      console.error('❌ [useGamification] Failed to award points:', error);
      setError('Erreur lors de l\'attribution des points');
    } finally {
      setIsAwardingPoints(false);
    }
  }, [loadProfile]);

  // Charger leaderboard
  const loadLeaderboard = useCallback(async (period: string = 'monthly') => {
    try {
      const leaderboardData = await GamificationService.getLeaderboard(period as any);
      setLeaderboard(leaderboardData);
      
      console.log('✅ [useGamification] Leaderboard loaded:', leaderboardData.length, 'entries');
    } catch (error: any) {
      console.error('❌ [useGamification] Failed to load leaderboard:', error);
      setError('Erreur lors du chargement du classement');
    }
  }, []);

  // Vérifier nouveaux badges
  const checkForNewBadges = useCallback(async () => {
    try {
      const badges = await GamificationService.getAvailableBadges(userId);
      setAvailableBadges(badges);
      
      // Filtrer les nouveaux badges pour notification
      const newBadges = badges.filter(badge => !badge.earned && badge.progress >= 100);
      
      if (newBadges.length > 0) {
        showNewBadgesNotification(newBadges);
      }
      
      return badges;
    } catch (error: any) {
      console.error('❌ [useGamification] Failed to check badges:', error);
      return [];
    }
  }, [userId]);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
    await checkForNewBadges();
  }, [loadProfile, checkForNewBadges]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Chargement initial
  useEffect(() => {
    if (userId) {
      loadProfile();
      loadLeaderboard();
      checkForNewBadges();
    }
  }, [userId, loadProfile, loadLeaderboard, checkForNewBadges]);

  return {
    profile,
    recentPoints,
    availableBadges,
    leaderboard,
    isLoading,
    isAwardingPoints,
    error,
    awardPoints,
    refreshProfile,
    loadLeaderboard,
    checkForNewBadges,
    clearError
  };
};

// Fonction utilitaire pour toast points
const showPointsToast = (points: number, action: string) => {
  // Integration avec système de toast existant
  ToastService.show({
    type: 'gamification',
    title: `+${points} XP`,
    description: getActionDescription(action),
    icon: '🎉',
    duration: 3000
  });
};

const getActionDescription = (action: string): string => {
  const descriptions: Record<string, string> = {
    'job_completed': 'Job terminé avec succès!',
    'job_completed_early': 'Job terminé en avance!',
    'staff_created': 'Nouveau membre d\'équipe ajouté!',
    'payment_received': 'Paiement reçu!',
    'profile_completed': 'Profil complété!',
    // ... autres actions
  };
  return descriptions[action] || 'Action complétée!';
};
```

### **3. Composants UI**

```typescript
// src/components/gamification/GamificationWidget.tsx
export const GamificationWidget: React.FC<{ userId: string }> = ({ userId }) => {
  const { profile, isLoading } = useGamification(userId);
  const { colors } = useTheme();

  if (isLoading || !profile) {
    return (
      <View style={styles.widgetContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const progressPercent = (profile.experience / 
    (profile.experience + profile.experienceToNextLevel)) * 100;

  return (
    <Pressable 
      style={[styles.widgetContainer, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('GamificationDashboard')}
    >
      <View style={styles.levelSection}>
        <Text style={styles.levelIcon}>{profile.levelInfo.icon}</Text>
        <View style={styles.levelInfo}>
          <Text style={[styles.levelTitle, { color: colors.text }]}>
            Niveau {profile.level}
          </Text>
          <Text style={[styles.levelName, { color: colors.textSecondary }]}>
            {profile.levelInfo.title}
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: colors.primary,
                width: `${progressPercent}%` 
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {profile.experience} / {profile.experience + profile.experienceToNextLevel} XP
        </Text>
      </View>

      {profile.badges.length > 0 && (
        <View style={styles.badgesPreview}>
          {profile.badges.slice(-3).map(badge => (
            <Text key={badge.id} style={styles.badgeIcon}>
              {badge.icon}
            </Text>
          ))}
        </View>
      )}
    </Pressable>
  );
};

// src/components/gamification/LevelProgressBar.tsx
export const LevelProgressBar: React.FC<{
  currentXP: number;
  nextLevelXP: number;
  showNumbers?: boolean;
}> = ({ currentXP, nextLevelXP, showNumbers = true }) => {
  const { colors } = useTheme();
  const progressPercent = (currentXP / nextLevelXP) * 100;

  return (
    <View style={styles.container}>
      {showNumbers && (
        <View style={styles.numbersRow}>
          <Text style={[styles.xpText, { color: colors.text }]}>
            {currentXP} XP
          </Text>
          <Text style={[styles.xpText, { color: colors.textSecondary }]}>
            {nextLevelXP} XP
          </Text>
        </View>
      )}
      
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: colors.primary,
              width: `${progressPercent}%`
            }
          ]}
        />
      </View>
      
      {showNumbers && (
        <Text style={[styles.percentText, { color: colors.textSecondary }]}>
          {Math.round(progressPercent)}% vers niveau suivant
        </Text>
      )}
    </View>
  );
};

// src/components/gamification/BadgeCollection.tsx
export const BadgeCollection: React.FC<{ badges: UserBadge[] }> = ({ badges }) => {
  const { colors } = useTheme();

  const badgesByRarity = badges.reduce((acc, badge) => {
    acc[badge.rarity] = acc[badge.rarity] || [];
    acc[badge.rarity].push(badge);
    return acc;
  }, {} as Record<string, UserBadge[]>);

  return (
    <ScrollView style={styles.container}>
      {Object.entries(badgesByRarity).map(([rarity, badges]) => (
        <View key={rarity} style={styles.raritySection}>
          <Text style={[styles.rarityTitle, { color: colors.text }]}>
            {getRarityTitle(rarity)} ({badges.length})
          </Text>
          
          <View style={styles.badgesGrid}>
            {badges.map(badge => (
              <Pressable
                key={badge.id}
                style={[
                  styles.badgeItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: getRarityColor(rarity)
                  }
                ]}
                onPress={() => showBadgeDetails(badge)}
              >
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={[styles.badgeName, { color: colors.text }]}>
                  {badge.name}
                </Text>
                <Text style={[styles.badgeDate, { color: colors.textSecondary }]}>
                  {formatDate(badge.earnedAt)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

// src/components/gamification/PointsToast.tsx
export const PointsToast: React.FC<{
  points: number;
  action: string;
  visible: boolean;
  onHide: () => void;
}> = ({ points, action, visible, onHide }) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(onHide);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, fadeAnim, slideAnim, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.primary,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.pointsText}>+{points} XP</Text>
        <Text style={styles.emoji}>🎉</Text>
      </View>
      <Text style={styles.actionText}>
        {getActionDescription(action)}
      </Text>
    </Animated.View>
  );
};
```

### **4. Integration avec App Existante**

```typescript
// Integration dans JobDetailsScreens/paymentWindow.tsx
const PaymentWindow: React.FC<PaymentWindowProps> = ({ job, onClose }) => {
  const { awardPoints } = useGamification(user.id);

  const handlePaymentSuccess = useCallback(async (amount: number) => {
    // Existing payment logic...
    
    // Award gamification points
    await awardPoints('payment_received_immediate', 15, {
      description: `Paiement encaissé: ${formatCurrency(amount)}`,
      jobId: job.id,
      amount: amount
    });
    
    onClose();
  }, [job, awardPoints, onClose]);

  // ... rest of component
};

// Integration dans useJobTimer.ts
export const useJobTimer = (jobId: string, options: JobTimerOptions = {}) => {
  const { awardPoints } = useGamification(user.id);
  
  const completeJob = useCallback(async () => {
    // Existing completion logic...
    
    // Calculate gamification points
    let points = 50; // Base points
    const metadata: any = { jobId, description: 'Job terminé avec succès' };
    
    if (isCompletedEarly) {
      points += 25;
      metadata.description = 'Job terminé en avance!';
      metadata.finishedEarly = true;
    }
    
    if (customerRating >= 4) {
      points += 30;
      metadata.description += ' (satisfaction client excellente)';
      metadata.customerSatisfaction = customerRating;
    }
    
    // Award points
    await awardPoints('job_completed', points, metadata);
    
    // ... rest of completion logic
  }, [jobId, awardPoints, /* other deps */]);
  
  // ... rest of hook
};

// Integration dans header/navigation principale
export const MainHeader: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <View style={styles.header}>
      {/* Existing header content */}
      
      <GamificationWidget userId={user.id} />
      
      {/* Existing header content */}
    </View>
  );
};
```

---

## 🧪 **Testing Strategy**

### **Backend Tests**

```typescript
// tests/gamification/service.test.ts
describe('GamificationService', () => {
  describe('awardPoints', () => {
    it('should award points and update user profile', async () => {
      const userId = 'test-user-id';
      
      const transaction = await GamificationService.awardPoints({
        userId,
        actionType: 'job_completed',
        points: 50,
        description: 'Test job completion'
      });
      
      expect(transaction.points_awarded).toBe(50);
      
      const profile = await GamificationService.getUserProfile(userId);
      expect(profile.experience).toBeGreaterThanOrEqual(50);
    });

    it('should level up user when experience threshold reached', async () => {
      // ... test implementation
    });

    it('should unlock badges when criteria met', async () => {
      // ... test implementation  
    });
  });
});

// tests/gamification/events.test.ts
describe('GamificationEventHandler', () => {
  it('should handle job completion events', async () => {
    // ... test implementation
  });
});
```

### **Frontend Tests**

```typescript
// src/hooks/__tests__/useGamification.test.ts
describe('useGamification', () => {
  it('should load user profile on mount', async () => {
    const { result } = renderHook(() => useGamification('test-user'));
    
    await waitFor(() => {
      expect(result.current.profile).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should award points and refresh profile', async () => {
    // ... test implementation
  });
});

// src/components/__tests__/GamificationWidget.test.tsx
describe('GamificationWidget', () => {
  it('should display level and progress correctly', () => {
    // ... test implementation
  });
});
```

---

## 📈 **Monitoring & Analytics**

### **Métriques à Tracker**

```typescript
// Analytics events gamification
export const trackGamificationEvent = (event: string, data: any) => {
  Analytics.track('Gamification_' + event, {
    timestamp: new Date().toISOString(),
    userId: data.userId,
    ...data
  });
};

// Événements clés
trackGamificationEvent('Points_Awarded', { action, points, level });
trackGamificationEvent('Level_Up', { oldLevel, newLevel, totalExp });
trackGamificationEvent('Badge_Unlocked', { badgeId, badgeName, rarity });
trackGamificationEvent('Leaderboard_View', { period, userPosition });
```

### **Dashboard Monitoring**

- **User Engagement**: temps moyen dans l'app, sessions par jour
- **Points Distribution**: points moyens par action, distribution par niveau
- **Badge Completion**: taux de déblocage par badge, progression moyenne
- **Level Progression**: temps moyen par niveau, abandon rates
- **Business Impact**: corrélation niveau ↔ revenue, retention par niveau

---

## 🚀 **Deployment Checklist**

### **Backend Deployment**
- [ ] Migration base de données (tables gamification)
- [ ] Déploiement API endpoints 
- [ ] Configuration webhooks événements
- [ ] Tests production base gamification
- [ ] Monitoring setup (alertes, logs)

### **Frontend Deployment**
- [ ] Build avec nouveaux composants gamification
- [ ] Tests E2E workflow complet
- [ ] Configuration analytics gamification
- [ ] Tests devices multiples
- [ ] Validation UX/UI final

### **Data & Configuration**
- [ ] Import configuration niveaux/badges
- [ ] Setup admin panel gamification
- [ ] Configuration notifications push
- [ ] Tests avec données réelles
- [ ] Documentation utilisateur final

---

## 🎯 **Success Metrics**

### **Engagement KPIs**
- Daily Active Users +30%
- Session Duration +40% 
- Feature Adoption +50%
- User Retention +25%

### **Business KPIs**  
- Job Completion Rate +35%
- Customer Satisfaction +20%
- Revenue per User +25%
- Referral Rate +60%

**Le système de gamification est architecturé pour être performant, scalable et parfaitement intégré à l'app existante !** 🚀