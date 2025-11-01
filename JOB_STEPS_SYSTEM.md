# 🚛 Système de Steps de Job - Documentation

## Vue d'ensemble

Le système de steps est **dynamique et flexible** pour supporter différents types de jobs (déménagement simple, multi-stops, avec storage, container, etc.).

---

## 📁 Fichier principal

**`src/constants/JobSteps.ts`** - Configuration centralisée de tous les types d'étapes

---

## 🎯 Types d'étapes

### ✅ **Étapes obligatoires** (tous les jobs)

| Type | Nom | Description | Icône | Couleur |
|------|-----|-------------|-------|---------|
| `DEPARTURE` | Départ | Départ du dépôt ou point de départ | 🚀 rocket-outline | Vert #10B981 |
| `FIRST_ADDRESS` | Première adresse | Arrivée à la première adresse | 📍 location-outline | Bleu #3B82F6 |
| `LAST_ADDRESS` | Dernière adresse | Arrivée à la dernière adresse | ✅ checkmark-circle | Rose #EC4899 |
| `COMPLETION` | Fin du job | Job terminé - facturation | 🏁 flag-outline | Vert #10B981 |

### 🔧 **Étapes optionnelles** (selon type de job)

| Type | Nom | Description | Icône | Couleur | Multiple? |
|------|-----|-------------|-------|---------|-----------|
| `LOADING` | Chargement | Chargement container/boxes au dépôt | 📦 cube-outline | Orange #F59E0B | ❌ |
| `TRANSIT` | Trajet | Trajet entre deux adresses | 🚗 car-outline | Violet #8B5CF6 | ✅ |
| `INTERMEDIATE_ADDRESS` | Adresse intermédiaire | Adresse supplémentaire | 📍 location-outline | Cyan #06B6D4 | ✅ |
| `RETURN_TO_DEPOT` | Retour au dépôt | Retour après dernière adresse | ↩️ arrow-undo | Indigo #6366F1 | ❌ |
| `STORAGE` | Mise en storage | Mise en box au dépôt | 🗄️ filing-outline | Rouge #EF4444 | ❌ |
| `UNLOADING` | Déchargement | Déchargement à une adresse | 📥 download-outline | Teal #14B8A6 | ✅ |

---

## 📋 Templates de jobs pré-configurés

### 1️⃣ **Déménagement simple** (`SIMPLE_MOVE`)
Déménagement direct A → B

**Steps :**
```
1. Départ
2. Première adresse
3. Trajet
4. Dernière adresse
5. Fin
```

**Durée estimée :** ~80 min

---

### 2️⃣ **Plusieurs adresses** (`MULTI_STOP`)
Déménagement avec plusieurs points de chargement/déchargement

**Steps :**
```
1. Départ
2. Première adresse
3. Trajet
4. Adresse intermédiaire (peut être répété)
5. Trajet
6. Dernière adresse
7. Fin
```

**Durée estimée :** ~140 min

---

### 3️⃣ **Avec storage** (`WITH_STORAGE`)
Déménagement avec mise en box au dépôt

**Steps :**
```
1. Départ
2. Première adresse
3. Trajet
4. Dernière adresse
5. Retour au dépôt
6. Mise en storage
7. Fin
```

**Durée estimée :** ~195 min

---

### 4️⃣ **Déménagement container** (`CONTAINER_MOVE`)
Chargement container au dépôt puis livraison

**Steps :**
```
1. Départ
2. Chargement (container)
3. Trajet
4. Première adresse
5. Déchargement
6. Retour au dépôt
7. Fin
```

**Durée estimée :** ~165 min

---

### 5️⃣ **Livraison simple** (`DELIVERY_ONLY`)
Livraison depuis le dépôt

**Steps :**
```
1. Départ
2. Chargement
3. Trajet
4. Première adresse
5. Fin
```

**Durée estimée :** ~80 min

---

## 🔧 Utilisation

### **Obtenir les steps d'un template**

```typescript
import { getTemplateSteps, JobTemplate } from '../constants/JobSteps';

const steps = getTemplateSteps(JobTemplate.SIMPLE_MOVE);
// Retourne: [DEPARTURE, FIRST_ADDRESS, TRANSIT, LAST_ADDRESS, COMPLETION]
```

### **Créer des steps custom**

```typescript
import { createStepsFromTypes, StepType } from '../constants/JobSteps';

const customSteps = createStepsFromTypes([
  StepType.DEPARTURE,
  StepType.LOADING,
  StepType.FIRST_ADDRESS,
  StepType.TRANSIT,
  StepType.INTERMEDIATE_ADDRESS,
  StepType.TRANSIT,
  StepType.LAST_ADDRESS,
  StepType.COMPLETION,
]);
```

### **Obtenir la config d'une étape**

```typescript
import { getStepConfig, StepType } from '../constants/JobSteps';

const stepConfig = getStepConfig(StepType.FIRST_ADDRESS);
// {
//   id: 'first_address',
//   type: 'FIRST_ADDRESS',
//   name: 'Première adresse',
//   shortName: '1ère adresse',
//   description: 'Arrivée à la première adresse...',
//   icon: 'location-outline',
//   color: '#3B82F6',
//   isOptional: false,
//   allowMultiple: false,
//   requiresSignature: false,
//   estimatedDuration: 60
// }
```

### **Vérifier si signature requise**

```typescript
import { isSignatureRequired } from '../constants/JobSteps';

if (isSignatureRequired(steps, currentStepIndex)) {
  // Afficher modal de signature
  showSignatureModal();
} else {
  // Passer à l'étape suivante
  advanceStep();
}
```

### **Calculer durée totale**

```typescript
import { calculateTotalEstimatedDuration } from '../constants/JobSteps';

const totalMinutes = calculateTotalEstimatedDuration(steps);
// 195 min pour WITH_STORAGE
```

---

## 🎨 Affichage dans l'UI

### **JobClock**

```tsx
import { useJobTimerContext } from '../context/JobTimerProvider';
import { getStepConfig, StepType } from '../constants/JobSteps';

const { currentStep, totalSteps } = useJobTimerContext();
const stepConfig = getStepConfig(job.steps[currentStep]);

<View>
  <Ionicons name={stepConfig.icon} size={20} color={stepConfig.color} />
  <Text>{stepConfig.shortName}</Text>
  <Text style={{ color: stepConfig.color }}>
    {currentStep}/{totalSteps}
  </Text>
</View>
```

### **JobProgressSection (Timeline)**

```tsx
import { formatStepName, getStepColor } from '../constants/JobSteps';

{steps.map((step, index) => (
  <View key={step.id}>
    <Text style={{ color: getStepColor(step) }}>
      {formatStepName(step, index, steps.length)}
    </Text>
    <Text>{step.description}</Text>
  </View>
))}
```

---

## ⚠️ Signature requise

### **Étape COMPLETION**

L'étape `COMPLETION` a `requiresSignature: true`. Cela signifie :

1. ✅ Quand `currentStep === totalSteps - 1` (avant-dernière étape)
2. ✅ User clique "Terminer" dans JobClock
3. ✅ Vérifier si signature existe :
   ```typescript
   if (!job.signatureDataUrl) {
     Alert.alert(
       'Signature requise',
       'Vous devez faire signer le client avant de finaliser le job.',
       [
         { text: 'Annuler', style: 'cancel' },
         { text: 'Signer', onPress: () => openSignatureModal() }
       ]
     );
     return;
   }
   ```
4. ✅ Si signature OK → Terminer job → Ouvrir modal paiement

---

## 🔄 Synchronisation avec JobTimerProvider

### **Dans jobDetails.tsx**

```typescript
import { createStepsFromTypes, StepType } from '../constants/JobSteps';

// Charger steps depuis API ou template
const jobSteps = createStepsFromTypes([
  StepType.DEPARTURE,
  StepType.FIRST_ADDRESS,
  StepType.TRANSIT,
  StepType.LAST_ADDRESS,
  StepType.COMPLETION,
]);

// Passer au provider
<JobTimerProvider
  jobId={jobId}
  currentStep={job.step.actualStep}
  totalSteps={jobSteps.length}
  onStepChange={handleStepChange}
  onJobCompleted={handleJobCompleted}
>
  {children}
</JobTimerProvider>
```

### **Dans JobClock.tsx**

```typescript
import { useJobTimerContext } from '../context/JobTimerProvider';
import { getStepConfig } from '../constants/JobSteps';

const { currentStep, totalSteps } = useJobTimerContext();
const currentStepConfig = getStepConfig(job.steps[currentStep]);

// Afficher étape actuelle
<Text>{currentStepConfig.name}</Text>
<Text style={{ color: currentStepConfig.color }}>
  Étape {currentStep + 1}/{totalSteps}
</Text>
```

---

## 🚀 Étapes dynamiques (ajouter des trajets)

### **Ajouter un trajet supplémentaire**

Quand user veut ajouter un aller-retour :

```typescript
import { StepType, getStepConfig } from '../constants/JobSteps';

const addTransit = () => {
  const transitStep = getStepConfig(StepType.TRANSIT);
  
  setJob(prev => ({
    ...prev,
    steps: [
      ...prev.steps.slice(0, currentStep + 1),
      transitStep,
      ...prev.steps.slice(currentStep + 1)
    ]
  }));
  
  // Incrémenter totalSteps dans le provider
};
```

### **Ajouter une adresse intermédiaire**

```typescript
const addIntermediateAddress = () => {
  const addressStep = getStepConfig(StepType.INTERMEDIATE_ADDRESS);
  const transitStep = getStepConfig(StepType.TRANSIT);
  
  setJob(prev => ({
    ...prev,
    steps: [
      ...prev.steps.slice(0, currentStep + 1),
      transitStep,
      addressStep,
      ...prev.steps.slice(currentStep + 1)
    ]
  }));
};
```

---

## 📊 Structure de données

### **job.steps** dans le state

```typescript
{
  "id": "JOB-123",
  "steps": [
    {
      "id": "departure",
      "type": "DEPARTURE",
      "name": "Départ",
      "shortName": "Départ",
      "description": "Départ du dépôt",
      "icon": "rocket-outline",
      "color": "#10B981",
      "isOptional": false,
      "allowMultiple": false,
      "requiresSignature": false,
      "estimatedDuration": 0
    },
    {
      "id": "first_address",
      "type": "FIRST_ADDRESS",
      "name": "Première adresse",
      ...
    },
    ...
  ],
  "step": {
    "actualStep": 2,  // Index actuel (0-based)
    "totalSteps": 5
  }
}
```

---

## 🧪 Testing

### **Tester avec template simple**

```typescript
import { getTemplateSteps, JobTemplate } from '../constants/JobSteps';

const steps = getTemplateSteps(JobTemplate.SIMPLE_MOVE);
console.log('Steps:', steps.map(s => s.name));
// ["Départ", "Première adresse", "Trajet", "Dernière adresse", "Fin"]
```

### **Tester signature requise**

```typescript
import { isSignatureRequired } from '../constants/JobSteps';

const steps = getTemplateSteps(JobTemplate.SIMPLE_MOVE);
const lastStepIndex = steps.length - 1;

console.log(isSignatureRequired(steps, lastStepIndex));
// true (COMPLETION nécessite signature)
```

---

## 📝 Notes importantes

⚠️ **Steps multiples** : `TRANSIT`, `INTERMEDIATE_ADDRESS`, `UNLOADING` peuvent avoir plusieurs instances (allowMultiple: true)

✅ **Signature obligatoire** : `COMPLETION` nécessite signature avant facturation

💾 **Persistance** : Les steps sont sauvegardés avec le job dans AsyncStorage

🔄 **Synchronisation** : Les steps sont sync avec JobTimerProvider pour le tracking temps

---

## 🎯 Prochaines étapes

- [ ] API pour récupérer steps depuis backend
- [ ] UI pour ajouter/supprimer steps dynamiquement
- [ ] Validation des transitions de steps
- [ ] Analytics par type de step (temps moyen)
- [ ] Notifications push par step

---

**Date de création :** 1er novembre 2025  
**Dernière mise à jour :** 1er novembre 2025  
**Version :** 1.0.0
