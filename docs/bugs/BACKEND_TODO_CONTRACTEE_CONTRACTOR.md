# ✅ IMPLÉMENTÉ - Backend Ownership Fields (1er février 2026)

## 🎉 Statut: TERMINÉ

L'API `GET /v1/job/{code}/full` retourne maintenant **toutes les données nécessaires**!

---

## 👍 Ce qui est IMPLÉMENTÉ

L'API retourne désormais les champs suivants dans la réponse:

```json
{
  "job": {
    "contractor_company_id": 1,
    "contractee_company_id": 1,
    "assignment_status": "accepted"
  },
  "company": {
    "id": 1,
    "name": "Quick Movers Pty Ltd"
  },
  "contractee_company": {
    // ✅ NOUVEAU - IMPLÉMENTÉ
    "id": 1,
    "name": "Quick Movers Pty Ltd",
    "stripe_account_id": "acct_xxx"
  }
}
```



✅ **Désormais disponible:**

- `contractor_company_id` - ID de l'entreprise exécutante
- `contractee_company_id` - ID de l'entreprise créatrice
- `assignment_status` - Statut de l'assignation (pending/accepted/declined)
- `company` - Objet complet de l'entreprise exécutante (contractor)
- `contractee_company` - ⭐ **Objet complet de l'entreprise créatrice**

---

## 🛠️ Solution Frontend Actuelle

Le fichier [src/services/jobs.ts](../../src/services/jobs.ts#L565) transforme automatiquement les données:

```typescript
// Construction automatique à partir de l'API
const contracteeObj = {
  company_id: contracteeCompanyId,
  company_name: contracteeCompanyData?.name, // ✅ Utilise contractee_company
  created_by_name: `${data.job.created_by_first_name} ${data.job.created_by_last_name}`,
  stripe_account_id: contracteeCompanyData?.stripe_account_id,
};

```


**Résultat:**

- ✅ Job interne: Affiche 1 section avec le bon nom
- ✅ Multi-entreprise: Affiche 2 sections avec les **vrais noms** des deux entreprises
- ✅ Tous les composants fonctionnent (CompanyDetailsSection, JobOwnershipBanner, JobAssignmentActions)

---


## 📋 Logs de Debug Actifs


Des logs ont été ajoutés pour faciliter les tests manuels:

### Dans src/services/jobs.ts

```
🏢 [OWNERSHIP] Traitement des données d'entreprise

✅ [OWNERSHIP] Contractor construit
✅ [OWNERSHIP] Contractee construit (JOB INTERNE ou MULTI-ENTREPRISE)
🔐 [OWNERSHIP] Permissions calculées

🔄 [getJobDetails] Data transformed (avec ownership)
```

### Dans les composants

```
🏢 [CompanyDetailsSection] Rendu: {...}
✅ [CompanyDetailsSection] Affichage: MULTI-ENTREPRISE (2 sections) | JOB INTERNE (1 section)
👑 [JobOwnershipBanner] Rendu: {...}
🎯 [JobAssignmentActions] Rendu: {...}
✅ [JobAssignmentActions] Boutons affichés: {...}
```


---

## ⚠️ CE QUI RESTE (Optionnel)


### Permissions précalculées

Le frontend calcule encore les permissions, mais le backend pourrait les retourner pour éviter les incohérences.

**Solution backend recommandée:**

```json
{
  "job": {
    "permissions": {
      // ⭐ Optionnel mais recommandé
      "is_owner": true,
      "is_assigned": false,
      "can_accept": false,
      "can_decline": false,
      "can_start": true,
      "can_complete": true,
      "can_edit": true
    }
  }
}
```

**Impact:** Aucun - le frontend fonctionne déjà avec le calcul côté client.

---

## 🎯 RÉSUMÉ

✅ **Toutes les fonctionnalités ownership sont FONCTIONNELLES**
✅ **Jobs internes affichent 1 section avec le bon nom**
✅ **Jobs multi-entreprises affichent 2 sections avec les vrais noms**
✅ **JobOwnershipBanner fonctionne**
✅ **JobAssignmentActions fonctionne**
📊 **Logs actifs pour tests manuels**

**Status: PRÊT POUR PRODUCTION** 🚀

---

# ANCIENNE DOCUMENTATION (Archive)

## Ce qui était demandé initialement

# ✅ MISE À JOUR - Backend Ownership Fields (1er février 2026)

## 👍 Ce qui est DÉJÀ IMPLÉMENTÉ

L'API `GET /v1/job/{code}/full` retourne **déjà** les champs suivants dans l'objet `job`:

```json
{
  "job": {

    "contractor_company_id": 1,
    "contractee_company_id": 1,
    "assignment_status": "accepted"
  },
  "company": {

    "id": 1,
    "name": "Quick Movers Pty Ltd"
  }
}
```

✅ **Déjà disponible:**

- `contractor_company_id` - ID de l'entreprise exécutante
- `contractee_company_id` - ID de l'entreprise créatrice
- `assignment_status` - Statut de l'assignation (pending/accepted/declined)
- `company` - Objet complet de l'entreprise exécutante (contractor)

---

## ⚠️ CE QUI MANQUE ENCORE

### 1. Nom de l'entreprise contractee (si différente)

Dans le cas où `contractee_company_id !== contractor_company_id`, on ne connaît pas le **nom** de l'entreprise contractee.

**Solution backend recommandée:**
Ajouter un objet `contractee_company` dans la réponse:

```json
{
  "job": {
    "contractor_company_id": 2,
    "contractee_company_id": 1,
    "assignment_status": "pending"
  },
  "company": {
    "id": 2,
    "name": "Transport Pro Ltd" // Contractor
  },
  "contractee_company": {
    // ⭐ NOUVEAU
    "id": 1,
    "name": "Quick Movers Pty Ltd",
    "stripe_account_id": "acct_xxx" // Pour les paiements
  }
}
```

**Workaround frontend actuel:**
On affiche "Entreprise externe" comme placeholder quand les IDs sont différents.

---

### 2. Permissions calculées

Le frontend calcule actuellement les permissions de manière basique, mais le backend devrait les retourner précalculées pour éviter les incohérences.

**Solution backend recommandée:**
Ajouter un objet `permissions` dans `job`:

```json
{

  "job": {
    "permissions": {
      "is_owner": true, // Est propriétaire (contractee)
      "is_assigned": false, // Est assigné au job
      "can_accept": false, // Peut accepter le job
      "can_decline": false, // Peut refuser le job

      "can_start": true, // Peut démarrer le job
      "can_complete": true, // Peut terminer le job
      "can_edit": true // Peut éditer le job
    }
  }
}
```

**Logique de calcul:**

```typescript
// is_owner: L'utilisateur appartient à la contractee company
is_owner = user.company_id === job.contractee_company_id;

// is_assigned: L'utilisateur est dans la crew
is_assigned = job.crew.some((member) => member.user_id === user.id);

// can_accept: Job en attente ET utilisateur dans contractor company ET pas encore accepté
can_accept =
  job.assignment_status === "pending" &&
  user.company_id === job.contractor_company_id &&
  !is_assigned;

// can_decline: Job en attente ET utilisateur dans contractor company
can_decline =
  job.assignment_status === "pending" &&
  user.company_id === job.contractor_company_id;

// can_start: Job accepté OU propriétaire OU assigné
can_start = job.assignment_status === "accepted" || is_owner || is_assigned;

// can_complete: Peut démarrer
can_complete = can_start;

// can_edit: Propriétaire OU assigné
can_edit = is_owner || is_assigned;
```

**Workaround frontend actuel:**
Permissions calculées dans [src/services/jobs.ts](../../../src/services/jobs.ts#L570).

---

### 3. Informations détaillées sur les créateurs/assignés

Pour un affichage optimal, il faudrait:

```json
{
  "job": {
    "created_by": {
      // ⭐ Infos sur le créateur
      "user_id": 15,
      "first_name": "Romain",
      "last_name": "Giovanni",
      "email": "romain@example.com",
      "company_id": 1,
      "company_name": "Quick Movers"
    },
    "assigned_to": {
      // ⭐ Infos sur l'assigné
      "user_id": 16,
      "first_name": "Marc",
      "last_name": "Dupont",
      "email": "marc@example.com",
      "assigned_at": "2026-01-20T09:00:00.000Z"
    }
  }
}
```

**Workaround frontend actuel:**
On utilise `job.created_by_first_name`, `job.created_by_last_name` et le premier membre de `crew[]`.

---

## 🛠️ SOLUTION FRONTEND ACTUELLE


Le fichier [src/services/jobs.ts](../../../src/services/jobs.ts#L550) transforme automatiquement les données reçues pour construire les objets manquants:

```typescript
// Ligne ~550 dans jobs.ts
const contractorObj = {
  company_id: data.job.contractor_company_id,
  company_name: data.company.name, // De l'objet company

  assigned_staff_name: `${data.crew[0].first_name} ${data.crew[0].last_name}`,
  assigned_at: data.crew[0].assigned_at,
};

const contracteeObj = {
  company_id: data.job.contractee_company_id,
  company_name:
    contracteeCompanyId === contractorCompanyId
      ? data.company.name
      : "Entreprise externe", // ⚠️ Placeholder si différent
  created_by_name: `${data.job.created_by_first_name} ${data.job.created_by_last_name}`,
};
```

**Limitations actuelles:**

- ⚠️ Si `contractee !== contractor`, on affiche "Entreprise externe" au lieu du vrai nom
- ⚠️ Les permissions sont calculées côté frontend (risque d'incohérence)

---

## 📝 CHECKLIST BACKEND (Optimisations recommandées)

- [ ] Ajouter `contractee_company` dans la réponse `/v1/job/{code}/full`
- [ ] Ajouter `permissions` précalculées dans `job`
- [ ] Ajouter `created_by` (objet complet) dans `job`
- [ ] Ajouter `assigned_to` (objet complet) dans `job`

**Impact si non implémenté:** Fonctionnalité de base OK, mais affichage limité pour les jobs multi-entreprises.

---

## 🎯 RÉSUMÉ

✅ **Frontend 100% fonctionnel** avec les données actuelles de l'API  
⚠️ **Améliorations backend recommandées** pour affichage complet des jobs multi-entreprises  
🚀 **Composants prêts:** CompanyDetailsSection, JobOwnershipBanner, JobAssignmentActions

---

# ANCIENNE DOCUMENTATION (Archive)

## Ce qui était demandé initialement (avant clarification)

# 🔧 TODO Backend - Données Contractee/Contractor

**Date:** 1er février 2026  
**Priorité:** 🔴 **HAUTE** - Bloque l'affichage de plusieurs fonctionnalités frontend  
**Endpoint concerné:** `GET /v1/job/{jobCode}/full`

---

## 📋 Résumé

Le frontend a été mis à jour pour gérer intelligemment l'affichage des entreprises (job interne vs multi-entreprise) via le composant `CompanyDetailsSection`. Cependant, les données nécessaires ne sont **pas encore retournées par l'API**.

---

## ⚠️ Fonctionnalités Frontend Bloquées

Sans ces données, les fonctionnalités suivantes sont **invisibles** pour l'utilisateur :

### 1. CompanyDetailsSection (Panel Summary + Panel Job)

- **État actuel:** Retourne `null`, section invisible
- **Comportement attendu:**
  - Job interne → 1 section "Entreprise"
  - Multi-entreprise → 2 sections avec bordures colorées (Donneur d'ordre + Exécutant)

### 2. JobOwnershipBanner

- **État actuel:** Ne s'affiche pas (conditionné par `job.contractee`)
- **Comportement attendu:** Affiche un bandeau avec le statut d'ownership (Créateur vs Exécutant)

### 3. JobAssignmentActions

- **État actuel:** Boutons Accept/Decline invisibles
- **Comportement attendu:** Affiche les boutons d'acceptation/refus si `permissions.can_accept` ou `can_decline`

---

## 🎯 Données à Ajouter

### Endpoint: `GET /v1/job/{jobCode}/full`

Ajouter les champs suivants dans l'objet `job` de la réponse :

```json
{
  "success": true,
  "data": {
    "job": {
      // ... champs existants ...

      // ✅ Nouveaux champs à ajouter
      "assignment_status": "none", // "none" | "pending" | "accepted" | "declined"

      "contractee": {
        "company_id": 1, // ID de l'entreprise créatrice
        "company_name": "Swift Movers", // Nom de l'entreprise
        "created_by_user_id": 10, // ID du créateur (optionnel)
        "created_by_name": "John Doe", // Nom du créateur
        "stripe_account_id": "acct_xxx" // Compte Stripe (optionnel)
      },

      "contractor": {
        "company_id": 1, // ID de l'entreprise exécutante
        "company_name": "Swift Movers", // Nom (même si job interne)
        "assigned_staff_id": "5", // ID du staff assigné (optionnel)
        "assigned_staff_name": "Jane Smith", // Nom du staff (optionnel)
        "assigned_at": "2026-01-31T10:00:00Z" // Date d'assignation (optionnel)
      },

      "permissions": {
        "is_owner": true, // L'utilisateur a créé le job
        "is_assigned": false, // L'utilisateur est assigné au job
        "can_accept": false, // Peut accepter le job
        "can_decline": false, // Peut refuser le job
        "can_start": true, // Peut démarrer le job
        "can_complete": false, // Peut terminer le job
        "can_edit": true // Peut modifier le job
      }
    }
  }
}
```

---

## 🧮 Logique Métier Backend

### 1. Déterminer `contractee` (Donneur d'ordre)

```python
# Pseudo-code
contractee = {
    "company_id": job.created_by_company_id,
    "company_name": Company.get(job.created_by_company_id).name,
    "created_by_user_id": job.created_by_user_id,
    "created_by_name": User.get(job.created_by_user_id).full_name,
    "stripe_account_id": Company.get(job.created_by_company_id).stripe_account_id
}
```

### 2. Déterminer `contractor` (Exécutant)

```python
# Cas 1: Job assigné à une autre entreprise
if job.contractor_company_id and job.contractor_company_id != job.created_by_company_id:
    contractor = {
        "company_id": job.contractor_company_id,
        "company_name": Company.get(job.contractor_company_id).name,
        "assigned_staff_id": job.assigned_staff_id,
        "assigned_staff_name": Staff.get(job.assigned_staff_id).full_name if job.assigned_staff_id else None,
        "assigned_at": job.assigned_at
    }

# Cas 2: Job interne (même entreprise)
else:
    contractor = {
        "company_id": job.created_by_company_id,  # MÊME ID que contractee
        "company_name": Company.get(job.created_by_company_id).name,
        "assigned_staff_id": job.assigned_staff_id,
        "assigned_staff_name": Staff.get(job.assigned_staff_id).full_name if job.assigned_staff_id else None,
        "assigned_at": job.assigned_at
    }
```

### 3. Déterminer `assignment_status`

```python
if not job.contractor_company_id or job.contractor_company_id == job.created_by_company_id:
    assignment_status = "none"  # Job interne, pas d'assignation externe
elif job.accepted_at:
    assignment_status = "accepted"
elif job.declined_at:
    assignment_status = "declined"
elif job.assigned_at:
    assignment_status = "pending"
else:
    assignment_status = "none"
```

### 4. Calculer `permissions`

```python
current_user_company_id = get_current_user().company_id
current_user_id = get_current_user().id

permissions = {
    "is_owner": job.created_by_user_id == current_user_id,
    "is_assigned": job.assigned_staff_id == current_user_id,
    "can_accept": (
        job.contractor_company_id == current_user_company_id and
        job.assignment_status == "pending" and
        not job.is_owner
    ),
    "can_decline": (
        job.contractor_company_id == current_user_company_id and
        job.assignment_status == "pending" and
        not job.is_owner
    ),
    "can_start": (
        job.status == "pending" or job.status == "accepted"
    ) and (permissions["is_owner"] or permissions["is_assigned"]),
    "can_complete": (
        job.status == "in-progress"
    ) and (permissions["is_owner"] or permissions["is_assigned"]),
    "can_edit": permissions["is_owner"] or permissions["is_assigned"]
}
```

---

## 🧪 Scénarios de Test

### Scénario 1: Job Interne (Même Entreprise)

**Données:**

- `created_by_company_id = 1` (Swift Movers)
- `contractor_company_id = 1` (même entreprise)
- `assigned_staff_id = 5` (Jane Smith)

**Réponse attendue:**

```json
{
  "assignment_status": "none",
  "contractee": {
    "company_id": 1,
    "company_name": "Swift Movers",
    "created_by_name": "John Doe"
  },
  "contractor": {
    "company_id": 1, // ← MÊME ID
    "company_name": "Swift Movers",
    "assigned_staff_name": "Jane Smith"
  }
}
```

**Rendu Frontend:**

- Panel Summary/Job : 1 seule section "Entreprise" (pas de duplication)
- JobOwnershipBanner : Affiche "Job Interne"

---

### Scénario 2: Job Multi-Entreprise (Assignment)

**Données:**

- `created_by_company_id = 1` (Swift Movers)
- `contractor_company_id = 2` (ABC Logistics)
- `assigned_staff_id = 10` (Marie Dupont)
- `assignment_status = "pending"`

**Réponse attendue:**

```json
{
  "assignment_status": "pending",
  "contractee": {
    "company_id": 1,
    "company_name": "Swift Movers",
    "created_by_name": "John Doe"
  },
  "contractor": {
    "company_id": 2, // ← ID DIFFÉRENT
    "company_name": "ABC Logistics",
    "assigned_staff_name": "Marie Dupont"
  },
  "permissions": {
    "can_accept": true, // Si current_user de ABC Logistics
    "can_decline": true
  }
}
```

**Rendu Frontend:**

- Panel Summary/Job : 2 sections distinctes (bordure verte + bleue)
- JobOwnershipBanner : Affiche "Créé par Swift Movers • Assigné à ABC Logistics"
- JobAssignmentActions : Boutons Accept/Decline visibles (si user de ABC)

---

### Scénario 3: Job Accepté

**Données:**

- Même que Scénario 2
- `assignment_status = "accepted"`

**Réponse attendue:**

```json
{
  "assignment_status": "accepted",
  "permissions": {
    "can_accept": false, // Déjà accepté
    "can_decline": false,
    "can_start": true
  }
}
```

**Rendu Frontend:**

- JobOwnershipBanner : Badge "ACCEPTÉ" en vert
- JobAssignmentActions : Boutons Accept/Decline invisibles
- Actions de démarrage disponibles

---

## 📊 Priorité et Impact

| Fonctionnalité Frontend       | Sans Données Backend | Avec Données Backend | Priorité |
| ----------------------------- | -------------------- | -------------------- | -------- |
| CompanyDetailsSection         | ❌ Invisible         | ✅ Visible           | 🔴 Haute |
| JobOwnershipBanner            | ❌ Invisible         | ✅ Visible           | 🔴 Haute |
| JobAssignmentActions          | ❌ Invisible         | ✅ Visible           | 🔴 Haute |
| Distinction Job Interne/Multi | ❌ Impossible        | ✅ Automatique       | 🔴 Haute |

---

## ✅ Checklist Backend

- [ ] Ajouter `assignment_status` dans la réponse
- [ ] Ajouter objet `contractee` avec tous les champs
- [ ] Ajouter objet `contractor` avec tous les champs
- [ ] Ajouter objet `permissions` avec calculs de droits
- [ ] Gérer le cas job interne (`company_id` identique)
- [ ] Gérer le cas job multi-entreprise (`company_id` différent)
- [ ] Tester avec Scénario 1 (job interne)
- [ ] Tester avec Scénario 2 (job pending assignment)
- [ ] Tester avec Scénario 3 (job accepté)
- [ ] Vérifier que les types TypeScript correspondent (jobs.ts lignes 36-60)

---

## 🔗 Fichiers Frontend Concernés

| Fichier                                                        | Impact                                       |
| -------------------------------------------------------------- | -------------------------------------------- |
| `src/services/jobs.ts`                                         | Types TypeScript déjà définis (lignes 36-60) |
| `src/components/jobDetails/sections/CompanyDetailsSection.tsx` | Retourne `null` si pas de données            |
| `src/components/jobs/JobOwnershipBanner.tsx`                   | Ne s'affiche pas si `!job.contractee`        |
| `src/components/jobs/JobAssignmentActions.tsx`                 | Ne s'affiche pas si `!permissions`           |
| `src/screens/JobDetailsScreens/summary.tsx`                    | Utilise CompanyDetailsSection                |
| `src/screens/JobDetailsScreens/job.tsx`                        | Utilise CompanyDetailsSection                |

---

## 📝 Documentation Frontend

- [JOB_OWNERSHIP_BACKEND_SUMMARY.md](./JOB_OWNERSHIP_BACKEND_SUMMARY.md) - Résumé complet backend
- [JOB_OWNERSHIP_REQUIREMENTS.md](./JOB_OWNERSHIP_REQUIREMENTS.md) - Spécifications détaillées
- [JOB_DETAILS_AUDIT.md](./JOB_DETAILS_AUDIT.md) - Audit complet de la page
- [COMPANY_DETAILS_SECTION_GUIDE.md](./COMPANY_DETAILS_SECTION_GUIDE.md) - Guide du composant

---

**Créé par:** GitHub Copilot  
**Date:** 1er février 2026  
**Contact:** Frontend prêt, en attente des données backend
