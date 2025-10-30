# 🕐 Système de Timer Centralisé - Documentation

## Vue d'ensemble

Le système de timer est maintenant **centralisé** via un Context Provider pour garantir que :
- ✅ Le **même timer** est affiché partout (summary, job, payment)
- ✅ Les **actions** (pause, étape suivante, arrêt) sont synchronisées
- ✅ Le **temps est tracké** avec toutes les actions historiques
- ✅ La **synchronisation** entre timer et job.step.actualStep est bidirectionnelle

---

## Architecture

```
JobDetailsWithProvider (wrapper principal)
  └─ JobStateProvider (gestion état job)
       └─ JobDetails (composant principal)
            └─ JobTimerProvider (🆕 TIMER CENTRALISÉ)
                 ├─ Summary (affiche JobClock avec contrôles)
                 ├─ Job (peut aussi utiliser timer)
                 └─ Payment (utilise timer pour calculs)
```

---

## 📁 Fichiers créés/modifiés

### 🆕 **src/context/JobTimerProvider.tsx**
**Nouveau Context Provider pour le timer**

**Responsabilités :**
- Encapsule le hook `useJobTimer`
- Expose les données et actions du timer à tous les composants enfants
- Gère la synchronisation avec `job.step.actualStep`

**API exposée :**
```typescript
interface JobTimerContextValue {
  // 📊 Données
  timerData: JobTimerData | null;
  totalElapsed: number;        // Temps total écoulé
  billableTime: number;         // Temps facturable (sans pauses)
  isRunning: boolean;
  isOnBreak: boolean;
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  finalCost: number | null;
  finalBillableHours: number | null;
  
  // 🎮 Actions
  startTimer: () => void;
  advanceStep: (step: number) => void;
  nextStep: () => void;           // ✅ Helper: étape suivante
  stopTimer: () => void;          // ✅ Helper: arrêter (dernière étape)
  startBreak: () => void;
  stopBreak: () => void;
  
  // 🛠️ Utilitaires
  formatTime: (ms: number, includeSeconds?: boolean) => string;
  calculateCost: (ms: number) => { hours, cost, rawHours };
  HOURLY_RATE_AUD: number;
}
```

**Props du Provider :**
```typescript
<JobTimerProvider
  jobId="123"
  currentStep={2}
  totalSteps={6}
  onStepChange={(newStep) => { /* sync avec job */ }}
  onJobCompleted={(cost, hours) => { /* basculer vers payment */ }}
>
  {children}
</JobTimerProvider>
```

---

### ✅ **src/components/jobDetails/JobClock.tsx**
**Composant Clock mis à jour**

**Changements :**
- ❌ Supprimé : `useJobTimer` direct
- ✅ Ajouté : `useJobTimerContext()` pour accéder au context
- ✅ Nouveaux boutons :
  * **Pause/Reprendre** : Gestion des breaks
  * **Étape suivante** : Avancer dans le workflow avec confirmation
  * **Terminer** : Arrêter le timer (dernière étape) avec confirmation

**Utilisation :**
```tsx
import { useJobTimerContext } from '../../context/JobTimerProvider';

const { 
  totalElapsed, 
  billableTime,
  isRunning,
  currentStep,
  nextStep,      // ✅ Nouvelle action
  stopTimer,     // ✅ Nouvelle action
  startBreak,
  stopBreak
} = useJobTimerContext();
```

**Boutons d'action :**
1. **Pause** (jaune) : Met le timer en pause (break), temps non facturable
2. **Reprendre** (vert) : Sort de pause et reprend le décompte
3. **Étape suivante** (bleu) : Avance à l'étape suivante (avec confirmation)
4. **Terminer** (rouge) : Arrête le timer, calcule le coût final (dernière étape uniquement)

---

### ✅ **src/screens/jobDetails.tsx**
**Écran principal avec provider wrappé**

**Changements :**
- ❌ Supprimé : Appel `useJobTimer` direct dans JobDetails
- ✅ Ajouté : Wrapper `<JobTimerProvider>` autour du contenu
- ✅ Callbacks de synchronisation :
  * `handleStepChange` : Met à jour `job.step.actualStep` quand le timer change
  * `handleJobCompleted` : Bascule vers panel payment + toast de succès

**Flow de synchronisation :**
```
Timer change d'étape
  → onStepChange callback
    → setJob({ step: { actualStep: newStep } })
      → JobTimerProvider reçoit new currentStep
        → Sync bidirectionnelle ✅
```

---

## 🎯 Cas d'usage

### 1️⃣ **Utiliser le timer dans n'importe quelle page**

Dans **summary.tsx**, **job.tsx** ou **payment.tsx** :

```tsx
import { useJobTimerContext } from '../../context/JobTimerProvider';

const MyComponent = () => {
  const { 
    totalElapsed, 
    billableTime, 
    formatTime, 
    isRunning,
    currentStep,
    totalSteps 
  } = useJobTimerContext();

  return (
    <Text>
      Étape {currentStep}/{totalSteps} - 
      Temps: {formatTime(totalElapsed)}
    </Text>
  );
};
```

### 2️⃣ **Contrôler le timer programmatiquement**

```tsx
const { nextStep, stopTimer, startBreak } = useJobTimerContext();

// Avancer à l'étape suivante
<Button onPress={nextStep}>Étape suivante</Button>

// Arrêter le timer (job terminé)
<Button onPress={stopTimer}>Terminer le job</Button>

// Mettre en pause
<Button onPress={startBreak}>Pause</Button>
```

### 3️⃣ **Calculer le coût en temps réel**

```tsx
const { billableTime, calculateCost, HOURLY_RATE_AUD } = useJobTimerContext();

const costData = calculateCost(billableTime);
// { hours: 3.5, cost: 385, rawHours: 3.2 }

<Text>Coût actuel: ${costData.cost} AUD</Text>
<Text>Heures facturables: {costData.hours}h</Text>
<Text>Taux horaire: ${HOURLY_RATE_AUD}/h</Text>
```

### 4️⃣ **Afficher le statut**

```tsx
const { isRunning, isOnBreak, isCompleted } = useJobTimerContext();

if (isCompleted) {
  return <Text>✅ Job terminé</Text>;
}

if (isOnBreak) {
  return <Text>⏸️ En pause</Text>;
}

if (isRunning) {
  return <Text>▶️ En cours</Text>;
}
```

---

## ⚙️ Fonctionnement technique

### **Flux de démarrage**

1. User ouvre jobDetails
2. `JobDetailsWithProvider` wrap avec `JobStateProvider`
3. `JobDetails` charge le job depuis API
4. `JobDetails` wrap contenu avec `JobTimerProvider`
5. Provider initialise `useJobTimer` avec `jobId` et `currentStep`
6. Timer démarre automatiquement si `currentStep >= 1`

### **Flux d'avancement d'étape**

```
User clique "Étape suivante" dans JobClock
  → Confirmation alert
    → nextStep() appelé
      → JobTimerProvider.advanceStep(currentStep + 1)
        → useJobTimer.advanceStep()
          → Enregistre l'étape précédente (endTime, duration)
          → Démarre nouvelle étape (startTime)
          → Sauvegarde dans AsyncStorage
        → onStepChange callback
          → jobDetails.handleStepChange(newStep)
            → setJob({ step: { actualStep: newStep } })
```

### **Flux de pause**

```
User clique "Pause"
  → startBreak() appelé
    → useJobTimer.startBreak()
      → Enregistre breakTime.startTime
      → isOnBreak = true
      → Sauvegarde dans AsyncStorage

User clique "Reprendre"
  → stopBreak() appelé
    → useJobTimer.stopBreak()
      → Enregistre breakTime.endTime et duration
      → isOnBreak = false
      → totalBreakTime += duration
      → Sauvegarde dans AsyncStorage
```

### **Flux de complétion**

```
User clique "Terminer" (dernière étape)
  → Confirmation alert
    → stopTimer() appelé
      → JobTimerProvider.advanceStep(totalSteps)
        → useJobTimer.advanceStep(6)
          → Termine dernière étape
          → isRunning = false
          → Calcule finalCost et finalBillableHours
          → onJobCompleted callback
            → jobDetails.handleJobCompleted(cost, hours)
              → setJobPanel('payment')
              → showToast("Job terminé ! $385 AUD")
```

---

## 📊 Persistance des données

Toutes les données timer sont sauvegardées dans **AsyncStorage** :

```typescript
{
  "jobTimers": {
    "JOB-123": {
      "jobId": "JOB-123",
      "startTime": 1698765432000,
      "currentStep": 3,
      "stepTimes": [
        {
          "step": 1,
          "stepName": "Départ (entrepôt/client)",
          "startTime": 1698765432000,
          "endTime": 1698766332000,
          "duration": 900000  // 15 min
        },
        {
          "step": 2,
          "stepName": "Arrivé première adresse",
          "startTime": 1698766332000,
          "endTime": 1698769932000,
          "duration": 3600000  // 1h
        },
        {
          "step": 3,
          "stepName": "Départ première adresse",
          "startTime": 1698769932000
        }
      ],
      "breakTimes": [
        {
          "startTime": 1698767232000,
          "endTime": 1698768132000,
          "duration": 900000  // 15 min pause
        }
      ],
      "isRunning": true,
      "isOnBreak": false,
      "totalElapsed": 4500000,  // 1h15 total
      "totalBreakTime": 900000  // 15 min pause
    }
  }
}
```

---

## 🔄 Synchronisation avec job.step

Le timer et `job.step.actualStep` sont **bidirectionnels** :

### **Timer → Job**
Quand le timer change d'étape, il met à jour le job :
```typescript
onStepChange: (newStep) => {
  setJob(prev => ({
    ...prev,
    step: { ...prev.step, actualStep: newStep },
    current_step: newStep
  }));
}
```

### **Job → Timer**
Quand le job change (ex: useEffect depuis API), le provider détecte :
```typescript
useEffect(() => {
  if (currentStep !== timer.currentStep && currentStep > 0) {
    timer.advanceStep(currentStep);
  }
}, [currentStep]);
```

---

## 🎨 Interface utilisateur

### **JobClock - Page Summary**

```
┌─────────────────────────────────────┐
│ 🕐 Job en cours         Étape 3/6   │
├─────────────────────────────────────┤
│                                     │
│           01:23:45                  │
│        Temps total écoulé           │
│                                     │
├─────────────────────────────────────┤
│          [⏸️ Pause]                 │
├─────────────────────────────────────┤
│   [➡️ Étape suivante] [🛑 Terminer] │
├─────────────────────────────────────┤
│ Temps facturable: 01:08:45          │
│ Temps total: 01:23:45               │
└─────────────────────────────────────┘
```

**Comportement des boutons :**
- **Pause** : Visible si `isRunning && !isOnBreak` → Devient "Reprendre" si `isOnBreak`
- **Étape suivante** : Visible si `currentStep < totalSteps`
- **Terminer** : Visible si `currentStep === totalSteps - 1` (dernière étape)

---

## 🧪 Testing

### **Tester localement :**

1. Ouvrir jobDetails d'un job
2. Vérifier que le timer démarre automatiquement
3. Cliquer "Pause" → Timer doit se mettre en pause
4. Cliquer "Reprendre" → Timer doit reprendre
5. Cliquer "Étape suivante" → Confirmation → Étape doit avancer
6. Naviguer vers "Job" ou "Payment" → Timer doit rester synchronisé
7. À la dernière étape, cliquer "Terminer" → Panel payment + toast de succès

### **Vérifier la persistance :**

1. Démarrer timer sur un job
2. Quitter l'app (force quit)
3. Rouvrir l'app et le job
4. Timer doit reprendre là où il s'était arrêté

---

## 🚀 Prochaines étapes

- [ ] Ajouter un indicateur visuel de sync (quand timer sauvegarde)
- [ ] Ajouter historique des pauses dans l'UI
- [ ] Exporter données timer en PDF pour facture
- [ ] Notification push quand job dépasse temps estimé
- [ ] Dashboard analytics : temps moyen par étape

---

## 📝 Notes importantes

⚠️ **Le timer ne peut pas être modifié manuellement** - Il démarre automatiquement et avance uniquement via les boutons.

✅ **Toutes les actions sont tracées** - Chaque changement d'étape et pause est enregistré avec timestamp.

💾 **Données persistées localement** - Même si l'app crash, le temps est sauvegardé.

🔐 **Thread-safe** - AsyncStorage + React Context garantissent pas de race conditions.

---

**Date de création :** 31 octobre 2025  
**Dernière mise à jour :** 31 octobre 2025  
**Version :** 1.0.0
