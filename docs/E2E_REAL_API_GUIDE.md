# 🧪 Guide E2E — Tests Réels API (altivo.fr)

**Date:** 3 Mars 2026 (mis à jour)  
**Script:** `scripts/e2e-real-api.js`  
**Score actuel:** ✅ **83% (15/18)** — 15 PASS · 3 WARN (attendus) · 0 FAIL

> ⚠️ **Avant de lancer FLOW 11-14** (invite employé / acceptation job), relancer le script de reset côté serveur :
>
> ```powershell
> ssh sushinari "node /tmp/setup_test_data.js"
> ```

---

## 🔑 Réponse directe

**Oui**, il suffit de lancer cette commande — aucun prérequis supplémentaire :

```powershell
# PowerShell (Windows)
$env:MAIL="admin.test@nerd-test.com"; $env:PASSWORD="Swift@Test2026!"; node scripts/e2e-real-api.js
```

```bash
# Bash / macOS / Linux
MAIL=admin.test@nerd-test.com PASSWORD=Swift@Test2026! node scripts/e2e-real-api.js
```

Le script gère lui-même la connexion, l'authentification et tous les tests. Aucune app ouverte, aucun mock, aucun serveur local à démarrer.

---

## ✅ Prérequis

| Prérequis                      | Vérification            | Notes                                         |
| ------------------------------ | ----------------------- | --------------------------------------------- |
| Node.js ≥ 16                   | `node --version`        | Aucun `npm install` requis                    |
| Connexion internet             | ping `altivo.fr`        | Le backend est `https://altivo.fr/swift-app/` |
| VPN désactivé                  | —                       | Peut bloquer les requêtes HTTPS               |
| Être dans le dossier du projet | `pwd` → `.../swift-app` | Le script est en `scripts/`                   |

> ⚠️ Le script utilise **uniquement des modules Node.js natifs** (`https`, `http`, `url`). Aucun `npm install` à faire.

---

## 🧾 Credentials de test configurés

Ces credentials ont été **créés et configurés sur le serveur** lors de la session précédente.

| Champ              | Valeur                     |
| ------------------ | -------------------------- |
| **Email**          | `admin.test@nerd-test.com` |
| **Password**       | `Swift@Test2026!`          |
| **Rôle DB**        | `admin`                    |
| **Company**        | Nerd-Test (ID=2)           |
| **company_role**   | `patron`                   |
| **Stripe Connect** | ✅ Compte configuré        |

> Ces credentials sont **permanents en base** (MySQL `swiftapp`). Ils ne disparaissent pas au redémarrage du serveur.

### Comptes alternatifs (même mot de passe `Swift@Test2026!`)

Les 5 comptes nerd-test sont tous opérationnels — choisissez selon le rôle à tester :

| Email                           | Rôle DB  | company_role | userId |
| ------------------------------- | -------- | ------------ | ------ | -------------------------------------------------------------------------- |
| `admin.test@nerd-test.com`      | admin    | patron       | 24     |
| `manager.test@nerd-test.com`    | manager  | patron       | 25     |
| `employee.test@nerd-test.com`   | employee | patron       | 26     |
| `driver.test@nerd-test.com`     | employee | patron       | 27     |
| `supervisor.test@nerd-test.com` | manager  | patron       | 28     |
| `new.employee@nerd-test.com`    | —        | —            | 35     | Compte employee **sans company** — utilisé par FLOW 12 (accept invitation) |

```powershell
# Exemple avec supervisor
$env:MAIL="supervisor.test@nerd-test.com"; $env:PASSWORD="Swift@Test2026!"; node scripts/e2e-real-api.js
```

---

## 🚀 Modes de lancement

### Mode 1 — Login automatique avec credentials (recommandé)

```powershell
$env:MAIL="admin.test@nerd-test.com"; $env:PASSWORD="Swift@Test2026!"; node scripts/e2e-real-api.js
```

Le script effectue lui-même la connexion et récupère le `sessionToken`.

---

### Mode 2 — Token JWT existant (depuis l'app ou DevTools)

Si vous avez un token actif (depuis l'app React Native en debug) :

```powershell
$env:TOKEN="votre_session_token_ici"; node scripts/e2e-real-api.js
```

Pour récupérer le token depuis l'app :

1. Lancer l'app avec `npx expo start`
2. Ouvrir les **DevTools React Native** ou **Flipper**
3. Chercher dans **AsyncStorage** ou **SecureStore** la clé `sessionToken`
4. Copier la valeur et la coller dans la commande ci-dessus

---

### Mode 3 — Token JWT en variable shell persistante (pour tests répétés)

```powershell
# Lancer une fois pour obtenir + mémoriser le token
$env:MAIL="admin.test@nerd-test.com"; $env:PASSWORD="Swift@Test2026!"
node scripts/e2e-real-api.js
# Copier le sessionToken depuis les logs si besoin
```

---

## 📋 Ce que teste le script (14 flows, 18 assertions)

### FLOW 1 — Authentification

**Endpoint :** `POST https://altivo.fr/swift-app/auth/login`

```json
{
  "mail": "admin.test@nerd-test.com",
  "password": "Swift@Test2026!",
  "device": { "name": "e2e-test-script", "platform": "android" },
  "wantRefreshInBody": true
}
```

✅ **Vérifie :** HTTP 200 + présence de `sessionToken` dans la réponse  
➡️ **Si FAIL ici :** Tous les autres flows s'arrêtent (pas de token = pas d'auth)

---

### FLOW 2 — User Profile & company_role (fix critique)

**Endpoint :** `GET /v1/user/profile`  
**Auth :** `Bearer {sessionToken}`

✅ **Vérifie :**

- HTTP 200
- `companyRole` présent dans la réponse (fix déployé le 28/02/2026)
- `companyId` présent dans la réponse

**Réponse attendue :**

```json
{
  "id": 24,
  "companyRole": "patron",
  "companyId": 2,
  "role": "admin"
}
```

---

### FLOW 3 — Calendrier

**Endpoint :** `POST /calendar-days`  
**Auth :** `Bearer {sessionToken}`

```json
{
  "startDate": "01-02-2026",
  "endDate": "28-02-2026"
}
```

✅ **Vérifie :** HTTP 200 + réponse en tableau (peut être vide si pas de jobs ce mois)

---

### FLOW 4 — Clients

**Endpoint :** `GET /v1/clients`  
**Auth :** `Bearer {sessionToken}`

✅ **Vérifie :** HTTP 200 + réponse en tableau (peut être vide)

---

### FLOW 5a — Notification Preferences

**Endpoint :** `GET /v1/users/notification-preferences`  
**Auth :** `Bearer {sessionToken}`

✅ **Vérifie :** HTTP 200

> Ce endpoint nécessitait `authenticateToken` middleware (correctif déployé le 28/02/2026)

---

### FLOW 5b — Enregistrement Push Token

**Endpoint :** `POST /v1/users/push-token`  
**Auth :** `Bearer {sessionToken}`

```json
{
  "push_token": "ExponentPushToken[e2e-test-fake-token-123]",
  "platform": "android",
  "device_name": "e2e-test-script"
}
```

✅ **Vérifie :** HTTP 200 ou 201

---

### FLOW 6 — Business Owner Complete Profile

**Endpoint :** `POST /business-owner/complete-profile`  
**Auth :** `Bearer {sessionToken}`

✅ **Vérifie :** Que l'endpoint est opérationnel  
⚠️ **WARN attendu :** `"User already has a company"` — car `admin.test@nerd-test.com` a déjà `company_id=2`. **Ce WARN est normal et non bloquant.**

> Pour tester ce flow à 100%, il faudrait un compte sans `company_id`. Ce n'est pas critique pour le MVP.

---

### FLOW 7 — Stripe Balance (validation fix SDK)

**Endpoint :** `GET /v1/stripe/balance`  
**Auth :** `Bearer {sessionToken}`

✅ **Vérifie :** HTTP 200 — confirme que le bug Stripe SDK (`stripeAccount` dans le mauvais argument) est bien corrigé

---

### FLOW 8 — Job Payment Create

**Endpoint :** `POST /v1/jobs/{jobId}/payment/create`  
**Auth :** `Bearer {sessionToken}`

✅ **Vérifie :** 201 + `payment_intent_id` Stripe  
⚠️ **WARN attendu** si le job a déjà été payé (idempotent)

---

### FLOW 9 — Job Payment Confirm

**Endpoint :** `POST /v1/jobs/{jobId}/payment/confirm`  
⚠️ **Skipped** si FLOW 8 n'a pas créé de nouveau PaymentIntent (job déjà payé)

---

### FLOW 10 — Job Payment History

**Endpoint :** `GET /v1/jobs/{jobId}/payments`  
✅ **Vérifie :** 200 + liste des paiements du job

---

### FLOW 11 — Staff Invite (invitation employé)

**Endpoint :** `POST /v1/staff/invite`  
**Auth :** `Bearer {sessionToken}` (admin company 2)  
**Body :**

```json
{
  "email": "new.employee@nerd-test.com",
  "role": "driver",
  "first_name": "New",
  "last_name": "Employee",
  "company_id": 2,
  "user_id": 24
}
```

✅ **Vérifie :** 201 + `invitation_link` contenant le token  
➡️ Le token est capturé pour FLOW 12

---

### FLOW 12 — Accept Invitation (création compte employé)

**Endpoint :** `POST /v1/staff/accept-invitation`  
**Auth :** Aucune (l'employé n'a pas encore de compte)  
**Body :**

```json
{
  "token": "<token de FLOW 11>",
  "password": "Swift@Test2026!",
  "first_name": "New",
  "last_name": "Employee"
}
```

✅ **Vérifie :** 201 + `{ userId, company_id: 2, sessionToken }`  
⚠️ **Si 404 :** Le token a déjà été utilisé → relancer `setup_test_data.js`

---

### FLOW 13 — Accept Job (acceptation de mission)

**Endpoint :** `POST /v1/jobs/32/accept`  
**Auth :** `Bearer {sessionToken}` (admin company 2 = contractor)  
**Body :** `{ "notes": "E2E test acceptance", "company_id": 2, "user_id": 24 }`

✅ **Vérifie :** 200 + `assignment_status=accepted`  
⚠️ **Si WARN** (déjà accepté) → relancer `setup_test_data.js`

> Le job `JOB-E2E-ACCEPT-TEST-001` (id=32) a été créé avec `contractor_company_id=2` et `assignment_status=pending`

---

### FLOW 14 — Decline Job (chemin d'erreur)

**Endpoint :** `POST /v1/jobs/32/decline`  
**Auth :** `Bearer {sessionToken}`

✅ **Vérifie :** 400 (job déjà accepté depuis FLOW 13) — confirme que le endpoint rejette correctement les transitions d'état invalides

---

## 📊 Résultats attendus

Lancement réussi (état actuel) :

```
╔═════════════════════════════════════════════════════╗
║   E2E REAL API TEST — Swift App / altivo.fr        ║
╚═════════════════════════════════════════════════════╝

── FLOW 1 — Authentification ─────────────────────────
  ✅ PASS Login — userId=24

── FLOW 2 — User Profile (company_role fix) ──────────
  ✅ PASS GET /v1/user/profile — HTTP 200
  ✅ PASS company_role présent dans réponse — value="patron"
  ✅ PASS companyId présent dans réponse — value=2

── FLOW 3 — Calendrier ───────────────────────────────
  ✅ PASS POST /calendar-days — 0 jour(s) avec données

── FLOW 4 — Clients ──────────────────────────────────
  ✅ PASS GET /v1/clients — ? client(s)

── FLOW 5 — Push Notifications ───────────────────────
  ✅ PASS GET notification-preferences — HTTP 200
  ✅ PASS POST push-token — HTTP 200

── FLOW 6 — Business Owner Complete Profile ──────────
  ⚠️  WARN POST complete-profile — User a déjà une company → opérationnel

── FLOW 7 — Stripe Balance ───────────────────────────
  ✅ PASS GET /v1/stripe/balance — HTTP 200

── FLOW 8 — Job Payment Create ───────────────────────
  ⚠️  WARN POST /v1/jobs/26/payment/create — déjà payé → opérationnel (idempotent)

── FLOW 9 — Job Payment Confirm ──────────────────────
  ⚠️  WARN POST /v1/jobs/26/payment/confirm — Skipped (FLOW 8 n'a pas créé de PI nouveau)

── FLOW 10 — Job Payment History ─────────────────────
  ✅ PASS GET /v1/jobs/26/payments — 1 paiement(s) — historique OK

── FLOW 11 — Staff Invite ────────────────────────────
  ✅ PASS POST /v1/staff/invite — Invitation créée | token capturé

── FLOW 12 — Accept Invitation ───────────────────────
  ✅ PASS POST /v1/staff/accept-invitation — Compte créé | userId=35 | company_id=2

── FLOW 13 — Accept Job ──────────────────────────────
  ✅ PASS POST /v1/jobs/32/accept — Job accepté | assignment_status=accepted

── FLOW 14 — Decline Job (error path) ───────────────
  ✅ PASS POST /v1/jobs/32/decline — Rejet correct (HTTP 400) → endpoint opérationnel

═══════════════════════════════════════════════════════
  ✅ PASS  15
  ⚠️  WARN  3  (attendus — voir FLOW 6, 8, 9)
  ❌ FAIL  0

  Score: 83% (15/18)
```

---

## 🔴 Cas d'erreur et solutions

| Erreur                                           | Cause                             | Solution                                                     |
| ------------------------------------------------ | --------------------------------- | ------------------------------------------------------------ |
| `FAIL Login — HTTP 401`                          | Mauvais credentials               | Vérifier `MAIL` et `PASSWORD` exacts                         |
| `FAIL Login — HTTP 400 — Invalid device format`  | `device` mal formé                | Mise à jour du script déjà effectuée                         |
| `FAIL — HTTP 401` sur tous les flows après login | Token mal parsé                   | Le script utilise `sessionToken`, pas `token` — déjà corrigé |
| `FAIL — ECONNREFUSED`                            | Backend arrêté                    | `ssh sushinari "pm2 restart swiftapp"`                       |
| `FAIL — ETIMEDOUT`                               | Réseau lent / VPN                 | Désactiver VPN, réessayer                                    |
| `FAIL notification-preferences — HTTP 401`       | Middleware manquant               | Correctif déjà déployé le 28/02                              |
| `FAIL FLOW 12 — 404 Token invalide`              | Job ou invitation déjà utilisé(e) | `ssh sushinari "node /tmp/setup_test_data.js"` puis relancer |
| `WARN FLOW 13 — Job déjà accepté`                | FLOW 13 déjà passé                | `ssh sushinari "node /tmp/setup_test_data.js"` pour reset    |

---

## 🔧 Si le backend n'est plus disponible

```powershell
# Vérification état PM2
ssh sushinari "pm2 list"

# Redémarrage swiftapp
ssh sushinari "pm2 restart swiftapp"

# Logs en temps réel
ssh sushinari "pm2 logs swiftapp --lines 50"
```

---

## 🔄 Reset des données de test (avant chaque run complet)

Les FLOW 11-13 modifient des données DB (invitations, jobs). Pour repartir proprement :

```powershell
# Recrée new.employee@nerd-test.com (sans company) + reset JOB-E2E-ACCEPT-TEST-001 à 'pending'
ssh sushinari "node /tmp/setup_test_data.js"
```

Ce script est **idempotent** — il ne crée pas de doublons.

---

## 🗓️ Historique des correctifs déployés

| Date       | Fichier serveur                    | Correctif                                                                  |
| ---------- | ---------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- |
| 27/02/2026 | `endPoints/v1/stripe/payouts.js`   | Stripe SDK: `stripeAccount` dans le bon argument (×3)                      |
| 28/02/2026 | `endPoints/v1/getUserProfile.js`   | `company_role` ajouté au SELECT SQL + réponse JSON                         |
| 28/02/2026 | `index.js`                         | `authenticateToken` ajouté sur 4 routes push notifications                 |
| 03/03/2026 | `endPoints/v1/acceptJob.js`        | Fix: gère ID numérique ET code string (`WHERE id=?` / `WHERE code=?`)      |
| 03/03/2026 | `endPoints/v1/declineJob.js`       | Idem + alias plural `/v1/jobs/:id/decline`                                 |
| 03/03/2026 | `endPoints/v1/acceptInvitation.js` | Nouvel endpoint `POST /v1/staff/accept-invitation`                         |
| 03/03/2026 | `endPoints/v1/staff.js`            | Body fallback `company_id` / `user_id` + fix colonnes `token`/`invited_by` |
| 03/03/2026 | `index.js`                         | Routes plural `/v1/jobs/:id/accept                                         | decline`+`accept-invitation` BEFORE 404 handler |

---

## 📁 Fichiers concernés

| Fichier                                               | Rôle                                              |
| ----------------------------------------------------- | ------------------------------------------------- |
| [scripts/e2e-real-api.js](../scripts/e2e-real-api.js) | Script de test (à lancer)                         |
| `C:\Users\romai\AppData\Local\Temp\set_test_pw.js`    | Script serveur ayant créé les credentials de test |

---

_Document généré le 2 Mars 2026_
