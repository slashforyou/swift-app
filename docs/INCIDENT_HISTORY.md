# INCIDENT HISTORY

Synthèse des principaux incidents récents (Stripe) avec cause et correctifs appliqués. Ajouter un bloc par incident résolu.

## 2026-02-06 – Onboarding impossible après suppression (company_id unique)

- Contexte: DELETE faisait un soft delete, la contrainte UNIQUE sur company_id bloquait la recréation.
- Symptôme: POST /v1/stripe/onboarding/start → 400 "Company already has a Stripe account".
- Cause racine: ligne résiduelle dans stripe_connected_accounts.
- Fix: passage en hard delete sur DELETE /v1/stripe/account, GET /company/:id/account renvoie 404 quand aucun compte, purge company_id=2.
- Réf: [BACKEND_FIX_ONBOARDING_COMPLETE.md](BACKEND_FIX_ONBOARDING_COMPLETE.md), logs du 6 fév 2026.

## 2026-02-05 – account_status manquant

- Contexte: /v1/stripe/onboarding/complete renvoyait 200 sans account_status → crash frontend.
- Symptôme: "Cannot read property 'charges_enabled' of undefined".
- Cause: backend ne renvoyait pas account_status.
- Fix: endpoint renvoie account_status (snake_case) + garde frontend et écran Completion.
- Réf: [BACKEND_FIX_ONBOARDING_COMPLETE.md](BACKEND_FIX_ONBOARDING_COMPLETE.md), [PROGRESS_STRIPE_ONBOARDING.md](PROGRESS_STRIPE_ONBOARDING.md).

## 2026-02-05 – ToS rejection avec requirement_collection='stripe'

- Contexte: Envoi tos_acceptance à Stripe alors que requirement_collection='stripe'.
- Symptôme: "You cannot accept the Terms of Service...".
- Cause: Stripe gère les ToS automatiquement dans ce mode.
- Fix: ne plus appeler accounts.update avec tos_acceptance; seulement persister en DB et retrieve.
- Réf: [STRIPE_TOS_REQUIREMENT_COLLECTION.md](STRIPE_TOS_REQUIREMENT_COLLECTION.md).

## 2026-02-04 – Champ missing account_status / incohérence snake_case

- Contexte: backend en snake_case, frontend vérifiait camelCase uniquement.
- Symptôme: écrans incomplets, crash en accès charges_enabled.
- Cause: mismatch de propriétés.
- Fix: support snake_case + camelCase, protections null, logs.
- Réf: [STRIPE_BACKEND_MISSING_ACCOUNT_STATUS.md](STRIPE_BACKEND_MISSING_ACCOUNT_STATUS.md).

## 2026-02-04 – ToS must be accepted (premier essai)

- Contexte: backend envoyait tos_acceptance avec requirement_collection='stripe'.
- Symptôme: blocage fin d’onboarding.
- Cause: même racine que ci-dessus.
- Fix: documenté puis remplacé par la solution finale (voir 2026-02-05).
- Réf: [STRIPE_TOS_ACCEPTANCE_FIX.md](STRIPE_TOS_ACCEPTANCE_FIX.md).
