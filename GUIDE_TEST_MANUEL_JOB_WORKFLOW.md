# 🧪 GUIDE DE TEST MANUEL - JOB WORKFLOW

## 🎯 Objectif
Ce guide te permet de tester manuellement le workflow complet d'un job dans l'application SwiftApp, de la création à la completion.

---

## 📋 PRÉ-REQUIS

### **Compte et Données**
- [ ] Compte utilisateur créé et authentifié
- [ ] Entreprise configurée avec au moins 1 employé
- [ ] Client existant dans le système
- [ ] Template de job disponible (plumbing, electrical, etc.)

### **Environnement**
- [ ] App SwiftApp lancée en mode développement
- [ ] Device physique ou émulateur avec internet
- [ ] Backend API accessible et fonctionnel
- [ ] Token d'authentification valide

### **Outils**
- [ ] Chronomètre (pour vérifier timer)
- [ ] Appareil photo (pour tests photos)
- [ ] Connexion internet stable

---

## 🚀 PROCÉDURE DE TEST - WORKFLOW COMPLET

### **ÉTAPE 1 : Navigation vers JobDetails** 📱

#### **Chemin A : Depuis Today Section (NOUVEAU)**
```
1. Ouvrir l'app → Page Home
2. Vérifier section "Today" visible
3. Cliquer sur la carte "Today"
   ✅ Redirection vers DayView avec date du jour
4. Dans DayView, trouver un job de test
5. Cliquer sur le job
   ✅ Ouverture JobDetails
```

#### **Chemin B : Depuis Calendar**
```
1. Page Home → Bouton "Calendar"
2. Navigation Month/Day view
3. Sélectionner le jour du test
4. Cliquer sur un job
   ✅ Ouverture JobDetails
```

#### **Validations**
- [ ] Navigation fluide (<500ms)
- [ ] Pas de crash ou erreur
- [ ] JobDetails affiche les bonnes données
- [ ] Header avec titre et RefBookMark visible

---

### **ÉTAPE 2 : Vérification État Initial du Job** 🔍

#### **Tab Summary**
```
1. Ouvrir tab "Summary" (par défaut)
2. Vérifier informations affichées:
   - Code job (ex: #LM0000001)
   - Client (nom, adresse)
   - Date et heure planifiées
   - Description du job
   - Statut actuel (assigned, scheduled)
   - Steps timeline (3 steps)
```

#### **Validations**
- [ ] Toutes les infos sont présentes
- [ ] Pas de "undefined" ou données manquantes
- [ ] Timeline affiche 3 steps
- [ ] Step actuel = 0 (job pas démarré)
- [ ] Boutons visibles : "Commencer", "Annuler"

---

### **ÉTAPE 3 : Démarrage du Job** ▶️

#### **Actions**
```
1. Tab Summary
2. Cliquer bouton "Commencer" (vert)
3. Observer changements:
   - Timer démarre à 00:00:00
   - Step actuel → 1/3
   - Boutons changent : "Pause", "Étape suivante"
   - Statut job → "in_progress"
```

#### **Validations Timer**
- [ ] Timer affiche 00:00:00 au démarrage
- [ ] Incrémente chaque seconde (00:00:01, 00:00:02...)
- [ ] Format correct HH:MM:SS
- [ ] Pas de freeze ou lag

#### **Validations Step**
- [ ] Step actuel = 1
- [ ] Nom du step affiché (ex: "Pickup")
- [ ] Description du step visible
- [ ] Timeline mise à jour (step 1 actif)

#### **Tests de Persistance**
```
1. Timer en cours à 00:00:30
2. Naviguer vers tab "Client"
3. Revenir au tab "Summary"
   ✅ Timer continue sans interruption
   ✅ Affiche ~00:00:33

4. Naviguer complètement hors de JobDetails
5. Revenir au job
   ✅ Timer toujours en cours
   ✅ Temps préservé
```

---

### **ÉTAPE 4 : Progression entre Steps** ⏭️

#### **Step 1 → Step 2**
```
1. Timer en cours (ex: 00:05:00)
2. Cliquer "Étape suivante"
3. Observer:
   - Step actuel → 2/3
   - Nom step change (ex: "Intermediate")
   - Timer CONTINUE (ne s'arrête pas)
   - Timeline mise à jour (step 2 actif, step 1 complété)
```

#### **Step 2 → Step 3**
```
1. Répéter l'action
2. Cliquer "Étape suivante"
3. Observer:
   - Step actuel → 3/3
   - Nom step change (ex: "Dropoff")
   - Bouton "Étape suivante" → "Terminer"
   - Timer continue
```

#### **Validations**
- [ ] Steps s'incrémentent correctement (1→2→3)
- [ ] Timer ne s'arrête JAMAIS entre steps
- [ ] Timeline visuelle correcte
- [ ] Boutons adaptés au step actuel
- [ ] Pas de skip de step
- [ ] Dernier step affiche "Terminer" au lieu de "Suivant"

#### **Test Rapide Multiple Clics**
```
1. Step 1 actif
2. Cliquer rapidement "Étape suivante" 5 fois
   ✅ Ne doit avancer que d'un step
   ✅ Debounce fonctionne
```

---

### **ÉTAPE 5 : Pause et Resume** ⏸️▶️

#### **Test Pause Simple**
```
1. Job en cours, step 2/3, timer à 00:10:30
2. Cliquer bouton "Pause" (jaune)
3. Observer:
   - Timer arrête d'incrémenter
   - Bouton "Pause" → "Reprendre"
   - Temps affiché figé à 00:10:30
```

#### **Validations Pause**
- [ ] Timer arrête immédiatement
- [ ] Temps affiché ne change plus
- [ ] Bouton devient "Reprendre"
- [ ] Statut job → "paused" (vérifier API)

#### **Test Resume**
```
1. Job en pause, timer figé à 00:10:30
2. Cliquer bouton "Reprendre" (vert)
3. Observer:
   - Timer reprend depuis 00:10:30
   - Incrémente normalement (00:10:31, 00:10:32...)
   - Bouton "Reprendre" → "Pause"
```

#### **Validations Resume**
- [ ] Timer reprend exact temps sauvegardé
- [ ] Pas de saut ou dérive temporelle
- [ ] Incrémentation normale
- [ ] Statut job → "in_progress"

#### **Test Pause Longue**
```
1. Pause à 00:15:00
2. Attendre 2 minutes (chronomètre externe)
3. Resume
   ✅ Timer reprend à 00:15:00 (pas 00:17:00)
   ✅ Pas de dérive basée sur temps réel
```

#### **Test Pause + Navigation**
```
1. Pause à 00:08:00
2. Naviguer ailleurs (Home, Calendar)
3. Revenir au job
4. Resume
   ✅ Timer reprend à 00:08:00
   ✅ État préservé
```

---

### **ÉTAPE 6 : Upload de Photos** 📸

#### **Pendant le Job**
```
1. Job en cours, step 2/3
2. Naviguer vers tab "Photos" (si disponible)
   OU utiliser bouton "Ajouter photo" dans Summary
3. Sélectionner photo depuis galerie ou prendre photo
4. Choisir type : "Avant", "Pendant", "Après"
5. Upload
6. Observer:
   - Barre de progression upload
   - Photo apparaît dans galerie
   - Association au step actuel
```

#### **Validations Photos**
- [ ] Upload réussit (<5s pour 1MB)
- [ ] Photo visible dans galerie
- [ ] Type photo correct (before/during/after)
- [ ] Association step correcte
- [ ] Plusieurs photos par step OK
- [ ] Compression appliquée (si >2MB)

#### **Edge Cases Photos**
```
1. Upload pendant pause
   ✅ Doit fonctionner normalement

2. Upload très grande photo (>5MB)
   ✅ Compression automatique ou erreur claire

3. Offline upload
   ✅ Queue pour sync ultérieur ou erreur
```

---

### **ÉTAPE 7 : Completion du Job** ✅

#### **Pré-conditions**
```
- Step actuel = 3/3 (dernier step)
- Timer en cours (ex: 01:25:00)
- Optionnel: Photos uploadées
```

#### **Actions**
```
1. Cliquer bouton "Terminer le job" (vert, gros)
2. Confirmer si modal de confirmation
3. Observer:
   - Timer s'arrête définitivement
   - Temps total calculé et affiché
   - Statut job → "completed"
   - Redirection automatique vers tab "Payment"
```

#### **Validations Completion**
- [ ] Timer stop immédiatement
- [ ] Temps total correct (somme des steps)
- [ ] Statut job = "completed"
- [ ] Redirection vers Payment réussit
- [ ] Job apparaît dans historique "complétés"
- [ ] Pas de possibilité de re-démarrer

#### **Temps Calculés**
```
Vérifier que les temps sont cohérents:
- Temps step 1: ~20min
- Temps step 2: ~30min
- Temps step 3: ~35min
- Temps total: ~85min (1h25)
- Temps pause: exclu du total
```

---

### **ÉTAPE 8 : Flow Paiement** 💳

#### **Tab Payment**
```
1. Après completion, tab Payment actif
2. Vérifier informations:
   - Montant total du job
   - Breakdown (main d'œuvre, matériaux, taxes)
   - Temps total et coût horaire
   - Statut paiement: "pending"
```

#### **Actions Paiement**
```
1. Cliquer "Créer facture" ou "Demander paiement"
2. Remplir informations paiement Stripe
3. Confirmer
4. Observer:
   - Payment Intent créé
   - Statut → "processing"
   - Notification client (si impl.)
```

#### **Validations**
- [ ] Montants corrects et cohérents
- [ ] Stripe Elements fonctionne
- [ ] Payment Intent créé avec succès
- [ ] Redirection après paiement
- [ ] Invoice générée et envoyée

> **Note :** Le flow paiement complet sera testé dans TEST_PAYMENT_WORKFLOW.md

---

## 🚨 EDGE CASES À TESTER

### **1. Offline Mode** 📶

#### **Scénario**
```
1. Démarrer job (online) ✅
2. Timer running à 00:05:00
3. Activer mode avion
4. Continuer progression (next step, photos)
5. Désactiver mode avion après 2 min
6. Observer synchronisation
```

#### **Validations**
- [ ] Timer continue offline
- [ ] Steps enregistrés localement
- [ ] Photos en cache
- [ ] Sync automatique au retour online
- [ ] Aucune perte de données

---

### **2. Interruptions App** 📱

#### **Scénario A : Appel Téléphonique**
```
1. Job en cours, timer à 00:12:00
2. Recevoir appel téléphonique
3. Appel de 3 minutes
4. Revenir à l'app
```

**Validations:**
- [ ] Timer a-t-il pausé automatiquement?
- [ ] Ou continue en background?
- [ ] État préservé au retour
- [ ] Temps cohérent

#### **Scénario B : App en Background**
```
1. Job en cours, timer à 00:08:00
2. Home button → App en background
3. Attendre 5 minutes
4. Réouvrir app
```

**Validations:**
- [ ] Timer état préservé
- [ ] Pas de crash au retour
- [ ] Reprend là où c'était

---

### **3. Kill App Brutal** 💀

#### **Scénario**
```
1. Job en cours, step 2/3, timer à 00:20:00
2. Force quit l'app (swipe dans multitask)
3. Réouvrir app après 1 minute
4. Navigate to JobDetails
```

**Validations:**
- [ ] État récupéré depuis API
- [ ] Job status = "in_progress" ou "paused"
- [ ] Timer state récupéré
- [ ] Peut reprendre normalement
- [ ] Photos uploadées toujours là

---

### **4. Erreurs Réseau** 🌐

#### **Test Timeout API**
```
1. Démarrer job → simuler timeout backend
   ✅ Message erreur clair
   ✅ Retry automatique (3x)
   ✅ Fallback graceful

2. Next step → erreur réseau
   ✅ Step enregistré localement
   ✅ Retry en background
   ✅ User peut continuer
```

---

### **5. Données Incohérentes** ⚠️

#### **Test Validation**
```
1. Job avec actualStep > totalSteps
   ✅ Détection et correction
   ✅ Logs d'erreur

2. Timer négatif
   ✅ Reset à 0 ou dernier état valide
   ✅ Alerte dev

3. Photos sans stepId
   ✅ Association step actuel ou erreur
```

---

## 📊 CHECKLIST FINALE

### **Fonctionnalités Core** ✅
- [ ] Création job fonctionne
- [ ] Assignation employé OK
- [ ] Démarrage job + timer
- [ ] Progression steps fluide
- [ ] Pause/Resume correct
- [ ] Upload photos réussit
- [ ] Completion job + calcul temps
- [ ] Redirection paiement

### **Performance** ⚡
- [ ] Navigation <500ms
- [ ] Timer incrémente sans lag
- [ ] Upload photo <5s (1MB)
- [ ] API calls <2s
- [ ] Pas de freeze UI

### **Fiabilité** 🛡️
- [ ] Offline mode fonctionne
- [ ] Interruptions gérées
- [ ] Kill app récupérable
- [ ] Erreurs réseau gérées
- [ ] Pas de perte de données

### **UX** 🎨
- [ ] Messages erreur clairs
- [ ] Loading states visibles
- [ ] Feedback utilisateur immédiat
- [ ] Navigation intuitive
- [ ] Design cohérent

---

## 🐛 RAPPORT DE BUGS

### **Template Bug Report**
```markdown
**Bug ID:** #TBD
**Titre:** [Description courte]
**Sévérité:** 🔴 Critical / 🟡 Medium / 🟢 Low
**Étape:** [Ex: Step 3 - Progression]

**Reproduction:**
1. Action 1
2. Action 2
3. Résultat observé

**Attendu:** [Comportement attendu]
**Observé:** [Comportement réel]
**Device:** [iPhone 12 / Pixel 5 / etc.]
**OS:** [iOS 17 / Android 13 / etc.]
**Version App:** [1.0.0]

**Screenshots/Vidéo:** [Si applicable]
**Logs:** [Console errors]
```

---

## 📈 MÉTRIQUES À COLLECTER

### **Performance**
- Temps démarrage job: ____ ms
- Timer lag moyen: ____ ms
- Upload photo (1MB): ____ s
- Completion job: ____ ms

### **Fiabilité**
- Success rate startJob: ____%
- Timer accuracy: ±____ s
- Photo upload success: ____%
- Data persistence: ____%

### **UX**
- Temps réponse UI: ____ ms
- Navigation fluide: Oui / Non
- Messages clairs: Oui / Non

---

## ✅ VALIDATION FINALE

**Tests Passés:** ____ / ____  
**Taux de Réussite:** ____%  
**Bugs Critiques:** ____  
**Bugs Mineurs:** ____  

**Recommandation:**
- [ ] ✅ **PRÊT POUR PRODUCTION**
- [ ] ⚠️  **CORRECTIONS MINEURES NÉCESSAIRES**
- [ ] ❌ **CORRECTIONS MAJEURES REQUISES**

---

**Testeur:** __________________  
**Date:** 17 Décembre 2025  
**Durée Test:** ____ minutes  
**Commentaires:** 

_______________________________________
_______________________________________
_______________________________________

---

*Document créé le 17 Décembre 2025*  
*Version: 1.0*
