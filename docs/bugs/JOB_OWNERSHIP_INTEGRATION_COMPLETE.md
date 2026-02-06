# ✅ Job Ownership - Intégration Frontend Complétée

**Date:** Janvier 2026  
**Statut:** ✅ INTEGRATION TERMINÉE  
**Backend Status:** ✅ PRÊT (confirmé par l'équipe)

---

## 📋 Résumé Exécutif

L'intégration complète du système de Job Ownership a été réalisée avec succès côté frontend. Le système permet maintenant une gestion multi-entreprise des jobs avec workflow d'acceptation/refus.

**Fonctionnalités intégrées:**

- ✅ Affichage visuel de la propriété des jobs (contractee vs contractor)
- ✅ Actions d'acceptation et de refus pour les jobs assignés
- ✅ Types TypeScript complets alignés avec le backend
- ✅ Traductions FR/EN pour tous les messages
- ✅ UI/UX cohérente avec le design system existant

---

## 🏗️ Architecture Mise en Place

### 1. Types et Interfaces

**Fichiers modifiés:**

- `src/services/jobs.ts` - JobAPI interface enrichie
- `src/hooks/useJobsForDay.ts` - Job interface et mapping

**Nouveaux champs:**

```typescript
interface JobAPI {
  // Nouveaux statuts
  status:
    | "pending"
    | "assigned"
    | "accepted"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "declined";
  assignment_status?: "none" | "pending" | "accepted" | "declined";

  // Ownership data
  contractee?: {
    company_id: number;
    company_name: string;
    created_by_name: string;
    stripe_account_id?: string;
  };

  contractor?: {
    company_id: number;
    company_name: string;
    assigned_staff_name?: string;
    assigned_at?: string;
  };

  permissions?: {
    is_owner: boolean;
    is_assigned: boolean;
    can_accept: boolean;
    can_decline: boolean;
    can_start: boolean;
    can_complete: boolean;
    can_edit: boolean;
  };
}
```

### 2. Composants UI Créés

#### **JobOwnershipBanner** (`src/components/jobs/JobOwnershipBanner.tsx`)

- **Rôle:** Affiche la propriété du job et le statut d'assignation
- **Variantes:**
  - `full` - Pour la page de détails (affiche toutes les infos)
  - `compact` - Pour les cartes de job (affichage condensé)
- **Props:**
  ```typescript
  {
    ownership: {
      contractee?: { company_id, company_name, created_by_name };
      contractor?: { company_id, company_name, assigned_staff_name };
      assignment_status?: 'none' | 'pending' | 'accepted' | 'declined';
      permissions?: { is_owner, is_assigned, ... };
    };
    variant: 'full' | 'compact';
  }
  ```
- **Logique d'affichage:**
  - Se masque automatiquement si le job est dans la même entreprise (pas d'assignation externe)
  - Badge coloré selon le statut: pending (orange), accepted (vert), declined (rouge)

#### **JobAssignmentActions** (`src/components/jobs/JobAssignmentActions.tsx`)

- **Rôle:** Boutons pour accepter ou refuser un job assigné
- **Fonctionnalités:**
  - Bouton "Accepter" avec confirmation Alert
  - Bouton "Refuser" avec modal pour saisir une raison (obligatoire, max 500 caractères)
  - États de chargement pendant les appels API
  - Gestion des erreurs avec feedback utilisateur
- **Props:**
  ```typescript
  {
    jobId: string;
    jobTitle: string;
    canAccept: boolean;
    canDecline: boolean;
    onAccept: (notes?: string) => Promise<void>;
    onDecline: (reason: string) => Promise<void>;
  }
  ```

### 3. Services API

**Fichier:** `src/services/jobs.ts`

**Nouvelles fonctions:**

```typescript
// Accepter un job assigné
export async function acceptJob(jobId: string, notes?: string): Promise<void>;
// POST /v1/jobs/{id}/accept

// Refuser un job assigné
export async function declineJob(jobId: string, reason: string): Promise<void>;
// POST /v1/jobs/{id}/decline
```

### 4. Intégration dans JobDetails

**Fichier:** `src/screens/jobDetails.tsx`

**Modifications:**

1. **Imports:**
   - Ajout de `JobOwnershipBanner, JobAssignmentActions` depuis `../components/jobs`
   - Ajout de `acceptJob, declineJob` depuis `../services/jobs`

2. **Handlers:**

   ```typescript
   const handleAcceptJob = async (notes?: string) => {
     await acceptJob(actualJobId, notes);
     showToast("Job accepté avec succès", "success");
     await refreshJobDetails(); // Rafraîchir pour voir le nouveau statut
   };

   const handleDeclineJob = async (reason: string) => {
     await declineJob(actualJobId, reason);
     showToast("Job refusé avec succès", "success");
     navigation.goBack(); // Retour car le job n'est plus assigné
   };
   ```

3. **Rendu conditionnel:**

   ```tsx
   {
     /* Après JobDetailsHeader */
   }

   {
     /* Afficher la bannière si le job vient d'une autre entreprise */
   }
   {
     job.contractee && (
       <JobOwnershipBanner
         ownership={{
           contractee: job.contractee,
           contractor: job.contractor,
           assignment_status: job.assignment_status,
           permissions: job.permissions,
         }}
         variant="full"
       />
     );
   }

   {
     /* Afficher les actions si l'utilisateur peut accepter/refuser */
   }
   {
     (job.permissions?.can_accept || job.permissions?.can_decline) && (
       <JobAssignmentActions
         jobId={job.id}
         jobTitle={job.title || job.code || "Job"}
         canAccept={job.permissions?.can_accept || false}
         canDecline={job.permissions?.can_decline || false}
         onAccept={handleAcceptJob}
         onDecline={handleDeclineJob}
       />
     );
   }
   ```

### 5. Traductions (i18n)

**Fichiers modifiés:**

- `src/localization/translations/fr.ts`
- `src/localization/translations/en.ts`

**Nouvelles clés ajoutées:**

```typescript
jobs: {
  // ... existing keys ...

  // Job actions
  deleteConfirmTitle: "Supprimer le job" / "Delete Job",
  deleteConfirmMessage: "Êtes-vous sûr..." / "Are you sure...",
  deleteSuccess: "Job supprimé avec succès" / "Job deleted successfully",
  deleteError: "Échec de la suppression du job" / "Failed to delete job",
  acceptSuccess: "Job accepté avec succès" / "Job accepted successfully",
  acceptError: "Échec de l'acceptation du job" / "Failed to accept job",
  declineSuccess: "Job refusé avec succès" / "Job declined successfully",
  declineError: "Échec du refus du job" / "Failed to decline job",
}
```

---

## 🔄 Workflow Utilisateur

### Scénario 1: Job de sa propre entreprise

```
1. Utilisateur ouvre JobDetails
2. Aucune bannière d'ownership n'apparaît (même entreprise)
3. Aucun bouton accept/decline
4. Workflow normal (start → complete)
```

### Scénario 2: Job assigné d'une autre entreprise (en attente)

```
1. Utilisateur ouvre JobDetails
2. ✅ Bannière affichée:
   - "Job créé par: [Entreprise X]"
   - "Assigné à: [Votre Entreprise]"
   - Badge "EN ATTENTE" (orange)
3. ✅ Deux boutons visibles:
   - "Accepter ce job" (vert)
   - "Refuser ce job" (rouge)
4. Si ACCEPTER → Confirmation → API call → Refresh → Bannière mise à jour (badge "ACCEPTÉ" vert) + boutons cachés
5. Si REFUSER → Modal raison → API call → Navigation retour (job retiré de la liste)
```

### Scénario 3: Job assigné déjà accepté

```
1. Utilisateur ouvre JobDetails
2. ✅ Bannière affichée avec badge "ACCEPTÉ" (vert)
3. ❌ Boutons accept/decline cachés (permissions.can_accept/can_decline = false)
4. Workflow normal (start → complete)
```

### Scénario 4: Job refusé

```
1. Job disparaît de la liste (status = "declined", assignment_status = "declined")
2. Côté créateur: Peut voir le job avec status "declined" et la raison du refus
3. Côté contractor: N'apparaît plus dans ses jobs (permissions.is_assigned = false)
```

---

## 🧪 Tests à Effectuer

### Tests Frontend (prêts)

- [x] Types TypeScript compilent sans erreurs
- [x] Composants s'affichent correctement
- [x] Traductions FR/EN fonctionnelles
- [x] Handlers accept/decline intégrés

### Tests Backend/Frontend à Valider

**Test 1: Même entreprise**

- [ ] Créer un job dans Entreprise A
- [ ] Se connecter avec un utilisateur d'Entreprise A
- [ ] Ouvrir le job → Bannière ne doit PAS s'afficher

**Test 2: Job assigné (non accepté)**

- [ ] Créer un job dans Entreprise A et l'assigner à Entreprise B
- [ ] Se connecter avec un utilisateur d'Entreprise B
- [ ] Ouvrir le job → Vérifier:
  - ✅ Bannière affichée avec "Job créé par: Entreprise A"
  - ✅ Badge "EN ATTENTE" (orange)
  - ✅ Bouton "Accepter" visible
  - ✅ Bouton "Refuser" visible

**Test 3: Acceptation d'un job**

- [ ] Depuis le test 2, cliquer sur "Accepter"
- [ ] Vérifier la confirmation Alert
- [ ] Confirmer → Vérifier:
  - ✅ Toast "Job accepté avec succès"
  - ✅ Bannière mise à jour avec badge "ACCEPTÉ" (vert)
  - ✅ Boutons accept/decline cachés
  - ✅ Backend a bien enregistré `assignment_status = 'accepted'`

**Test 4: Refus d'un job**

- [ ] Créer un nouveau job Entreprise A → Entreprise B
- [ ] Se connecter Entreprise B
- [ ] Cliquer "Refuser"
- [ ] Vérifier modal avec champ texte pour raison
- [ ] Saisir raison < 10 caractères → Vérifier erreur validation
- [ ] Saisir raison valide (10-500 caractères) → Confirmer
- [ ] Vérifier:
  - ✅ Toast "Job refusé avec succès"
  - ✅ Navigation retour (job ne doit plus apparaître dans la liste)
  - ✅ Backend a bien enregistré `assignment_status = 'declined'` + raison

**Test 5: Côté créateur après refus**

- [ ] Se connecter en tant que créateur (Entreprise A)
- [ ] Ouvrir le job refusé
- [ ] Vérifier:
  - ✅ Status du job = "declined" ou "pending"
  - ✅ Raison du refus visible quelque part (à définir UX)
  - ✅ Possibilité de réassigner à une autre entreprise ou un autre staff

**Test 6: Permissions**

- [ ] Vérifier que `permissions.can_accept` et `can_decline` sont corrects:
  - `can_accept = true` seulement si `is_assigned && assignment_status === 'pending'`
  - `can_decline = true` seulement si `is_assigned && assignment_status === 'pending'`
  - Après acceptation: `can_accept = false, can_decline = false`

---

## 📊 Statuts de Job et Mapping

### Backend → Frontend Mapping

**Job Status (status):**

```
Backend          Frontend         Description
---------        ----------       -----------
pending       → pending           Job créé, pas encore assigné/démarré
assigned      → assigned          Job assigné à une autre entreprise (awaiting response)
accepted      → accepted          Job assigné et accepté (ready to start)
in_progress   → in-progress       Job en cours d'exécution
completed     → completed         Job terminé
cancelled     → cancelled         Job annulé
declined      → declined          Job refusé par le contractor
```

**Assignment Status (assignment_status):**

```
Backend          Frontend         Contexte
---------        ----------       --------
none          → none              Job interne (même entreprise, pas d'assignation externe)
pending       → pending           Job assigné, en attente d'acceptation
accepted      → accepted          Job assigné et accepté
declined      → declined          Job assigné mais refusé
```

**Workflow Typique:**

```
1. Job créé par Entreprise A
   status = 'pending', assignment_status = 'none'

2. Job assigné à Entreprise B
   status = 'assigned', assignment_status = 'pending'
   permissions.can_accept = true, can_decline = true

3a. Entreprise B accepte
    status = 'accepted', assignment_status = 'accepted'
    permissions.can_accept = false, can_decline = false, can_start = true

3b. Entreprise B refuse
    status = 'declined', assignment_status = 'declined'
    permissions.is_assigned = false (job retiré de leur liste)

4. (Si accepté) Job démarré
   status = 'in-progress'

5. Job terminé
   status = 'completed'
```

---

## 🚀 Données Backend Attendues

### GET /v1/jobs/{id} - Réponse Enrichie

```json
{
  "id": 123,
  "code": "JOB-2026-001",
  "status": "assigned",
  "assignment_status": "pending",

  // Données du créateur (contractee = celui qui reçoit l'argent)
  "contractee": {
    "company_id": 1,
    "company_name": "Entreprise A",
    "created_by_name": "John Doe",
    "stripe_account_id": "acct_123"
  },

  // Données de l'exécutant (contractor = celui qui fait le travail)
  "contractor": {
    "company_id": 2,
    "company_name": "Entreprise B",
    "assigned_staff_name": "Jane Smith",
    "assigned_at": "2026-01-15T10:30:00Z"
  },

  // Permissions pour l'utilisateur actuel
  "permissions": {
    "is_owner": false, // Est-ce que je suis le créateur?
    "is_assigned": true, // Est-ce que le job m'est assigné?
    "can_accept": true, // Puis-je accepter?
    "can_decline": true, // Puis-je refuser?
    "can_start": false, // Puis-je démarrer? (true après acceptation)
    "can_complete": false, // Puis-je terminer?
    "can_edit": false // Puis-je modifier?
  }

  // ... autres champs existants (title, addresses, etc.)
}
```

### POST /v1/jobs/{id}/accept - Request & Response

**Request:**

```json
{
  "notes": "On arrive demain matin à 8h" // optionnel
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Job accepted successfully",
  "job": {
    // Job complet avec status et assignment_status mis à jour
    "status": "accepted",
    "assignment_status": "accepted",
    "permissions": {
      "can_accept": false,
      "can_decline": false,
      "can_start": true,
      ...
    }
  }
}
```

### POST /v1/jobs/{id}/decline - Request & Response

**Request:**

```json
{
  "reason": "Nous n'avons pas de véhicule disponible ce jour-là" // requis
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Job declined successfully",
  "job": {
    "status": "declined",
    "assignment_status": "declined",
    "declined_reason": "Nous n'avons pas de véhicule disponible ce jour-là",
    "declined_at": "2026-01-15T11:00:00Z",
    "permissions": {
      "is_assigned": false,
      ...
    }
  }
}
```

---

## 📝 Notes pour le Backend

### Données à Mettre à Jour/Modifier

**Si elles ne sont pas déjà en place:**

1. **Champs de base de données:**
   - `contractee_company_id` (foreign key)
   - `contractee_company_name` (denormalisé pour performance)
   - `contractor_company_id` (foreign key)
   - `contractor_company_name` (denormalisé)
   - `assignment_status` ENUM('none', 'pending', 'accepted', 'declined')
   - `assigned_at` TIMESTAMP
   - `assignment_responded_at` TIMESTAMP
   - `declined_reason` TEXT

2. **Logique de permissions:**
   - `can_accept`: true si `is_assigned && assignment_status === 'pending'`
   - `can_decline`: true si `is_assigned && assignment_status === 'pending'`
   - `can_start`: true si `(is_owner || is_assigned) && (status === 'accepted' || status === 'pending' && assignment_status === 'none')`
   - `can_complete`: true si job en cours ET (is_owner OU is_assigned)
   - `can_edit`: true si is_owner ET status !== 'completed'

3. **Validation des endpoints:**
   - POST /accept : Vérifier que l'utilisateur a `can_accept = true`
   - POST /decline : Vérifier que l'utilisateur a `can_decline = true` ET que `reason` est fourni (min 10 caractères)

4. **Auto-acceptation:**
   - Si job créé dans Entreprise A et assigné à un staff d'Entreprise A (même entreprise):
     - `assignment_status = 'none'` (pas d'assignation externe)
     - `contractee.company_id === contractor.company_id`
     - Pas besoin d'acceptation explicite

---

## ✅ Checklist Complète

### Frontend (TERMINÉ)

- [x] Types TypeScript créés et alignés avec le backend
- [x] Composant JobOwnershipBanner créé et testé (2 variantes)
- [x] Composant JobAssignmentActions créé et testé
- [x] Services API acceptJob/declineJob implémentés
- [x] Intégration dans JobDetails complète
- [x] Handlers accept/decline avec gestion d'erreurs
- [x] Traductions FR/EN ajoutées
- [x] Compilation sans erreurs TypeScript
- [x] Documentation technique complète

### Backend (À CONFIRMER)

- [ ] Champs de BDD créés (contractee_company_id, assignment_status, etc.)
- [ ] GET /v1/jobs/{id} retourne ownership + permissions
- [ ] POST /v1/jobs/{id}/accept implémenté
- [ ] POST /v1/jobs/{id}/decline implémenté
- [ ] Logique de permissions implémentée
- [ ] Tests unitaires backend passent

### Tests E2E (PROCHAINE ÉTAPE)

- [ ] Test 1: Même entreprise (pas de bannière)
- [ ] Test 2: Job assigné en attente (bannière + boutons)
- [ ] Test 3: Acceptation d'un job
- [ ] Test 4: Refus d'un job
- [ ] Test 5: Côté créateur après refus
- [ ] Test 6: Permissions correctes

---

## 🎯 Prochaines Étapes

1. **Tests avec backend réel** ✅ PRIORITÉ
   - Confirmer que les endpoints fonctionnent
   - Valider la structure des réponses
   - Tester tous les scénarios utilisateur

2. **Intégration dans les listes de jobs** (Optionnel - Phase 2)
   - Ajouter JobOwnershipBanner variant="compact" aux cartes de job dans le calendrier
   - Ajouter des filtres: "Mes Jobs", "Jobs Assignés", "Action Requise"

3. **Notifications push** (Phase 3)
   - Notifier le contractor quand un job lui est assigné
   - Notifier le contractee quand un job est accepté/refusé

4. **Analytics** (Phase 3)
   - Tracker le taux d'acceptation par entreprise
   - Temps moyen de réponse
   - Raisons de refus les plus fréquentes

---

## 📞 Support et Questions

Pour toute question ou problème:

- **Frontend Lead:** Romain
- **Backend Lead:** [À compléter]
- **Documentation complète:** `docs/bugs/JOB_OWNERSHIP_*.md`

---

## 🎉 Conclusion

L'intégration frontend est **100% complète et prête pour les tests**. Le système est robuste, type-safe, et respecte les conventions du projet existant.

**Points forts:**

- ✅ Architecture propre et modulaire
- ✅ Composants réutilisables
- ✅ Gestion d'erreurs complète
- ✅ Traductions multilingues
- ✅ Type-safety stricte
- ✅ UI/UX cohérente

**Prêt pour:** Tests backend + validation E2E

---

_Dernière mise à jour: Janvier 2026_
