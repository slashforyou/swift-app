# 📌 Stripe — Point général (frontend + backend) & plan de stabilisation

**Date :** 14 février 2026  
**Statut :** 🔴 instable / intégration encore “non lançable” telle quelle  
**Contexte :** Onboarding Connect **Custom in-app** (pas Express) + backend itératif (v2 → v3) + exigences “company persons”.

---

## 1) TL;DR (résumé exécutable)

Aujourd’hui, l’onboarding Stripe fonctionne “par à-coups” mais reste fragile car :

- Le **contrat backend** a évolué (endpoints, payloads, shape des réponses) et le frontend a dû ajouter des **retries de compatibilité**.
- Le cas `business_type=company` est fortement dépendant du système **persons** (owners/directors/executives/representative) et de la manière dont `/persons` fait l’**upsert**.
- Le produit a pris la décision “**1 seul gérant/personne**” : cela impose un backend capable d’**appliquer plusieurs rôles sur une même person** (ou de faire un upsert par identité/person_id).
- Le Hub (`StripeHub`) considère à tort l’onboarding “complet” dès que `details_submitted=true` → UX incohérente (dashboard affiché alors qu’il manque encore des requirements).

➡️ Mise à jour (backend) : un correctif **v3.1** est annoncé côté backend pour rendre `/persons` idempotent (upsert + single_person_mode) + ajouter `request_id` + exposer `person_id`.

➡️ Côté app, il faut maintenant **aligner le frontend** sur ce contrat (payload `/persons` + routing `person_*` + logique “compte complet” basée sur requirements).

---

## 2) Cartographie du système Stripe en place

### 2.1 Frontend — points d’entrée

- Hub business : [src/screens/business/StripeHub.tsx](src/screens/business/StripeHub.tsx)
  - Décide d’afficher : écran d’onboarding vs dashboard.
  - Bouton “Complete profile” → navigation vers `StripeOnboarding`.
  - **Bug logique actuel** : `isOnboardingComplete = details_submitted || onboarding_completed` (trop permissif).

- Hook compte Stripe : [src/hooks/useStripe.ts](src/hooks/useStripe.ts)
  - `useStripeAccount()` charge `fetchStripeAccount()` + balance etc.
  - Typage `AccountInfo` en snake_case.

- Service API Stripe : [src/services/StripeService.ts](src/services/StripeService.ts)
  - Récupère `company_id` depuis le profil (et SecureStore en fallback).
  - Orchestration onboarding (custom) :
    - `/start`, `/personal-info`, `/business-profile`, `/address`, `/bank-account`, `/document`, `/verify`, `/complete`
    - v3 : `/persons` + `/verify` check-only + `/complete` finalise ToS
  - Plusieurs **compat layers** (retry si validation backend inattendue).

### 2.2 Frontend — flow onboarding (écrans)

- Steps mapping : [src/screens/Stripe/OnboardingFlow/onboardingSteps.ts](src/screens/Stripe/OnboardingFlow/onboardingSteps.ts)
  - Mappe des `requirements.*` vers un écran (`CompanyDetails`, `Representative`, etc.).
  - Mappe `directors.* / executives.* / owners.*` → `Representative`.
  - **Manque** : mapping explicite des champs du type `person_<id>.*`.

- Écrans : [src/screens/Stripe/OnboardingFlow](src/screens/Stripe/OnboardingFlow)
  - `ReviewScreen` : coche CGU puis `verifyOnboarding()` puis `completeOnboarding(true)` si complet.
  - `RepresentativeScreen` : en company, appelle `submitCompanyPersons()`.

### 2.3 Backend — endpoints observés / attendus

(les URLs exactes varient mais la structure est stable)

- Hub/Company account : `GET /v1/stripe/company/:companyId/account`
  - Retourne `stripeAccountId`, status `pending_verification` etc.

- Onboarding custom :
  - `POST /v1/stripe/onboarding/start`
  - `POST /v1/stripe/onboarding/personal-info`
  - `POST /v1/stripe/onboarding/business-profile`
  - `POST /v1/stripe/onboarding/address`
  - `POST /v1/stripe/onboarding/bank-account`
  - `POST /v1/stripe/onboarding/document`
  - `POST /v1/stripe/onboarding/verify` (v3 : check-only)
  - `POST /v1/stripe/onboarding/complete` (ToS finalisation)
  - `POST /v1/stripe/onboarding/persons` (v3 : company persons)

---

## 3) Erreurs actuelles (confirmées par logs)

### 3.1 ✅ ToS (CGU) — erreur supprimée côté app

Symptôme historique : `verifyOnboarding()` bloquait client-side avec “Terms of service must be accepted”.

- Fix : `/verify` ne doit pas exiger ToS (v3), ToS gate doit rester sur `/complete`.

### 3.2 ✅ Crash DOB (Representative) — date stockée en string

Symptôme : `date.toLocaleDateString is not a function`.

- Cause : `dob` stocké via `JSON.stringify` → rechargé en string.
- Fix : normalisation `dob` → `Date` avant render/submit.

### 3.3 🔴 Company persons — DUPLICATE PERSON (bloquant, avant correction backend v3.1)

Log /persons :

- `/persons` renvoie `200` mais `success:false` avec :
  - `created_persons`: 1 personne créée en role `representative`
  - `errors`: 3 erreurs pour `owner/director/executive`
  - message : `The same person cannot be provided on an account more than once. This person is identical to 'person_...'`
  - `requirements_pending`: `person_<id>.relationship.title`

**Interprétation la plus probable :**

- Le backend implémente `/persons` comme **create** d’une person Stripe par rôle (owner/director/executive/representative).
- Le frontend (MVP “1 seule personne”) envoie la **même identité** dans owners/directors/executives.
- Stripe refuse de créer plusieurs persons identiques sur un même compte.

➡️ Résultat : la stratégie “single person” n’est pas compatible avec un backend qui “create par rôle” au lieu de “upsert / update relationship sur la même person”.

**Mise à jour backend (rapport v3.1) :**

- `/persons` devient **idempotent** : liste des persons existantes, détection par identité (nom/prénom/DOB), puis `updatePerson` si existe, `createPerson` sinon.
- Ajout d’un **single_person_mode** : applique `representative+owner+director+executive` sur **une seule person** (avec `percent_ownership=100` + `title='Director'`).
- La réponse `/persons` retourne : `person_id`, `roles_applied`, `person_result.action (created|updated)`, `request_id`.

➡️ Concrètement : dès que le backend v3.1 est déployé, l’erreur “same person cannot be provided more than once” ne doit plus apparaître si le frontend envoie un payload compatible.

### 3.4 🔴 Hub/UX — onboarding considéré “complet” trop tôt

Dans `StripeHub`, `renderOnboardingScreen()` calcule :

- `isOnboardingComplete = accountInfo?.details_submitted || accountInfo?.onboarding_completed`

Or dans tes logs, on a :

- `details_submitted: true`
- `requirements.currently_due` et `past_due` remplis (company persons encore dus)

➡️ Le Hub peut afficher le dashboard alors que le compte est **restricted/past_due** et qu’il manque des infos. Cela rend l’expérience “ça marche / ça marche pas” et provoque des boucles.

### 3.5 ⚠️ Session `ensureSession timed out`

On voit régulièrement : `ensureSession timed out after 15 seconds`.

- Probable bruit/perf : pas forcément la cause racine du Stripe, mais augmente la variabilité (timeout/rafraîchissements).  
- À traiter dans le plan de stabilisation (corrélation request_id, retries, durée de refresh token, etc.).

---

## 4) Erreurs “prochaines” très probables (si on continue sans refonte)

### 4.1 `person_<id>.*` non routable

Le backend renvoie déjà : `person_<id>.relationship.title`.

- `onboardingSteps.ts` ne mappe pas `person_` → aucun step explicite (côté app).
- Risque UX : l’app reste sur Review ou redirige mal, car elle ne sait pas “où aller” pour satisfaire ce champ.

**Mise à jour backend (rapport v3.1) :** `next_step` est amélioré pour router `person_*` vers `persons`. Le frontend doit malgré tout mapper `person_*` vers l’écran `Representative` (qui est l’écran “persons” côté app).

### 4.2 Idempotence / doublons “à chaque retry”

Si `/persons` est appelé plusieurs fois (retry, back/next, refresh) :

- sans clé d’idempotence ou sans logique d’update → multiplication de persons / erreurs Stripe / état impossible à stabiliser.

### 4.3 Incohérences entre `requirements` et `progress`

On observe déjà des progress (ex: 85, 100) qui ne reflètent pas l’état réel des `currently_due/past_due`.

- Risque : le frontend auto-skip / auto-advance sur une base fausse et boucle.

### 4.4 Company vs Individual — mapping de branches

Historique : payload `individual.*` exigé sur un compte company et inversement.

- Risque récurrent tant que le backend n’a pas une “source de vérité” déterministe du `business_type` et de la branche mise à jour.

---

## 5) Conclusion : pourquoi “ça s’empile”

Le coût augmente parce que :

1) Le backend renvoie des exigences Stripe **dynamiques** (requirements) et le frontend tente de “s’adapter” avec des retries/heuristiques.
2) Le système persons est intrinsèquement **stateful** (IDs Stripe, relationship flags, upsert) → si le backend n’est pas idempotent, chaque correction côté app aggrave les effets de bord.
3) Le Hub mélange “compte créé / details_submitted” avec “onboarding réellement complet”.

---

## 6) Spécification minimale d’une solution viable (avant dev)

> Objectif : définir une cible stable, pas ajouter des patchs.

### 6.1 Contrat backend (à figer)

1) **Schéma de réponse commun** pour tous endpoints onboarding :
   - `success` (bool)
   - `progress`/`onboarding_progress` (number)
   - `requirements` (currently_due/eventually_due/past_due)
   - `next_step` (optionnel)
   - `account_status` (charges_enabled/payouts_enabled/details_submitted)
   - `error`/`message` + `required[]` si validation

2) `/verify` (v3)
   - check-only : ne finalise pas ToS
   - retourne `requirements` fiables

3) `/complete`
   - unique endpoint ToS finalisation
   - idempotent (si déjà fait → success)

4) `/persons` (le point clé)

Deux options compatibles “single person” :

- **Option A (recommandée)** : un seul objet person avec flags relationship multiples
  - Le backend doit créer **1 person** puis **update** relationship sur cette même person (owner/director/executive/representative).
  - Le backend doit gérer **un `person_id` stable**.

- **Option B** : API d’upsert par fingerprint
  - Payload inclut `person_id` si connu.
  - Sinon, backend cherche la person existante (email+dop+nom) et update au lieu de create.

Dans tous les cas :
- Pas de “create par rôle” si les données sont identiques.
- Retourner l’ID Stripe `person_id` et les rôles effectivement appliqués.

**Mise à jour backend (rapport v3.1) :** ces points sont annoncés comme implémentés (upsert + `person_id` + `request_id` + single_person_mode).

### 6.2 Contrat frontend (à aligner)

- Mapper `person_<id>.*` → `Representative` (au minimum) ou vers une étape dédiée si on en crée une.
- Ne jamais considérer “onboarding complet” tant que `currently_due` ou `past_due` n’est pas vide.
- Stocker `person_id` localement (SecureStore) uniquement si backend le supporte (sinon pas utile).

### 6.3 Observabilité / debug

- Ajouter `request_id` côté backend et logger `stripe_request_id`.
- Sur chaque endpoint : logger `account_id`, `business_type`, `updated_branch`, `requirements` avant/après.

---

## 7) Actions recommandées (ordre)

1) Confirmer que le backend v3.1 est **déployé** (sinon on reste bloqué sur les doublons) et récupérer un exemple réel de réponse `/persons` avec `request_id`.

2) Aligner le frontend sur le mode “single person” :
  - envoyer un payload `/persons` qui déclenche le `single_person_mode` (ne pas recréer un owner/director/executive séparément si c’est la même identité).

3) Corriger la logique “compte complet” du Hub : se baser sur `requirements` (et/ou `charges_enabled/payouts_enabled`), pas `details_submitted`.

4) Mettre à jour le mapping de `person_<id>.*` vers l’écran `Representative`.

5) Logguer `request_id` côté app sur `/persons` + `/verify` + `/complete` pour debug support.

---

## Annexes

- Blocage persons (doc existant) : [docs/bugs/active/BACKEND_STRIPE_COMPANY_PERSONS_REQUIREMENTS_BLOCKER_14_02_2026.md](docs/bugs/active/BACKEND_STRIPE_COMPANY_PERSONS_REQUIREMENTS_BLOCKER_14_02_2026.md)
- Audit backend (doc existant) : [docs/bugs/active/BACKEND_STRIPE_ONBOARDING_FORM_RISK_AUDIT_12_02_2026.md](docs/bugs/active/BACKEND_STRIPE_ONBOARDING_FORM_RISK_AUDIT_12_02_2026.md)
