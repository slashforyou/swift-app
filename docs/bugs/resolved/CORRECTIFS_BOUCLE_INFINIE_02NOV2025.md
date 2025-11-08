# 🔧 Correctifs - Boucle Infinie Timer (02 Nov 2025)

## 🐛 Problèmes Identifiés

### 1. **Boucle Infinie de Logs Timer** ❌
```
⏱️ [JobTimer] Job JOB-NERD-SCHEDULED-004 - Step 1/5
⏱️ [JobTimer] Job JOB-NERD-SCHEDULED-004 - Step 1/5
⏱️ [JobTimer] Job JOB-NERD-SCHEDULED-004 - Step 1/5
... (infini)
```

**Cause racine :**
- `timerLogger.step()` appelé **DIRECTEMENT dans le render** du `JobTimerProvider` (ligne 36)
- Chaque render → log → re-render → log → boucle infinie
- `useEffect` de synchronisation manquait des dépendances critiques

### 2. **Démarrage Automatique Intempestif** ❌
- Le timer démarrait automatiquement dès qu'on affichait un job
- Même si le job était `status: "scheduled"` (pas encore commencé)
- `useEffect` dans `useJobTimer` forçait le démarrage à `currentStep >= 1`

### 3. **Version Mismatch React Native** ⚠️
```
JavaScript version: 0.79.5
Native version: 0.81.4
```

**Impact :**
- Peut causer des incompatibilités entre JS et Native
- Logs pollués avec warnings
- Risque de crashes inattendus

---

## ✅ Correctifs Appliqués

### Correctif 1: Logger dans useEffect (JobTimerProvider.tsx)

**Avant :**
```tsx
const safeJobId = jobId || 'unknown';
const safeCurrentStep = Math.max(0, currentStep || 0);
const safeTotalSteps = Math.max(1, totalSteps || 5);

timerLogger.step(safeJobId, safeCurrentStep, safeTotalSteps); // ❌ Dans le render !
```

**Après :**
```tsx
const safeJobId = jobId || 'unknown';
const safeCurrentStep = Math.max(0, currentStep || 0);
const safeTotalSteps = Math.max(1, totalSteps || 5);

// ✅ FIX BOUCLE INFINIE: Logger uniquement quand les valeurs changent (dans useEffect)
useEffect(() => {
    timerLogger.step(safeJobId, safeCurrentStep, safeTotalSteps);
}, [safeJobId, safeCurrentStep, safeTotalSteps]);
```

**Impact :**
- ✅ Le log n'est affiché **qu'une seule fois par changement de step**
- ✅ Pas de re-render infini
- ✅ Performance restaurée

---

### Correctif 2: Dépendances useEffect Complètes (JobTimerProvider.tsx)

**Avant :**
```tsx
useEffect(() => {
    if (isInternalUpdateRef.current) {
        timerLogger.sync('fromContext', currentStep);
        return;
    }
    
    if (currentStep !== timer.currentStep && currentStep >= 0) {
        timerLogger.sync('toContext', currentStep);
        timer.advanceStep(currentStep);
    }
}, [currentStep]); // ❌ Dépendances incomplètes
```

**Après :**
```tsx
useEffect(() => {
    if (isInternalUpdateRef.current) {
        timerLogger.sync('fromContext', currentStep);
        return;
    }
    
    // ✅ FIX BOUCLE INFINIE: Vérifier que timer.currentStep existe avant de comparer
    if (timer.timerData && currentStep !== timer.currentStep && currentStep >= 0) {
        timerLogger.sync('toContext', currentStep);
        timer.advanceStep(currentStep);
    }
}, [currentStep, timer.currentStep, timer.timerData]); // ✅ Dépendances complètes
```

**Impact :**
- ✅ Évite les appels inutiles à `advanceStep()`
- ✅ Synchronisation stable entre jobDetails et timer context
- ✅ Pas de warning "missing dependencies"

---

### Correctif 3: Désactivation Démarrage Automatique (useJobTimer.ts)

**Avant :**
```tsx
// Démarrer automatiquement si on passe de 0 à 1+ ou si le job a déjà commencé
useEffect(() => {
    if (timerData && currentStep >= 1 && !timerData.isRunning && timerData.startTime === 0) {
        timerLogger.start(jobId);
        startTimer(); // ❌ Démarrage forcé !
    } else if (timerData && currentStep > timerData.currentStep && timerData.isRunning) {
        timerLogger.step(jobId, currentStep, totalSteps);
        advanceStep(currentStep);
    }
}, [currentStep, timerData, startTimer, advanceStep]);
```

**Après :**
```tsx
// ✅ FIX: Ne PAS démarrer automatiquement - laisse le contrôle explicite à l'utilisateur
// Commenté pour éviter le démarrage automatique intempestif
/*
useEffect(() => {
    if (timerData && currentStep >= 1 && !timerData.isRunning && timerData.startTime === 0) {
        timerLogger.start(jobId);
        startTimer();
    } else if (timerData && currentStep > timerData.currentStep && timerData.isRunning) {
        timerLogger.step(jobId, currentStep, totalSteps);
        advanceStep(currentStep);
    }
}, [currentStep, timerData, startTimer, advanceStep]);
*/
```

**Impact :**
- ✅ Le timer ne démarre **QUE** quand l'utilisateur clique explicitement sur "Démarrer"
- ✅ Jobs `status: "scheduled"` restent en step 0 jusqu'au démarrage manuel
- ✅ Contrôle total sur le lifecycle du timer

---

## 📊 Résultats Attendus

### Avant Correctifs ❌
```
Logs: 500+ logs/seconde (boucle infinie)
Performance: CPU 100%, UI freezée
Timer: Démarre automatiquement (intempestif)
Jobs "scheduled": Affichés comme "en cours"
```

### Après Correctifs ✅
```
Logs: 1 log par changement de step
Performance: CPU normal, UI fluide
Timer: Démarre seulement si l'utilisateur clique
Jobs "scheduled": Restent en step 0 (correct)
```

---

## 🧪 Tests à Effectuer

### Test 1: Pas de Boucle Infinie
1. Ouvrir un job (ex: JOB-NERD-SCHEDULED-004)
2. Observer les logs dans la console
3. ✅ **Attendu :** 1 seul log `⏱️ [JobTimer] Job ... - Step 1/5`
4. ❌ **Échec si :** Le log se répète indéfiniment

### Test 2: Pas de Démarrage Automatique
1. Ouvrir un job avec `status: "scheduled"`
2. Vérifier l'affichage du timer
3. ✅ **Attendu :** Timer en pause, bouton "Démarrer" visible
4. ❌ **Échec si :** Timer démarre automatiquement

### Test 3: Synchronisation Stable
1. Ouvrir un job
2. Cliquer sur "Étape Suivante" 3 fois
3. Observer les logs de sync
4. ✅ **Attendu :** Logs `[JobTimer] Sync toContext:` sans duplication
5. ❌ **Échec si :** Multiples sync pour un seul clic

### Test 4: Performance CPU
1. Ouvrir un job
2. Laisser l'écran ouvert 30 secondes
3. Observer l'utilisation CPU dans DevTools
4. ✅ **Attendu :** CPU < 10% (idle)
5. ❌ **Échec si :** CPU > 50% constant

---

## 🔧 Actions Additionnelles Recommandées

### 1. Résoudre Version Mismatch React Native ⚠️

**Problème :**
```
JavaScript version: 0.79.5
Native version: 0.81.4
```

**Solution :**
```bash
# Option 1: Rebuild natif avec la bonne version
npx expo prebuild --clean
npx expo run:android

# Option 2: Aligner les versions dans package.json
npm install react-native@0.81.4
npx expo prebuild --clean
```

**Commande recommandée :**
```bash
cd C:\Users\romai\OneDrive\Documents\client\Swift\App\swift-app
npx expo prebuild --clean
npx expo run:android
```

### 2. Clear Watchman & Metro Cache (si problèmes persistent)

```bash
# Windows PowerShell
watchman watch-del-all
npx react-native start --reset-cache
```

---

## 📝 Fichiers Modifiés

| Fichier | Lignes Modifiées | Type de Changement |
|---------|------------------|-------------------|
| `src/context/JobTimerProvider.tsx` | 36-40, 144-151 | 🔧 Fix boucle infinie |
| `src/hooks/useJobTimer.ts` | 301-313 | 🔧 Désactivation auto-start |

---

## 🎯 Checklist de Validation

- [ ] **Boucle infinie résolue** - 1 seul log par changement de step
- [ ] **Performance restaurée** - CPU < 10% au repos
- [ ] **Démarrage contrôlé** - Timer ne démarre que manuellement
- [ ] **Synchronisation stable** - Pas de duplication de sync
- [ ] **Jobs scheduled affichés correctement** - Step 0 jusqu'au démarrage
- [ ] **Version mismatch résolu** (optionnel) - JS et Native alignées

---

## 📚 Documentation Liée

- `AUDIT_GESTION_TEMPS_02NOV2025.md` - Audit initial du système de temps
- `SYNC_FLOW_DOCUMENTATION.md` - Documentation de la synchronisation
- `OPTIMISATIONS_RAPPORT_02NOV2025.md` - Rapport des optimisations précédentes
- `GUIDE_TESTS_OPTIMISATIONS.md` - Guide de tests

---

## 💡 Leçons Apprises

### ❌ À Éviter
1. **Logs dans le render** → Utilisez `useEffect` avec dépendances
2. **Démarrage auto sans garde** → Toujours vérifier l'état avant l'action
3. **useEffect sans dépendances complètes** → Lint warnings sont là pour aider

### ✅ Bonnes Pratiques
1. **Logs conditionnels** → `useEffect(() => { logger() }, [deps])`
2. **Protection contre re-render** → `useRef` pour flags internes
3. **Dépendances explicites** → Toujours lister toutes les dépendances
4. **Contrôle utilisateur** → Actions critiques nécessitent un clic explicite

---

## 🆘 En Cas de Problème

Si la boucle infinie persiste après ces correctifs :

1. **Hard reload :**
   ```bash
   npx expo start --clear
   ```

2. **Supprimer AsyncStorage cache :**
   - Sur l'appareil : Settings → Apps → Swift App → Clear Data

3. **Vérifier les autres useEffect :**
   - Chercher d'autres `useEffect` sans dépendances dans `jobDetails.tsx`
   - Vérifier qu'aucun state n'est modifié dans un render direct

4. **Activer React DevTools Profiler :**
   - Identifier quel composant re-render en boucle
   - Trouver le state qui change constamment

---

**Date :** 02 Novembre 2025  
**Auteur :** GitHub Copilot  
**Status :** ✅ Correctifs appliqués - En attente de tests utilisateur
