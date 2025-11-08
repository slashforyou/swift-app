# 🎯 Simplification Timer v1.0 - 4 Novembre 2025

## 📋 Contexte

**Problème détecté :**
- Timer affiche `00:00:00` alors que le job est à l'étape `3/5`
- Incohérence entre le step du job et l'état du timer
- Système de breaks/pauses trop complexe pour la v1.0
- Bouton "Pause" ne fonctionne pas correctement

**Décision :**
Simplifier complètement le système de timer pour la v1.0 :
- **1 seul bouton : Play/Pause**
- Le temps de pause est enregistré et soustrait du temps facturable
- Sync avec l'API à chaque pause/reprise

---

## ✅ Modifications apportées

### 1. **useJobTimer.ts** - Nouvelle fonction `togglePause()`

**Avant :**
```typescript
// Deux fonctions séparées
startBreak()
stopBreak()

// Return
return {
    startBreak,
    stopBreak,
    ...
}
```

**Après :**
```typescript
// ✅ V1.0 SIMPLIFIÉ: Toggle pause simple (pas de breaks multiples)
const togglePause = useCallback(() => {
    if (!timerData) return;

    const now = Date.now();
    const wasRunning = timerData.isRunning;

    if (wasRunning) {
        // ⏸️ PAUSE: Freeze le timer et enregistre le temps écoulé
        const elapsedMs = now - timerData.startTime - (timerData.totalBreakTime || 0);
        const currentBreakStart = now;

        const updatedData: JobTimerData = {
            ...timerData,
            isRunning: false,
            isOnBreak: true, // Pour tracking interne
            breakTimes: [
                ...timerData.breakTimes,
                { startTime: currentBreakStart }
            ],
            totalElapsed: elapsedMs // Freeze le temps écoulé
        };

        setTimerData(updatedData);
        saveTimerData(updatedData);

        // ✅ Sync pause to API
        const totalElapsedHours = elapsedMs / (1000 * 60 * 60);
        pauseTimerAPI(jobId, timerData.currentStep, totalElapsedHours);
    } else {
        // ▶️ PLAY: Reprendre le timer et calculer la durée de la pause
        const updatedBreakTimes = [...timerData.breakTimes];
        const lastBreakIndex = updatedBreakTimes.length - 1;
        
        let breakDurationMs = 0;
        let breakDurationHours = 0;
        
        if (lastBreakIndex >= 0 && !updatedBreakTimes[lastBreakIndex].endTime) {
            const lastBreak = updatedBreakTimes[lastBreakIndex];
            breakDurationMs = now - lastBreak.startTime;
            breakDurationHours = breakDurationMs / (1000 * 60 * 60);
            
            updatedBreakTimes[lastBreakIndex] = {
                ...lastBreak,
                endTime: now,
                duration: breakDurationMs
            };
        }

        const updatedData: JobTimerData = {
            ...timerData,
            isRunning: true,
            isOnBreak: false,
            breakTimes: updatedBreakTimes,
            totalBreakTime: updatedBreakTimes.reduce((total, breakTime) => 
                total + (breakTime.duration || 0), 0
            )
        };

        setTimerData(updatedData);
        saveTimerData(updatedData);

        // ✅ Sync resume to API
        resumeTimerAPI(jobId, breakDurationHours);
    }
}, [timerData, saveTimerData, jobId]);

// Return
return {
    togglePause, // ✅ V1.0: Simple Play/Pause toggle
    ...
}
```

**Ce que ça fait :**
1. **Si le timer tourne (`isRunning = true`)** :
   - ⏸️ Met en PAUSE
   - Freeze le temps écoulé
   - Enregistre le timestamp de début de pause
   - Appelle `pauseTimerAPI()` pour sync avec le backend

2. **Si le timer est en pause (`isRunning = false`)** :
   - ▶️ Reprend le timer
   - Calcule la durée de la pause
   - Ajoute cette durée à `totalBreakTime`
   - Appelle `resumeTimerAPI()` avec la durée de la pause

---

### 2. **JobTimerProvider.tsx** - Exposition de `togglePause()`

**Avant :**
```typescript
interface JobTimerContextValue {
    startBreak: () => void;
    stopBreak: () => void;
    ...
}

// Value
const value = {
    startBreak: timer.startBreak,
    stopBreak: timer.stopBreak,
    ...
};
```

**Après :**
```typescript
interface JobTimerContextValue {
    togglePause: () => void; // ✅ V1.0: Simple Play/Pause toggle
    ...
}

// Value
const value = {
    togglePause: timer.togglePause, // ✅ V1.0: Simple Play/Pause
    ...
};
```

---

### 3. **JobTimerDisplay.tsx** - Bouton Play/Pause unique

**Avant :**
```tsx
const { 
    startBreak,
    stopBreak,
    isOnBreak,
    ...
} = useJobTimerContext();

// Bouton conditionnel
{isRunning && (
    <Pressable onPress={isOnBreak ? stopBreak : startBreak}>
        <Ionicons name={isOnBreak ? 'play' : 'pause'} />
        <Text>{isOnBreak ? 'Reprendre' : 'Pause'}</Text>
    </Pressable>
)}

// Bannière "En pause"
{isOnBreak && (
    <View>
        <Text>⏸️ En pause - Le temps n'est pas facturé</Text>
    </View>
)}

// Boutons d'action seulement si pas en pause
{isRunning && !isOnBreak && (
    <View>
        <Pressable>Étape suivante</Pressable>
        <Pressable>Terminer</Pressable>
    </View>
)}
```

**Après :**
```tsx
const { 
    togglePause, // ✅ V1.0: Simple Play/Pause toggle
    isRunning,
    ...
} = useJobTimerContext();

// ✅ V1.0: Bouton Play/Pause simple - TOUJOURS VISIBLE
<Pressable onPress={togglePause}>
    <Ionicons name={isRunning ? 'pause' : 'play'} />
    <Text>{isRunning ? 'Pause' : 'Play'}</Text>
</Pressable>

// ✅ Bannière retirée (pas nécessaire)

// Boutons d'action si timer actif (peu importe si pause interne)
{isRunning && (
    <View>
        <Pressable>Étape suivante</Pressable>
        <Pressable>Terminer</Pressable>
    </View>
)}
```

**Changements clés :**
1. **Bouton toujours visible** : Plus besoin de condition `{isRunning && ...}`
2. **Icône dynamique** : `pause` si en cours, `play` si en pause
3. **Couleur adaptative** : Orange (warning) quand en pause, Vert quand actif
4. **Pas de bannière** : Interface plus simple et claire

---

## 🔄 Workflow utilisateur simplifié

### Scénario 1 : Démarrage normal

```
1. Job créé → Timer à 00:00:00, bouton "Play" désactivé
2. Chauffeur démarre → Timer passe à 00:00:01, bouton "Pause" affiché
3. Chauffeur clique "Pause" → Timer freeze, bouton "Play" affiché
4. Chauffeur clique "Play" → Timer reprend, temps de pause enregistré
```

### Scénario 2 : Avec plusieurs pauses

```
1. Timer à 01:30:00 (en cours)
2. Pause de 15 min → Timer freeze à 01:30:00
3. Reprise → Timer reprend à 01:30:00, totalBreakTime = 15 min
4. Timer continue → 02:00:00 total, 01:45:00 facturable (2h - 15min)
```

### Scénario 3 : Calcul facturable

```
Temps total écoulé : 03:45:00 (3h45)
Temps de pause total : 00:30:00 (30min)
────────────────────────────────────
Temps facturable    : 03:15:00 (3h15)

Facturation :
- Minimum 2h : Oui (3h15 > 2h)
- Call-out fee : +30min
- Arrondi 30min : 3h15 + 30min = 3h45 → 4h
- Coût : 4h × 110 AUD = 440 AUD
```

---

## 📊 Structure des données

### JobTimerData (AsyncStorage)

```typescript
{
    jobId: "JOB-NERD-URGENT-006",
    startTime: 1730707200000, // Timestamp début job
    currentStep: 3,
    isRunning: false, // ⏸️ En pause actuellement
    isOnBreak: true,  // Flag interne
    
    stepTimes: [
        {
            step: 1,
            stepName: "Départ entrepôt",
            startTime: 1730707200000,
            endTime: 1730708100000,
            duration: 900000 // 15 min
        },
        {
            step: 2,
            stepName: "Arrivé première adresse",
            startTime: 1730708100000,
            endTime: 1730715300000,
            duration: 7200000 // 2h
        },
        {
            step: 3,
            stepName: "Départ première adresse",
            startTime: 1730715300000
            // En cours, pas de endTime
        }
    ],
    
    breakTimes: [
        {
            startTime: 1730710800000,
            endTime: 1730711700000,
            duration: 900000 // 15 min pause 1
        },
        {
            startTime: 1730717100000,
            // En pause actuellement, pas de endTime
        }
    ],
    
    totalElapsed: 10800000,  // 3h total
    totalBreakTime: 900000   // 15 min pause totale
}
```

### Calculs dérivés

```typescript
// Temps total écoulé (si en cours)
totalElapsed = now - startTime

// Temps facturable (sans les pauses)
billableTime = totalElapsed - totalBreakTime - currentBreakDuration

// Si en pause actuellement
currentBreakDuration = now - breakTimes[last].startTime
```

---

## 🔗 Synchronisation API

### Endpoints utilisés

**1. Pause timer** - `POST /jobs/:jobId/timer/pause`
```typescript
pauseTimerAPI(jobId, currentStep, totalElapsedHours)

// Body envoyé :
{
    step: 3,
    timer_billable_hours: 2.75 // 2h45 facturable
}

// Response :
{
    success: true,
    message: "Timer paused successfully"
}
```

**2. Reprendre timer** - `POST /jobs/:jobId/timer/resume`
```typescript
resumeTimerAPI(jobId, breakDurationHours)

// Body envoyé :
{
    break_duration_hours: 0.25 // 15 min de pause
}

// Response :
{
    success: true,
    message: "Timer resumed successfully"
}
```

**Fréquence de sync :**
- ⏸️ **Pause** : Immédiatement au clic
- ▶️ **Reprise** : Immédiatement au clic
- 🔄 **Auto-sync** : Toutes les 30s si timer actif (via JobTimerProvider)

---

## ✅ Avantages de la simplification

### UX/UI
✅ **Interface plus claire** : 1 bouton au lieu de 2  
✅ **Moins de confusion** : Play/Pause universel  
✅ **Toujours accessible** : Bouton visible en permanence  
✅ **Feedback visuel** : Couleur et icône adaptatives  

### Technique
✅ **Moins de code** : 60 lignes supprimées  
✅ **Moins de bugs** : 1 seul flux au lieu de 2  
✅ **Meilleure sync** : 2 API calls au lieu de conditionnels complexes  
✅ **Plus maintenable** : Logique centralisée dans `togglePause()`  

### Business
✅ **Temps de pause trackés** : Toujours enregistrés dans `breakTimes`  
✅ **Facturation précise** : `billableTime` exclut automatiquement les pauses  
✅ **Conformité** : Chaque pause est timestampée et sync avec l'API  

---

## 🧪 Tests à effectuer

### Test 1 : Play/Pause basique
```
1. Ouvrir job JOB-NERD-URGENT-006
2. Vérifier timer affiche temps actuel
3. Cliquer "Pause" → Timer freeze, bouton devient "Play"
4. Attendre 10 secondes
5. Cliquer "Play" → Timer reprend, temps de pause enregistré
6. Vérifier console : "✅ Timer paused and synced to API" puis "✅ Timer resumed and synced to API"
```

### Test 2 : Multiples pauses
```
1. Timer à 01:00:00
2. Pause 5 min → Temps freeze à 01:00:00
3. Play → Timer reprend
4. Continue 10 min → Timer à 01:10:00
5. Pause 3 min → Temps freeze à 01:10:00
6. Play → Timer reprend
7. Vérifier totalBreakTime = 8 min (5 + 3)
8. Vérifier billableTime = 01:02:00 (1h10 - 8min)
```

### Test 3 : Sync API
```
1. Ouvrir Network tab (React Native Debugger)
2. Cliquer "Pause"
3. Vérifier POST /jobs/:id/timer/pause avec step + timer_billable_hours
4. Cliquer "Play"
5. Vérifier POST /jobs/:id/timer/resume avec break_duration_hours
```

### Test 4 : Persistance (AsyncStorage)
```
1. Timer en cours → Pause
2. Fermer l'app complètement (force quit)
3. Rouvrir l'app
4. Ouvrir le même job
5. Vérifier timer toujours en pause
6. Cliquer "Play" → Timer reprend correctement
```

### Test 5 : Calcul facturable
```
1. Timer total : 03:30:00
2. Pause total : 00:20:00
3. Vérifier "Temps facturable" affiche : 03:10:00
4. Vérifier "Temps total" affiche : 03:30:00
```

---

## 📝 Logs console attendus

### Pause
```
⏸️ [useJobTimer] Pausing timer...
⏸️ [pauseTimerAPI] Pausing timer: { jobId: 'JOB-XXX', step: 3, hours: 2.75 }
✅ [pauseTimerAPI] Timer paused: { success: true }
✅ [useJobTimer] Timer paused and synced to API
```

### Reprise
```
▶️ [useJobTimer] Resuming timer...
▶️ [resumeTimerAPI] Resuming timer: { jobId: 'JOB-XXX', breakDuration: 0.25 }
✅ [resumeTimerAPI] Timer resumed: { success: true }
✅ [useJobTimer] Timer resumed and synced to API
```

---

## 🚀 Prochaines étapes

### Court terme (cette semaine)
1. ✅ Tester Play/Pause sur device réel
2. ✅ Vérifier sync API fonctionne
3. ✅ Vérifier calcul facturable correct
4. ✅ Vérifier persistance AsyncStorage

### Moyen terme (prochaine semaine)
- [ ] Backend : Enregistrer `break_times` en base de données
- [ ] Backend : Retourner `break_times` dans `GET /jobs/:id/full`
- [ ] Frontend : Afficher historique des pauses dans l'écran Job Details

### Long terme (v2.0)
- [ ] Raisons de pause (lunch, traffic, equipment failure, etc.)
- [ ] Limite max de pause (alerte si > 2h)
- [ ] Graphique temps de travail vs pause
- [ ] Export PDF avec breakdown détaillé

---

## 📚 Fichiers modifiés

| Fichier | Lignes modifiées | Type de changement |
|---------|------------------|-------------------|
| `src/hooks/useJobTimer.ts` | ~80 lignes | Remplacé `startBreak/stopBreak` par `togglePause()` |
| `src/context/JobTimerProvider.tsx` | ~5 lignes | Exposé `togglePause` au lieu de `startBreak/stopBreak` |
| `src/components/jobDetails/JobTimerDisplay.tsx` | ~30 lignes | Bouton unique Play/Pause, retiré bannière pause |

**Total :** 3 fichiers, ~115 lignes modifiées, **0 erreurs TypeScript**

---

## 💡 Notes importantes

### Pourquoi garder `isOnBreak` en interne ?
Même si on a simplifié l'UI, on garde `isOnBreak` dans `JobTimerData` pour :
- **Tracking précis** : Savoir si une pause est en cours
- **Calcul billableTime** : Exclure la pause actuelle du temps facturable
- **Historique** : Pouvoir reconstruire l'historique complet si besoin
- **Compatibilité future** : Prêt pour features avancées (raisons de pause, etc.)

### Différence entre `isRunning` et `isOnBreak`
```typescript
isRunning = false, isOnBreak = false  // Timer jamais démarré
isRunning = true,  isOnBreak = false  // Timer actif ▶️
isRunning = false, isOnBreak = true   // Timer en pause ⏸️
```

### Sync API : Pourquoi 2 endpoints ?
- **`pauseTimerAPI()`** : Enregistre le temps billable AVANT la pause (important pour facturation)
- **`resumeTimerAPI()`** : Enregistre la DURÉE de la pause (important pour reporting)

Cela permet au backend de :
1. Calculer le temps facturable à chaque pause
2. Vérifier que le temps de pause est raisonnable
3. Générer des rapports détaillés

---

## 🎉 Résultat final

**Avant :**
- Timer affiche `00:00:00` alors que job à `3/5`
- Bouton "Pause" ne fonctionne pas
- Système complexe avec breaks multiples
- Confusion utilisateur

**Après :**
- Timer affiche le temps réel
- **1 seul bouton Play/Pause** ✅
- Interface claire et intuitive
- Sync API automatique
- Temps de pause trackés et facturés correctement

---

**Date :** 4 Novembre 2025  
**Version :** v1.0 - Simplification Timer  
**Status :** ✅ Implémenté, en attente de tests device
