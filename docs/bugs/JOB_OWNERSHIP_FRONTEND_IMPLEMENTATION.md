# ✅ IMPLÉMENTATION FRONTEND - Job Ownership & Assignment

**Date:** 1er février 2026  
**Status:** Implémenté (en attente backend)

---

## 📦 Résumé

Le frontend est maintenant prêt à gérer les jobs multi-entreprises avec un système clair d'ownership et d'acceptation/refus d'assignations.

---

## 🎨 Composants Créés

### 1. `JobOwnershipBanner`

**Fichier:** `src/components/jobs/JobOwnershipBanner.tsx`

**Description:** Affiche clairement à qui appartient le job et le statut de l'assignation

**Variantes:**

- `compact`: Badge simple pour les listes de jobs
- `full`: Vue détaillée pour l'écran JobDetails

**Props:**

```typescript
interface JobOwnership {
  contractee: {
    company_id: number;
    company_name: string;
    created_by_name?: string;
  };
  contractor: {
    company_id: number;
    company_name: string;
    assigned_staff_name?: string;
  };
  assignment_status: "none" | "pending" | "accepted" | "declined";
  permissions: {
    is_owner: boolean;
    is_assigned: boolean;
    can_accept: boolean;
    can_decline: boolean;
  };
}
```

**Utilisation:**

```tsx
// Liste de jobs (compact)
<JobOwnershipBanner ownership={job.ownership} variant="compact" />

// Détails du job (full)
<JobOwnershipBanner ownership={job.ownership} variant="full" />
```

---

### 2. `JobAssignmentActions`

**Fichier:** `src/components/jobs/JobAssignmentActions.tsx`

**Description:** Actions pour accepter ou refuser un job assigné

**Fonctionnalités:**

- ✅ Bouton "Accepter" avec confirmation
- ✅ Bouton "Refuser" avec modal pour saisir la raison
- ✅ Gestion des états de chargement
- ✅ Validation de la raison du refus
- ✅ Alertes de succès/erreur

**Props:**

```typescript
interface JobAssignmentActionsProps {
  jobId: string;
  jobTitle: string;
  canAccept: boolean;
  canDecline: boolean;
  onAccept: (notes?: string) => Promise<void>;
  onDecline: (reason: string) => Promise<void>;
}
```

**Utilisation:**

```tsx
<JobAssignmentActions
  jobId={job.id}
  jobTitle={job.title}
  canAccept={job.ownership.permissions.can_accept}
  canDecline={job.ownership.permissions.can_decline}
  onAccept={handleAcceptJob}
  onDecline={handleDeclineJob}
/>
```

---

## 🔌 Services API

### Fonctions Ajoutées dans `src/services/jobs.ts`

#### `acceptJob(jobId, notes?)`

```typescript
/**
 * Accepter un job assigné
 * POST /v1/jobs/{job_id}/accept
 */
export async function acceptJob(
  jobId: string,
  notes?: string,
): Promise<{ success: boolean; message: string; data: any }>;
```

#### `declineJob(jobId, reason)`

```typescript
/**
 * Refuser un job assigné
 * POST /v1/jobs/{job_id}/decline
 */
export async function declineJob(
  jobId: string,
  reason: string,
): Promise<{ success: boolean; message: string; data: any }>;
```

---

## 🎯 Intégration dans les Écrans Existants

### 1. Écran JobDetails

**Emplacement:** Après le header, avant les détails du job

```tsx
import { JobOwnershipBanner, JobAssignmentActions } from "../components/jobs";
import { acceptJob, declineJob } from "../services/jobs";

// Dans le composant
const handleAcceptJob = async (notes?: string) => {
  await acceptJob(job.id, notes);
  // Recharger les données du job
  await refreshJobData();
};

const handleDeclineJob = async (reason: string) => {
  await declineJob(job.id, reason);
  // Retour à la liste ou notification
  navigation.goBack();
};

// Dans le render
<ScrollView>
  {/* Header existant */}

  {/* NOUVEAU: Ownership Banner */}
  {job.ownership && (
    <JobOwnershipBanner ownership={job.ownership} variant="full" />
  )}

  {/* NOUVEAU: Actions d'assignation */}
  {job.ownership?.permissions.can_accept && (
    <JobAssignmentActions
      jobId={job.id}
      jobTitle={job.title}
      canAccept={job.ownership.permissions.can_accept}
      canDecline={job.ownership.permissions.can_decline}
      onAccept={handleAcceptJob}
      onDecline={handleDeclineJob}
    />
  )}

  {/* Reste des détails du job */}
</ScrollView>;
```

---

### 2. Liste de Jobs (Calendar/JobList)

**Emplacement:** Sur chaque carte de job

```tsx
<JobCard>
  {/* Titre, heure, etc. */}

  {/* NOUVEAU: Badge ownership */}
  {job.ownership && (
    <JobOwnershipBanner ownership={job.ownership} variant="compact" />
  )}

  {/* Status, priority, etc. */}
</JobCard>
```

---

### 3. Filtres Calendar

**Nouveaux filtres à ajouter:**

```tsx
const FILTER_OPTIONS = [
  { key: "all", label: "Tous les Jobs" },
  { key: "my_jobs", label: "Mes Jobs", api: "?is_owner=true" },
  { key: "assigned", label: "Jobs Assignés", api: "?is_assigned=true" },
  {
    key: "pending_action",
    label: "Action Requise",
    api: "?assignment_status=pending&is_assigned=true",
  },
  {
    key: "accepted",
    label: "Acceptés",
    api: "?assignment_status=accepted&is_assigned=true",
  },
];
```

---

## 📋 Structure de Données Attendue du Backend

### Réponse GET /v1/jobs/{id}

```json
{
  "success": true,
  "data": {
    "id": "123",
    "code": "JOB-NERD-20260201-001",
    "title": "Déménagement 2 pièces",
    "status": "assigned",

    // NOUVEAU: Sections ownership
    "contractee": {
      "company_id": 1,
      "company_name": "Nerd-Test Removals",
      "created_by_user_id": 5,
      "created_by_name": "John Doe",
      "stripe_account_id": "acct_xxx"
    },

    "contractor": {
      "company_id": 2,
      "company_name": "Swift Movers",
      "assigned_staff_id": 10,
      "assigned_staff_name": "Jane Smith",
      "assigned_at": "2026-01-31T10:00:00Z"
    },

    "assignment_status": "pending",

    "permissions": {
      "is_owner": false,
      "is_assigned": true,
      "can_accept": true,
      "can_decline": true,
      "can_start": false,
      "can_complete": false,
      "can_edit": false
    },

    // Reste des données du job
    "client": { ... },
    "addresses": [ ... ],
    ...
  }
}
```

---

## 🎨 Design System

### Couleurs par Statut

```typescript
assignment_status: {
  'pending': {
    color: colors.warning,
    bgColor: colors.warning + '20',
    icon: 'time-outline'
  },
  'accepted': {
    color: colors.success,
    bgColor: colors.success + '20',
    icon: 'checkmark-circle-outline'
  },
  'declined': {
    color: colors.error,
    bgColor: colors.error + '20',
    icon: 'close-circle-outline'
  }
}
```

---

## 🔄 Workflow Utilisateur

### Scénario: Utilisateur Company 2 voit un job de Company 1

1. **Liste Jobs**
   - Badge orange: "Job de: Nerd-Test Removals"
   - Badge jaune: "En attente d'acceptation"

2. **Clique sur le job**
   - Banner détaillé:
     ```
     Parties Impliquées
     Créateur (Contractee): Nerd-Test Removals
     Exécutant (Contractor): Swift Movers
     ```
   - Card "Action Requise":
     ```
     Ce job vous a été assigné. Acceptez-vous de le prendre en charge?
     [Accepter] [Refuser]
     ```

3a. **Clique "Accepter"** - Confirmation: "Voulez-vous accepter le job... ?" - API: `POST /v1/jobs/123/accept` - Succès: Badge devient vert "Accepté" - Actions du job maintenant disponibles (Démarrer, etc.)

3b. **Clique "Refuser"** - Modal: "Veuillez indiquer la raison du refus" - Textarea pour saisir la raison - API: `POST /v1/jobs/123/decline` avec reason - Succès: Retour à la liste - Notification envoyée au créateur

---

## 📊 Métriques à Suivre

- Taux d'acceptation des jobs assignés
- Temps moyen pour accepter/refuser
- Raisons de refus les plus courantes
- Nombre de jobs multi-entreprises par mois

---

## 🐛 Cas Limites Gérés

1. **Job déjà accepté par quelqu'un d'autre**
   - Backend retourne erreur 409 Conflict
   - Frontend affiche: "Ce job a déjà été accepté"

2. **Réseau hors ligne**
   - Actions mises en queue locale
   - Retry automatique quand connecté

3. **Job annulé pendant l'acceptation**
   - Backend retourne erreur 410 Gone
   - Frontend affiche: "Ce job n'est plus disponible"

4. **Permissions changées**
   - Refresh auto des permissions après chaque action
   - Désactivation des boutons si permissions révoquées

---

## 📝 Documentation Backend Nécessaire

Voir le document détaillé: [JOB_OWNERSHIP_REQUIREMENTS.md](./JOB_OWNERSHIP_REQUIREMENTS.md)

**Résumé des besoins:**

- ✅ Nouveaux champs DB (contractee_company_id, assignment_status, etc.)
- ✅ Endpoints `/accept` et `/decline`
- ✅ Enrichissement de GET /v1/jobs/{id}
- ✅ Filtres dans GET /v1/jobs
- ✅ Système de notifications
- ✅ Tests des 4 scénarios

---

## ✅ Checklist d'Intégration

### Frontend (Déjà Fait)

- [x] Composant `JobOwnershipBanner`
- [x] Composant `JobAssignmentActions`
- [x] Services API `acceptJob` et `declineJob`
- [x] Export des composants

### Frontend (À Faire)

- [ ] Intégrer dans JobDetails
- [ ] Intégrer dans JobCard (liste)
- [ ] Ajouter filtres dans Calendar
- [ ] Mettre à jour les types TypeScript selon réponse API
- [ ] Tests des composants

### Backend (À Faire)

- [ ] Implémenter les modifications DB
- [ ] Créer endpoints `/accept` et `/decline`
- [ ] Enrichir GET /v1/jobs/{id}
- [ ] Ajouter filtres GET /v1/jobs
- [ ] Système de notifications
- [ ] Tests backend

---

**Créé par:** GitHub Copilot  
**Date:** 1er février 2026  
**Prêt pour:** Intégration dès que le backend est implémenté
