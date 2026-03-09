# Plan de tests paiement (jobs + invoices)

## Objectif


Avoir une suite de tests manuels et automatisables pour valider chaque changement sans regressions.


## 1) Preconditions communes

- Environnement stable (API dev/staging).
- Un compte company avec Stripe Connect actif (charges_enabled=true).
- Un compte company avec Stripe Connect inactif (charges_enabled=false).
- Un client avec stripe_customer_id valide.
- Un client avec stripe_customer_id invalide (simulateur pour retry).
- Un job interne (contractor=contractee) sans job_users au depart.
- Un job externe avec job_users assigne.



## 2) Jobs - Paiement carte (PaymentSheet)

### Cas OK

1. Job interne owner, charges_enabled=true
   - /payment/create -> 201 + client_secret + stripe_account_id
   - PaymentSheet init OK
   - /payment/confirm -> 200
   - job.payment_status -> paid

2. Job externe assigne, charges_enabled=true
   - /payment/create -> 201

   - PaymentSheet init OK
   - /payment/confirm -> 200

### Cas erreurs
2
3. charges_enabled=false
   - /payment/create -> 400 action_required=complete_stripe_onboarding
   - UI: message onboarding + CTA StripeHub

4. Stripe customer invalide

   - /payment/create -> retry auto backend
   - Si retry OK -> 201
   - Si retry KO -> 400 et message clair

## 3) Jobs - Paiement "autre" (offline)

1. Cash / Virement / Autre
   - /payment/create -> 201
   - /payment/confirm -> 200
   - job.payment_status -> paid


2. Repetition (idempotence confirm)
   - /payment/confirm appelle 2x
   - 2e reponse -> 200 "Payment already confirmed"

## 4) Invoices - Creation email

1. createStripeInvoice (send_invoice)
   - /v1/stripe/invoices/create -> 200

   - hosted_invoice_url present

2. charges_enabled=false
   - /v1/stripe/invoices/create -> 400 action_required
   - UI message onboarding

## 5) Invoices - Paiement direct (si active)


1. create-payment-intent
   - /v1/payments/create-payment-intent -> 201
   - client_secret present

2. confirm
   - /v1/payment/confirm -> 200


## 6) Assignation / authorisation

1. Job interne sans job_users
   - Create/confirm OK (owner same-company)


2. Job externe sans job_users
   - /payment/create -> 401/403

## 7) Non-regression UI

- Aucun crash lors de retour ecran JobDetails apres paiement.

- Alertes d'erreur affichent un message clair.
- CTA StripeHub fonctionne.

## 8) Checks automatiques (idee)


- Ajouter un smoke test e2e (Detox) pour:
  - ouvrir JobDetails
  - lancer paiement (mocked)
  - verifier alert et etat UI

## 9) Traceurs logs minimum

- [JOB PAYMENT] create/confirm
- [STRIPE INVOICE] create
- [INVOICE PAYMENT] create/confirm

## Sortie attendue

Toutes les etapes critiques passent sans 500, sans crash UI, et sans regressions de paiement.
