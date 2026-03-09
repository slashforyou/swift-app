# 🚨 Audit backend — Risques d'erreur du formulaire Stripe Onboarding (Custom)

**Date:** 12 février 2026  
**Statut:** 🔴 Action backend requise  
**Scope:** Flux onboarding in-app `start → personal-info → business-profile → address → bank-account → document → verify`

---

## 1) Incident corrigé côté frontend (ce soir)

### Symptôme observé

- `POST /v1/stripe/onboarding/personal-info` depuis l'étape **Representative** retournait `400 VALIDATION_ERROR` avec:
  - `accountBusinessType: "company"`
  - `required: ["company.name"]`

### Correctif appliqué côté app

- Le frontend envoie maintenant un payload representative **complet** (incluant `address` et `relationship`) sur `/personal-info`.
- Si le backend répond encore `400` avec exigence `company.name` (mode company), le frontend fait un **retry de compatibilité** avec:
  - `{ company: { name } }`
- Objectif: ne plus bloquer l'utilisateur au step Representative en attendant l'alignement backend final.

> Note: c'est un contournement de compatibilité, pas la cible finale de contrat.

---

## 2) Audit des points à risque (formulaire → backend)

## P0 — Bloquants probables

### A. `POST /onboarding/personal-info` : contrat ambigu selon le contexte

**Risque**

- Endpoint utilisé pour plusieurs étapes (personal/company/representative) avec des payloads différents.
- Peut exiger tantôt `individual.*`, tantôt `company.*` sans signal explicite stable.

**Impact utilisateur**

- `400 VALIDATION_ERROR` selon l'ordre des étapes.
- Boucle de blocage entre Company/Representative.

**Attendu backend**

- Contrat déterministe basé sur `business_type` du compte Stripe.
- Message de validation explicite avec payload attendu.

---

### B. `POST /onboarding/address` : branche cible Stripe potentiellement incorrecte

**Risque**

- Mapping possible sur `individual.address` pour un compte `company` (ou inversement).

**Impact utilisateur**

- `500` Stripe sémantique (paramètres incompatibles avec le type de compte).

**Attendu backend**

- `company` → `company.address`
- `individual` → `individual.address`
- Rejet en `4xx` si payload incohérent, pas en `500`.

---

### C. Transition d'étapes non alignée avec `requirements`

**Risque**

- Le backend peut marquer des champs dus qui ne correspondent pas au step en cours (ex: representative mais endpoint attend company).

**Impact utilisateur**

- L'app enchaîne sur un step qui ne peut pas réussir même avec des données valides.

**Attendu backend**

- `next_step` et `requirements` cohérents avec la dernière écriture Stripe réussie.

---

## P1 — Risques élevés (non systématiques)

### D. Erreurs de validation hétérogènes

**Risque**

- Mélange entre `error`, `code`, `message`, `required`, `details` selon endpoint.

**Impact**

- Gestion d'erreurs fragile côté app et UX incohérente.

**Attendu backend**

- Schéma unique:

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "code": "VALIDATION_ERROR",
  "message": "...",
  "required": ["..."],
  "details": { "expectedPayload": {} }
}
```

---

### E. Distinction erreur métier vs erreur serveur

**Risque**

- Erreurs de payload envoyées en `500`.

**Impact**

- Faux incidents serveur, débogage ralenti, monitoring bruité.

**Attendu backend**

- `400/422` pour validation/input.
- `500` uniquement pour erreurs internes inattendues.

---

## P2 — Risques de robustesse

### F. Dépendance à la session côté app (`ensureSession timed out`)

**Observation**

- Warning vu dans les logs.
- Non identifié comme cause racine des erreurs Stripe actuelles.

**Action recommandée**

- Conserver une trace corrélée `request_id` backend pour confirmer la distinction timeout session vs erreur Stripe contractuelle.

---

## 3) Checklist backend priorisée

## Priorité immédiate (P0)

- [ ] Sur chaque endpoint onboarding, lire `business_type` réel du compte Stripe **avant** `accounts.update`.
- [ ] Router strictement les écritures vers la bonne branche (`company.*` / `individual.*`).
- [ ] Stabiliser le contrat de `/personal-info` (déterministe, documenté, non ambigu).
- [ ] Retourner des `4xx` actionnables en cas de payload invalide.

## Priorité courte (P1)

- [ ] Uniformiser le format des erreurs JSON sur tous les endpoints onboarding.
- [ ] Garantir cohérence `onboarding_progress`, `next_step`, `requirements` après chaque update.

## Priorité robustesse (P2)

- [ ] Ajouter logs structurés par endpoint:
  - `account_id`
  - `business_type`
  - `endpoint`
  - `payload_branch_used` (`company`/`individual`)
  - `stripe_request_id`

---

## 4) Plan de validation non-régression

1. **Flow company complet**
   - `start → personal-info → business-profile → address → bank-account → document → verify`
   - Attendu: pas de `400` contradictoire, pas de `500` Stripe sémantique.

2. **Flow individual complet**
   - Même séquence.
   - Attendu: écritures uniquement `individual.*`.

3. **Contrôle Stripe final**
   - Champs bien écrits dans la branche correspondant au `business_type`.
   - `requirements.currently_due` diminue de façon cohérente à chaque étape.

---

## 5) Résumé exécutable backend

Le point critique n'est plus l'UI du formulaire: c'est l'**incohérence de contrat backend** entre les étapes et le `business_type` du compte Stripe.

Tant que `/personal-info` et `/address` ne sont pas strictement branchés `company` vs `individual`, le flux restera fragile même avec des données frontend correctes.
