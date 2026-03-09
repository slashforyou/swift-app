# Job Transfer — Spécification Fonctionnelle et Technique

> **Date :** 04/03/2026  
> **Auteur :** Romain Giovanni — Slashforyou  
> **Statut :** Backend déployé — Frontend complet

---

## Todo — Suivi d'implémentation

### Backend (à faire côté serveur)

- [x] Migration SQL — colonne `company_code CHAR(8) UNIQUE` sur `companies` _(migration 013 appliquée)_
- [x] Migration SQL — table `job_transfers` _(migration 014 appliquée)_
- [x] Migration SQL — table `company_relations` _(migration 015 appliquée)_
- [~] Migration SQL — colonne `active_transfer_id` sur `jobs` _(non implémentée — pas essentielle. Remplacée par une requête runtime dans `getJobById.js`. À ajouter uniquement si besoin de perf sur `listJobs`)_
- [x] Endpoint `GET /v1/companies/me` — profil + company_code _(nouveau, non prévu dans la spec initiale)_
- [x] Endpoint `GET /v1/companies/lookup?code=` — lookup par code
- [x] Endpoint `POST /v1/jobs/:jobId/transfers` — créer un transfert
- [x] Endpoint `GET /v1/jobs/:jobId/transfers` — lister les transferts
- [x] Endpoint `PATCH /v1/jobs/:jobId/transfers/:id/respond` — accept/decline
- [x] Endpoint `DELETE /v1/jobs/:jobId/transfers/:id` — annuler
- [x] Endpoint `GET /v1/transfers/incoming` — transferts entrants _(route : `/swift-app/v1/transfers/incoming`)_
- [x] Endpoint `GET /v1/companies/relations` — carnet de relations
- [x] Endpoint `POST /v1/companies/relations` — sauvegarder une relation
- [x] Endpoint `PATCH /v1/companies/relations/:id` — renommer
- [x] Endpoint `DELETE /v1/companies/relations/:id` — supprimer
- [ ] Auto-update `last_used_at` à chaque création de transfert _(non implémenté)_
- [ ] Notifications push sur accept / decline / cancel / receive _(non implémenté)_
- [x] Calcul des permissions `can_create_transfer` / `can_cancel_transfer` / `can_respond_transfer` _(dans `getJobById.js` + `listJobs.js`)_

### Frontend — Fichiers à créer

- [x] `src/types/jobTransfer.ts` — types TypeScript
- [x] `src/services/companyRelations.ts` — service API relations
- [x] `src/services/jobTransfer.ts` — service API transferts
- [x] `src/components/modals/TransferJobModal/CompanyCodeInput.tsx`
- [x] `src/components/modals/TransferJobModal/RelationsCarnet.tsx`
- [x] `src/components/modals/TransferJobModal/index.tsx`
- [x] `src/components/jobDetails/sections/TransferBannerSection.tsx`
- [x] `src/screens/business/RelationsScreen.tsx`

### Frontend — Fichiers à modifier

- [x] `src/services/jobs.ts` — ajouter `active_transfer` dans `JobAPI`
- [x] `src/types/jobSummary.ts` — ajouter `active_transfer` dans `JobSummaryData`
- [x] `src/services/notificationsService.ts` — ajouter templates transfert
- [x] `src/components/business/BusinessTabMenu.tsx` — ajouter tab Relations
- [x] `src/screens/business/index.ts` — exporter `RelationsScreen`
- [x] `src/navigation/business.tsx` — brancher `RelationsScreen`
- [x] `src/screens/JobDetailsScreens/summary.tsx` — injecter `TransferBannerSection`
- [x] `src/screens/jobDetails.tsx` — passer permissions transfer aux enfants

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Modèle de données](#2-modèle-de-données)
3. [Endpoints API](#3-endpoints-api)
4. [UI — Formulaire d'émission (côté cédant)](#4-ui--formulaire-démission-côté-cédant)
5. [UI — Formulaire d'acceptation / refus (côté destinataire)](#5-ui--formulaire-dacceptation--refus-côté-destinataire)
6. [Notifications push & in-app](#6-notifications-push--in-app)
7. [États & transitions](#7-états--transitions)
8. [Règles métier](#8-règles-métier)
9. [Intégration côté frontend existant](#9-intégration-côté-frontend-existant)
10. [Page Carnet de relations (section Business)](#10-page-carnet-de-relations-section-business)

---

## 1. Vue d'ensemble

Une entreprise (la **cédante**) peut déléguer tout ou une partie d'un job à une autre entité (la **cessionnaire**) : une autre entreprise ou un prestataire (contractor).  
La délégation crée un **job transfer** attaché au job parent. Le cessionnaire peut accepter ou refuser. Tant qu'il n'a pas répondu, la cédante peut l'annuler.

### Cinq concepts clés

| Concept                   | Description                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rôle délégué**          | Ce que le cessionnaire devra faire : chauffeur seul, offsider seul, ou le job en entier                                                                                         |
| **Prix de la délégation** | Montant payé par la cédante au cessionnaire — à l'heure ou forfait                                                                                                              |
| **Destinataire**          | L'entreprise ou le prestataire à qui le job est transmis                                                                                                                        |
| **Code entreprise**       | Code unique de 8 caractères (chiffres + lettres majuscules) attribué à chaque entreprise à sa création. Permet de l'identifier de façon non-ambiguë pour initier une délégation |
| **Carnet de relations**   | Liste des entreprises / prestataires déjà utilisés, sauvegardés pour accès rapide lors des prochaines délégations                                                               |

---

## 2. Modèle de données

### 2.1 Nouvelle table `job_transfers`

```sql
CREATE TABLE job_transfers (
    id             SERIAL PRIMARY KEY,
    job_id         INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

    -- Qui cède
    sender_company_id    INTEGER NOT NULL REFERENCES companies(id),
    sender_user_id       INTEGER NOT NULL REFERENCES users(id),

    -- À qui
    recipient_type       VARCHAR(20) NOT NULL CHECK (recipient_type IN ('company', 'contractor')),
    recipient_company_id INTEGER REFERENCES companies(id),    -- si recipient_type = 'company'
    recipient_contractor_id INTEGER REFERENCES contractors(id), -- si recipient_type = 'contractor'

    -- Ce qui est délégué
    delegated_role       VARCHAR(50) NOT NULL,
    -- Valeurs possibles : 'driver', 'offsider', 'full_job', 'custom'
    delegated_role_label VARCHAR(255),  -- Libellé libre si role = 'custom'

    -- Tarification
    pricing_type   VARCHAR(10) NOT NULL CHECK (pricing_type IN ('hourly', 'flat')),
    pricing_amount NUMERIC(10, 2) NOT NULL,
    pricing_currency VARCHAR(3) NOT NULL DEFAULT 'AUD',

    -- État du transfert
    status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),

    -- Métadonnées
    message        TEXT,                          -- Message optionnel de la cédante
    decline_reason TEXT,                          -- Raison refus par le cessionnaire
    responded_at   TIMESTAMP,
    cancelled_at   TIMESTAMP,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_job_transfers_job_id       ON job_transfers(job_id);
CREATE INDEX idx_job_transfers_sender       ON job_transfers(sender_company_id);
CREATE INDEX idx_job_transfers_recipient_co ON job_transfers(recipient_company_id);
CREATE INDEX idx_job_transfers_status       ON job_transfers(status);
```

### 2.2 Code unique d'entreprise

Chaque entreprise possède un `company_code` permanent de **8 caractères** (chiffres et lettres majuscules, ex. `A3FX7KQ2`). Il est généré aléatoirement à la création de l'entreprise, garanti unique, et ne change jamais.

```sql
-- Migration : ajout du code unique sur la table companies
ALTER TABLE companies
    ADD COLUMN company_code CHAR(8) UNIQUE NOT NULL DEFAULT '';

-- Remplir les entreprises existantes (à exécuter une seule fois)
UPDATE companies
SET company_code = upper(substring(md5(random()::text) FROM 1 FOR 8))
WHERE company_code = '';

-- Contrainte définitive
ALTER TABLE companies ALTER COLUMN company_code DROP DEFAULT;
CREATE UNIQUE INDEX idx_companies_code ON companies(company_code);
```

> **Backend :** à la création d'une entreprise, générer un code en boucle jusqu'à obtenir un code non existant (collisions quasi-impossibles à 8 chars alphanumériques = 36^8 ≈ 2,8 milliards de combinaisons).

---

### 2.3 Carnet de relations (`company_relations`)

```sql
CREATE TABLE company_relations (
    id                   SERIAL PRIMARY KEY,
    owner_company_id     INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- L'entité sauvegardée
    related_type         VARCHAR(20) NOT NULL CHECK (related_type IN ('company', 'contractor')),
    related_company_id   INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    related_contractor_id INTEGER REFERENCES contractors(id) ON DELETE CASCADE,

    -- Métadonnées optionnelles
    nickname             VARCHAR(100),   -- Surnom libre (ex : "Déménageurs du Nord")
    last_used_at         TIMESTAMP,      -- Mise à jour à chaque nouveau transfert vers cette entité

    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Unicité : une seule entrée par paire owner / entité
    CONSTRAINT uniq_relation_company
        UNIQUE (owner_company_id, related_company_id),
    CONSTRAINT uniq_relation_contractor
        UNIQUE (owner_company_id, related_contractor_id),
    -- Au moins un des deux doit être renseigné
    CONSTRAINT chk_related_not_null
        CHECK (
            (related_type = 'company'    AND related_company_id    IS NOT NULL) OR
            (related_type = 'contractor' AND related_contractor_id IS NOT NULL)
        )
);

CREATE INDEX idx_relations_owner ON company_relations(owner_company_id);
CREATE INDEX idx_relations_last_used ON company_relations(owner_company_id, last_used_at DESC);
```

---

### 2.4 Modification de la table `jobs`

```sql
-- Indique si le job a un transfert actif
ALTER TABLE jobs ADD COLUMN active_transfer_id INTEGER REFERENCES job_transfers(id);
```

### 2.5 Type TypeScript frontend

```typescript
// src/types/jobTransfer.ts

export type TransferDelegatedRole =
  | "driver"
  | "offsider"
  | "full_job"
  | "custom";

export type TransferPricingType = "hourly" | "flat";

export type TransferStatus = "pending" | "accepted" | "declined" | "cancelled";

export type TransferRecipientType = "company" | "contractor";

export interface JobTransfer {
  id: number;
  job_id: string;

  sender_company_id: number;
  sender_company_name: string;
  sender_user_id: number;

  recipient_type: TransferRecipientType;
  recipient_company_id?: number;
  recipient_company_name?: string;
  recipient_contractor_id?: number;
  recipient_contractor_name?: string;

  delegated_role: TransferDelegatedRole;
  delegated_role_label?: string; // Uniquement si 'custom'

  pricing_type: TransferPricingType;
  pricing_amount: number;
  pricing_currency: string;

  status: TransferStatus;
  message?: string;
  decline_reason?: string;

  responded_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJobTransferRequest {
  recipient_type: TransferRecipientType;
  recipient_company_id?: number;
  recipient_contractor_id?: number;
  delegated_role: TransferDelegatedRole;
  delegated_role_label?: string;
  pricing_type: TransferPricingType;
  pricing_amount: number;
  message?: string;
}

export interface RespondToTransferRequest {
  action: "accept" | "decline";
  decline_reason?: string;
}

// ------------------------------------------
// Types pour le carnet de relations
// ------------------------------------------

export type RelatedEntityType = "company" | "contractor";

export interface CompanyRelation {
  id: number;
  owner_company_id: number;
  related_type: RelatedEntityType;
  related_company_id?: number;
  related_company_name?: string;
  related_company_code?: string; // Code 8 chars de l'entreprise liée
  related_contractor_id?: number;
  related_contractor_name?: string;
  nickname?: string;
  last_used_at?: string;
  created_at: string;
}

export interface SaveRelationRequest {
  related_type: RelatedEntityType;
  related_company_id?: number; // Résolu après lookup par code
  related_contractor_id?: number;
  nickname?: string;
}

export interface CompanyLookupResult {
  id: number;
  name: string;
  company_code: string;
  logo_url?: string;
  is_already_saved: boolean; // Si déjà dans le carnet de relations
}
```

---

## 3. Endpoints API

### Base path : `/api/jobs/:jobId/transfers`

---

### `POST /api/jobs/:jobId/transfers`

**Créer un transfert** — accessible par l'entreprise propriétaire du job (`is_owner: true`).

**Body :** `CreateJobTransferRequest`

**Réponse 201 :**

```json
{
  "success": true,
  "data": {
    /* JobTransfer complet */
  }
}
```

**Erreurs :**

- `403` — L'appelant n'est pas propriétaire du job
- `409` — Un transfert `pending` existe déjà sur ce job
- `422` — Champs manquants ou destinataire inconnu

---

### `GET /api/jobs/:jobId/transfers`

**Lister les transferts du job** — propriétaire ou cessionnaire.

**Réponse 200 :**

```json
{
  "data": [
    /* JobTransfer[] */
  ]
}
```

---

### `GET /api/jobs/:jobId/transfers/:transferId`

**Détail d'un transfert.**

---

### `PATCH /api/jobs/:jobId/transfers/:transferId/respond`

**Accepter ou refuser un transfert** — accessible uniquement par le cessionnaire.

**Body :** `RespondToTransferRequest`

**Effets si `accept` :**

- Statut `job_transfers.status` → `accepted`
- Statut `jobs.assignment_status` → `accepted`
- Assigner `jobs.contractor_company_id` au cessionnaire
- Envoyer notification push à la cédante

**Effets si `decline` :**

- Statut `job_transfers.status` → `declined`
- Envoyer notification push à la cédante

---

### `DELETE /api/jobs/:jobId/transfers/:transferId`

**Annuler un transfert** — accessible par la cédante, uniquement si `status = 'pending'`.

**Réponse 200 :**

```json
{ "success": true }
```

**Erreur :**

- `409` — Le transfert a déjà reçu une réponse (accepted / declined)

---

### `GET /api/companies/me/incoming-transfers`

**Transferts entrants pour l'entreprise connectée** — liste tous les transferts `pending` où l'entreprise est cessionnaire. Utilisé pour le badge de notification et la liste dans l'app.

---

### `GET /api/companies/lookup?code=XXXXXXXX`

**Trouver une entreprise par son code** — public pour toute entreprise authentifiée.

**Paramètre :** `code` — 8 caractères, insensible à la casse (normalisé en majuscules côté serveur).

**Réponse 200 :**

```json
{
  "data": {
    "id": 42,
    "name": "ABC Removals",
    "company_code": "A3FX7KQ2",
    "logo_url": "https://...",
    "is_already_saved": true
  }
}
```

**Erreurs :**

- `404` — Aucune entreprise trouvée avec ce code
- `400` — Code invalide (longueur ≠ 8, caractères non autorisés)
- `403` — Ne pas permettre de se chercher soi-même

---

### `GET /api/companies/me/relations`

**Lister le carnet de relations** de l'entreprise connectée, trié par `last_used_at DESC` puis `created_at DESC`.

**Réponse 200 :**

```json
{
  "data": [
    /* CompanyRelation[] */
  ]
}
```

---

### `POST /api/companies/me/relations`

**Sauvegarder une relation** dans le carnet.

**Body :** `SaveRelationRequest`

**Réponse 201 :**

```json
{
  "success": true,
  "data": {
    /* CompanyRelation */
  }
}
```

**Erreurs :**

- `409` — Relation déjà enregistrée (retourne quand même la relation existante)

---

### `PATCH /api/companies/me/relations/:relationId`

**Modifier le surnom** d'une relation.

**Body :** `{ "nickname": "Nouveau surnom" }`

---

### `DELETE /api/companies/me/relations/:relationId`

**Supprimer une relation** du carnet.

---

## 4. UI — Formulaire d'émission (côté cédant)

### Emplacement

Le formulaire est déclenché depuis la **fiche du job** (`jobDetails.tsx`), dans le tab **Summary** (`JobDetailsScreens/summary.tsx`), via un bouton **"Déléguer ce job"** visible uniquement quand :

- `permissions.is_owner === true`
- `job.status` ∈ `['pending', 'assigned', 'accepted']`
- Aucun transfert `pending` n'existe déjà sur ce job

Le bouton est identique au style du bouton **"Assigner un staff"** existant. Il ouvre un **bottom sheet modal** (`TransferJobModal.tsx` — à créer dans `src/components/modals/`).

---

### Contenu du formulaire (`TransferJobModal.tsx`)

```
┌─────────────────────────────────────────────┐
│  ✕    Déléguer ce job                        │
├─────────────────────────────────────────────┤
│  RÔLE DÉLÉGUÉ                               │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Chauffeur│ │ Offsider │ │  Job entier  │  │
│  └─────────┘ └──────────┘ └──────────────┘  │
│  ┌───────────────────────────────────────┐   │
│  │  Autre (préciser) _______________     │   │
│  └───────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  TARIFICATION                               │
│  ○ À l'heure    ● Forfait                   │
│  ┌────────────────────────────────────────┐  │
│  │  $  [   125.00   ]  AUD                │  │
│  └────────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  DESTINATAIRE                               │
│                                             │
│  ┌ Carnet de relations ──────────────────┐  │
│  │  [Logo] ABC Removals        ★ favori  │  │
│  │  [Logo] Premier Movers                │  │
│  │  [Logo] Quick Freight  (il y a 3j)    │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ── ou ajouter par code ──────────────────  │
│  ┌────────────────────────────────────────┐  │
│  │  🔑  Code entreprise  [ A3FX7KQ2 ]    │  │
│  └────────────────────────────────────────┘  │
│  ↓ (après saisie des 8 chars, lookup auto)   │
│  ┌────────────────────────────────────────┐  │
│  │  ✅ ABC Removals  (A3FX7KQ2)           │  │
│  │     [ Enregistrer dans le carnet ]     │  │
│  └────────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│  MESSAGE (optionnel)                        │
│  ┌────────────────────────────────────────┐  │
│  │  Saisissez un message...               │  │
│  └────────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│         [ Envoyer la délégation ]            │
└─────────────────────────────────────────────┘
```

#### Flux de sélection du destinataire — détail

**Étape 1 — Carnet de relations affiché en premier**  
À l'ouverture du modal, la section _Destinataire_ affiche directement la liste `company_relations` de l'entreprise triée par `last_used_at DESC` (appel `GET /api/companies/me/relations`). Un tap sur une ligne la sélectionne immédiatement.

**Étape 2 — Recherche par code (si la cible n'est pas dans le carnet)**

- Le champ accepte exactement 8 caractères.
- Le lookup `GET /api/companies/lookup?code=...` est déclenché **automatiquement** dès que 8 caractères sont saisis (pas de bouton "Rechercher").
- Si trouvé : affiche le nom + logo de l'entreprise avec un bouton **"Enregistrer dans le carnet"** (appel `POST /api/companies/me/relations`).
- Si non trouvé : message d'erreur inline `"Aucune entreprise trouvée pour ce code"`.
- L'enregistrement dans le carnet est **optionnel** — on peut envoyer la délégation sans sauvegarder.

**À la confirmation du transfert :**  
Si l'entreprise sélectionnée n'est pas encore dans le carnet, proposer un toast/banner non bloquant : _"Enregistrer ABC Removals dans votre carnet ?"_.
En arrière-plan, `last_used_at` de la relation est mis à jour automatiquement (via le backend lors de la création du transfert).

**Validation avant envoi :**

- Rôle sélectionné (ou libellé custom rempli)
- Montant > 0
- Destinataire sélectionné (depuis le carnet ou via lookup code)

---

### Affichage de l'état existant sur la fiche (après envoi)

Dans la section **Summary**, un bandeau statut apparaît :

```
┌──────────────────────────────────────────────────────┐
│  🔄  Délégation en attente                           │
│  Envoyée à  [Logo] ABC Removals                      │
│  Rôle : Chauffeur  |  50 $/h                         │
│  Envoyée le 04/03/2026 à 10:32                       │
│                          [ Annuler la délégation ]   │
└──────────────────────────────────────────────────────┘
```

Ce bandeau disparaît quand le transfert est accepté, refusé ou annulé.

---

## 5. UI — Formulaire d'acceptation / refus (côté destinataire)

### Point d'entrée 1 — Notification push

La notification push reçue par le cessionnaire contient un deep link vers la fiche du job concerné.  
En arrivant sur la fiche, si `permissions.can_accept === true` et un transfert `pending` existe, un **bandeau d'action** s'affiche automatiquement en haut de la fiche.

### Point d'entrée 2 — Liste dédiée

Page **"Jobs à valider"** (onglet existant ou section dans le calendrier/home) listant tous les `incoming-transfers` de l'entreprise.

---

### Bandeau sur la fiche du job

```
┌──────────────────────────────────────────────────────┐
│  📩  Délégation reçue de  [Logo] Premier Movers      │
│  Rôle : Job entier  |  Forfait : 800 $               │
│  Message : "Nous avons un empêchement, seras-tu dispo?│
│                                                      │
│       [ Refuser ]          [ Accepter ]              │
└──────────────────────────────────────────────────────┘
```

- **Accepter** → confirmation rapide (AlertDialog) → appel `PATCH .../respond { action: 'accept' }` → la fiche du job se recharge avec le job actif pour le cessionnaire
- **Refuser** → bottom sheet avec champ **"Raison du refus (optionnel)"** → appel `PATCH .../respond { action: 'decline', decline_reason: '...' }`

---

## 6. Notifications push & in-app

### Templates à ajouter dans `notificationsService.ts`

```typescript
// Côté cédant
transferSent: (recipientName: string): NotificationTemplate => ({
    title: 'Délégation envoyée',
    message: `${recipientName} a reçu votre demande de délégation`,
    type: 'job',
}),
transferAccepted: (jobId: string, recipientName: string): NotificationTemplate => ({
    title: '✅ Délégation acceptée',
    message: `${recipientName} a accepté le job #${jobId}`,
    type: 'job',
}),
transferDeclined: (jobId: string, recipientName: string, reason?: string): NotificationTemplate => ({
    title: '❌ Délégation refusée',
    message: reason
        ? `${recipientName} a refusé le job #${jobId} : "${reason}"`
        : `${recipientName} a refusé le job #${jobId}`,
    type: 'job',
}),
transferCancelled: (jobId: string): NotificationTemplate => ({
    title: 'Délégation annulée',
    message: `La délégation pour le job #${jobId} a été annulée par l'émetteur`,
    type: 'job',
}),

// Côté cessionnaire
transferReceived: (jobId: string, senderName: string, role: string): NotificationTemplate => ({
    title: '📩 Nouveau job à accepter',
    message: `${senderName} vous délègue le rôle "${role}" sur le job #${jobId}`,
    type: 'job',
}),
```

### Notification push (Firebase / Expo Push)

Les notifications push utilisent le **`user_id` du gestionnaire de l'entreprise cessionnaire** (admin ou owner) et la **`company_id` pour les broadcasts**.

| Événement         | Destinataire push               | Canal in-app   |
| ----------------- | ------------------------------- | -------------- |
| Transfert créé    | Admin/owner du cessionnaire     | Badge + in-app |
| Transfert accepté | Créateur du transfert (cédante) | In-app         |
| Transfert refusé  | Créateur du transfert (cédante) | In-app         |
| Transfert annulé  | Admin/owner du cessionnaire     | In-app         |

---

## 7. États & transitions

```
Cédante crée le transfert
        │
        ▼
   [ pending ] ──────────────── Cédante annule ──────► [ cancelled ]
        │
        ├── Cessionnaire accepte ──────────────────────► [ accepted ]
        │         └─► job.assignment_status = accepted
        │             job.contractor_company_id = cessionnaire
        │
        └── Cessionnaire refuse ──────────────────────► [ declined ]
```

---

## 8. Règles métier

| #   | Règle                                                                                                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------- |
| R1  | Un seul transfert `pending` autorisé par job à la fois                                                                     |
| R2  | Seul le propriétaire (`is_owner`) du job peut créer un transfert                                                           |
| R3  | Seule la cédante peut annuler un transfert `pending`                                                                       |
| R4  | Une fois `accepted` ou `declined`, le transfert est immuable                                                               |
| R5  | Si `accepted` : la cédante reste visible dans `contractee`, le cessionnaire devient `contractor`                           |
| R6  | Le job accepté par le cessionnaire apparaît dans son calendrier comme un job normal                                        |
| R7  | La tarification de la délégation ne modifie pas le prix facturé au client final                                            |
| R8  | Un transfert ne peut être fait que si `job.status ∈ ['pending', 'assigned', 'accepted']`                                   |
| R9  | L'annulation d'une délégation (`cancelled`) remet le job dans son état d'origine                                           |
| R10 | Le `company_code` est généré une seule fois à la création, immuable, unique globalement                                    |
| R11 | Le lookup par code ne renvoie jamais l'entreprise de l'appelant (une entreprise ne peut pas se déléguer un job)            |
| R12 | `last_used_at` d'une relation est mis à jour automatiquement côté serveur à chaque création de transfert vers cette entité |
| R13 | Une relation supprimée du carnet n'affecte pas les transferts déjà envoyés                                                 |

---

## 9. Intégration côté frontend existant

### Fichiers à créer

| Fichier                                                        | Description                                                                            |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/types/jobTransfer.ts`                                     | Types TypeScript définis en §2.5 (JobTransfer, CompanyRelation, CompanyLookupResult…)  |
| `src/services/jobTransfer.ts`                                  | Appels API (createTransfer, respond, cancel, list)                                     |
| `src/services/companyRelations.ts`                             | Appels API (lookupByCode, listRelations, saveRelation, updateNickname, deleteRelation) |
| `src/components/modals/TransferJobModal.tsx`                   | Formulaire d'émission (§4)                                                             |
| `src/components/modals/TransferJobModal/RelationsCarnet.tsx`   | Sous-composant : liste du carnet de relations                                          |
| `src/components/modals/TransferJobModal/CompanyCodeInput.tsx`  | Sous-composant : champ de saisie du code + lookup auto                                 |
| `src/components/jobDetails/sections/TransferBannerSection.tsx` | Bandeau cédant + bandeau cessionnaire (§4 + §5)                                        |
| `src/screens/business/RelationsScreen.tsx`                     | Page Carnet de relations dans la section Business (§10)                                |

### Fichiers à modifier

| Fichier                                                   | Modification                                                          |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/services/jobs.ts`                                    | Ajouter `active_transfer?: JobTransfer` dans `JobAPI`                 |
| `src/services/notificationsService.ts`                    | Ajouter les templates §6                                              |
| `src/screens/JobDetailsScreens/summary.tsx`               | Injecter `TransferBannerSection`                                      |
| `src/screens/jobDetails.tsx`                              | Passer les permissions transfer aux composants enfants                |
| `src/types/jobSummary.ts`                                 | Ajouter `active_transfer?: JobTransfer` dans `JobSummaryData`         |
| `src/screens/business/index.ts`                           | Exporter `RelationsScreen`                                            |
| `src/navigation/business.tsx`                             | Ajouter le tab `Relations` et le rendu conditionnel `RelationsScreen` |
| `src/components/business/BusinessTabMenu` (ou équivalent) | Ajouter l'entrée de tab Relations                                     |

### Extension de `permissions` sur `JobAPI`

```typescript
permissions?: {
  is_owner: boolean;
  is_assigned: boolean;
  can_accept: boolean;
  can_decline: boolean;
  can_start: boolean;
  can_complete: boolean;
  can_edit: boolean;
  // Nouveau
  can_create_transfer: boolean;   // is_owner && pas de pending transfer && status éligible
  can_cancel_transfer: boolean;   // is_owner && transfer.status === 'pending'
  can_respond_transfer: boolean;  // is recipient && transfer.status === 'pending'
};
```

---

---

## 10. Page Carnet de relations (section Business)

### Emplacement

Nouveau tab **"Relations"** dans la navigation `business.tsx`, au même niveau que _BusinessInfo_, _StaffCrew_, _Trucks_, _JobsBilling_. Le tab est visible uniquement pour les utilisateurs ayant le rôle `owner` ou `admin` de leur entreprise.

**Icône suggérée :** `people-outline` (Ionicons) — cohérent avec StaffCrew voisin.

---

### Structure de la page (`RelationsScreen.tsx`)

```
┌──────────────────────────────────────────────────────┐
│  VOTRE CODE ENTREPRISE                               │
│  ┌──────────────────────────────────────────────┐   │
│  │  🔑  A3FX7KQ2                  [ Copier ]   │   │
│  └──────────────────────────────────────────────┘   │
│  Partagez ce code pour qu'une autre entreprise       │
│  puisse vous déléguer un job.                        │
├──────────────────────────────────────────────────────┤
│  CARNET DE RELATIONS               [ + Ajouter ]     │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  [Logo]  ABC Removals                   ···  │   │
│  │          A3FX7KQ2  ·  utilisé il y a 2j      │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  [Logo]  Premier Movers                 ···  │   │
│  │          BX92KL01  ·  utilisé il y a 1 sem.  │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  [Avatar] Jean Dupont (prestataire)      ···  │   │
│  │          Prestataire  ·  jamais utilisé       │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  (liste vide : illustration + "Ajoutez votre         │
│   premier partenaire via son code")                  │
└──────────────────────────────────────────────────────┘
```

---

### Section — Code entreprise

- Affiche le `company_code` de l'entreprise connectée dans un encadré bien visible.
- Bouton **"Copier"** : copie dans le presse-papiers via `Clipboard.setString()` + toast `"Code copié !"` pendant 2 s.
- Bouton **"Partager"** (optionnel, v2) : déclenche le share natif iOS/Android avec le texte `"Mon code entreprise Swift : A3FX7KQ2"`.

---

### Section — Liste des relations

Chaque ligne affiche :

- Logo ou avatar de l'entité
- Nom complet + code entreprise (si type `company`) ou label "Prestataire" (si type `contractor`)
- Surnom (`nickname`) si défini, en italique sous le nom
- `last_used_at` : texte relatif ("il y a 2 jours", "jamais utilisé")
- Menu contextuel `···` (kebab) avec :
  - **Renommer** → bottom sheet avec champ `nickname` pré-rempli → appel `PATCH /api/companies/me/relations/:id`
  - **Supprimer** → confirmation AlertDialog → appel `DELETE /api/companies/me/relations/:id`

La liste est triée par `last_used_at DESC` (jamais utilisés en bas).

Bouton **Pull-to-refresh** pour recharger depuis l'API.

---

### Bouton [+ Ajouter]

Ouvre un **bottom sheet** minimaliste :

```
┌──────────────────────────────────────────────────────┐
│  ✕   Ajouter une relation                            │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  │
│  │  🔑 Code entreprise  [ A3FX7KQ2        ]      │  │
│  └────────────────────────────────────────────────┘  │
│  ↓ (lookup automatique à 8 chars)                    │
│  ┌────────────────────────────────────────────────┐  │
│  │  ✅ ABC Removals  (A3FX7KQ2)                  │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Surnom (optionnel)  ___________________________     │
│                                                      │
│              [ Enregistrer ]                         │
└──────────────────────────────────────────────────────┘
```

- Réutilise le composant `CompanyCodeInput.tsx` défini en §9.
- Après sauvegarde, la liste se recharge et affiche la nouvelle entrée en tête.
- Erreur `409` (déjà enregistré) → toast `"Cette entreprise est déjà dans votre carnet."` sans bloquer.

---

### État vide

Si `data.length === 0` :

```
   [Illustration : deux buildings reliés par une ligne pointillée]

   Votre carnet est vide

   Ajoutez un partenaire en saisissant son code
   entreprise pour lui déléguer un job rapidement.

             [ + Ajouter une relation ]
```

---

### Intégration dans `business.tsx`

Ajouts nécessaires dans `src/navigation/business.tsx` :

```typescript
// Import
import { RelationsScreen } from '../screens/business';

// Dans getPanelTitle()
case 'Relations':
  return 'Partenaires';

// Dans le rendu conditionnel
{businessPanel === 'Relations' && <RelationsScreen />}
```

Ajout dans `BusinessTabMenu` (ou composant équivalent) :

```typescript
{ id: 'Relations', label: 'Partenaires', icon: 'people-outline' }
```

---

_Fin du document — en attente de validation pour démarrer l'implémentation._
