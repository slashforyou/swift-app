# 🧪 Guide de Test - Timer Play/Pause Simplifié

## ✅ Test 1 : Bouton Play/Pause visible

**Actions :**
1. Ouvrir l'app
2. Naviguer vers le job `JOB-NERD-URGENT-006` (celui qui est à step 3/5)
3. Scroller jusqu'au timer

**Résultat attendu :**
```
✅ Timer affiché avec temps actuel (pas 00:00:00)
✅ Bouton "Pause" visible (couleur orange)
✅ Icône "pause" visible
✅ Badge "▶ EN COURS" affiché
```

---

## ✅ Test 2 : Pause fonctionne

**Actions :**
1. Noter le temps actuel du timer (ex: 48:32:15)
2. Cliquer sur le bouton "Pause"
3. Attendre 10 secondes
4. Observer le timer

**Résultat attendu :**
```
✅ Timer freeze immédiatement à 48:32:15 (ne bouge plus)
✅ Bouton devient "Play" (couleur verte)
✅ Icône devient "play"
✅ Badge devient "⏸ PAUSE"
✅ Console affiche : "✅ [useJobTimer] Timer paused and synced to API"
```

**⚠️ Si ça ne marche pas :**
- Vérifier console pour erreurs
- Vérifier que `togglePause` est bien appelé

---

## ✅ Test 3 : Reprise fonctionne

**Actions :**
1. Timer en pause à 48:32:15
2. Attendre 5 secondes
3. Cliquer sur "Play"
4. Observer le timer pendant 10 secondes

**Résultat attendu :**
```
✅ Timer reprend immédiatement à 48:32:15
✅ Timer s'incrémente : 48:32:16, 48:32:17, 48:32:18...
✅ Bouton redevient "Pause" (orange)
✅ Icône redevient "pause"
✅ Badge redevient "▶ EN COURS"
✅ Console affiche : "✅ [useJobTimer] Timer resumed and synced to API"
```

---

## ✅ Test 4 : Temps facturable correct

**Actions :**
1. Timer en cours à 48:30:00
2. Scroller vers le bas du timer
3. Noter "Temps facturable" et "Temps total"
4. Cliquer "Pause"
5. Attendre 1 minute (60 secondes)
6. Cliquer "Play"
7. Re-noter "Temps facturable" et "Temps total"

**Résultat attendu :**
```
Avant pause :
- Temps total      : 48:30:00
- Temps facturable : 48:10:00 (avec pauses précédentes)

Après pause de 1 minute :
- Temps total      : 48:31:00 (+ 1 min)
- Temps facturable : 48:10:00 (INCHANGÉ - pause non facturée)

✅ Temps total augmente
✅ Temps facturable N'AUGMENTE PAS pendant la pause
```

---

## ✅ Test 5 : Sync API (avec React Native Debugger)

**Actions :**
1. Ouvrir React Native Debugger
2. Aller dans Network tab
3. Cliquer "Pause" sur le timer
4. Observer les requêtes
5. Cliquer "Play"
6. Observer les requêtes

**Résultat attendu :**
```
1. Pause :
   POST https://api.swift.com/jobs/JOB-NERD-URGENT-006/timer/pause
   Body: { step: 3, timer_billable_hours: 48.17 }
   Response: { success: true, message: "Timer paused successfully" }

2. Play :
   POST https://api.swift.com/jobs/JOB-NERD-URGENT-006/timer/resume
   Body: { break_duration_hours: 0.017 }
   Response: { success: true, message: "Timer resumed successfully" }

✅ 2 requêtes API envoyées
✅ Réponses 200 OK
✅ Pas d'erreur 401/500
```

---

## ✅ Test 6 : Persistance (fermeture app)

**Actions :**
1. Timer en cours à 48:30:00
2. Cliquer "Pause"
3. Vérifier timer freeze à 48:30:00
4. **Fermer l'app complètement** (swipe up, force quit)
5. Rouvrir l'app
6. Naviguer vers le même job

**Résultat attendu :**
```
✅ Timer affiche toujours 48:30:00 (pas 00:00:00)
✅ Bouton affiche "Play" (vert)
✅ Badge affiche "⏸ PAUSE"
✅ État de pause conservé
```

**Puis :**
7. Cliquer "Play"
8. Observer timer

**Résultat attendu :**
```
✅ Timer reprend à 48:30:00
✅ Timer s'incrémente normalement
✅ Pas d'erreur console
```

---

## ✅ Test 7 : Changement de step pendant pause

**Actions :**
1. Timer en pause à 48:30:00 (step 3/5)
2. Cliquer "Play" pour reprendre
3. Cliquer "Étape suivante" → passe à step 4/5
4. Observer timer et bouton

**Résultat attendu :**
```
✅ Step change de 3 → 4
✅ Timer continue (ne se reset pas)
✅ Badge affiche "Étape 4" ou le nom du step
✅ Bouton "Pause" toujours visible
✅ Temps continue de s'incrémenter
```

---

## 🐛 Bugs potentiels à vérifier

### Bug 1 : Timer affiche 00:00:00
**Symptôme :** Timer affiche `00:00:00` alors que job à step 3/5

**Diagnostic :**
```bash
# Ouvrir console
# Chercher :
⚠️ [useJobTimer] INCOHÉRENCE DÉTECTÉE: Job à l'étape 3/5 mais timer jamais démarré

# Si ce message apparaît :
✅ Auto-correction devrait démarrer automatiquement
✅ Timer devrait afficher temps estimé (ex: 48h rétroactif)

# Si timer reste à 00:00:00 :
❌ Vérifier que auto-correction fonctionne
❌ Vérifier AsyncStorage : @jobTimers
```

**Solution :**
1. Effacer AsyncStorage : `AsyncStorage.clear()`
2. Recharger job → Auto-correction devrait créer timer
3. Si ça ne marche toujours pas → Vérifier `startTimerAPI()` dans logs

---

### Bug 2 : Bouton "Pause" ne répond pas
**Symptôme :** Cliquer "Pause" ne fait rien

**Diagnostic :**
```bash
# Vérifier console :
1. Erreur TypeScript ?
2. togglePause() est undefined ?
3. Erreur API ?

# Ajouter log temporaire :
console.log('🔍 togglePause called', { timerData, isRunning });
```

**Solution :**
- Vérifier que `JobTimerProvider` wrappe bien le composant
- Vérifier import correct de `useJobTimerContext()`

---

### Bug 3 : Temps facturable négatif
**Symptôme :** "Temps facturable" affiche nombre négatif ou `NaN`

**Diagnostic :**
```bash
# Vérifier calcul :
totalElapsed = now - startTime
totalBreakTime = sum(breakTimes[].duration)
billableTime = totalElapsed - totalBreakTime

# Si billableTime < 0 :
❌ startTime incorrect (futur)
❌ totalBreakTime > totalElapsed
```

**Solution :**
- Vérifier `timerData.startTime` est un timestamp valide
- Vérifier `breakTimes` ne contient pas de doublons

---

## 📊 Checklist finale

Avant de valider la feature, vérifier :

- [ ] ✅ Bouton "Pause" visible et fonctionnel
- [ ] ✅ Bouton "Play" visible et fonctionnel
- [ ] ✅ Timer freeze quand en pause
- [ ] ✅ Timer reprend quand play
- [ ] ✅ Temps facturable exclut les pauses
- [ ] ✅ API sync fonctionne (pause + resume)
- [ ] ✅ Persistance après fermeture app
- [ ] ✅ Pas d'erreur console
- [ ] ✅ Pas de boucle infinie
- [ ] ✅ Changement de step conserve le timer

---

## 🎯 Critères de succès

**Feature validée si :**
1. ✅ Timer affiche temps réel (pas 00:00:00)
2. ✅ Play/Pause fonctionne en 1 clic
3. ✅ Temps de pause NOT facturé
4. ✅ API sync automatique
5. ✅ Interface claire et intuitive
6. ✅ Aucun bug bloquant

---

**Date :** 4 Novembre 2025  
**Version testée :** v1.0 - Timer simplifié  
**Testeur :** _________________  
**Device :** iOS / Android (à préciser)  
**Résultat :** ✅ PASS / ❌ FAIL
