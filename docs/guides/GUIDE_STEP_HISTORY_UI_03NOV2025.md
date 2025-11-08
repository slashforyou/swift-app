# 📊 GUIDE : Affichage Step History dans l'UI
*03 Novembre 2025 - TODO #5*

## 🎯 OBJECTIF

Afficher l'historique détaillé des étapes avec durées réelles depuis l'API au lieu du timer local.

---

## ⚠️ PRÉREQUIS

Le backend doit retourner `step_history` dans la réponse `GET /jobs/{id}/full` :

```json
{
  "data": {
    "id": 123,
    "code": "JOB-123",
    "current_step": 2,
    "timeline": {
      "step_history": [
        {
          "step": 1,
          "step_name": "Préparation",
          "started_at": "2025-11-03T15:30:00Z",
          "completed_at": "2025-11-03T18:00:00Z",
          "duration_hours": 2.5,
          "is_current": false
        },
        {
          "step": 2,
          "step_name": "Excavation",
          "started_at": "2025-11-03T18:00:00Z",
          "completed_at": null,
          "duration_hours": 440.0,
          "is_current": true
        }
      ],
      "timer_billable_hours": 442.5,
      "timer_break_hours": 12.0,
      "timer_is_running": true,
      "timer_started_at": "2025-11-03T15:30:00Z",
      "timer_completed_at": null
    }
  }
}
```

---

## 📝 ÉTAPES D'IMPLÉMENTATION

### **1. Ajouter types TypeScript**

**Fichier :** `src/services/jobDetails.ts`

**Ajouter interface :**

```typescript
// ✅ NOUVEAU: Interface pour step_history
export interface JobStepHistory {
  step: number;
  step_name: string;
  started_at: string | null;
  completed_at: string | null;
  duration_hours: number | null;
  is_current: boolean;
}

// ✅ NOUVEAU: Interface pour timer_info dans timeline
export interface JobTimerInfo {
  step_history: JobStepHistory[];
  timer_billable_hours: number;
  timer_break_hours: number;
  timer_is_running: boolean;
  timer_started_at: string | null;
  timer_completed_at: string | null;
}

// Modifier l'interface JobDetails existante
export interface JobDetails {
  id: string;
  code: string;
  // ... autres propriétés existantes
  timeline: TimelineEvent[];
  timer_info?: JobTimerInfo; // ✅ NOUVEAU: Ajouter timer_info
}
```

---

### **2. Transformer la réponse API**

**Fichier :** `src/services/jobs.ts` (fonction `getJobDetails`)

**Ajouter transformation :**

```typescript
// Ligne ~461 dans getJobDetails()
timeline: data.timeline || [],

// ✅ AJOUTER après timeline:
timer_info: data.timeline?.step_history ? {
  step_history: (data.timeline.step_history || []).map((sh: any) => ({
    step: sh.step,
    step_name: sh.step_name,
    started_at: sh.started_at,
    completed_at: sh.completed_at,
    duration_hours: sh.duration_hours,
    is_current: sh.is_current
  })),
  timer_billable_hours: data.timeline.timer_billable_hours || 0,
  timer_break_hours: data.timeline.timer_break_hours || 0,
  timer_is_running: data.timeline.timer_is_running || false,
  timer_started_at: data.timeline.timer_started_at || null,
  timer_completed_at: data.timeline.timer_completed_at || null
} : undefined,
```

**OU dans `jobDetails.ts` (fonction `getJobDetails`) ligne ~739 :**

```typescript
timeline: (timelineData.timeline || []).map(normalizeTimelineEvent),

// ✅ AJOUTER après timeline:
timer_info: timelineData.timeline?.step_history ? {
  step_history: (timelineData.timeline.step_history || []).map((sh: any) => ({
    step: sh.step,
    step_name: sh.step_name,
    started_at: sh.started_at,
    completed_at: sh.completed_at,
    duration_hours: sh.duration_hours,
    is_current: sh.is_current
  })),
  timer_billable_hours: timelineData.timeline.timer_billable_hours || 0,
  timer_break_hours: timelineData.timeline.timer_break_hours || 0,
  timer_is_running: timelineData.timeline.timer_is_running || false,
  timer_started_at: timelineData.timeline.timer_started_at || null,
  timer_completed_at: timelineData.timeline.timer_completed_at || null
} : undefined,
```

---

### **3. Créer composant d'affichage**

**Fichier (NOUVEAU) :** `src/components/JobStepHistoryCard.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { JobStepHistory, JobTimerInfo } from '../services/jobDetails';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface JobStepHistoryCardProps {
  timerInfo: JobTimerInfo;
}

export const JobStepHistoryCard: React.FC<JobStepHistoryCardProps> = ({ timerInfo }) => {
  const { step_history, timer_billable_hours, timer_break_hours, timer_is_running } = timerInfo;

  const formatDuration = (hours: number | null) => {
    if (hours === null || hours === 0) return '-';
    
    if (hours < 1) {
      // Moins d'une heure: afficher en minutes
      const minutes = Math.round(hours * 60);
      return `${minutes}min`;
    } else if (hours < 24) {
      // Moins de 24h: afficher en heures avec décimales
      return `${hours.toFixed(1)}h`;
    } else {
      // Plus de 24h: afficher jours + heures
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}j ${remainingHours}h`;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Historique des étapes</Text>
        {timer_is_running && (
          <View style={styles.runningBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.runningText}>En cours</Text>
          </View>
        )}
      </View>

      {/* Step History List */}
      {step_history && step_history.length > 0 ? (
        <View style={styles.stepList}>
          {step_history.map((stepItem) => (
            <View 
              key={stepItem.step} 
              style={[
                styles.stepItem,
                stepItem.is_current && styles.stepItemCurrent,
                stepItem.completed_at && styles.stepItemCompleted
              ]}
            >
              {/* Step Number & Name */}
              <View style={styles.stepHeader}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>{stepItem.step}</Text>
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepName}>{stepItem.step_name}</Text>
                  {stepItem.is_current && (
                    <Text style={styles.currentLabel}>⏱️ Étape actuelle</Text>
                  )}
                  {stepItem.completed_at && (
                    <Text style={styles.completedLabel}>✅ Terminée</Text>
                  )}
                </View>
              </View>

              {/* Duration */}
              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>Durée:</Text>
                <Text style={styles.durationValue}>
                  {formatDuration(stepItem.duration_hours)}
                </Text>
              </View>

              {/* Timestamps */}
              {stepItem.started_at && (
                <View style={styles.timestampRow}>
                  <Text style={styles.timestampLabel}>Démarré:</Text>
                  <Text style={styles.timestampValue}>
                    {formatDateTime(stepItem.started_at)}
                  </Text>
                </View>
              )}
              {stepItem.completed_at && (
                <View style={styles.timestampRow}>
                  <Text style={styles.timestampLabel}>Terminé:</Text>
                  <Text style={styles.timestampValue}>
                    {formatDateTime(stepItem.completed_at)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aucun historique disponible</Text>
          <Text style={styles.emptyHint}>
            Les étapes apparaîtront ici une fois le timer démarré
          </Text>
        </View>
      )}

      {/* Summary Footer */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>💰 Heures facturables:</Text>
          <Text style={styles.summaryValue}>
            {formatDuration(timer_billable_hours)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>⏸️ Temps de pause:</Text>
          <Text style={styles.summaryValue}>
            {formatDuration(timer_break_hours)}
          </Text>
        </View>
        <View style={styles.separatorLine} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabelBold}>⏱️ Total:</Text>
          <Text style={styles.summaryValueBold}>
            {formatDuration(timer_billable_hours + timer_break_hours)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  runningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  runningText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  stepList: {
    gap: 12,
  },
  stepItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#9E9E9E',
  },
  stepItemCurrent: {
    backgroundColor: '#FFF3E0',
    borderLeftColor: '#FF9800',
  },
  stepItemCompleted: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#4CAF50',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  currentLabel: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '500',
  },
  completedLabel: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  durationLabel: {
    fontSize: 13,
    color: '#757575',
  },
  durationValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timestampLabel: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  timestampValue: {
    fontSize: 11,
    color: '#757575',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#757575',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  summaryLabelBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  summaryValueBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  separatorLine: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
});
```

---

### **4. Intégrer dans jobDetails.tsx**

**Fichier :** `src/screens/jobDetails.tsx`

**Ajouter import :**

```typescript
import { JobStepHistoryCard } from '../components/JobStepHistoryCard';
```

**Ajouter dans le render (ligne ~600-800) :**

```typescript
{/* ✅ NOUVEAU: Afficher step_history si disponible */}
{jobDetails?.timer_info && jobDetails.timer_info.step_history.length > 0 && (
  <JobStepHistoryCard timerInfo={jobDetails.timer_info} />
)}

{/* Existing Timeline */}
<JobTimelineCard timeline={jobDetails?.timeline || []} />
```

**Ou si tu veux remplacer complètement le timer local par l'API :**

```typescript
{/* Afficher timer_info depuis API ou fallback sur timer local */}
{jobDetails?.timer_info ? (
  <JobStepHistoryCard timerInfo={jobDetails.timer_info} />
) : (
  <JobTimerCard jobId={jobId} currentStep={job.step.actualStep} />
)}
```

---

## 🔄 FLUX DE DONNÉES

```
App démarre timer → POST /jobs/{id}/timer/start
    ↓
App avance step 1→2 → POST /jobs/{id}/timer/advance
    ↓
Backend crée job_step_history
    ↓
App rafraîchit → GET /jobs/{id}/full
    ↓
Réponse contient timeline.step_history
    ↓
Transform dans jobs.ts → timer_info
    ↓
jobDetails.tsx → JobStepHistoryCard
    ↓
UI affiche:
  ✅ Étape 1 - Préparation (2.5h) ✅
  🔵 Étape 2 - Excavation (440.0h) ⏱️
  💰 Heures facturables: 442.5h
  ⏸️ Temps de pause: 0h
```

---

## ✅ CHECKLIST IMPLÉMENTATION

- [ ] **Backend:** Vérifier que `GET /jobs/{id}/full` retourne `timeline.step_history`
- [ ] **Types:** Ajouter `JobStepHistory` et `JobTimerInfo` interfaces
- [ ] **Transform:** Ajouter transformation dans `jobs.ts` ou `jobDetails.ts`
- [ ] **Component:** Créer `JobStepHistoryCard.tsx`
- [ ] **Integration:** Ajouter dans `jobDetails.tsx`
- [ ] **Install:** `npm install date-fns` (si pas déjà installé)
- [ ] **Test:** Démarrer timer, avancer steps, vérifier affichage
- [ ] **Refresh:** Vérifier que pull-to-refresh met à jour step_history

---

## 🎨 APERÇU VISUEL

```
┌─────────────────────────────────────┐
│ 📊 Historique des étapes    🟢 En cours │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [1] Préparation                 │ │
│ │     ✅ Terminée                 │ │
│ │     Durée: 2.5h                 │ │
│ │     Démarré: 03/11/2025 15:30   │ │
│ │     Terminé: 03/11/2025 18:00   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [2] Excavation                  │ │
│ │     ⏱️ Étape actuelle           │ │
│ │     Durée: 18j 8h               │ │
│ │     Démarré: 03/11/2025 18:00   │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ 💰 Heures facturables: 18j 10h     │
│ ⏸️ Temps de pause: 0h              │
│ ─────────────────────────────       │
│ ⏱️ Total: 18j 10h                  │
└─────────────────────────────────────┘
```

---

## 🧪 TESTS SUGGÉRÉS

### **Test 1: Pas de données**
```typescript
// Vérifier empty state
timerInfo = undefined → Affiche "Aucun historique disponible"
```

### **Test 2: Une étape complétée**
```typescript
step_history = [
  { step: 1, step_name: "Préparation", duration_hours: 2.5, completed_at: "...", is_current: false }
]
→ Badge vert ✅ "Terminée"
→ Durée affichée: "2.5h"
```

### **Test 3: Étape actuelle**
```typescript
step_history = [
  { step: 2, step_name: "Excavation", duration_hours: 440, completed_at: null, is_current: true }
]
→ Badge orange ⏱️ "Étape actuelle"
→ Header badge "En cours" visible
→ Durée affichée: "18j 8h"
```

### **Test 4: Multiple étapes**
```typescript
step_history = [
  { step: 1, completed: true },
  { step: 2, current: true },
  { step: 3, started: false }
]
→ 3 cartes affichées
→ Step 1: vert, Step 2: orange, Step 3: gris
```

---

## 🚀 DÉPLOIEMENT

1. **Vérifier backend ready** → Test `GET /jobs/123/full` avec Postman
2. **Créer composant** → `JobStepHistoryCard.tsx`
3. **Tester composant isolé** → Avec données mockées
4. **Intégrer dans jobDetails** → Remplacer timer local
5. **Tester flow complet** → Start → Advance → Refresh
6. **Vérifier refresh** → Pull-to-refresh met à jour
7. **Clean logs** → Retirer console.log de debug

---

## 📌 NOTES

- **Offline:** Si API fail, continuer à afficher timer local (fallback)
- **Refresh:** Auto-refresh toutes les 30s si timer actif ?
- **Cache:** Stocker `timer_info` dans state pour éviter flicker
- **Animation:** Ajouter pulse animation sur dot "En cours"
- **i18n:** Internationaliser labels (FR/EN)

---

## ✅ STATUT

- [ ] Backend retourne step_history
- [ ] Types créés
- [ ] Composant créé
- [ ] Intégré dans jobDetails
- [ ] Testé end-to-end

**Prêt à implémenter après validation backend ! 🚀**
