# Jeu de donnees test - Paiements (jobs + invoices)

## Objectif

Fournir un set minimal reproductible pour valider tous les cas paiement (OK/KO).

## Entites

### 1) Companies

- Company A (active Stripe):
  - id: 2
  - name: Test Frontend
  - stripe_account_id: acct_active_123
  - charges_enabled: true
  - payouts_enabled: true

- Company B (Stripe inactive):
  - id: 3
  - name: Test Onboarding
  - stripe_account_id: acct_inactive_456
  - charges_enabled: false
  - payouts_enabled: false

### 2) Users

- Owner A:
  - id: 15
  - email: ownerA@test.com
  - role: admin
  - company_id: 2

- Owner B:
  - id: 16
  - email: ownerB@test.com
  - role: admin
  - company_id: 3

### 3) Clients

- Client OK:
  - id: 19
  - email: test@example.com
  - stripe_customer_id: cus_valid_123
  - stripe_customer_account_id: acct_active_123
  - stripe_customer_account_type: connected

- Client invalide:
  - id: 20
  - email: invalid@example.com
  - stripe_customer_id: cus_invalid_999
  - stripe_customer_account_id: acct_active_123
  - stripe_customer_account_type: connected

### 4) Jobs

- Job interne (company A):
  - id: 31
  - code: JOB-TEST-20260201-704
  - contractor_company_id: 2
  - contractee_company_id: 2
  - job_users: none (auto-assign attendu)
  - amount_total: 450

- Job externe (assigne, company A):
  - id: 25
  - code: JOB-PIERRE-20260121-598
  - contractor_company_id: 2
  - contractee_company_id: 4
  - job_users: owner A assigne
  - amount_total: 630

- Job externe (non assigne, company A):
  - id: 26
  - code: JOB-EXT-UNASSIGNED-001
  - contractor_company_id: 2
  - contractee_company_id: 4
  - job_users: none
  - amount_total: 300

### 5) Invoices

- Invoice A (company A):
  - id: 101
  - job_id: 31
  - client_id: 19
  - amount_due: 450
  - currency: AUD

- Invoice B (company B):
  - id: 102
  - job_id: 32
  - client_id: 19
  - amount_due: 500
  - currency: AUD

## Scenarios principaux

### A) Jobs - create/confirm OK

- Actor: Owner A (company 2)
- Target: Job interne (id 31)
- Expect:
  - create -> 201 (client_secret + stripe_account_id)
  - confirm -> 200 (paid)

### B) Jobs - onboarding incomplet

- Actor: Owner B (company 3)
- Target: Job interne company 3
- Expect:
  - create -> 400 action_required=complete_stripe_onboarding
  - UI: message onboarding + CTA StripeHub

### C) Jobs - customer invalide

- Actor: Owner A
- Target: Job externe (id 25) + client invalide
- Expect:
  - create -> retry auto backend
  - si retry OK -> 201
  - sinon -> 400 avec message clair

### D) Jobs - non assigne (externe)

- Actor: Owner A
- Target: Job externe non assigne (id 26)
- Expect:
  - create -> 401/403

### E) Invoices - create email OK

- Actor: Owner A
- Target: Invoice A (id 101)
- Expect:
  - /v1/stripe/invoices/create -> 200
  - hosted_invoice_url present

### F) Invoices - create email KO (onboarding)

- Actor: Owner B
- Target: Invoice B (id 102)
- Expect:
  - 400 action_required

### G) Invoices - paiement direct (si active)

- Actor: Owner A
- Target: Invoice A
- Expect:
  - create-payment-intent -> 201
  - confirm -> 200

## Notes

- Les ids sont exemples; adapter a la base reelle.
- Si besoin, garder une version "sandbox" pour ces donnees.
