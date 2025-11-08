# 🎯 Timer v1.0 - Simplification Play/Pause

**Date:** 4 novembre 2025  
**Status:** ✅ Implémentation complétée - En attente de tests

---

## 📋 Contexte

### Problème Initial
Le système de timer avait un système de **breaks complexe** avec:
- Multiples boutons (Start Break, Stop Break, Pause, Resume)
- Logique compliquée de gestion des pauses
- UI confuse pour l'utilisateur
- Code difficile à maintenir

### Solution v1.0
**Simplifier** en un seul bouton **Play/Pause** qui:
- ⏸️ Met en pause le timer (freeze le temps)
- ▶️ Reprend le timer (continue le décompte)
- 🔄 Sync automatique avec l'API
- 📊 Track les pauses pour facturation correcte

---

## 🔧 Modifications Techniques

### 1. `useJobTimer.ts` - Hook principal

**Ajout de `togglePause()`:**
```typescript
const togglePause = useCallback(() => {
    if (!timerData) return;

    const now = Date.now();
    const wasRunning = timerData.isRunning;

    if (wasRunning) {
        // ⏸️ PAUSE: Freeze le timer
        const elapsedMs = now - timerData.startTime - (timerData.totalBreakTime || 0);
        const updatedData: JobTimerData = {
            ...timerData,
            isRunning: false,
            isOnBreak: true,
            breakTimes: [...timerData.breakTimes, { startTime: now }],
            totalElapsed: elapsedMs
        };
        
        // Sync to API
        pauseTimerAPI(jobId, currentStep, elapsedMs / (1000 * 60 * 60));
    } else {
        // ▶️ PLAY: Reprendre le timer
        const breakDurationMs = now - lastBreak.startTime;
        const updatedData: JobTimerData = {
            ...timerData,
            isRunning: true,
            isOnBreak: false,
            totalBreakTime: timerData.totalBreakTime + breakDurationMs
        };
        
        // Sync to API
        resumeTimerAPI(jobId, breakDurationMs / (1000 * 60 * 60));
    }
}, [timerData, jobId]);
```

**Retrait:**
- ❌ `startBreak()`
- ❌ `stopBreak()`
- ❌ Logique complexe de breaks multiples

---

### 2. `JobTimerProvider.tsx` - Context

**Modifications:**
```typescript
interface JobTimerContextValue {
    // ... autres props
    togglePause: () => void; // ✅ AJOUTÉ
    // ❌ RETIRÉ: startBreak, stopBreak
}

const value: JobTimerContextValue = {
    // ... autres valeurs
    togglePause: timer.togglePause, // ✅ Exposé
};
```

**Auto-sync maintenu:**
- ⏱️ Sync toutes les 30 secondes quand timer actif
- 🔄 Sync immédiate lors pause/resume

---

### 3. `JobTimerDisplay.tsx` - UI principale

**Bouton Play/Pause:**
```tsx
<Pressable
    onPress={togglePause}
    style={{
        backgroundColor: isRunning ? colors.warning : '#10B981',
        // Orange si actif, vert si pause
    }}
>
    <Ionicons 
        name={isRunning ? 'pause' : 'play'} 
        size={16} 
    />
    <Text>{isRunning ? 'Pause' : 'Play'}</Text>
</Pressable>
```

**Visuel:**
- 🟠 **Orange** quand timer actif → bouton "Pause"
- 🟢 **Vert** quand en pause → bouton "Play"
- ⏸️ Icône pause ou ▶️ icône play

---

### 4. `JobClock.tsx` - Horloge summary

**Correction:**
```typescript
// ❌ AVANT
const { startBreak, stopBreak, ... } = useJobTimerContext();

// ✅ APRÈS
const { togglePause, ... } = useJobTimerContext();
```

**Bouton mis à jour:**
- Même logique que `JobTimerDisplay`
- Cohérence UI/UX dans toute l'app

---

## 📊 États du Timer

### État 1: Timer Actif (Running)
```
┌─────────────────────────────────────┐
│ ⏱️ 02:34:18          🚛 En route    │
│ ○────●────○────○────○    [⏸️ Pause] │ ← Orange
│                                     │
│ Temps facturable: 02:34:18         │
│ Temps total: 02:34:18              │
└─────────────────────────────────────┘

isRunning: true
isOnBreak: false
Border: blue (primary)
```

### État 2: Timer en Pause
```
┌─────────────────────────────────────┐
│ ⏱️ 02:34:18          🚛 En route    │
│ ○────●────○────○────○    [▶️ Play]  │ ← Vert
│ ⏸️ En pause                         │
│ Temps facturable: 02:34:18         │
│ Temps total: 02:34:18              │
└─────────────────────────────────────┘

isRunning: false
isOnBreak: true
Border: gray (border)
Timer FREEZÉ
```

---

## 🔄 Flow de Pause/Resume

### Scénario Complet

1. **Timer actif** - `02:30:00`
   ```
   isRunning: true
   totalElapsed: 2h 30m
   billableTime: 2h 30m
   breakTimes: []
   ```

2. **Click "Pause"** - `02:30:00`
   ```
   ⏸️ Freeze le timer
   isRunning: false → true
   isOnBreak: false → true
   breakTimes: [{ startTime: now }]
   
   API: pauseTimerAPI(jobId, 2.5 hours)
   ```

3. **Attendre 5 minutes** - Toujours `02:30:00`
   ```
   Timer reste figé à 02:30:00
   Temps réel: 02:35:00
   ```

4. **Click "Play"** - Reprend à `02:30:00`
   ```
   ▶️ Resume le timer
   isRunning: true
   isOnBreak: false
   breakTimes: [{ 
       startTime: X, 
       endTime: X+5min,
       duration: 5min 
   }]
   totalBreakTime: 5min
   
   API: resumeTimerAPI(jobId, 0.083 hours)
   ```

5. **1 minute plus tard** - `02:31:00`
   ```
   Temps total écoulé: 2h 36m (temps réel)
   Temps facturable: 2h 31m (excluant 5min pause)
   ```

---

## 💾 Structure de Données

### JobTimerData
```typescript
interface JobTimerData {
    jobId: string;
    startTime: number;
    currentStep: number;
    stepTimes: JobStepTime[];
    
    // ✅ Pause tracking
    breakTimes: JobBreakTime[];     // Array des pauses
    isRunning: boolean;             // Timer actif?
    isOnBreak: boolean;             // En pause?
    totalElapsed: number;           // Temps total (ms)
    totalBreakTime: number;         // Total pauses (ms)
}

interface JobBreakTime {
    startTime: number;     // Début pause
    endTime?: number;      // Fin pause (undefined si en cours)
    duration?: number;     // Durée (ms)
}
```

---

## 🎨 Design Visuel

### Bouton Play/Pause

**État Running (Pause button):**
```
┌──────────────┐
│ ⏸️  Pause    │  🟠 Orange (#F59E0B)
└──────────────┘
```

**État Paused (Play button):**
```
┌──────────────┐
│ ▶️  Play     │  🟢 Vert (#10B981)
└──────────────┘
```

**Pressed State:**
- Opacity légère (DD = 87% opacité)
- Feedback tactile

---

## 📡 API Endpoints

### 1. Pause Timer
```typescript
POST /v1/jobs/{jobId}/timer/pause
Body: {
    currentStep: number,
    elapsedHours: number
}
Response: { success: true }
```

### 2. Resume Timer
```typescript
POST /v1/jobs/{jobId}/timer/resume
Body: {
    breakDurationHours: number
}
Response: { success: true }
```

### 3. Sync Timer (Auto 30s)
```typescript
POST /v1/jobs/{jobId}/timer/sync
Body: JobTimerData
Response: { success: true }
```

---

## ✅ Avantages de v1.0

### Pour l'Utilisateur
1. ✅ **Interface simple** - Un seul bouton clair
2. ✅ **Feedback visuel** - Couleurs et icônes intuitives
3. ✅ **Pas de confusion** - Play ou Pause, c'est tout
4. ✅ **Facturation précise** - Pauses exclues automatiquement

### Pour le Développeur
1. ✅ **Code plus simple** - Moins de fonctions, moins de bugs
2. ✅ **Maintenance facile** - Logique unifiée dans `togglePause()`
3. ✅ **Tests plus simples** - Un seul flow à tester
4. ✅ **Sync API claire** - Deux endpoints bien définis

---

## 🧪 Tests Requis

Voir: **[TEST_TIMER_PLAY_PAUSE.md](./TEST_TIMER_PLAY_PAUSE.md)**

### Checklist
- [ ] Pause freeze le timer
- [ ] Play reprend le timer
- [ ] Temps facturable correct
- [ ] Sync API réussie
- [ ] UI responsive

---

## 📝 Fichiers Modifiés

```
✅ src/hooks/useJobTimer.ts
   - Ajout togglePause()
   - Retrait startBreak/stopBreak
   - Sync API pause/resume

✅ src/context/JobTimerProvider.tsx
   - Exposition togglePause
   - Retrait startBreak/stopBreak du context

✅ src/components/jobDetails/JobTimerDisplay.tsx
   - Bouton Play/Pause unique
   - Changement couleur orange/vert

✅ src/components/jobDetails/JobClock.tsx
   - Migration vers togglePause
   - Correction erreurs TypeScript
```

---

## 🚀 Déploiement

### Prérequis
- [x] Code TypeScript sans erreur
- [x] Documentation complète
- [ ] Tests device réussis
- [ ] Review code OK

### Commandes
```powershell
# 1. Vérifier erreurs
npx tsc --noEmit

# 2. Démarrer app
npx expo start

# 3. Tester sur device
# (Scan QR code)
```

---

## 📚 Documentation Connexe

- [TIMER_SYSTEM.md](./TIMER_SYSTEM.md) - Architecture complète
- [TEST_TIMER_PLAY_PAUSE.md](./TEST_TIMER_PLAY_PAUSE.md) - Guide de test
- [API-Doc.md](./API-Doc.md) - API endpoints

---

## 🎯 Prochaines Étapes

1. ✅ Tests device complets
2. 📊 Monitoring des pauses en production
3. 🔍 Analyse temps facturable vs total
4. 🎨 Amélioration UI si feedback utilisateur

---

**Version:** 1.0  
**Status:** ✅ Ready for Testing  
**Last Updated:** 4 novembre 2025
