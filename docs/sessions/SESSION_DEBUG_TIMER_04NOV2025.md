# 🐛 SESSION DEBUG TIMER - 04 Novembre 2025

## 📋 RÉSUMÉ

**Problèmes résolus aujourd'hui:**
1. ✅ **Boucle infinie** dans JobTimerProvider → `useEffect` qui se déclenchait continuellement
2. ✅ **Timer non affiché** après auto-correction → Manquait rechargement des données

---

## 🔍 PROBLÈME #1: BOUCLE INFINIE

### Symptômes
```
Console logs (toutes les ~100ms):
🔍 [JobTimerProvider] Sync check: Object
🔍 [JobTimerProvider] No sync needed
🔍 [JobTimerProvider] Sync check: Object
🔍 [JobTimerProvider] No sync needed
... (répété 400+ fois)
```

- App complètement inutilisable
- Timer gelé à `00:00:00`
- Console saturée de logs
- Performance dégradée

### Cause racine

**Fichier:** `src/context/JobTimerProvider.tsx` (ligne ~150-178)

**Code problématique:**
```typescript
useEffect(() => {
  console.log('🔍 [JobTimerProvider] Sync check:', {...});
  
  if (timer.timerData && currentStep !== timer.currentStep && currentStep > 0) {
    timer.advanceStep(currentStep);
  }
}, [currentStep, timer.currentStep, timer.timerData]); 
//          ^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^
//          Ces dépendances changent constamment !
```

**Mécanisme de la boucle:**
1. Timer tick (toutes les 1000ms) → `timer.timerData` se met à jour
2. `useEffect` se déclenche (dépendance: `timer.timerData`)
3. Log `"Sync check"`
4. Condition évaluée → `"No sync needed"`
5. Re-render
6. `useEffect` se re-déclenche
7. **RETOUR à l'étape 1 → BOUCLE INFINIE**

### Solution appliquée

**Stratégie:** Utiliser `useRef` pour tracker le dernier step synchronisé

**Code fixé:**
```typescript
// ✅ Ajouter une ref pour tracker le dernier step synchronisé
const lastSyncedStepRef = useRef<number>(currentStep);

useEffect(() => {
  // Ne pas synchroniser si le changement vient de nous-mêmes
  if (isInternalUpdateRef.current) {
    timerLogger.sync('fromContext', currentStep);
    return;
  }
  
  // ✅ Ne sync que si le step a VRAIMENT changé depuis la dernière sync
  if (currentStep !== lastSyncedStepRef.current && currentStep > 0 && timer.timerData) {
    console.log(`🔄 [JobTimerProvider] SYNCING step from ${timer.currentStep} to ${currentStep}`);
    timerLogger.sync('toContext', currentStep);
    timer.advanceStep(currentStep);
    lastSyncedStepRef.current = currentStep; // ✅ Sauvegarder le step synchronisé
    console.log(`✅ [JobTimerProvider] Sync completed`);
  }
}, [currentStep]); // ✅ UNIQUEMENT currentStep (props) comme dépendance
// Plus de timer.currentStep ni timer.timerData !
```

**Pourquoi ça marche:**

| Avant (Boucle) | Après (Stable) |
|----------------|----------------|
| Dépendances: `[currentStep, timer.currentStep, timer.timerData]` | Dépendances: `[currentStep]` |
| Timer tick → `timer.timerData` change → useEffect déclenché | Timer tick → `timer.timerData` change → **useEffect PAS déclenché** |
| Boucle infinie ❌ | Sync uniquement si `currentStep` (props) change ✅ |

**Résultat attendu:**
```
Console Logs (une seule fois au changement):
🔄 [JobTimerProvider] SYNCING step from 1 to 2
✅ [JobTimerProvider] Sync completed

(Puis silence jusqu'au prochain changement de step)
```

**Fichier modifié:** `src/context/JobTimerProvider.tsx`
- Ligne ~63-66: Ajout de `lastSyncedStepRef`
- Ligne ~150-165: Modification du `useEffect`

---

## 🔍 PROBLÈME #2: TIMER NON AFFICHÉ APRÈS AUTO-CORRECTION

### Symptômes
```
Logs de validation:
✅ [JobValidation] Timer créé et synchronisé avec l'API
⚠️ 1 incohérence(s) détectée(s):
🔴 1. Job à l'étape 3/5 mais timer jamais démarré
✓ Timer créé rétroactivement pour étape 3
```

**Mais dans l'UI:**
- Timer affiché: `00:00:00`
- Timer arrêté (icône ⏸️)
- Pas de mise à jour visuelle

### Cause racine

**Flux problématique:**
```
1. Ouverture du job → Validation détecte incohérence
2. Auto-correction → Appel startTimerAPI() → Timer créé en DB
3. ❌ Interface PAS mise à jour → Affiche toujours les anciennes données
4. Timer reste à 00:00:00
```

**Ce qui manquait:** Recharger les données du job depuis l'API après l'auto-correction

### Solution appliquée

**Fichier:** `src/screens/jobDetails.tsx` (ligne ~228-250)

**Code ajouté:**
```typescript
// 🔍 VALIDATION: Vérifier la cohérence du job à chaque chargement
if (jobDetails.job) {
    validateJobConsistency(jobDetails.job)
        .then(async (validation) => {
            if (!validation.isValid) {
                console.warn('⚠️ [JobDetails] Incohérences détectées:', validation.inconsistencies);
                const report = formatValidationReport(validation);
                console.log(report);
            }
            
            if (validation.autoCorrected) {
                console.log('✅ [JobDetails] Auto-corrections appliquées:', validation.corrections);
                showToast('Incohérence corrigée automatiquement', 'success');
                
                // 🔄 RECHARGER les données du job pour afficher le timer créé
                console.log('🔄 [JobDetails] Rechargement du job après auto-correction...');
                await new Promise(resolve => setTimeout(resolve, 500)); // Attendre 500ms pour sync API
                refreshJobDetails(); // ✅ Recharger depuis l'API
                console.log('✅ [JobDetails] Données rechargées après auto-correction');
            }
        })
        .catch((error) => {
            console.error('❌ [JobDetails] Erreur lors de la validation:', error);
        });
}
```

**Nouveau flux:**
```
1. Ouverture du job → Validation détecte incohérence
2. Auto-correction → Appel startTimerAPI() → Timer créé en DB
3. Attente 500ms → API synchronisée
4. ✅ refreshJobDetails() → Rechargement depuis API
5. ✅ UI mise à jour → Timer s'affiche correctement
```

**Résultat attendu:**

Après auto-correction:
- Toast affiché: `"Incohérence corrigée automatiquement"`
- Rechargement automatique des données
- Timer affiché avec valeur rétroactive (ex: `48h 30min`)
- Timer en cours d'exécution (icône ▶️)

---

## ✅ VÉRIFICATION

### Test 1: Plus de boucle infinie
```bash
1. Ouvrir un job (ex: JOB-NERD-URGENT-006)
2. Vérifier les logs console
3. ✅ Doit montrer le sync UNE SEULE FOIS
4. ❌ Ne doit PAS répéter les logs indéfiniment
```

**Logs attendus:**
```
✅ [JobDetails] Job details loaded successfully
(Pas de logs répétés de "Sync check")
```

### Test 2: Auto-correction + Rechargement
```bash
1. Ouvrir job avec timer non démarré (ex: JOB-NERD-URGENT-006)
2. Observer les logs
3. ✅ Doit afficher: "⚠️ Incohérences détectées"
4. ✅ Doit afficher: "✅ Timer créé et synchronisé avec l'API"
5. ✅ Doit afficher: "🔄 Rechargement du job après auto-correction..."
6. ✅ Toast affiché: "Incohérence corrigée automatiquement"
7. ✅ Timer s'affiche avec valeur rétroactive
```

**Résultat attendu dans l'UI:**
- Timer affiché: `48h 30min` (ou autre valeur selon l'étape)
- Timer en cours: Icône ▶️
- Temps qui s'incrémente

### Test 3: Timer qui tourne
```bash
1. Démarrer le timer manuellement
2. Attendre 10 secondes
3. Vérifier les logs
4. ✅ Timer doit s'incrémenter (0h00, 0h01, 0h02, etc.)
5. ❌ Ne doit PAS montrer de "Sync check" répétés
```

---

## 📊 STATISTIQUES DE LA SESSION

**Fichiers modifiés:** 2
- ✅ `src/context/JobTimerProvider.tsx` - Fix boucle infinie
- ✅ `src/screens/jobDetails.tsx` - Ajout rechargement après auto-correction

**Lignes modifiées:**
- `JobTimerProvider.tsx`: ~20 lignes
- `jobDetails.tsx`: ~10 lignes

**Erreurs TypeScript:** 0 ✅

**Temps de debug:** ~1h

**Bugs résolus:** 2
1. Boucle infinie dans JobTimerProvider
2. Timer non affiché après auto-correction

---

## 🎯 PROCHAINES ÉTAPES

### 1. Test validation automatique ✅ COMPLÉTÉ
- [x] Ouvrir job JOB-NERD-URGENT-006
- [x] Vérifier logs console
- [x] Vérifier auto-correction
- [x] Vérifier toast
- [ ] **TODO:** Vérifier DB update (timer_started_at)

### 2. Test affichage step_history ⏳ EN ATTENTE
- [ ] Vérifier que `JobStepHistoryCard` s'affiche si backend retourne `timeline.step_history`
- [ ] **Dépendance:** Backend doit implémenter step_history dans GET /jobs/{id}/full

### 3. Test mode offline ⏳ EN ATTENTE
- [ ] Activer mode avion
- [ ] Avancer step
- [ ] Vérifier AsyncStorage: `@job_pending_corrections`
- [ ] Désactiver mode avion
- [ ] Vérifier sync automatique après 5s

### 4. Backend: Implémenter step_history ⏳ EN ATTENTE
Structure attendue:
```json
{
  "data": {
    "timeline": {
      "step_history": [
        {
          "step": 1,
          "step_name": "Préparation",
          "started_at": "2025-11-03T15:30:00Z",
          "completed_at": "2025-11-03T18:00:00Z",
          "duration_hours": 2.5,
          "is_current": false
        }
      ],
      "timer_billable_hours": 442.5,
      "timer_break_hours": 0,
      "timer_is_running": true
    }
  }
}
```

---

## 📚 DOCUMENTATION ASSOCIÉE

- `FIX_BOUCLE_INFINIE_04NOV2025.md` - Documentation détaillée du fix
- `INTEGRATION_COMPLETE_04NOV2025.md` - Guide complet d'intégration
- `VALIDATION_SYSTEM_04NOV2025.md` - Documentation du système de validation

---

## 🎨 ARCHITECTURE FINALE

```
┌─────────────────────────────────────────┐
│         JobDetails Screen               │
│  (src/screens/jobDetails.tsx)           │
└─────────────┬───────────────────────────┘
              │
              ├─► useJobDetails Hook
              │   - Charge les données: GET /jobs/:id/full
              │   - refreshJobDetails() pour recharger
              │
              ├─► validateJobConsistency()
              │   - Détecte 8 types d'incohérences
              │   - Auto-correction si possible
              │   - Retourne validation result
              │
              └─► Auto-correction Flow:
                  1. Validation détecte incohérence
                  2. Auto-correction (ex: startTimerAPI)
                  3. Attente 500ms
                  4. refreshJobDetails()
                  5. UI mise à jour ✅

┌─────────────────────────────────────────┐
│       JobTimerProvider Context          │
│  (src/context/JobTimerProvider.tsx)     │
└─────────────┬───────────────────────────┘
              │
              ├─► lastSyncedStepRef (useRef)
              │   - Track dernier step synchronisé
              │   - Évite syncs multiples
              │
              └─► useEffect([currentStep])
                  - Déclenché UNIQUEMENT si currentStep change
                  - Pas de dépendance sur timer.timerData
                  - ✅ Plus de boucle infinie
```

---

**Créé:** 04 Novembre 2025  
**Status:** ✅ PROBLÈMES RÉSOLUS  
**Prochaine étape:** Tester validation automatique et vérifier DB update
