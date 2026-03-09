# Audit paiement - Correctifs backend recommandés

## Objectif

Réduire au maximum les erreurs futures sur le flux paiement (create/confirm/history) pour jobs internes et externes, Stripe Connect et clients existants.

## Statut backend (mis en place 2026-02-07)

- Jobs paiement: validation amount/currency, idempotency key, retry customer "No such customer", correction scope customer, idempotence confirm, logs structures.
- Invoices paiement: charges_enabled check, idempotency key, retry customer, scope customer, logs structures.
- Auto-assign job_users sur job interne (creator insere automatiquement).
- Migration DB: ajout de clients.stripe_customer_account_id et clients.stripe_customer_account_type.
- Comportement: 400 action_required=complete_stripe_onboarding si compte Stripe pas pret.

## Verification front (a mettre en place / confirme)

- Jobs: utiliser stripe_account_id renvoye par /payment/create pour initialiser le SDK Stripe.
- Erreur action_required: afficher un message clair + CTA vers StripeHub / refresh-onboarding.
- Invoices: le front utilise actuellement /v1/stripe/invoices/create.
  - Backend expose aussi /v1/payments/create-payment-intent et /v1/payment/confirm pour paiement direct d'une facture.
  - A clarifier si un flow de paiement direct facture est necessaire cote app.

## Checklist test rapide (action_required)

1. Forcer une company avec charges_enabled=false.
2. Lancer un paiement job -> verifier 400 action_required.
3. L'app affiche le message onboarding + bouton StripeHub.
4. Ouvrir StripeHub, relancer refresh onboarding.
5. Une fois charges_enabled=true, relancer create/confirm.

## 1) Autorisations & assignation

### Problème constaté

- Les jobs internes sans job_users ont provoqué des 404/401 auparavant.

### Correctifs recommandés

- Appliquer un garde "owner/admin same-company" sur tous les endpoints paiement:
  - POST /v1/jobs/{id}/payment/create
  - POST /v1/jobs/{id}/payment/confirm
  - GET /v1/jobs/{id}/payments
- Ne pas ouvrir inter-company (garde strict sur contractee_company_id == contractor_company_id).
- Optionnel: créer automatiquement job_users (creator/owner) sur création d'un job interne.

## 2) Gestion Stripe Customer (source 400 "No such customer")

### Problème constaté

- Stripe renvoie "No such customer" quand l'id en DB n'existe plus ou est lié au mauvais account.

### Correctifs recommandés

- Lors de /payment/create:
  - Si customer_id absent -> créer un customer Stripe et persister.
  - Si Stripe répond "No such customer" -> recréer le customer et mettre à jour la DB, puis retenter la création du PaymentIntent une seule fois.
  - Enregistrer quelle "Stripe account" a généré le customer (platform vs connected) pour éviter des IDs cross-account.
- Ajouter une clé de compatibilité: si le customer appartient au compte connecté, mais le PI est créé côté platform (ou inverse), corriger le contexte Stripe.

## 3) Stripe Connect & onboarding

### Problème constaté

- Erreurs "Company Stripe account not connected".

### Correctifs recommandés

- Endpoint /company/{id}/account doit renvoyer:
  - stripe_account_id
  - charges_enabled
  - payouts_enabled
  - requirements.currently_due
- Dans /payment/create:
  - Si stripe_account_id absent ou charges_enabled=false -> retourner 400 avec action_required=complete_stripe_onboarding.
  - Logs et event dédié pour debug.

## 4) Robustesse /payment/confirm (500 userCompanyId)

### Problème constaté

- Variable manquante provoque crash en prod.

### Correctifs recommandés

- Standardiser les variables obligatoires:
  - userId
  - userCompanyId
  - jobId
  - stripe_account_id
- Ajouter un guard early return avec 400 explicite si une donnée critique est manquante.
- Ajouter logs structurés (payload, session user, company) pour reproduire rapidement.

## 5) Idempotence et retries

### Problèmes possibles

- Double envoi create/confirm lors de retry front ou double tap.

### Correctifs recommandés

- /payment/create:
  - Ajouter idempotency key côté backend (par jobId + amount + date) pour éviter doubles intents.
- /payment/confirm:
  - Si PaymentIntent déjà confirmé, renvoyer 200 avec un message "already_confirmed".

## 6) Validation de payload et data types

### Problèmes possibles

- amount en cents vs dollars, currency incorrecte.

### Correctifs recommandés

- Valider que amount est un entier positif.
- Normaliser currency en lower-case, et refuser les devises non supportées.
- Loguer amount avant et après conversion en cents.

## 7) Synchronisation job/payment

### Problèmes possibles

- payment_status non mis à jour, job incohérent.

### Correctifs recommandés

- Après confirm réussi:
  - mettre à jour job.payment_status, job.payment_time, amount_paid, amount_due.
  - enregistrer transaction_id Stripe.
- Si confirm échoue:
  - stocker un paiement en "failed" pour audit.

## 8) Journalisation & observabilité

### Recommandations

- Log structuré par endpoint:
  - jobId, companyId, userId, stripe_account_id, payment_intent_id
  - status, error, stripe_error_type
- Envoyer les erreurs Stripe dans un channel dédié (Sentry/Datadog).

## 9) Tests backend essentiels

### Tests unitaires/integration

- Job interne owner sans job_users -> create/confirm OK.
- Job externe sans job_users -> 403/401.
- Customer absent -> auto-create OK.
- Customer invalide -> recreate OK.
- Onboarding incomplet -> 400 action_required.
- Idempotency create -> un seul PI.
- Confirm double -> 200 already_confirmed.

## 10) Migration/maintenance DB

### Recommandations

- Script de vérification périodique des stripe_customer_id:
  - détecter les customers inexistants
  - nettoyer / régénérer si besoin
- Vérifier cohérence company.stripe_account_id et status.

## Résumé actions prioritaires (ordre)

1. Fix /payment/confirm (userCompanyId undefined) + guards.
2. Gestion robuste des Stripe customer (recreate si invalide).
3. Autorisation job interne owner same-company sur tous endpoints paiement.
4. Idempotency keys + logging amélioré.
5. Tests d'intégration.
