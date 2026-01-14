# 🎮 API Gamification - Documentation Complète

> **Statut**: ✅ Implémenté et intégré  
> **Date de mise à jour**: 14 janvier 2026

## 📋 Résumé

Le système de gamification est maintenant **entièrement opérationnel**. L'API backend fournit les données de niveau, XP, badges et classement. Le frontend a été mis à jour pour consommer ces données.

---

## 🔗 Endpoints Disponibles

### 1. GET `/swift-app/v1/user/gamification`

Retourne les données complètes de gamification avec la configuration.

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "level": 5,
    "experience": 850,
    "experienceToNextLevel": 1200,
    "totalExperienceForNextLevel": 1200,
    "xpProgress": 50,
    "title": "Member",
    "rank": {
      "name": "Member",
      "emoji": "⭐⭐",
      "color": "#4A90D9"
    },
    "completedJobs": 12,
    "streak": 3,
    "lastActivity": "2026-01-14T10:30:00Z",
    "lastLevelUp": "2026-01-10T15:00:00Z",
    "badges": ["driver_first", "driver_10"],
    "badgesDetailed": [...],
    "recentXp": [...],
    "xpRewards": {...},
    "levelThresholds": [...],
    "availableBadges": [...]
  }
}
```

---

### 2. GET `/swift-app/v1/user/gamification/leaderboard`

Retourne le classement des utilisateurs.

**Query params:**
- `limit` : nombre de résultats (défaut: 20)

**Réponse:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "userId": 42,
      "firstName": "Alice",
      "lastName": "Smith",
      "level": 15,
      "title": "Specialist",
      "experience": 9500,
      "completedJobs": 156
    }
  ],
  "userRank": 12
}
```

---

### 3. GET `/swift-app/v1/user/gamification/history`

Retourne l'historique des gains d'XP.

**Query params:**
- `limit` : nombre de résultats (défaut: 50)
- `offset` : pagination

**Réponse:**
```json
{
  "success": true,
  "history": [
    {
      "id": 123,
      "action": "job_completed",
      "xpEarned": 50,
      "jobId": 456,
      "createdAt": "2026-01-14T10:30:00Z"
    }
  ],
  "total": 234
}
```

---

## 🎚️ Configuration des Niveaux (30 levels)

| Level | Titre | XP Requis |
|-------|-------|-----------|
| 1-2 | Newcomer | 0 - 100 |
| 3-4 | Starter | 250 - 500 |
| 5-6 | Member | 800 - 1200 |
| 7-8 | Contributor | 1700 - 2300 |
| 9-10 | Professional | 3000 - 3800 |
| 11-12 | Experienced | 4700 - 5700 |
| 13-14 | Expert | 6800 - 8000 |
| 15-16 | Specialist | 9300 - 10700 |
| 17-18 | Senior | 12200 - 13800 |
| 19-20 | Master | 15500 - 17300 |
| 21-22 | Elite | 19200 - 21200 |
| 23-24 | Champion | 23500 - 26000 |
| 25-26 | Legend | 29000 - 32500 |
| 27-28 | Icon | 36500 - 41000 |
| 29-30 | Ultimate | 46000 - 52000 |

---

## 🏆 Configuration des Rangs

| Rang | Level Min | Emoji | Couleur |
|------|-----------|-------|---------|
| Starter | 1 | ⭐ | #808080 |
| Member | 5 | ⭐⭐ | #4A90D9 |
| Bronze | 9 | 🥉 | #CD7F32 |
| Silver | 13 | 🥈 | #C0C0C0 |
| Gold | 17 | 🥇 | #FFD700 |
| Platinum | 21 | 💎 | #E5E4E2 |
| Diamond | 25 | 👑 | #B9F2FF |

---

## 🎖️ Badges

### 🚗 Driver
| Code | Nom | Condition |
|------|-----|-----------|
| driver_first | Rookie Driver | 1er job |
| driver_10 | Driver | 10 jobs |
| driver_50 | Experienced Driver | 50 jobs |
| driver_100 | Pro Driver | 100 jobs |
| driver_500 | Expert Driver | 500 jobs |
| driver_1000 | Master Driver | 1000 jobs |

### ⭐ Rating
| Code | Nom | Condition |
|------|-----|-----------|
| five_star_first | First Five Star | 1ère note 5⭐ |
| five_star_10 | Quality Service | 10 notes 5⭐ |
| five_star_50 | Excellence | 50 notes 5⭐ |
| five_star_100 | Outstanding | 100 notes 5⭐ |

### 🔥 Streak
| Code | Nom | Condition |
|------|-----|-----------|
| streak_7 | Week Warrior | 7 jours consécutifs |
| streak_30 | Month Master | 30 jours consécutifs |
| streak_100 | Unstoppable | 100 jours consécutifs |

---

## 💰 XP Rewards

| Action | XP | Max/Jour |
|--------|-----|----------|
| job_completed | 50 | - |
| five_star_rating | 25 | - |
| first_job_of_day | 10 | 1 |
| no_incident | 15 | - |
| photo_added | 5 | 10 |
| note_added | 5 | 10 |
| signature_collected | 10 | - |
| streak_bonus_7 | 100 | - |
| streak_bonus_30 | 500 | - |
| streak_bonus_100 | 2000 | - |
| referral_bonus | 200 | - |
| profile_completed | 100 | 1 |
| verification_completed | 250 | 1 |

---

## 📁 Fichiers Frontend

### Service API
- **`src/services/gamification.ts`** - Service d'appel API avec interfaces TypeScript

### Hook
- **`src/hooks/useGamification.ts`** - Hook React pour consommer les données

### Composants
- **`src/components/home/ProfileHeader.tsx`** - Affichage level/XP sur Home

---

## ✅ Implémentation Complète

### Backend ✅
- [x] Endpoint `/v1/user/gamification`
- [x] Endpoint `/v1/user/gamification/leaderboard`
- [x] Endpoint `/v1/user/gamification/history`
- [x] 30 niveaux configurés
- [x] 7 rangs configurés
- [x] Système de badges par catégorie
- [x] Attribution automatique d'XP

### Frontend ✅
- [x] Service `gamification.ts` créé
- [x] Hook `useGamification` mis à jour
- [x] `ProfileHeader` intégré avec API
- [x] Support du rang avec emoji/couleur
- [x] Fallback sur données par défaut si erreur API
