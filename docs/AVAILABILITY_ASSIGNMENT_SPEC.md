# Disponibilité & Affectation des ressources — Spécification Fonctionnelle et Technique

> **Date :** 04/03/2026
> **Auteur :** Romain Giovanni — Slashforyou
> **Statut :** Spécification — À implémenter
> **Dépendances :** `JOB_TRANSFER_SPEC.md` (système de délégation B2B — déjà déployé)

---

## Table des matières

1. [Décomposition du problème](#1-décomposition-du-problème)
2. [Les trois scénarios d'affectation](#2-les-trois-scénarios-daffectation)
3. [Solution retenue — Requête générale + confirmation en cascade](#3-solution-retenue)
4. [Modèle de données](#4-modèle-de-données)
5. [Concept de disponibilité — le slot](#5-concept-de-disponibilité--le-slot)
6. [Flux complet par scénario](#6-flux-complet-par-scénario)
7. [États & transitions par entité](#7-états--transitions-par-entité)
8. [Endpoints API nécessaires](#8-endpoints-api-nécessaires)
9. [UI — Parcours par acteur](#9-ui--parcours-par-acteur)
10. [Règles métier](#10-règles-métier)
11. [Plan d'implémentation par phases](#11-plan-dimplémentation-par-phases)
12. [Scalabilité & architecture long terme](#12-scalabilité--architecture-long-terme)

---

## 1. Décomposition du problème

### Les acteurs

Un job implique jusqu'à **4 niveaux d'acteurs indépendants**, chacun avec ses propres ressources et contraintes :

```
┌──────────────────────────────────────────────────────────────────┐
│  NIVEAU 1 — Entreprise A (cédante / donneur d'ordre)            │
│  Rôle : possède le client, crée et facture le job               │
│  Ressources : aucune requise (ou ses propres si job interne)    │
└──────────────────────────┬───────────────────────────────────────┘
                           │  job_transfer  (déjà implémenté)
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  NIVEAU 2 — Entreprise B (cessionnaire / exécutante)            │
│  Rôle : accepte le job, possède le camion, orchestre l'équipe   │
│  Ressources : trucks, staff (salariés + prestataires)           │
└──────────┬──────────────────────────────────┬────────────────────┘
           │ job_assignment                   │ job_assignment
           ▼                                  ▼
┌──────────────────────────┐    ┌─────────────────────────────────┐
│  NIVEAU 3A — Chauffeur   │    │  NIVEAU 3B — Offsider           │
│  Prestataire ou salarié  │    │  Prestataire ou salarié         │
│  Doit confirmer sa dispo │    │  Doit confirmer sa dispo        │
└──────────────────────────┘    └─────────────────────────────────┘

(+ le camion lui-même, qui est une ressource passée, confirmée par l'Entreprise B)
```

### Les ressources à affecter

| Ressource                   | Propriétaire habituel                | Contrainte principale                      |
| --------------------------- | ------------------------------------ | ------------------------------------------ |
| **Camion** (truck)          | Entreprise B                         | Peut être sur un autre job au même créneau |
| **Chauffeur** (driver)      | Prestataire indépendant ou salarié B | Peut être sur un autre job ou indisponible |
| **Offsider**                | Prestataire indépendant ou salarié B | Idem chauffeur                             |
| **Superviseur** (optionnel) | Salarié B                            | Idem                                       |

### Le problème central

> **Comment s'assurer que les ressources assignées à un job sont disponibles au bon créneau, et que chaque partie concernée a confirmé sa participation ?**

Il n'existe pas de solution triviale car :

- On ne peut pas forcer une confirmation instantanée (la vie réelle est asynchrone)
- Les créneaux horaires d'un job ont des fenêtres (`start_window_start` → `end_window_end`), pas des horaires fixes
- Un prestataire peut travailler pour plusieurs entreprises en parallèle — l'Entreprise B ne sait pas toujours s'il est libre
- Un camion peut être loané ou partagé entre équipes
- Les conflits ne sont détectables que si toutes les affectations passent par le même système

---

## 2. Les trois scénarios d'affectation

### Scénario A — Sélection atomique (granulaire)

L'entreprise A choisit elle-même, lors de la création du `job_transfer`, exactement quelles ressources elle demande :

```
Entreprise A : "Je veux UN chauffeur + UN offsider + UN camion 20m³ pour le 10/03 entre 8h et 12h"
Entreprise B : vérifie si elle peut fournir ça, répond oui/non/contre-proposition
```

**Avantages :** contrôle maximal côté A, pas d'ambiguïté sur ce qui est demandé
**Inconvénients :** A doit connaître le catalogue de B, la granularité crée de la friction, B peut ne pas avoir exactement ça

---

### Scénario B — Sélection en pack (bundle)

L'entreprise B expose des **bundles pré-configurés** : `Camion X + Chauffeur Y + Offsider Z` formant une unité réservable. A choisit un bundle disponible.

```
Entreprise A voit : "Pack Standard — Isuzu FRR + Jean D. + Marc L.  ✅ disponible le 10/03"
```

**Avantages :** simplicité pour A, disponibilité calculée d'un seul coup
**Inconvénients :** B doit maintenir ses bundles à jour, peu flexible si quelqu'un est absent

---

### Scénario C — Requête générale ✅ RETENU (Phase 1)

L'entreprise A envoie une demande de service **sans préciser les ressources** — seulement le rôle (chauffeur seul, offsider seul, job entier) et le créneau. L'Entreprise B se débrouille en interne pour affecter les bonnes personnes, et **chaque ressource confirme individuellement**.

```
Entreprise A : "J'ai besoin d'un chauffeur + offsider pour le 10/03, créneau 8h–12h, forfait 400$"
Entreprise B : accepte le transfer, puis assigne camion + chauffeur + offsider en interne
Chauffeur Jean : reçoit une notification → confirme ou décline
Offsider Marc : idem
→ Quand tous ont confirmé, A est notifiée "Job entièrement pourvu"
```

**Pourquoi ce scénario en premier :**

- S'appuie sur le système `job_transfers` déjà déployé — pas de refonte
- Respecte l'autonomie de l'Entreprise B (elle sait mieux que A ce qu'elle peut faire)
- Corresponds au réel : les entreprises de déménagement ne publient pas de catalogue temps réel
- Extensible vers A et B sans rupture de modèle
- La confirmation individuelle prépare nativement les scénarios A et B futurs

---

## 3. Solution retenue

### Principe : deux niveaux de confirmation indépendants

```
NIVEAU 1 — Inter-entreprises (déjà implémenté dans job_transfers)
────────────────────────────────────────────────────────────────
Entreprise A  ──[transfer pending]──►  Entreprise B
                                       Entreprise B accepte ou declining

NIVEAU 2 — Intra-Entreprise B (À IMPLÉMENTER)
────────────────────────────────────────────────────────────────
Entreprise B  ──[assignment pending]──►  Camion X    → confirmation auto (bien que B)
Entreprise B  ──[assignment pending]──►  Chauffeur Y → notification push → confirmation
Entreprise B  ──[assignment pending]──►  Offsider Z  → notification push → confirmation
```

### Invariants du design

1. **Le `job_transfer` reste la seule unité visible côté A** — A ne voit jamais les affectations internes de B sauf si B les expose explicitement
2. **Chaque ressource est une entité indépendante** avec son propre cycle de confirmation
3. **La disponibilité est calculée à la demande** depuis les affectations existantes, pas stockée comme un "calendrier" (pas de slot pre-rempli)
4. **Les conflits sont détectés, jamais bloquants d'office** — on avertit, B décide si elle gère le conflit
5. **Tout est traçable** — qui a affecté quoi, quand, avec quel statut

---

## 4. Modèle de données

### 4.1 Nouvelle table `job_assignments`

C'est la table centrale du système. Elle lie **une ressource** (staff ou véhicule) **à un job**, avec un statut de confirmation individuel.

```sql
CREATE TABLE job_assignments (
    id                      INT AUTO_INCREMENT PRIMARY KEY,

    -- Contexte job
    job_id                  INT NOT NULL,
    job_transfer_id         INT NULL,               -- nil si affectation interne (pas via transfer)

    -- Entreprise qui fait l'affectation
    assigned_by_company_id  INT NOT NULL,

    -- La ressource affectée
    resource_type           ENUM('staff', 'vehicle') NOT NULL,
    resource_id             INT NOT NULL,           -- staff.id OU trucks.id

    -- Rôle joué sur ce job
    role                    ENUM(
                                'driver',
                                'offsider',
                                'supervisor',
                                'vehicle'           -- le camion lui-même
                            ) NOT NULL,

    -- Cycle de confirmation
    status                  ENUM(
                                'pending',          -- en attente de confirmation
                                'confirmed',        -- accepté
                                'declined',         -- refusé (une autre ressource sera cherchée)
                                'cancelled',        -- annulé par B avant confirmation
                                'replaced'          -- remplacé par une autre ressource
                            ) NOT NULL DEFAULT 'pending',

    -- Timestamps clés (5 max)
    confirmed_at            DATETIME NULL,          -- quand la ressource a confirmé
    declined_at             DATETIME NULL,          -- quand la ressource a décliné
    notified_at             DATETIME NULL,          -- quand la notif push a été envoyée
    created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Traçabilité
    decline_reason          TEXT NULL,
    assigned_by_user_id     INT NOT NULL,

    -- Intégrité
    FOREIGN KEY (job_id)                REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (job_transfer_id)       REFERENCES job_transfers(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by_company_id) REFERENCES companies(id),
    FOREIGN KEY (assigned_by_user_id)   REFERENCES users(id)
);

-- Index pour les requêtes de disponibilité (hot path)
CREATE INDEX idx_ja_resource        ON job_assignments(resource_type, resource_id, status);
CREATE INDEX idx_ja_job             ON job_assignments(job_id);
CREATE INDEX idx_ja_company         ON job_assignments(assigned_by_company_id);
CREATE INDEX idx_ja_transfer        ON job_assignments(job_transfer_id);
CREATE INDEX idx_ja_status          ON job_assignments(status);
```

> **Note :** Cette table remplace progressivement `job_trucks`, `job_truck_users`, et `job_users` (qui restent actifs en phase 1 pour la compatibilité ascendante). La migration se fait en deux phases.

---

### 4.2 Extension de `jobs`

```sql
-- Statut global de staffing du job (calculé / dénormalisé pour performance)
ALTER TABLE jobs ADD COLUMN staffing_status ENUM(
    'unassigned',       -- aucune ressource affectée
    'partial',          -- certaines ressources confirmées, pas toutes
    'fully_staffed',    -- toutes les ressources requises ont confirmé
    'conflict'          -- au moins une ressource a un conflit détecté
) NOT NULL DEFAULT 'unassigned';

-- Nombre de ressources requises (défini lors du job_transfer ou à la création)
ALTER TABLE jobs ADD COLUMN required_driver    TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE jobs ADD COLUMN required_offsider  TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE jobs ADD COLUMN required_vehicle   TINYINT(1) NOT NULL DEFAULT 1;
```

---

### 4.3 Extension de `job_transfers`

```sql
-- Préciser combien de ressources sont demandées dans le transfer
ALTER TABLE job_transfers ADD COLUMN requested_drivers    TINYINT NOT NULL DEFAULT 1;
ALTER TABLE job_transfers ADD COLUMN requested_offsiders  TINYINT NOT NULL DEFAULT 0;
ALTER TABLE job_transfers ADD COLUMN requested_vehicles   TINYINT NOT NULL DEFAULT 1;
-- Notes sur les exigences spéciales (ex: "camion avec lift gate", "chauffeur bilingue")
ALTER TABLE job_transfers ADD COLUMN resource_requirements TEXT NULL;
```

---

### 4.4 Types TypeScript frontend

```typescript
// src/types/jobAssignment.ts

export type AssignmentResourceType = "staff" | "vehicle";

export type AssignmentRole = "driver" | "offsider" | "supervisor" | "vehicle";

export type AssignmentStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "replaced";

export type StaffingStatus =
  | "unassigned"
  | "partial"
  | "fully_staffed"
  | "conflict";

export interface JobAssignment {
  id: number;
  job_id: number;
  job_transfer_id: number | null;
  assigned_by_company_id: number;
  resource_type: AssignmentResourceType;
  resource_id: number;
  role: AssignmentRole;
  status: AssignmentStatus;
  confirmed_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  assigned_by_user_id: number;
  notified_at: string | null;
  created_at: string;
  updated_at: string;

  // Données jointes (dans les réponses API enrichies)
  resource?: StaffResource | VehicleResource;
  assigned_by_user?: { firstName: string; lastName: string };
  conflict?: AvailabilityConflict | null;
}

export interface StaffResource {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  type: "employee" | "contractor";
  company_id: number | null;
}

export interface VehicleResource {
  id: number;
  name: string;
  license_plate: string;
  capacity: string;
  company_id: number;
}

export interface AvailabilityConflict {
  conflicting_job_id: number;
  conflicting_job_code: string;
  overlap_start: string;
  overlap_end: string;
}

export interface ResourceAvailability {
  resource_type: AssignmentResourceType;
  resource_id: number;
  is_available: boolean;
  conflicts: AvailabilityConflict[];
}

export interface CreateJobAssignmentRequest {
  resource_type: AssignmentResourceType;
  resource_id: number;
  role: AssignmentRole;
}

export interface RespondToAssignmentRequest {
  action: "confirm" | "decline";
  decline_reason?: string;
}
```

---

## 5. Concept de disponibilité — le slot

### Définition

Une ressource est **disponible** pour le créneau d'un job si elle n'a **aucune affectation active** (status = `pending` ou `confirmed`) sur un autre job dont la fenêtre temporelle chevauche celle du job concerné.

```
Fenêtre du job A :  |----[8h-12h]-------|
Fenêtre du job B :       |------[10h-14h]---------|
                              ↑ CONFLIT (overlap = 10h–12h)

Fenêtre du job C :                         |----[13h-17h]--|
                                                ✅ LIBRE
```

### Requête de disponibilité (SQL)

```sql
-- Est-ce que truck #5 est disponible pour le job #42 ?
SELECT ja.id, j.code, j.start_window_start, j.end_window_end
FROM job_assignments ja
JOIN jobs j ON j.id = ja.job_id
WHERE ja.resource_type = 'vehicle'
  AND ja.resource_id   = 5                -- truck_id
  AND ja.status        IN ('pending', 'confirmed')
  AND ja.job_id        != 42              -- exclure le job lui-même
  AND j.start_window_start < (SELECT end_window_end   FROM jobs WHERE id = 42)
  AND j.end_window_end     > (SELECT start_window_start FROM jobs WHERE id = 42);
-- Résultat vide = disponible
```

### Performance

- Cette requête utilise l'index `idx_ja_resource` + les index sur `jobs.start_window_start` et `jobs.end_window_end` (déjà indexés).
- Pour une flotte de 100 camions et 1 000 jobs actifs, le temps de réponse est < 10 ms.
- Au-delà de 10 000 jobs actifs : envisager un cache Redis avec invalidation sur `INSERT/UPDATE job_assignments`.

### Sémantique "non bloquante"

La disponibilité est **informationnelle, pas restrictive** en phase 1 :

| Situation                                                      | Comportement système                                                                |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Ressource **disponible**                                       | Affectation créée directement (`pending`)                                           |
| Ressource **potentiellement occupée** (pending ailleurs)       | Avertissement visible par B, mais affectation autorisée                             |
| Ressource **confirmée sur un autre job**                       | Avertissement rouge, B doit confirmer explicitement l'intention de créer un conflit |
| Ressource **confirmée + conflit critique** (même heure exacte) | Blocage optionnel (paramètre entreprise en phase 3)                                 |

---

## 6. Flux complet par scénario

### Flux principal — Requête générale (Scénario C)

```
Entreprise A                    Entreprise B                   Ressources (staff + camion)
─────────────                   ────────────                   ──────────────────────────
[Crée le job]
     │
     ▼
[Envoie job_transfer]
  role: "full_job"
  créneau: 10/03 8h–12h
  montant: 400$
     │
     └──────────────────────────────►
                                [Reçoit notification]
                                     │
                                     ▼
                                [Consulte le job]
                                Voit le créneau, les adresses
                                     │
                                     ▼
                                [Accepte le transfer]
                                job_transfers.status = 'accepted'
                                     │
[Notifiée "Job accepté par B"] ◄─────┘
                                     │
                                     ▼
                                [Ouvre le job — onglet "Job"]
                                Voit section "Affecter les ressources"
                                     │
                                     ├── Assigne Camion X ──────────────────►
                                     │   job_assignments (vehicle, confirmed) [auto-confirmé]
                                     │
                                     ├── Assigne Chauffeur Jean ────────────►
                                     │   job_assignments (driver, pending)
                                     │                                    [Reçoit notif push]
                                     │                                         │
                                     │                                         ▼
                                     │                                    [Consulte demande]
                                     │                                    Voit job, créneau, tarif
                                     │                                         │
                                     │                                    [Confirme] ──────────────►
                                     │                                    job_assignment.status = confirmed
                                     │                                         │
                                     ├── Assigne Offsider Marc ─────────────► │
                                     │   job_assignments (offsider, pending)   │
                                     │                                    [Marc confirme aussi]
                                     │
                                     ▼
                                staffing_status = 'fully_staffed'
[Notifiée "Job entièrement     ◄─────────────────────────────────────────────
pourvu — Chauffeur Jean,
Offsider Marc, Camion X"]
```

---

### Flux déclin ressource — remplacement

```
Chauffeur Jean décline
     │
     ▼
job_assignments[Jean].status = 'declined'
jobs.staffing_status = 'partial'  (ou conflict)
     │
     ▼
Entreprise B reçoit notification "Jean a décliné le job #42"
     │
     ▼
B assigne Chauffeur Paul à la place
job_assignments[Jean].status reste 'declined' (traçabilité)
job_assignments[Paul].status = 'pending'
     │
     ▼
Paul confirme → staffing_status = 'fully_staffed'
```

---

## 7. États & transitions par entité

### 7.1 Camion (vehicle)

```
(non assigné)
      │
      └── [POST assignment] ──► confirmed   [auto — B possède le camion, pas besoin de notif]
                                    │
                                    ├── [B annule]       ──► cancelled
                                    └── [conflit détecté] ──► conflict (warning only, status reste confirmed)
```

### 7.2 Chauffeur / Offsider (staff)

```
(non assigné)
      │
      └── [POST assignment] ──► pending
                                    │
                                    ├── [push notif envoyée → confirme]  ──► confirmed
                                    ├── [push notif envoyée → décline]   ──► declined
                                    ├── [B annule avant confirmation]    ──► cancelled
                                    └── [B remplace par autre personne]  ──► replaced
```

### 7.3 Job — staffing_status

```
unassigned
    │
    └── [première assignment créée]        ──► partial
                                                   │
                                                   ├── [toutes ressources required confirmées] ──► fully_staffed
                                                   ├── [au moins un conflit détecté]           ──► conflict
                                                   └── [assignment déclinée / annulée]         ──► partial (recalcul)
```

---

## 8. Endpoints API nécessaires

### Base path : `/v1/jobs/:jobId/assignments`

---

#### `GET /v1/jobs/:jobId/assignments`

Liste toutes les affectations du job avec statuts.

**Réponse 200 :**

```json
{
  "data": [
    {
      "id": 1,
      "resource_type": "vehicle",
      "resource_id": 5,
      "role": "vehicle",
      "status": "confirmed",
      "resource": { "id": 5, "name": "Isuzu FRR", "license_plate": "XYZ-123" }
    },
    {
      "id": 2,
      "resource_type": "staff",
      "resource_id": 12,
      "role": "driver",
      "status": "pending",
      "resource": { "firstName": "Jean", "lastName": "Dupont", "phone": "..." },
      "conflict": null
    }
  ],
  "staffing_status": "partial",
  "required": { "driver": 1, "offsider": 0, "vehicle": 1 },
  "confirmed": { "driver": 0, "offsider": 0, "vehicle": 1 }
}
```

---

#### `POST /v1/jobs/:jobId/assignments`

Créer une affectation. Accessible par `assigned_by_company_id` = company du job (ou contractor de la company).

**Body :**

```json
{
  "resource_type": "staff",
  "resource_id": 12,
  "role": "driver"
}
```

**Comportement :**

1. Vérifie la disponibilité → ajoute `conflict` dans la réponse si problème (mais ne bloque pas)
2. Crée l'enregistrement `job_assignments`
3. Si `resource_type = vehicle` → `status = confirmed` immédiatement
4. Si `resource_type = staff` → `status = pending` + envoie notification push
5. Recalcule `jobs.staffing_status`

**Réponse 201 :**

```json
{
  "success": true,
  "data": {
    /* job_assignment complet */
  },
  "conflict": null,
  "staffing_status": "partial"
}
```

**Erreurs :**

- `403` — L'appelant n'appartient pas à l'entreprise assignante
- `409` — Cette ressource est déjà affectée en `pending`/`confirmed` sur ce job
- `422` — `resource_id` invalide ou n'appartient pas à la company

---

#### `DELETE /v1/jobs/:jobId/assignments/:assignmentId`

Annuler une affectation (avant confirmation). Accessible par la company assignante.

---

#### `PATCH /v1/jobs/:jobId/assignments/:assignmentId/respond`

Le staff répond à sa demande d'affectation.

**Body :**

```json
{ "action": "confirm" }
// ou
{ "action": "decline", "decline_reason": "Je suis déjà pris ce jour-là" }
```

**Comportement si `confirm` :**

- `status → confirmed`
- Notifie l'Entreprise B
- Recalcule `staffing_status`
- Si `fully_staffed` : notifie Entreprise A

**Comportement si `decline` :**

- `status → declined`
- Notifie l'Entreprise B "Jean a décliné, cherchez un remplacement"

---

#### `GET /v1/companies/:companyId/resources/availability`

**Calculer la disponibilité de toutes les ressources d'une entreprise pour un créneau donné.**

**Paramètres query :** `start_at`, `end_at`, `resource_type` (optionnel)

**Réponse 200 :**

```json
{
  "data": {
    "vehicles": [
      { "id": 5, "name": "Isuzu FRR", "is_available": true, "conflicts": [] },
      {
        "id": 6,
        "name": "Mercedes Sprinter",
        "is_available": false,
        "conflicts": [
          {
            "conflicting_job_id": 38,
            "overlap_start": "...",
            "overlap_end": "..."
          }
        ]
      }
    ],
    "staff": [
      { "id": 12, "firstName": "Jean", "is_available": true, "conflicts": [] },
      { "id": 14, "firstName": "Marc", "is_available": true, "conflicts": [] }
    ]
  }
}
```

---

#### `GET /v1/users/me/assignments`

Toutes les affectations `pending` de l'utilisateur connecté — utilisé pour la liste "Jobs à confirmer".

---

## 9. UI — Parcours par acteur

### 9.1 Entreprise B — Après avoir accepté un transfer

Dans l'onglet **"Job"** de la fiche job, une nouvelle section apparaît **"Equipe & Véhicule"** (remplace/étend l'actuelle section crew).

```
┌─────────────────────────────────────────────────────────┐
│  📋  ÉQUIPE & VÉHICULE                    [+ Affecter]  │
│  Statut : ⏳ Partiellement pourvu                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🚛  Véhicule                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Isuzu FRR  · XYZ-123              ✅ Confirmé  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  👤  Chauffeur                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Jean Dupont                      ⏳ En attente  │   │
│  │  Notifié il y a 5 min             [🔔 Rappel]   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  👤  Offsider                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  (non assigné)                                  │   │
│  │  Pas requis pour ce job  [Ajouter quand même]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Bouton [+ Affecter]** ouvre un bottom sheet `AssignResourceModal` :

```
┌─────────────────────────────────────────────────────────┐
│  ✕   Affecter une ressource              Créneau: 8h–12h│
├─────────────────────────────────────────────────────────┤
│  TYPE                                                   │
│  [ 🚛 Véhicule ]  [ 👤 Chauffeur ]  [ 👥 Offsider ]    │
├─────────────────────────────────────────────────────────┤
│  RESSOURCES DISPONIBLES                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │ ✅ Isuzu FRR · XYZ-123                           │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ ⚠️ Mercedes Sprinter · déjà sur job #38  10h–12h  │  │
│  │    [Affecter quand même]                          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  RESSOURCES NON DISPONIBLES (occupées)                  │
│  ─────────────────────────────────────────────────────  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 🔴 Toyota Hilux · job #40 (8h–14h)               │  │
│  └───────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                 [ Affecter ]                            │
└─────────────────────────────────────────────────────────┘
```

---

### 9.2 Chauffeur / Offsider — Notification et confirmation

**Push notification reçue :**

```
🚛 Nouveau job — Jean Dupont
ABC Removals vous propose un job le 10/03 de 8h à 12h
321 Collins St → 48 Bridge Rd  |  Chauffeur
```

**Deep link** → page "Jobs à confirmer" ou directement la fiche du job

**Fiche de confirmation (page dédiée ou bottom sheet) :**

```
┌─────────────────────────────────────────────────────────┐
│  📩  Demande d'affectation                              │
│  De : ABC Removals — Entreprise B                       │
├─────────────────────────────────────────────────────────┤
│  📅  10 mars 2026  ·  8h00 – 12h00                     │
│  📍  321 Collins St → 48 Bridge Rd, Melbourne           │
│  🎯  Rôle : Chauffeur                                   │
│  💰  Inclus dans le forfait job / ou X$/h               │
├─────────────────────────────────────────────────────────┤
│    [ ✗ Décliner ]          [ ✓ Confirmer ]             │
└─────────────────────────────────────────────────────────┘
```

---

### 9.3 Entreprise A — Vue de l'avancement du staffing

Dans la section **Summary** du job (en plus du bandeau transfer déjà existant) :

```
┌─────────────────────────────────────────────────────────┐
│  ⏳  Équipe en cours de constitution                    │
│  Par : ABC Removals                                     │
│  📊  Véhicule ✅  ·  Chauffeur ⏳  ·  Offsider ─       │
└─────────────────────────────────────────────────────────┘
```

Quand `fully_staffed` :

```
┌─────────────────────────────────────────────────────────┐
│  ✅  Équipe constituée                                  │
│  🚛 Isuzu FRR  ·  👤 Jean D. (chauffeur)               │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Règles métier

| #   | Règle                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------- |
| R1  | Seule l'entreprise cessionnaire (Entreprise B) peut créer des `job_assignments` sur un job qu'elle a accepté              |
| R2  | Un véhicule est auto-confirmé lors de l'affectation (pas besoin de notification — B contrôle ses camions)                 |
| R3  | Un staff membre reçoit toujours une notification avant d'être considéré confirmé                                          |
| R4  | Un staff peut seulement répondre à ses propres affectations                                                               |
| R5  | Un conflit (chevauchement) est affiché comme avertissement, jamais comme blocage en phase 1                               |
| R6  | `staffing_status = 'fully_staffed'` déclenche une notification vers Entreprise A                                          |
| R7  | Si un staff décline, son affectation passe `declined` mais n'est pas supprimée (traçabilité)                              |
| R8  | L'Entreprise A ne voit que le `staffing_status` agrégé, pas les détails individuels des ressources de B (confidentialité) |
| R9  | Un `job_assignment` ne peut pas être créé si `job.status` est `completed` ou `cancelled`                                  |
| R10 | Quand un `job_transfer` est annulé ou décliné, tous les `job_assignments` associés passent à `cancelled` automatiquement  |
| R11 | Un staff affilé à aucune company (freelance) peut recevoir des affectations de n'importe quelle company                   |
| R12 | La disponibilité est calculée sur la fenêtre complète `start_window_start → end_window_end` (worst case)                  |

---

## 11. Plan d'implémentation par phases

### Phase 1 — Fondation (MVP) — Recommandée maintenant

**Objectif :** Permettre à l'Entreprise B d'affecter ses ressources après acceptation du transfer, avec confirmation individuelle du staff.

**Backend :**

- [ ] Migration SQL — table `job_assignments`
- [ ] Migration SQL — colonnes `staffing_status`, `required_driver/offsider/vehicle` sur `jobs`
- [ ] Endpoint `GET /v1/jobs/:jobId/assignments`
- [ ] Endpoint `POST /v1/jobs/:jobId/assignments`
- [ ] Endpoint `DELETE /v1/jobs/:jobId/assignments/:id`
- [ ] Endpoint `PATCH /v1/jobs/:jobId/assignments/:id/respond`
- [ ] Calcul automatique de `staffing_status` à chaque mutation
- [ ] Notification push sur affectation staff (template `staffAssigned`)
- [ ] Notification push vers A quand `fully_staffed` (template `jobFullyStaffed`)

**Frontend :**

- [ ] `src/types/jobAssignment.ts` — types TypeScript
- [ ] `src/services/jobAssignments.ts` — service API
- [ ] `src/components/modals/AssignResourceModal/` — sélecteur de ressource avec dispo
- [ ] `src/screens/JobDetailsScreens/job.tsx` — section "Équipe & Véhicule" (remplace crew actuel)
- [ ] `src/screens/JobDetailsScreens/summary.tsx` — bandeau `staffing_status` visible A
- [ ] `src/screens/assignments/` — page "Jobs à confirmer" pour le staff

---

### Phase 2 — Bundles & équipes pré-configurées

**Objectif :** L'Entreprise B peut créer des "packs" camion+chauffeur+offsider réutilisables.

**Backend :**

- [ ] Table `resource_bundles` (company_id, name, vehicle_id?, drivers[], offsiders[])
- [ ] Endpoint `GET /v1/companies/:id/bundles` avec disponibilité calculée
- [ ] Endpoint `POST /v1/jobs/:jobId/assignments/bundle/:bundleId`

**Frontend :**

- [ ] Section "Packs" dans `AssignResourceModal` en plus de la sélection individuelle

---

### Phase 3 — Calendrier de disponibilité & blocage optionnel

**Objectif :** Chaque ressource peut signaler ses indisponibilités à l'avance (vacances, entretien camion…).

**Backend :**

- [ ] Table `resource_unavailabilities` (resource_type, resource_id, start_at, end_at, reason)
- [ ] Intégration dans le calcul de disponibilité
- [ ] Paramètre entreprise `block_on_hard_conflict: boolean`

**Frontend :**

- [ ] Calendrier de disponibilité par ressource (section Business > Staff ou Trucks)
- [ ] Indicateur "Indisponible (congés)" dans `AssignResourceModal`

---

### Phase 4 — Sélection granulaire côté A (Scénario A)

**Objectif :** Entreprise A peut préciser exactement les ressources qu'elle veut lors du `job_transfer`.

- Requiert que A connaisse le catalogue de B (exposé via API publique / partage)
- `job_transfers.resource_requirements` devient structuré (JSON de contraintes)
- B peut accepter les ressources proposées par A ou les remplacer

---

## 12. Scalabilité & architecture long terme

### Pourquoi ce modèle est scalable

1. **Table `job_assignments` universelle** — supporte les 4 phases sans changement de schéma. On ajoute des colonnes optionnelles (bundle_id, etc.), on ne restructure pas.

2. **Disponibilité calculée à la demande** — pas de "calendrier" stocké qui devient stale. La requête SQL est O(assignments actifs) et très rapide avec les bons index.

3. **Séparation stricte des niveaux** — `job_transfers` (inter-entreprises) vs `job_assignments` (intra-entreprise) sont deux systèmes orthogonaux. On peut faire évoluer l'un sans toucher l'autre.

4. **Notifications découplées** — le service de push n'est jamais bloquant dans le chemin critique. Si la notification échoue, l'affectation reste en `pending` et un rappel est envoyé plus tard.

5. **Extensible à N ressources** — `ENUM('driver','offsider','supervisor','vehicle')` peut devenir une table de référence `assignment_roles` sans toucher la logique métier.

6. **Multi-tenant natif** — chaque affectation est toujours scopée par `assigned_by_company_id`. Impossible d'accéder aux ressources d'une autre company par erreur.

### Schéma relationnel global après Phase 2

```
companies ──────────────────────────────────────────────────────────┐
    │                                                               │
    ├── trucks (company_id)                                         │
    │       └── job_assignments (resource_type='vehicle')          │
    │                                                               │
    ├── users → team_members → teams                               │
    │       └── job_assignments (resource_type='staff')            │
    │                                                               │
    └── jobs (contractee_company_id / contractor_company_id)       │
            │                                                       │
            ├── job_transfers ──────────────────────────────────────┘
            │       └── job_assignments (job_transfer_id)
            │
            └── job_assignments (job_id)
                    [staffing_status calculé depuis tous les assignments du job]
```

### Métriques à surveiller en production

| Métrique                                   | Seuil alerte | Action                                                 |
| ------------------------------------------ | ------------ | ------------------------------------------------------ |
| Temps moyen requête disponibilité          | > 100 ms     | Ajouter cache Redis                                    |
| Assignments `pending` > 24h sans réponse   | > 5%         | Activer reminder push automatique                      |
| Taux de déclin ressource                   | > 20%        | UX d'avertissement proactif au moment de l'affectation |
| Jobs `partially_staffed` > 48h avant start | —            | Alerte Entreprise B                                    |

---

## Annexe — Templates de notifications à créer

```typescript
// À ajouter dans src/services/notificationsService.ts

staffAssigned: (jobCode: string, role: string, date: string): NotificationTemplate => ({
  title: `🚛 Nouveau job — ${role}`,
  body: `Vous êtes demandé(e) comme ${role} le ${date}`,
  type: 'job',
  data: { jobCode, action: 'respond_assignment' },
}),

staffConfirmed: (jobCode: string, staffName: string, role: string): NotificationTemplate => ({
  title: `✅ ${staffName} a confirmé`,
  body: `${role} confirmé(e) pour le job ${jobCode}`,
  type: 'job',
  data: { jobCode },
}),

staffDeclined: (jobCode: string, staffName: string, role: string): NotificationTemplate => ({
  title: `❌ ${staffName} a décliné`,
  body: `Cherchez un(e) ${role} de remplacement pour le job ${jobCode}`,
  type: 'job',
  data: { jobCode, action: 'reassign' },
}),

jobFullyStaffed: (jobCode: string, companyName: string): NotificationTemplate => ({
  title: `✅ Équipe constituée`,
  body: `${companyName} a finalisé l'équipe pour le job ${jobCode}`,
  type: 'job',
  data: { jobCode },
}),

assignmentReminder: (jobCode: string, role: string): NotificationTemplate => ({
  title: `⏰ Réponse requise`,
  body: `Vous n'avez pas encore confirmé votre rôle de ${role} sur le job ${jobCode}`,
  type: 'job',
  data: { jobCode, action: 'respond_assignment' },
}),
```

---

_Document créé le 04/03/2026 — Dépend de `JOB_TRANSFER_SPEC.md` (déployé). Prochaine étape : validation métier puis implémentation Phase 1._
