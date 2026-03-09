# 🚨 Blocage Stripe Onboarding (Company) — `directors/executives/owners` toujours requis

**Date:** 14 février 2026  
**Priorité:** 🔴 Bloquant (l'utilisateur boucle après Review/Verify)  
**Contexte:** Connect Custom in-app onboarding

---

## Symptôme côté app
Après avoir complété toutes les étapes visibles (jusqu’à **Review**), l’appel `POST /v1/stripe/onboarding/verify` répond `200` mais:

- `onboarding_complete: false`
- `onboarding_progress: 100`
- `requirements.currently_due` contient toujours des champs **company persons**:
  - `company.directors_provided`, `company.executives_provided`, `company.owners_provided`
  - `directors.*`, `executives.*`, `owners.*`
  - + parfois `company.phone`, `company.registration_number`

Résultat UX:
- L’utilisateur est renvoyé sur des écrans précédents.
- L’app redemande des champs déjà saisis car le backend/Stripe ne les considère pas “satisfaits”.

---

## Cause racine probable
Pour un compte `business_type=company`, Stripe exige souvent:

1) **Flags company**
- `company.directors_provided = true`
- `company.executives_provided = true`
- `company.owners_provided = true`

2) **Persons (Owners/Directors/Executives/Representative)**
- Création des persons via Stripe API (ex: `accounts.createPerson`) avec:
  - identité (first_name/last_name/dob)
  - contact (email/phone)
  - adresse
  - relationship (`owner/director/executive/representative` + `percent_ownership` si owner)

Si le backend:
- ne crée pas ces persons, ou
- ne renseigne pas correctement les relationship, ou
- n’active pas les flags `*_provided`,

alors Stripe garde ces requirements en `currently_due` et `verify` ne peut pas être complet.

---

## Ce que le backend doit implémenter (checklist)

### A) Company fields
- Mapper et envoyer correctement:
  - `company.phone`
  - `company.registration_number`
  - (et idéalement `company.name`, `company.tax_id`)

⚠️ Attention: respecter la branche `company.*` (pas `individual.*`) quand le compte est company.

### B) Persons API (bloquant)
Implémenter une stratégie claire:

**Option 1 — Endpoint dédié persons (recommandé)**
- `POST /v1/stripe/onboarding/person`
  - body: `{ role: "owner"|"director"|"executive"|"representative", person: {...} }`
- Ou `POST /v1/stripe/onboarding/persons` (liste)

Le backend doit:
- Créer/mettre à jour une person Stripe sur le compte (`acct_...`).
- Remplir `relationship` correctement selon le rôle.

**Option 2 — Réutiliser `/personal-info` mais avec structure explicite**
- Accepter quelque chose comme:
```json
{
  "persons": {
    "owners": [ {"first_name": "...", "relationship": {"owner": true, "percent_ownership": 100}, ... } ],
    "directors": [ ... ],
    "executives": [ ... ],
    "representative": { ... }
  }
}
```

### C) Mettre à jour les flags `*_provided`
Une fois que les persons requises sont créées:
- `company.owners_provided = true`
- `company.directors_provided = true`
- `company.executives_provided = true`

### D) `verify` doit être cohérent
- `verify` ne doit pas renvoyer `progress=100` si `currently_due` n’est pas vide.
- Retour attendu:
```json
{
  "success": true,
  "onboarding_complete": false,
  "onboarding_progress": 60,
  "requirements": { "currently_due": ["..."] }
}
```

---

## Validation (non-régression)

1) Flow company
- Compléter `company.*` + persons requis
- Attendu: `requirements.currently_due` diminue étape par étape
- Attendu: `verify` retourne `onboarding_complete=true` quand `currently_due=[]`

2) Sanity Stripe
- Vérifier dans Stripe Dashboard / API:
  - persons présents (owners/directors/executives/representative)
  - relationship correct
  - flags `*_provided` à true

---

## Note frontend (important)
Le frontend peut verrouiller/griser les champs déjà validés **uniquement** si le backend expose des requirements fiables.
Le blocage actuel ne peut pas être résolu à 100% côté app tant que le backend ne satisfait pas les requirements `directors/executives/owners`.
