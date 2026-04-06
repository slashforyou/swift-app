# Rapport : Liaison entre sociétés — Diagnostic complet

## Date : 6 avril 2026
## Contexte : Compte connecté `admin.test@nerd-test.com` (user_id=24, company_id=1, Nerd-Test)

---

## 1. État actuel de la base de données

### 1.1 Sociétés existantes

| id | name | trading_name | company_code |
|----|------|-------------|--------------|
| 1 | Nerd-Test | — | CDE68417 |
| 2 | Test Frontend | — | A7310361 |
| 3 | TestOnboarding | — | 6FF0FD19 |
| 4 | Carmichael Services | Carmichael Services | JCBEV1O2 |

### 1.2 Utilisateurs par société

| id | Nom | Email | company_id | Société | Rôle |
|----|-----|-------|------------|---------|------|
| 24 | Admin Test | admin.test@nerd-test.com | 1 | Nerd-Test | patron |
| 25 | Manager Test | manager.test@nerd-test.com | 1 | Nerd-Test | patron |
| 26 | Employee Test | employee.test@nerd-test.com | 1 | Nerd-Test | employee |
| 27 | Driver Test | driver.test@nerd-test.com | 1 | Nerd-Test | employee |
| 28 | Supervisor Test | supervisor.test@nerd-test.com | 1 | Nerd-Test | patron |
| 35 | New Employee | new.employee@nerd-test.com | 1 | Nerd-Test | employee |
| 36 | Jim Hargreaves | jim.hargreaves@nerd-test.com | 1 | Nerd-Test | employee |
| 37 | Sean Calloway | sean.calloway@nerd-test.com | 1 | Nerd-Test | employee |
| 38 | Tony Ferraro | tony.ferraro@nerd-test.com | 1 | Nerd-Test | employee |
| 39 | George Papas | george.papas@nerd-test.com | 1 | Nerd-Test | employee |
| 40 | Anna Vickers | anna.vickers@nerd-test.com | 1 | Nerd-Test | employee |
| 62 | Steve Pommes | steve.pommes@cobbr-demo.com | 1 | Nerd-Test | employee |
| 63 | Adam Granny | adam.granny@cobbr-demo.com | 1 | Nerd-Test | employee |
| 15 | Romain Giovanni | romaingiovanni@gmail.com | 2 | Test Frontend | patron |
| 34 | Test Onboarding | user.onboarding@test.com | 3 | TestOnboarding | employee |
| 58 | Joseph Carmichael | joseph.carmichael@gmail.com | 4 | Carmichael Services | patron |

---

## 2. Les deux mécanismes de liaison entre sociétés

L'application utilise **deux systèmes indépendants** pour lier les sociétés entre elles. C'est la source du problème.

### 2.1 Table `company_relations` — Le "Carnet de relations"

**Objectif** : Carnet d'adresses B2B manuellement géré par l'utilisateur. Permet de mémoriser des partenaires pour les retrouver rapidement lors d'un transfert de job.

**Table** : `company_relations` (migration 015)
```
owner_company_id  → l'entreprise qui possède cette relation
related_company_id → l'entreprise partenaire mémorisée
nickname          → surnom personnalisé
```

**Contenu actuel** :

| id | Owner (company_id) | Related (company_id) | Nickname |
|----|--------------------|---------------------|----------|
| 1 | 2 (Test Frontend) | 1 (Nerd-Test) | "Nerd Test" |
| 2 | **1 (Nerd-Test)** | **4 (Carmichael Services)** | **"Joseph Carmichael"** |
| 3 | 4 (Carmichael Services) | 1 (Nerd-Test) | "Nerd Test" |

**Constat** : Nerd-Test (company_id=1) n'a qu'**UNE SEULE** relation enregistrée dans son carnet : **Carmichael Services** (company_id=4).

- ❌ **Test Frontend (company_id=2)** n'est pas dans le carnet de Nerd-Test
- ❌ **TestOnboarding (company_id=3)** n'est pas dans le carnet de Nerd-Test
- ✅ **Carmichael Services (company_id=4)** est dans le carnet avec le nickname "Joseph Carmichael"

**Endpoint backend** : `GET /v1/companies/relations` → query `WHERE cr.owner_company_id = ?`
**Frontend** : `RelationsScreen.tsx` → appelle `listRelations()` de `companyRelations.ts`

### 2.2 Table `job_transfers` — Les transferts de jobs

**Objectif** : Trace les jobs qui ont été transférés/délégués d'une société à une autre.

**Table** : `job_transfers`
```
sender_company_id     → société qui envoie le job
recipient_company_id  → société qui reçoit le job
status               → pending, accepted, cancelled
```

**Contenu actuel (impliquant company_id=1)** :

| id | job_id | Sender | Recipient | Status |
|----|--------|--------|-----------|--------|
| 1 | 33 | 2 (Test Frontend) → | 1 (Nerd-Test) | pending |
| 9 | 36 | 4 (Carmichael) → | 1 (Nerd-Test) | pending |
| 10 | 38 | 3 (TestOnboarding) → | 1 (Nerd-Test) | pending |
| 11 | 40 | 2 (Test Frontend) → | 1 (Nerd-Test) | pending |
| 12 | 41 | 4 (Carmichael) → | 1 (Nerd-Test) | pending |
| 13 | 43 | 3 (TestOnboarding) → | 1 (Nerd-Test) | pending |
| 14 | 44 | 4 (Carmichael) → | 1 (Nerd-Test) | pending |
| 15 | 46 | 2 (Test Frontend) → | 1 (Nerd-Test) | pending |
| 16 | 48 | 3 (TestOnboarding) → | 1 (Nerd-Test) | pending |
| 17 | 61 | 1 (Nerd-Test) → | 4 (Carmichael) | pending |
| 18 | 62 | 1 (Nerd-Test) → | 4 (Carmichael) | pending |
| 20 | 55 | 1 (Nerd-Test) → | 4 (Carmichael) | cancelled |

**Constat** : Via les job_transfers, Nerd-Test est lié à **TROIS** sociétés :
- ✅ Test Frontend (company_id=2) — 3 transferts reçus
- ✅ TestOnboarding (company_id=3) — 3 transferts reçus
- ✅ Carmichael Services (company_id=4) — 3 transferts reçus + 3 envoyés

---

## 3. Origine du problème

### L'écran "Partenaires" (RelationsScreen)
- Utilise **uniquement** la table `company_relations`
- Appelle `GET /v1/companies/relations` qui filtre par `owner_company_id = 1`
- **Résultat** : affiche seulement **Carmichael Services** (la seule entrée dans company_relations pour owner=1)

### Le wizard "Assign a Resource" (AssignResourceModal)
- Utilise **uniquement** la table `job_transfers`
- Appelle `GET /v1/companies/:companyId/resources/availability`
- Le backend cherche les partenaires via :
  ```sql
  SELECT DISTINCT c.id, c.name FROM job_transfers jt
  JOIN companies c ON ...
  WHERE (jt.sender_company_id = ? OR jt.recipient_company_id = ?)
    AND jt.status IN ('pending', 'accepted')
  ```
- **Résultat** : trouve les 3 sociétés partenaires (Test Frontend, TestOnboarding, Carmichael Services) et affiche leur staff/véhicules

### Le décalage
```
┌─────────────────────────────────────────────────────────────────────┐
│                    SOURCES DE DONNÉES                              │
├──────────────────────┬──────────────────────────────────────────────┤
│  Écran "Partenaires" │  Wizard "Assign Resource"                   │
│  (RelationsScreen)   │  (AssignResourceModal)                      │
├──────────────────────┼──────────────────────────────────────────────┤
│  company_relations   │  job_transfers                              │
│  (carnet manuel)     │  (transferts de jobs)                       │
├──────────────────────┼──────────────────────────────────────────────┤
│  ✅ Carmichael       │  ✅ Carmichael Services                     │
│                      │  ✅ Test Frontend                           │
│                      │  ✅ TestOnboarding                          │
├──────────────────────┼──────────────────────────────────────────────┤
│  Total : 1 société   │  Total : 3 sociétés                        │
└──────────────────────┴──────────────────────────────────────────────┘
```

**Test Frontend** et **TestOnboarding** ont envoyé des jobs à Nerd-Test (via job_transfers), mais Nerd-Test ne les a jamais ajoutés manuellement dans son carnet de relations (`company_relations`).

---

## 4. Solutions proposées

### Option A — Fusionner les sources (RECOMMANDÉE)

Modifier l'endpoint `GET /v1/companies/relations` (le backend du carnet) pour **aussi inclure automatiquement les sociétés liées via `job_transfers`**, même si elles n'ont pas été ajoutées manuellement au carnet.

**Changement backend** (`relations.js` — `listRelationsEndpoint`) :

```sql
-- Requête actuelle (ne montre que les relations manuelles) :
SELECT cr.* FROM company_relations cr WHERE cr.owner_company_id = ?

-- Requête fusionnée (relations manuelles + partenaires via transfers) :
SELECT cr.id, cr.related_type, cr.related_company_id, cr.nickname, cr.created_at,
       COALESCE(cr.nickname, c.trading_name, c.name) AS related_company_name,
       c.company_code AS related_company_code,
       'manual' AS source
FROM company_relations cr
LEFT JOIN companies c ON c.id = cr.related_company_id
WHERE cr.owner_company_id = ?

UNION

SELECT NULL AS id, 'company' AS related_type, c.id AS related_company_id,
       NULL AS nickname, MIN(jt.created_at) AS created_at,
       COALESCE(c.trading_name, c.name) AS related_company_name,
       c.company_code AS related_company_code,
       'transfer' AS source
FROM job_transfers jt
JOIN companies c ON c.id = CASE
  WHEN jt.sender_company_id = ? THEN jt.recipient_company_id
  ELSE jt.sender_company_id
END
WHERE (jt.sender_company_id = ? OR jt.recipient_company_id = ?)
  AND jt.status IN ('pending', 'accepted')
  AND c.id != ?
  AND c.id NOT IN (
    SELECT related_company_id FROM company_relations WHERE owner_company_id = ?
  )
GROUP BY c.id

ORDER BY related_company_name ASC
```

**Avantages** :
- L'écran "Partenaires" affiche automatiquement toutes les sociétés avec lesquelles on a interagi
- Pas besoin d'action manuelle de l'utilisateur
- Les relations manuelles (avec nickname) restent prioritaires
- Le champ `source` permet au frontend de distinguer visuellement les relations auto-détectées vs manuelles

**Changement frontend** (`RelationsScreen.tsx`) :
- Ajouter un badge/indicateur pour les relations `source: 'transfer'` (ex: "Auto-détecté via transferts")
- Proposer un bouton "Ajouter au carnet" pour les convertir en relation manuelle

### Option B — Ajout automatique au carnet lors d'un transfert

À chaque création de `job_transfer`, insérer automatiquement une entrée dans `company_relations` si elle n'existe pas déjà (INSERT IGNORE / ON DUPLICATE KEY).

**Avantage** : simple
**Inconvénient** : ne fonctionne pas rétroactivement pour les transferts existants (il faudrait un script de migration)

### Option C — Script de migration ponctuel

Exécuter un script SQL one-shot qui crée les entrées manquantes dans `company_relations` à partir des `job_transfers` existants, puis implémenter l'Option B pour le futur.

```sql
INSERT IGNORE INTO company_relations (owner_company_id, related_type, related_company_id, related_company_name)
SELECT DISTINCT
  CASE WHEN jt.sender_company_id = c_own.id THEN jt.sender_company_id
       ELSE jt.recipient_company_id END AS owner_id,
  'company',
  CASE WHEN jt.sender_company_id = c_own.id THEN jt.recipient_company_id
       ELSE jt.sender_company_id END AS related_id,
  COALESCE(c_rel.trading_name, c_rel.name)
FROM job_transfers jt
JOIN companies c_own ON c_own.id IN (jt.sender_company_id, jt.recipient_company_id)
JOIN companies c_rel ON c_rel.id = CASE
  WHEN jt.sender_company_id = c_own.id THEN jt.recipient_company_id
  ELSE jt.sender_company_id
END
WHERE jt.status IN ('pending', 'accepted')
  AND c_own.id != c_rel.id;
```

---

## 5. Recommandation

**Option A** est la meilleure car :
1. Pas besoin de migration de données
2. Fonctionne rétroactivement et pour les futurs transferts
3. L'utilisateur voit immédiatement tous ses partenaires
4. Les relations manuelles (avec nicknames) ne sont pas perdues
5. Le frontend peut distinguer les sources (manuel vs auto-détecté)

Combiner avec **Option B** pour que le carnet s'enrichisse aussi automatiquement lors de nouveaux transferts, et que les relations auto-détectées puissent être "promues" en relations manuelles avec un nickname personnalisé.

---

## 6. Fichiers impactés par la correction

### Backend
| Fichier | Changement |
|---------|-----------|
| `endPoints/v1/companies/relations.js` | Modifier `listRelationsEndpoint` pour fusionner `company_relations` + `job_transfers` |
| `endPoints/v1/jobTransfers.js` (ou équivalent) | Ajouter auto-insertion dans `company_relations` lors d'un nouveau transfert |

### Frontend
| Fichier | Changement |
|---------|-----------|
| `src/screens/business/RelationsScreen.tsx` | Afficher un badge "Auto-détecté" pour les relations sans id (source: transfer) |
| `src/components/modals/TransferJobModal/RelationsCarnet.tsx` | Gérer le champ `source` pour l'affichage |
| `src/types/jobTransfer.ts` | Étendre `CompanyRelation` avec le champ `source?: 'manual' \| 'transfer'` |
| `src/services/companyRelations.ts` | Aucun changement nécessaire (le service appelle déjà le bon endpoint) |

---

## 7. Résumé visuel du problème

```
                    ┌──────────────────┐
                    │   Nerd-Test      │
                    │   (company_id=1) │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────────┐
            │                │                    │
   ╔════════▼═══════╗  ╔════▼════════════╗  ╔════▼═══════════════╗
   ║ Test Frontend  ║  ║ TestOnboarding  ║  ║ Carmichael Services║
   ║ (company_id=2) ║  ║ (company_id=3)  ║  ║ (company_id=4)    ║
   ╚════════════════╝  ╚═════════════════╝  ╚════════════════════╝
   
   job_transfers: ✅     job_transfers: ✅     job_transfers: ✅
   company_rel:  ❌      company_rel:  ❌      company_rel:  ✅
   
   → absent du          → absent du           → visible dans
     carnet partenaires   carnet partenaires     carnet partenaires
   → visible dans       → visible dans         → visible dans
     assign resource      assign resource        assign resource
```
