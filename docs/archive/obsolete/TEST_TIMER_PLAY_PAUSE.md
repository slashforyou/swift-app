# 🧪 Guide de Test - Timer Play/Pause v1.0

**Date:** 4 novembre 2025  
**Objectif:** Tester le nouveau système simplifié Play/Pause du timer

---

## ✅ Modifications Complétées

1. **✅ `useJobTimer.ts`** - Fonction `togglePause()` ajoutée avec sync API
2. **✅ `JobTimerProvider.tsx`** - Expose `togglePause()` au lieu de `startBreak/stopBreak`
3. **✅ `JobTimerDisplay.tsx`** - Bouton Play/Pause unique
4. **✅ `JobClock.tsx`** - Bouton Play/Pause unique (corrigé)
5. **✅ 0 erreurs TypeScript**

---

## 📋 Plan de Test

### Prérequis
- [ ] App démarrée sur device/émulateur
- [ ] Console ouverte pour voir les logs
- [ ] Job avec timer actif (ex: `JOB-NERD-URGENT-006`)

### Test 1️⃣: Pause du Timer
**Objectif:** Vérifier que le timer se met en pause correctement

1. **Ouvrir un job actif** avec timer en cours
2. **Observer l'état initial:**
   - Timer affiche le temps qui s'incrémente (ex: `02:34:18`)
   - Bouton "Pause" est orange/warning
   - Icône pause ⏸️ visible

3. **Cliquer sur "Pause"**
4. **Vérifier:**
   - ✅ Le temps affiché **freeze** (ne change plus)
   - ✅ Le bouton devient "Play" avec icône ▶️
   - ✅ Le bouton devient vert (`#10B981`)
   - ✅ Message dans console: `⏸️ Timer paused`
   - ✅ Le badge de l'étape reste visible
   - ✅ Les boutons "Étape suivante" restent désactivés pendant la pause

5. **Logs attendus dans la console:**
```
✅ [useJobTimer] Timer paused and synced to API
⏸️ Pause started at: [timestamp]
📊 Total elapsed: XX:XX:XX
```

---

### Test 2️⃣: Reprise du Timer (Play)
**Objectif:** Vérifier que le timer reprend correctement

1. **Avec le timer en pause** (bouton "Play" vert)
2. **Cliquer sur "Play"**
3. **Vérifier:**
   - ✅ Le temps recommence à s'incrémenter
   - ✅ Le bouton devient "Pause" avec icône ⏸️
   - ✅ Le bouton redevient orange/warning
   - ✅ Message dans console: `▶️ Timer resumed`
   - ✅ Le temps reprend exactement où il était (pas de perte)
   - ✅ Les boutons "Étape suivante" redeviennent actifs

4. **Logs attendus dans la console:**
```
✅ [useJobTimer] Timer resumed and synced to API
▶️ Break duration: X.XX hours
📊 Total break time: XX:XX:XX
📊 Billable time: XX:XX:XX
```

---

### Test 3️⃣: Temps Facturable
**Objectif:** Vérifier que le temps de pause n'est pas facturé

1. **Noter le "Temps facturable" avant la pause** (ex: `02:30:00`)
2. **Mettre en pause pendant 5 minutes**
3. **Reprendre le timer**
4. **Vérifier:**
   - ✅ "Temps total" = temps avant pause + 5 min
   - ✅ "Temps facturable" = temps avant pause (SANS les 5 min de pause)
   - ✅ La différence = temps de pause

**Exemple:**
```
Avant pause:
- Temps total: 02:30:00
- Temps facturable: 02:30:00

Pause de 5 min

Après reprise:
- Temps total: 02:35:00
- Temps facturable: 02:30:00 ← Inchangé!
```

---

### Test 4️⃣: Synchronisation API
**Objectif:** Vérifier que les pauses sont sauvegardées dans l'API

1. **Mettre en pause**
2. **Vérifier dans la console:**
   - ✅ Appel API `pauseTimerAPI()` réussi
   - ✅ Log: `✅ [useJobTimer] Timer paused and synced to API`

3. **Reprendre**
4. **Vérifier dans la console:**
   - ✅ Appel API `resumeTimerAPI()` réussi
   - ✅ Log: `✅ [useJobTimer] Timer resumed and synced to API`

---

### Test 5️⃣: Persistance des Pauses
**Objectif:** Vérifier que les pauses multiples sont trackées

1. **Faire 3 pauses différentes:**
   - Pause 1: 2 minutes
   - Pause 2: 3 minutes
   - Pause 3: 1 minute

2. **Vérifier:**
   - ✅ Total break time = 6 minutes
   - ✅ Temps facturable = Temps total - 6 minutes
   - ✅ Logs montrent chaque pause avec sa durée

---

### Test 6️⃣: Comportement UI
**Objectif:** Vérifier l'expérience utilisateur

1. **Pendant que le timer tourne:**
   - ✅ Border du container = bleu (primary)
   - ✅ Timer ticking chaque seconde

2. **Pendant la pause:**
   - ✅ Border du container = gris (border)
   - ✅ Timer complètement figé
   - ✅ Indicateur visuel "⏸️ En pause"

3. **Transitions:**
   - ✅ Animations fluides du bouton (pressed state)
   - ✅ Pas de lag ou freeze de l'UI

---

## 🐛 Problèmes Potentiels à Surveiller

### ⚠️ Attention aux:
1. **Boucles infinies** de re-render (si console spam)
2. **Perte de temps** lors de la reprise
3. **Erreurs API** si backend non disponible
4. **Incohérence** entre `JobClock` et `JobTimerDisplay`
5. **Crashes** lors de multiples pauses rapides

---

## 📊 Checklist Complète

### Fonctionnalité
- [ ] Pause freeze le timer
- [ ] Play reprend le timer
- [ ] Temps facturable correct (exclut pauses)
- [ ] Pauses multiples fonctionnent
- [ ] Sync API réussie

### UI/UX
- [ ] Bouton change de couleur (orange ↔ vert)
- [ ] Icône change (⏸️ ↔ ▶️)
- [ ] Texte change ("Pause" ↔ "Play")
- [ ] Animations fluides
- [ ] Pas de lag

### Persistance
- [ ] Timer persiste après fermeture app
- [ ] Pauses sauvegardées dans AsyncStorage
- [ ] Sync API réussie

---

## ✅ Critères de Succès

Le test est **réussi** si:
1. ✅ Toutes les fonctionnalités marchent sans erreur
2. ✅ Temps facturable correct (exclut les pauses)
3. ✅ Sync API réussie (logs verts dans console)
4. ✅ UI responsive et fluide
5. ✅ Aucun crash ou bug visuel

---

## 🚀 Commandes Utiles

### Démarrer l'app
```powershell
npx expo start
```

### Voir les logs en temps réel
```powershell
npx expo start --clear
```

### Reset du cache si problème
```powershell
npx expo start --clear --reset-cache
```

---

## 📝 Résultat du Test

**Date du test:** _________________

**Testeur:** _________________

### Résultats:
- [ ] ✅ Tous les tests passés
- [ ] ⚠️ Quelques problèmes mineurs (détails ci-dessous)
- [ ] ❌ Problèmes majeurs (détails ci-dessous)

### Notes:
```
[Vos observations ici]
```

### Screenshots/Vidéos:
_[Ajoutez des captures d'écran si nécessaire]_

---

## 🎯 Prochaine Étape

Une fois les tests réussis:
1. Marquer la todo "Test timer Play/Pause sur device" comme ✅ complétée
2. Documenter les résultats dans ce fichier
3. Créer un commit avec les changements
4. Passer à la prochaine fonctionnalité

---

**Bon test! 🚀**
