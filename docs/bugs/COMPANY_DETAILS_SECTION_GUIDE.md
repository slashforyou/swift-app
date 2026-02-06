# 📊 CompanyDetailsSection - Guide Visuel

**Date:** 1er février 2026  
**Composant:** `src/components/jobDetails/sections/CompanyDetailsSection.tsx`

---

## 🎯 Objectif

Afficher intelligemment les informations d'entreprise dans JobDetails selon le contexte:

- **Job interne** (même entreprise) → Afficher seulement "Entreprise"
- **Job multi-entreprise** → Afficher "Contractee" (créateur) et "Contractor" (exécutant)

---

## 🔍 Logique de Détection

```typescript
const hasContractee = !!job?.contractee;
const hasContractor = !!job?.contractor;

// Multi-entreprise si les IDs sont différents
const isDifferentCompany =
  hasContractee &&
  hasContractor &&
  job.contractee.company_id !== job.contractor.company_id;
```

---

## 📱 Affichage Visuel

### Cas 1: Job Interne (Même Entreprise)

```
┌─────────────────────────────────────────────────────┐
│ Entreprise                                          │
│ Entreprise responsable du job                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🏢 ENTREPRISE                                       │
│ Swift Movers                                        │
│                                                     │
│ 👤 Créé par: John Doe                              │
│ 👷 Staff assigné: Jane Smith                       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Données backend attendues:**

```json
{
  "contractee": {
    "company_id": 1,
    "company_name": "Swift Movers",
    "created_by_name": "John Doe"
  },
  "contractor": {
    "company_id": 1, // ← Même ID
    "company_name": "Swift Movers",
    "assigned_staff_name": "Jane Smith"
  }
}
```

---

### Cas 2: Job Multi-Entreprise

```
┌─────────────────────────────────────────────────────┐
│ Entreprises Impliquées                             │
│ Job multi-entreprise - Informations de             │
│ facturation et d'exécution                          │
├─────────────────────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃ 💰 CRÉATEUR DU JOB (CONTRACTEE)             ┃  │
│ ┃ Entreprise qui reçoit le paiement            ┃  │
│ ┃                                              ┃  │
│ ┃ Nerd-Test Removals                           ┃  │
│ ┃ 👤 Créé par: John Doe                        ┃  │
│ ┃ ────────────────────────────────────         ┃  │
│ ┃ Stripe: acct_1234567890ab...                 ┃  │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                     │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃ 🔧 EXÉCUTANT (CONTRACTOR)                    ┃  │
│ ┃ Entreprise qui effectue le travail           ┃  │
│ ┃                                              ┃  │
│ ┃ Swift Movers                                  ┃  │
│ ┃ 👷 Staff assigné: Jane Smith                 ┃  │
│ ┃ ────────────────────────────────────         ┃  │
│ ┃ Assigné le: 31 janvier 2026, 10:30          ┃  │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Données backend attendues:**

```json
{
  "contractee": {
    "company_id": 1,
    "company_name": "Nerd-Test Removals",
    "created_by_name": "John Doe",
    "stripe_account_id": "acct_1234567890abcdef"
  },
  "contractor": {
    "company_id": 2, // ← ID différent
    "company_name": "Swift Movers",
    "assigned_staff_name": "Jane Smith",
    "assigned_at": "2026-01-31T10:30:00Z"
  }
}
```

---

## 🎨 Détails de Design

### Couleurs et Styles

**Contractee (Créateur):**

- Fond: `colors.success + '10'` (vert clair)
- Bordure gauche: `colors.success` (vert)
- Icône: 💰 (argent)
- Signification: Reçoit le paiement

**Contractor (Exécutant):**

- Fond: `colors.info + '10'` (bleu clair)
- Bordure gauche: `colors.info` (bleu)
- Icône: 🔧 (outil)
- Signification: Effectue le travail

**Job Interne:**

- Fond: transparent
- Style simple sans bordure colorée
- Icône: 🏢 (entreprise)

---

## 📊 Flux de Données

### Depuis l'API

```
GET /v1/jobs/123
    ↓
Response avec contractee + contractor
    ↓
useJobDetails hook
    ↓
jobDetails.job contient ownership data
    ↓
CompanyDetailsSection détecte automatiquement:
  - isDifferentCompany?
  - Affiche format approprié
```

### Propagation dans l'App

```
1. JobDetails screen charge le job
2. Passe `job` prop à <JobSummary>
3. JobSummary passe `job` à <CompanyDetailsSection>
4. CompanyDetailsSection analyse et affiche
```

---

## ✅ Avantages de l'Approche

1. **Automatique** - Détection intelligente sans configuration
2. **Cohérent** - Suit le pattern des autres sections (ClientDetailsSection, etc.)
3. **Clair** - Distinction visuelle entre les rôles
4. **Flexible** - S'adapte aux deux scénarios
5. **Informatif** - Affiche toutes les données pertinentes

---

## 🧪 Cas de Test

### Test 1: Job Interne Simple

```json
{
  "contractee": {
    "company_id": 1,
    "company_name": "Swift Movers"
  },
  "contractor": {
    "company_id": 1,
    "company_name": "Swift Movers"
  }
}
```

**Résultat attendu:** Section simple "Entreprise: Swift Movers"

---

### Test 2: Job Multi-Entreprise Complet

```json
{
  "contractee": {
    "company_id": 1,
    "company_name": "Nerd-Test Removals",
    "created_by_name": "John Doe",
    "stripe_account_id": "acct_xxx"
  },
  "contractor": {
    "company_id": 2,
    "company_name": "Swift Movers",
    "assigned_staff_name": "Jane Smith",
    "assigned_at": "2026-01-31T10:30:00Z"
  }
}
```

**Résultat attendu:** Deux blocs distincts avec toutes les infos

---

### Test 3: Données Manquantes

```json
{
  "contractee": null,
  "contractor": null
}
```

**Résultat attendu:** Section ne s'affiche pas (return null)

---

### Test 4: Contractee Sans Contractor

```json
{
  "contractee": {
    "company_id": 1,
    "company_name": "Swift Movers"
  },
  "contractor": null
}
```

**Résultat attendu:** Affiche "Entreprise: Swift Movers" (fallback sur contractee)

---

## 🔄 Intégration dans JobDetails

**Position dans summary.tsx:**

```tsx
<QuickActionsSection ... />
<CompanyDetailsSection job={job} />  ← ICI (avant client)
<ClientDetailsSection job={job} />
<ContactDetailsSection job={job} />
<AddressesSection job={job} />
```

**Ordre logique:**

1. Actions rapides
2. **Entreprise(s)** ← Nouveau
3. Client
4. Contact
5. Adresses
6. Horaires
7. Camion

---

## 📝 Notes Techniques

### Props Interface

```typescript
interface CompanyDetailsSectionProps {
  job: any; // Job avec contractee/contractor optionnels
}
```

### Dépendances

- `useTheme()` - Pour les couleurs
- `DESIGN_TOKENS` - Pour les espacements et rayons
- `SectionCard` - Composant wrapper réutilisé

### Pas de traductions (i18n)

Les textes sont en dur pour l'instant. Si besoin d'i18n:

```typescript
t("jobDetails.company.title");
t("jobDetails.company.contractee");
t("jobDetails.company.contractor");
```

---

## 🚀 Prochaines Étapes

1. **Test avec données réelles** ✅ PRIORITÉ
   - Vérifier affichage job interne
   - Vérifier affichage job multi-entreprise

2. **Ajout des traductions** (Optionnel)
   - Fichiers fr.ts et en.ts
   - Clés company.\*

3. **Amélioration visuelle** (Phase 2)
   - Icônes vectorielles au lieu d'emojis
   - Animations de transition
   - Lien vers profil entreprise

---

**Status:** ✅ Implémenté et intégré  
**Tests:** En attente de données backend

_Dernière mise à jour: 1er février 2026_
