# 🧪 TEST WORKFLOW JOB COMPLET - 17 DÉCEMBRE 2025

## 🎯 OBJECTIF
Valider le workflow complet d'un job de la création à la completion, incluant timer, steps, photos, et transition vers paiement.

---

## 📋 ARCHITECTURE DU WORKFLOW

### **Flow Principal**
```
1. CRÉATION JOB
   ↓ (API: POST /jobs)
   
2. ASSIGNATION EMPLOYÉ
   ↓ (API: PUT /jobs/:id/assign)
   
3. VISUALISATION JOB
   ↓ (Navigation: Calendar → DayView → JobDetails)
   
4. DÉMARRAGE JOB
   ↓ (Action: startJob → API: POST /jobs/:id/start)
   ↓ (Timer: démarre, step 1/N)
   
5. PROGRESSION STEPS
   ↓ (Action: handleNextStep → actualStep++)
   ↓ (Timer: continue, photos optionnelles)
   
6. PAUSE/RESUME (optionnel)
   ↓ (Action: pauseJob / resumeJob)
   ↓ (Timer: pause/resume)
   
7. COMPLETION JOB
   ↓ (Action: completeJob → API: POST /jobs/:id/complete)
   ↓ (Timer: stop, calcul temps total)
   
8. PAIEMENT
   ↓ (Navigation: JobDetails/Payment)
   ↓ (Flow Stripe: Payment Intent → Confirmation)
```

---

## 🔍 COMPOSANTS TESTÉS

### **Hooks Principaux**
- ✅ `useJobDetails(jobId)` - Données job et actions CRUD
- ✅ `useJobTimer(jobId)` - Gestion timer et temps
- ✅ `useJobPhotos(jobId)` - Upload et gestion photos
- ✅ `useJobPayment()` - Intégration Stripe

### **Contextes**
- ✅ `JobStateProvider` - État global du job
- ✅ `JobTimerProvider` - État timer et progression

### **Composants UI**
- ✅ `JobTimerDisplay` - Affichage timer et contrôles
- ✅ `JobSummary` - Vue d'ensemble et actions
- ✅ `JobSteps` - Timeline de progression
- ✅ `PaymentScreen` - Interface paiement

---

## 🧪 PLAN DE TEST DÉTAILLÉ

### **TEST 1 : Création et Assignation de Job** 🟡 EN COURS

#### **Pré-requis**
- [ ] User authentifié avec token valide
- [ ] Entreprise créée avec au moins 1 employé
- [ ] Template de job disponible

#### **Actions à Tester**
```typescript
// 1. Créer un nouveau job
const newJob = {
  clientId: "client_test_001",
  templateId: "template_plumbing_basic",
  scheduledDate: "2025-12-17",
  scheduledTime: "14:00",
  location: {
    address: "123 Test Street, TestCity",
    coordinates: { lat: 48.8566, lon: 2.3522 }
  },
  estimatedDuration: 120, // minutes
  description: "Test job - Réparation robinet cuisine"
};

// Expected Response:
{
  success: true,
  job: {
    id: "job_xxx",
    code: "#LM0000001",
    status: "scheduled",
    ...newJob
  }
}

// 2. Assigner à un employé
const assignment = {
  jobId: "job_xxx",
  employeeId: "emp_yyy"
};

// Expected Response:
{
  success: true,
  job: {
    ...previousJob,
    status: "assigned",
    assignedTo: {
      id: "emp_yyy",
      name: "John Doe"
    }
  }
}
```

#### **Validations**
- [ ] Job créé avec ID unique
- [ ] Code généré automatiquement (#LMxxxxxxx)
- [ ] Statut initial = "scheduled"
- [ ] Assignation change statut → "assigned"
- [ ] Job visible dans Calendar/DayView
- [ ] Employé reçoit notification (si impl.)

#### **API Endpoints Utilisés**
```
POST   /api/jobs
PUT    /api/jobs/:id/assign
GET    /api/jobs/:id
GET    /api/jobs/day/:year/:month/:day
```

---

### **TEST 2 : Démarrage Job et Timer** ⏰

#### **Scénario**
```
Navigation: Home → Today → DayView → JobDetails
Tab: Summary
Action: Bouton "Commencer"
```

#### **Actions à Tester**
```typescript
// Dans JobSummary.tsx
const handleStartJob = async () => {
  // 1. Appel API startJob
  await startJob(jobId);
  
  // Expected:
  // - API call: POST /jobs/:id/start
  // - Job status: "in_progress"
  // - Timer démarre à 00:00:00
  // - Step actuel: 1/N
};
```

#### **Validations Timer**
- [ ] Timer démarre à 00:00:00
- [ ] Incrémentation chaque seconde
- [ ] Format affiché: HH:MM:SS
- [ ] Persistance en cas de navigation
- [ ] Récupération état après refresh

#### **Validations Step**
- [ ] Step actuel = 1 (premier step)
- [ ] Affichage timeline correcte
- [ ] Nom et description du step visibles
- [ ] Boutons "Pause" et "Étape suivante" actifs

#### **API Endpoints**
```
POST   /api/jobs/:id/start
GET    /api/jobs/:id/timer
```

---

### **TEST 3 : Progression entre Steps** 📊

#### **Scénario**
```
Job démarré, step actuel = 1/3
Action: Clic "Étape suivante"
Expected: Step 2/3, timer continue
```

#### **Actions à Tester**
```typescript
// handleNextStep dans JobTimerDisplay
const handleNextStep = () => {
  if (currentStep < totalSteps) {
    // 1. Enregistrer temps du step actuel
    recordStepTime(currentStep, elapsedTime);
    
    // 2. Passer au step suivant
    setCurrentStep(currentStep + 1);
    
    // 3. Timer continue (ne s'arrête pas)
    // Expected:
    // - actualStep incrémenté
    // - Timeline mise à jour
    // - Timer continue sans interruption
  }
};
```

#### **Validations**
- [ ] Step incrémenté correctement (1→2→3)
- [ ] Timer ne s'arrête PAS entre steps
- [ ] Temps de chaque step enregistré
- [ ] Timeline visuelle mise à jour
- [ ] Photos uploadées associées au bon step
- [ ] Dernier step → Bouton "Terminer" au lieu de "Suivant"

#### **Edge Cases**
- [ ] Clic rapide multiple → debounce
- [ ] Step en cours avec photos non uploadées
- [ ] Navigation pendant progression

---

### **TEST 4 : Pause et Resume** ⏸️▶️

#### **Scénario A : Pause Simple**
```
Job en cours, step 2/3, timer 00:15:30
Action: Clic "Pause"
Expected: Timer pause, statut "paused"
```

#### **Actions à Tester**
```typescript
// Pause Job
const handlePause = async () => {
  await pauseJob(jobId);
  
  // Expected:
  // - Timer arrête incrémentation
  // - Statut job: "paused"
  // - Bouton "Pause" → "Reprendre"
  // - Temps écoulé sauvegardé
};

// Resume Job
const handleResume = async () => {
  await resumeJob(jobId);
  
  // Expected:
  // - Timer reprend depuis temps sauvegardé
  // - Statut job: "in_progress"
  // - Bouton "Reprendre" → "Pause"
};
```

#### **Validations**
- [ ] Timer pause correctement
- [ ] Temps écoulé préservé
- [ ] Resume depuis temps exact
- [ ] Pas de perte de données
- [ ] API sync correcte

#### **Scénario B : Pause Longue**
```
Pause à 00:15:30
Wait 2 heures
Resume
Expected: Reprend à 00:15:30 (pas de dérive)
```

#### **Edge Cases**
- [ ] Pause → Navigation ailleurs → Retour → Resume
- [ ] Pause → Kill app → Reopen → Resume
- [ ] Pause → Offline → Resume (queue API call)

---

### **TEST 5 : Upload Photos** 📸

#### **Scénario**
```
Job en cours, step 2/3
Action: Ajouter photos
Expected: Upload vers S3/backend, association au step
```

#### **Actions à Tester**
```typescript
// useJobPhotos hook
const { uploadPhoto, photos, uploadStatus } = useJobPhotos(jobId);

// Upload photo
await uploadPhoto({
  uri: "file://photo.jpg",
  type: "before", // or "during", "after"
  stepId: currentStep
});

// Expected:
// - File upload vers backend/S3
// - URL retournée et stockée
// - Photo visible dans galerie
// - Association step correcte
```

#### **Validations**
- [ ] Upload réussit avec progression
- [ ] Photo apparaît dans galerie
- [ ] Association step/photo correcte
- [ ] Plusieurs photos par step OK
- [ ] Types before/during/after distincts

#### **Edge Cases**
- [ ] Upload échoue (réseau)
- [ ] Photo trop grande (compression?)
- [ ] Upload pendant pause
- [ ] Multiple uploads simultanés

---

### **TEST 6 : Completion Job** ✅

#### **Scénario**
```
Step 3/3 terminé, toutes photos uploadées
Action: Clic "Terminer le job"
Expected: Job completed, timer stop, redirection paiement
```

#### **Actions à Tester**
```typescript
// handleCompleteJob dans JobSummary
const handleCompleteJob = async () => {
  // 1. Valider que tout est OK
  if (currentStep < totalSteps) {
    showToast("Terminer toutes les étapes d'abord", "error");
    return;
  }
  
  // 2. Compléter le job
  await completeJob(jobId);
  
  // Expected:
  // - API call: POST /jobs/:id/complete
  // - Timer stop définitivement
  // - Calcul temps total et par step
  // - Statut job: "completed"
  // - Redirection vers Payment tab
};
```

#### **Validations**
- [ ] Job status → "completed"
- [ ] Timer stop définitivement
- [ ] Temps total calculé et sauvegardé
- [ ] Temps par step enregistré
- [ ] Redirection automatique vers Payment
- [ ] Job apparaît dans historique
- [ ] Notification client (si impl.)

#### **Données Finales Attendues**
```typescript
{
  id: "job_xxx",
  status: "completed",
  completedAt: "2025-12-17T16:45:00Z",
  duration: {
    total: 7800, // seconds (2h 10min)
    byStep: [
      { stepId: 1, duration: 2400 }, // 40min
      { stepId: 2, duration: 3000 }, // 50min
      { stepId: 3, duration: 2400 }  // 40min
    ]
  },
  photos: [
    { id: "photo_1", stepId: 1, type: "before", url: "..." },
    { id: "photo_2", stepId: 2, type: "during", url: "..." },
    { id: "photo_3", stepId: 3, type: "after", url: "..." }
  ]
}
```

---

### **TEST 7 : Edge Cases Critiques** ⚠️

#### **A. Offline Mode**
```typescript
Scénario:
1. Démarrer job (online) ✅
2. Timer running
3. Passer offline (airplane mode)
4. Continuer progression (next step, photos)
5. Revenir online
6. Compléter job

Expected:
- Timer continue offline
- Actions queueées localement
- Sync automatique au retour online
- Aucune perte de données
```

**Validations:**
- [ ] Timer fonctionne offline
- [ ] Steps enregistrés localement
- [ ] Photos sauvegardées en cache
- [ ] Queue d'actions synchronisée
- [ ] Résolution conflits si besoin

#### **B. Interruptions App**
```typescript
Scénario:
1. Job en cours, step 2/3, timer 00:25:00
2. Recevoir appel téléphonique
3. App en background 5 minutes
4. Revenir à l'app

Expected:
- Timer continue en background? OU
- Timer pause automatique + alerte
- État préservé exactement
```

**Validations:**
- [ ] État timer préservé
- [ ] Pas de dérive temporelle
- [ ] Reprend là où c'était
- [ ] Pas de crash au retour

#### **C. Kill App Brutal**
```typescript
Scénario:
1. Job en cours, step 2/3, timer 00:15:30
2. Kill app (force quit)
3. Réouvrir app
4. Navigate to JobDetails

Expected:
- Job status "in_progress" récupéré depuis API
- Timer state récupéré ou recalculé
- Possibilité de reprendre
```

**Validations:**
- [ ] État récupéré depuis API
- [ ] Timer recalculé correctement
- [ ] Photos uploadées toujours là
- [ ] Peut reprendre normalement

#### **D. Erreurs Réseau**
```typescript
Scénario:
1. Job en cours
2. Appel API échoue (startJob, pauseJob, completeJob)
3. Expected: Retry automatique ou message clair

Validations:
- [ ] Messages d'erreur clairs
- [ ] Retry automatique (3 tentatives)
- [ ] Fallback mode offline
- [ ] Pas de corruption état
```

#### **E. Données Incohérentes**
```typescript
Scénario:
1. Job avec actualStep > totalSteps
2. Timer négatif
3. Photos sans stepId
4. Expected: Validation et correction

Validations:
- [ ] useJobValidation détecte problèmes
- [ ] Logs d'erreur détaillés
- [ ] Recovery automatique si possible
- [ ] Alerte utilisateur si critique
```

---

## 📊 RÉSULTATS DES TESTS

### **Test 1 : Création et Assignation** ⏳ EN COURS
```
Status: 🟡 TESTING
Date: 17 Décembre 2025

Résultats:
[ ] Job creation API
[ ] Job assignment API
[ ] Visibility in Calendar
[ ] Navigation to JobDetails

Bugs Identifiés:
- TBD

Notes:
- TBD
```

### **Test 2 : Démarrage et Timer** ⏳ PENDING
```
Status: ⏳ PENDING
Date: -

Résultats:
[ ] Timer starts correctly
[ ] Format display correct
[ ] Persistence after navigation
[ ] API sync

Bugs Identifiés:
- TBD
```

### **Test 3 : Progression Steps** ⏳ PENDING
```
Status: ⏳ PENDING
Date: -

Résultats:
[ ] Step incrementation
[ ] Timer continues
[ ] Timeline update
[ ] Last step handling

Bugs Identifiés:
- TBD
```

### **Test 4 : Pause/Resume** ⏳ PENDING
```
Status: ⏳ PENDING
Date: -

Résultats:
[ ] Pause functionality
[ ] Time preservation
[ ] Resume from exact time
[ ] Long pause handling

Bugs Identifiés:
- TBD
```

### **Test 5 : Upload Photos** ⏳ PENDING
```
Status: ⏳ PENDING
Date: -

Résultats:
[ ] Photo upload success
[ ] Gallery display
[ ] Step association
[ ] Multiple photos

Bugs Identifiés:
- TBD
```

### **Test 6 : Completion** ⏳ PENDING
```
Status: ⏳ PENDING
Date: -

Résultats:
[ ] Complete job success
[ ] Timer stops
[ ] Time calculation
[ ] Redirect to payment

Bugs Identifiés:
- TBD
```

### **Test 7 : Edge Cases** ⏳ PENDING
```
Status: ⏳ PENDING
Date: -

Résultats:
[ ] Offline mode
[ ] App interruptions
[ ] Kill app recovery
[ ] Network errors
[ ] Data validation

Bugs Identifiés:
- TBD
```

---

## 🔧 OUTILS DE TEST

### **Manuel Testing**
```bash
# 1. Lancer l'app en mode dev
npm start

# 2. Ouvrir Expo Go sur device
# 3. Navigate: Home → Today → JobDetails
# 4. Suivre scénarios ci-dessus
```

### **API Testing**
```bash
# Test API endpoints avec curl
curl -X POST http://backend/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clientId": "test_001", ...}'
```

### **Automated Testing**
```bash
# Run tests existants
npm test -- JobTimerDisplay.test.tsx

# Run E2E tests
npm run test:e2e
```

---

## 📝 CHECKLIST FINALE

### **Avant Production**
- [ ] ✅ Tous les tests passent (95%+)
- [ ] ✅ Edge cases gérés
- [ ] ✅ Pas de bugs critiques
- [ ] ✅ Performance acceptable (<3s actions)
- [ ] ✅ Logs complets pour debugging
- [ ] ✅ Documentation mise à jour

### **Nice to Have**
- [ ] Tests automatisés E2E
- [ ] Mock API pour tests offline
- [ ] Performance benchmarks
- [ ] Monitoring production ready

---

## 🐛 BUGS TRACKER

### **Bugs Critiques** 🔴
```
ID: #TBD
Titre: TBD
Statut: TBD
Priorité: 🔴 CRITICAL
Description: TBD
Reproduction: TBD
Fix: TBD
```

### **Bugs Mineurs** 🟡
```
(À remplir pendant les tests)
```

---

## 📈 MÉTRIQUES CIBLES

### **Performance**
- Démarrage job: <1s
- Incrémentation timer: <100ms
- Upload photo: <5s (1MB)
- Completion job: <2s

### **Fiabilité**
- Success rate startJob: >99%
- Timer accuracy: ±1s
- Photo upload success: >95%
- Data persistence: 100%

### **UX**
- Temps réponse UI: <300ms
- Messages erreur clairs: 100%
- Recovery automatique: 80%+

---

*Document de test créé le 17 Décembre 2025*  
*Dernière mise à jour: En cours*
