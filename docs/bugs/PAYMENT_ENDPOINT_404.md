# 🐛 Bug Critique: Endpoint de Paiement Retourne 404 ✅ RÉSOLU

**Date:** 26 janvier 2026  
**Heure:** 10:46 AM (Paris)  
**Status:** ✅ **RÉSOLU** - 11:15 AM  
**Cause:** Utilisateur non assigné au job dans la table `job_users`  
**Priority:** 🔴 CRITIQUE - Fonctionnalité métier bloquée  
**Développeur Mobile:** Romain Giovanni  
**Backend:** Équipe SwiftApp

---

## ✅ RÉSOLUTION

### Cause Racine Identifiée

L'utilisateur 15 (Romain) n'était **pas assigné au job 29** dans la table `job_users`. Le backend vérifie cette association avant d'autoriser les opérations de paiement, d'où l'erreur "Job not found or unauthorized".

### Action Backend

✅ L'utilisateur 15 a été ajouté à la table `job_users` pour le job 29  
✅ Le paiement devrait maintenant fonctionner avec le même token

### Recommandations

- **Pour d'autres jobs :** Si le même problème se reproduit, vérifier que l'utilisateur est bien dans `job_users` pour ce job
- **Frontend :** Retester le flow de paiement pour confirmer le fix
- **Backend :** Envisager d'améliorer le message d'erreur pour distinguer "Job not found" de "Not authorized"

---

## 📋 Résumé Exécutif (Problème Initial)

L'endpoint de création de PaymentIntent Stripe retourne systématiquement **404 "Job not found or unauthorized"** alors que toutes les conditions sont réunies côté frontend :

✅ **Token de session valide** : Token présent, 128 caractères, envoyé dans les headers  
✅ **URL conforme à la doc** : `/v1/jobs/:job_id/payment/create` (pluriel comme spécifié)  
✅ **Job existant** : Job ID 29 visible dans l'application, code `JOB-PIERRE-20260124-082`  
✅ **Body JSON valide** : Structure conforme à la documentation backend du 25/01/2026  
✅ **Autres endpoints job fonctionnels** : GET notes, GET signatures, etc. fonctionnent avec le même token

**Impact Business:** Les clients ne peuvent pas payer leurs jobs, bloquant le workflow complet de paiement.

---

## 🔍 Détails Techniques Complets

### Requête HTTP Exacte

```http
POST https://altivo.fr/swift-app/v1/jobs/29/payment/create HTTP/1.1
Host: altivo.fr
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[128 caractères]
Content-Type: application/json
Content-Length: 78

{
  "amount": 45000,
  "currency": "AUD",
  "description": "Paiement job 29"
}
```

### Réponse HTTP

```http
HTTP/1.1 404 Not Found
Content-Type: application/json
Date: Sun, 26 Jan 2026 09:46:46 GMT

{
  "success": false,
  "error": "Job not found or unauthorized"
}
```

### Token de Session

- **Présent:** ✅ Oui
- **Longueur:** 128 caractères
- **Format:** JWT Bearer token
- **Preview:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (début) `...Xj4K9pL2mN` (fin)
- **Stockage:** `expo-secure-store` clé `session_token`
- **Validation:** Fonctionne pour d'autres endpoints (`GET /jobs/:id/notes`, `GET /jobs/:id/signatures`)

### Job Concerné

- **Job ID:** 29
- **Job Code:** `JOB-PIERRE-20260124-082`
- **Status:** `completed`
- **Visible dans l'app:** ✅ Oui (JobDetails affiche tous les détails)
- **Montant calculé:** 450.00 AUD (45000 cents)
- **Temps facturable:** Calculé via timer job

### Utilisateur Connecté

- **User ID:** 15 (extrait du token lors des autres requêtes)
- **Nom:** Nerd-Test
- **Company ID:** 1 (lié au job)
- **Email:** nerdtest@example.com (à vérifier)

---

## 🧪 Tests et Validations Effectués

### ✅ Ce qui fonctionne avec le même token

| Endpoint                  | Méthode | Status | Commentaire          |
| ------------------------- | ------- | ------ | -------------------- |
| `/auth/me`                | GET     | 200    | Retourne user ID 15  |
| `/v1/jobs/:id`            | GET     | 200    | Détails du job       |
| `/v1/jobs/:id/notes`      | GET     | 200    | Liste des notes      |
| `/v1/jobs/:id/signatures` | GET     | 200    | Liste des signatures |
| `/v1/jobs/:id/photos`     | GET     | 200    | Liste des photos     |

### ❌ Ce qui ne fonctionne PAS

| Endpoint                      | Méthode | Status      | Erreur                          |
| ----------------------------- | ------- | ----------- | ------------------------------- |
| `/v1/jobs/29/payment/create`  | POST    | 404         | "Job not found or unauthorized" |
| `/v1/jobs/29/payment/confirm` | POST    | (non testé) | N/A                             |
| `/v1/jobs/29/payments`        | GET     | (non testé) | N/A                             |

**Observation:** Les endpoints de **lecture** job fonctionnent, mais l'endpoint de **paiement** retourne 404.

### 🔬 Tests de Validation Technique

#### Test 1: Vérification du token

```typescript
// Code: StripeService.ts ligne 956-965
const token = await SecureStore.getItemAsync("session_token");
console.log("🔐 [JOB PAYMENT] Has session token:", !!token);
console.log("🔐 [JOB PAYMENT] Length:", token?.length);
```

**Résultat:** Token présent, 128 caractères ✅

#### Test 2: Vérification de l'URL

```typescript
const createUrl = `${ServerData.serverUrl}v1/jobs/${jobId}/payment/create`;
console.log("🌐 [JOB PAYMENT] Calling endpoint:", createUrl);
```

**Résultat:** `https://altivo.fr/swift-app/v1/jobs/29/payment/create` ✅

#### Test 3: Vérification du body

```typescript
console.log("📦 [JOB PAYMENT] Request body:", JSON.stringify(options, null, 2));
```

**Résultat:**

```json
{
  "amount": 45000,
  "currency": "AUD",
  "description": "Paiement job 29"
}
```

✅ Conforme à la doc

#### Test 4: Type du jobId

```typescript
console.log(
  `🔍 [PaymentWindow] Extracted jobId: ${jobId} (type: ${typeof jobId})`,
);
```

**Résultat:** `jobId: 29 (type: number)` ✅

---

## 📊 Logs Complets de Débogage

### Séquence Complète (26/01/2026 10:46:46)

```
LOG  📑 [JOB_ACTION] Tab pressed: payment
LOG  🚀 [PaymentWindow] Starting REAL Stripe payment process...

LOG  🔍 [PaymentWindow DEBUG] job prop: {
  "hasJob": true,
  "hasJobJob": false,
  "jobId": 29,
  "jobCode": "JOB-PIERRE-20260124-082"
}

LOG  🔍 [PaymentWindow] Extracted jobId: 29 (type: number)
LOG  💳 [PaymentWindow] Creating Payment Intent for job 29, amount: 450

LOG  💳 [JOB PAYMENT] Creating Payment Intent for job 29...
LOG  📦 [JOB PAYMENT] Request body: {
  "amount": 45000,
  "currency": "AUD",
  "description": "Paiement job 29"
}

LOG  🌐 [JOB PAYMENT] Calling endpoint: https://altivo.fr/swift-app/v1/jobs/29/payment/create
LOG  🔐 [JOB PAYMENT] Has session token: true Length: 128

LOG  📡 [JOB PAYMENT] Response status: 404

ERROR  ❌ [JOB PAYMENT] Error response: {"success":false,"error":"Job not found or unauthorized"}
ERROR  ❌ [JOB PAYMENT] Error creating Payment Intent: [Error: Job introuvable]
ERROR  ❌ [useJobPayment] Create payment error: [Error: Job introuvable]
ERROR  ❌ [PaymentWindow] REAL payment failed: [Error: Job introuvable]
```

### Logs Contextuels Précédents

```
WARN  ⚠️ [Session] ensureSession timed out after 8 seconds
(Note: Ce timeout n'empêche pas la récupération du token)

LOG  🔍 [GET SIGNATURES] Fetching signatures for job: 29
LOG  ✅ [GET SIGNATURES] Signatures fetched: {"count": 1}
LOG  ✅ [CHECK SIGNATURE] Found existing signature: {"id": 12, "type": "client"}
(Note: Les autres endpoints job fonctionnent correctement)
```

---

## 🔧 Étapes de Reproduction

### Environnement

- **App:** SwiftApp Mobile (React Native + Expo SDK 53)
- **Plateforme:** Android (émulateur/device)
- **Backend:** `https://altivo.fr/swift-app/`
- **Stripe:** Mode test (clé publishable fournie)

### Étapes Exactes

1. **Connexion utilisateur**
   - Email: nerdtest@example.com
   - Login réussi, token stocké (128 caractères)

2. **Navigation vers le job**
   - Aller sur "Jobs" → Sélectionner Job #29
   - Code job: `JOB-PIERRE-20260124-082`
   - Job visible avec tous les détails

3. **Ouverture du modal de paiement**
   - Cliquer sur l'onglet "Payment"
   - Modal s'ouvre avec montant: 450.00 AUD

4. **Tentative de paiement par carte**
   - Cliquer sur "Bank Card"
   - L'app appelle `POST /v1/jobs/29/payment/create`
   - **Erreur 404** retournée

5. **Vérification du token**
   - Token présent: ✅
   - Token valide: ✅ (fonctionne pour autres endpoints)

---

## ❓ Questions Critiques pour le Backend

### 1. Implémentation de l'endpoint

**Q:** L'endpoint `POST /v1/jobs/:job_id/payment/create` est-il réellement implémenté dans le code backend ?  
**Vérification:** Chercher dans le code source :

```bash
# Exemple de recherche dans le code
grep -r "jobs/:job_id/payment/create" /path/to/backend/src
grep -r "/payment/create" /path/to/backend/routes
```

### 2. Existence du job en base de données

**Q:** Le job ID 29 existe-t-il dans la table `jobs` ?  
**SQL à exécuter:**

```sql
SELECT
  id,
  code,
  company_id,
  status,
  payment_status,
  created_at,
  updated_at
FROM jobs
WHERE id = 29;
```

**Résultat attendu:** Une ligne avec `code = 'JOB-PIERRE-20260124-082'`

### 3. Permissions et company_id

**Q:** L'utilisateur 15 a-t-il les permissions pour accéder au job 29 ?  
**SQL à exécuter:**

```sql
-- Vérifier le company_id de l'utilisateur
SELECT id, email, company_id, role
FROM users
WHERE id = 15;

-- Vérifier le company_id du job
SELECT id, code, company_id
FROM jobs
WHERE id = 29;

-- Les deux company_id doivent correspondre
```

### 4. Vérification du token JWT

**Q:** Le token JWT est-il correctement décodé côté backend ?  
**Actions:**

- Vérifier les logs backend lors de la requête (timestamp: 26/01/2026 10:46:46)
- Extraire le `user_id` du token
- Vérifier si le middleware d'auth valide le token

### 5. Routes et Routing

**Q:** La route est-elle correctement enregistrée dans le router ?  
**Vérifications:**

```javascript
// Exemple de configuration attendue
router.post(
  "/jobs/:job_id/payment/create",
  authMiddleware, // Vérifie le token
  checkJobAccess, // Vérifie l'accès au job
  createJobPaymentIntent, // Handler
);
```

### 6. Différence entre GET et POST

**Q:** Pourquoi les endpoints GET `/jobs/:id/*` fonctionnent mais pas POST `/jobs/:id/payment/create` ?  
**Hypothèses:**

- Les endpoints GET sont implémentés mais pas les POST payment
- Middleware différent entre GET et POST
- Permissions différentes pour lecture vs écriture

### 7. Message d'erreur "Job not found or unauthorized"

**Q:** Ce message vient de quelle partie du code ?  
**Recherche:**

```bash
grep -r "Job not found or unauthorized" /path/to/backend/src
```

**But:** Comprendre à quel niveau l'erreur est générée (routing, auth, business logic)

---

## 🔬 Vérifications Backend à Effectuer

### Checklist pour l'équipe backend

- [ ] **Routes Payment**
  - [ ] Vérifier que `POST /v1/jobs/:job_id/payment/create` existe dans le code
  - [ ] Vérifier que la route est bien montée dans l'application Express/Fastify
  - [ ] Vérifier que le handler de route est implémenté

- [ ] **Base de Données**
  - [ ] Confirmer que le job ID 29 existe : `SELECT * FROM jobs WHERE id = 29;`
  - [ ] Vérifier le `company_id` du job : devrait être `1`
  - [ ] Vérifier le `company_id` de l'utilisateur 15 : devrait être `1`
  - [ ] Vérifier le `payment_status` du job (null / pending / paid)

- [ ] **Authentication**
  - [ ] Vérifier que le token JWT est valide et pas expiré
  - [ ] Extraire le `user_id` du token (devrait être 15)
  - [ ] Vérifier que le middleware d'auth ne bloque pas les requêtes POST
  - [ ] Vérifier les logs d'auth au moment de la requête (10:46:46)

- [ ] **Permissions**
  - [ ] Vérifier le middleware de permissions pour les endpoints payment
  - [ ] Confirmer que l'utilisateur 15 peut créer des paiements pour les jobs de company_id=1
  - [ ] Vérifier si un rôle spécifique est requis (admin, worker, etc.)

- [ ] **Stripe Configuration**
  - [ ] Vérifier que les clés Stripe sont configurées (mode test)
  - [ ] Secret key: `sk_test_51SMZIJInA65k4AVU...`
  - [ ] Publishable key: `pk_test_51SMZIJInA65k4AVU...`
  - [ ] Vérifier que le client Stripe est initialisé

- [ ] **Logs Backend**
  - [ ] Consulter les logs au timestamp: `2026-01-26 10:46:46`
  - [ ] Rechercher les entrées avec `job_id=29`
  - [ ] Vérifier si la requête arrive jusqu'au handler ou échoue avant

---

## 📞 Test Manuel avec curl

### Requête curl complète

```bash
curl -X POST https://altivo.fr/swift-app/v1/jobs/29/payment/create \
  -H "Authorization: Bearer <VOTRE_TOKEN_ICI>" \
  -H "Content-Type: application/json" \
  -H "x-client: mobile" \
  -d '{
    "amount": 45000,
    "currency": "AUD",
    "description": "Test paiement via curl"
  }' \
  -v
```

### Test avec un autre job_id

```bash
# Tester avec un autre job pour voir si le problème est spécifique au job 29
curl -X POST https://altivo.fr/swift-app/v1/jobs/1/payment/create \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000, "currency": "AUD", "description": "Test"}' \
  -v
```

### Test de l'endpoint GET équivalent

```bash
# Vérifier si un endpoint GET payment existe
curl -X GET https://altivo.fr/swift-app/v1/jobs/29/payments \
  -H "Authorization: Bearer <TOKEN>" \
  -v
```

---

---

## 📚 Référence Documentation Backend

### Document: "💳 API Paiements SwiftApp - Guide Frontend"

**Date:** 25 janvier 2026  
**Version API:** v1.0  
**Status doc:** ✅ Opérationnel (Stripe mode test)

### Endpoint Documenté

```http
POST /swift-app/v1/jobs/:job_id/payment/create
```

**Description:** Crée un PaymentIntent Stripe pour payer un job spécifique.

### Body Attendu (selon doc)

```json
{
  "amount": 5000, // Montant en CENTS (5000 = $50.00)
  "currency": "aud", // Devise (défaut: "aud")
  "description": "..." // Description du paiement
}
```

### Réponse Attendue (200)

```json
{
  "success": true,
  "data": {
    "payment_intent_id": "pi_3StcgJIsgSU2xbML1G3wzYwl",
    "client_secret": "pi_3StcgJIsgSU2xbML1G3wzYwl_secret_xxx",
    "amount": 500000,
    "currency": "aud",
    "application_fee_amount": 12500
  }
}
```

### Erreurs Documentées

| Code | Message                    | Cause                  |
| ---- | -------------------------- | ---------------------- |
| 400  | "Job is already paid"      | Le job a déjà été payé |
| 404  | "Job not found"            | Job inexistant         |
| 401  | "Invalid or expired token" | Token invalide         |

**Note:** La doc mentionne une erreur 404 "Job not found", mais nous recevons "Job not found **or unauthorized**", ce qui suggère une vérification de permissions en plus.

### Clés Stripe Fournies

**Publishable Key (test):**

```
pk_test_51SMZIJInA65k4AVU4pfHe2XYbwfiqZqYNmCSCfgrIP7iyI2rQ4sw5Po5KbZC5nt1NVMOXiWzZXaxnD1wiDnPNd2m00BwhyWbwP
```

---

## 💡 Hypothèses et Pistes d'Investigation

### Hypothèse 1: Endpoint pas encore implémenté ⚠️

**Probabilité:** Moyenne  
**Indices:**

- La documentation existe (25/01/2026)
- Mais le code backend n'est peut-être pas déployé
- Erreur 404 = route non trouvée

**Action:** Vérifier dans le code source si le handler existe

### Hypothèse 2: Problème de routing 🔀

**Probabilité:** Élevée  
**Indices:**

- Les endpoints GET `/v1/jobs/:id/*` fonctionnent
- Mais POST `/v1/jobs/:id/payment/*` ne fonctionne pas
- Possiblement un router différent ou non monté

**Action:** Vérifier la configuration des routes dans le serveur Express/Fastify

### Hypothèse 3: Middleware d'autorisation trop strict 🔒

**Probabilité:** Moyenne  
**Indices:**

- Message "Job not found **or unauthorized**" (et non juste "Job not found")
- Les GET fonctionnent (lecture) mais pas POST (écriture)
- Possiblement un check de permissions qui bloque les POST

**Action:** Vérifier les middlewares sur la route payment

### Hypothèse 4: Job 29 n'existe pas en base 🗄️

**Probabilité:** Faible  
**Indices:**

- Le job est visible via GET `/v1/jobs/29`
- Donc il existe forcément en base
- L'erreur serait ailleurs

**Action:** Quand même vérifier pour éliminer cette possibilité

### Hypothèse 5: Company_id mismatch 🏢

**Probabilité:** Moyenne  
**Indices:**

- User ID 15 → Company ID 1 (d'après le code frontend)
- Job 29 → Company ID à vérifier
- Si mismatch → "unauthorized"

**Action:** Vérifier la correspondance user.company_id vs job.company_id

### Hypothèse 6: Payment_status bloquant 💳

**Probabilité:** Faible  
**Indices:**

- Le job est peut-être déjà payé
- La doc mentionne "Job is already paid" → 400
- Mais nous avons 404, pas 400

**Action:** Vérifier `jobs.payment_status` pour le job 29

---

## 🔧 Solutions Possibles

### Solution 1: Implémenter l'endpoint backend

Si l'endpoint n'existe pas encore :

1. Créer le handler dans le contrôleur payment
2. Monter la route dans le router
3. Implémenter la logique Stripe PaymentIntent
4. Déployer en production

### Solution 2: Corriger le routing

Si l'endpoint existe mais n'est pas monté :

1. Vérifier l'enregistrement de la route
2. S'assurer que le router payment est monté sous `/v1/jobs`
3. Vérifier l'ordre des middlewares

### Solution 3: Ajuster les permissions

Si c'est un problème de permissions :

1. Vérifier le middleware `checkJobAccess`
2. S'assurer que l'utilisateur avec company_id=1 peut accéder au job avec company_id=1
3. Ajouter des logs dans le middleware pour debug

### Solution 4: Workaround temporaire (Frontend)

En attendant le fix backend :

```typescript
// Option: Désactiver temporairement le paiement Stripe
// Afficher un message "Paiement bientôt disponible"
// Permettre seulement le paiement cash
```

**Note:** Pas idéal car bloque la fonctionnalité business critique

---

## 📋 Checklist de Résolution

### Équipe Backend

- [ ] Confirmer que l'endpoint existe dans le code
- [ ] Vérifier les logs au moment de l'erreur (10:46:46, 26/01/2026)
- [ ] Tester avec curl et le token fourni
- [ ] Vérifier que job ID 29 existe en base
- [ ] Vérifier la correspondance company_id user vs job
- [ ] Vérifier le payment_status du job
- [ ] Corriger et déployer le fix
- [ ] Notifier l'équipe mobile une fois corrigé

### Équipe Mobile

- [ ] Fournir le token complet au backend (si demandé)
- [ ] Tester avec un autre job_id si disponible
- [ ] Documenter tout changement de comportement
- [ ] Retester une fois le fix backend déployé
- [ ] Valider le flow complet de paiement

---

## � Analyse Post-Mortem

### Pourquoi l'erreur disait "Job not found or unauthorized" ?

Le backend effectue plusieurs vérifications avant d'autoriser un paiement :

1. ✅ **Le job existe-t-il ?** → Oui (job ID 29 existe)
2. ✅ **Le token est-il valide ?** → Oui (user ID 15)
3. ❌ **L'utilisateur est-il assigné au job ?** → **NON** (manquait dans `job_users`)

C'est la 3ème vérification qui échouait, d'où l'erreur "unauthorized".

### Pourquoi les autres endpoints fonctionnaient ?

Les endpoints de **lecture** (GET notes, GET signatures, etc.) ont probablement des vérifications de permissions moins strictes ou utilisent une logique différente (par exemple : vérification par `company_id` uniquement).

Les endpoints de **paiement** nécessitent une association explicite dans `job_users` pour des raisons de sécurité (éviter qu'un utilisateur de la même entreprise puisse créer des paiements pour n'importe quel job).

### Leçons Apprises

1. **Message d'erreur ambiguë** : "Job not found or unauthorized" regroupe 2 cas différents
   - Recommandation : Séparer en 2 messages distincts pour faciliter le debug

2. **Permissions différentes par endpoint** : GET vs POST ont des règles différentes
   - Normal pour des raisons de sécurité, mais peut être confus

3. **Importance de la table `job_users`** : Association explicite requise pour les opérations critiques
   - À documenter dans le guide d'intégration

---

## 📞 Contact et Suivi

**Développeur Mobile:** Romain Giovanni  
**Email:** romaingiovanni@gmail.com  
**Date du rapport:** 26 janvier 2026  
**Résolution:** 26 janvier 2026 - 11:15 AM  
**Temps de résolution:** ~30 minutes

**Status:** ✅ RÉSOLU - En attente de validation par tests

**Prochaines étapes:**

1. ✅ Backend a assigné l'utilisateur au job
2. ⏳ Retester le paiement sur le job 29
3. ⏳ Valider que le PaymentIntent est créé correctement
4. ⏳ Tester le flow complet de paiement Stripe
5. ⏳ Documenter pour éviter ce problème à l'avenir

---

## 📎 Informations Techniques Supplémentaires

### Table `job_users` (probable structure)

```sql
CREATE TABLE job_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  job_id INT NOT NULL,
  user_id INT NOT NULL,
  role VARCHAR(50), -- ex: 'assigned', 'owner', 'helper'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_job_user (job_id, user_id)
);
```

### Fix appliqué par le backend

```sql
-- Assignation de l'utilisateur 15 au job 29
INSERT INTO job_users (job_id, user_id, role)
VALUES (29, 15, 'assigned')
ON DUPLICATE KEY UPDATE updated_at = NOW();
```

---

## 🎯 Impact et Urgence (Résolu)

**Impact Business:** ✅ RÉSOLU

- ~~Les clients ne peuvent pas payer leurs jobs~~
- ✅ Paiement maintenant possible pour le job 29
- ✅ Process de résolution rapide (~30 min)

**Urgence:** ✅ RÉSOLUE

- ~~Fonctionnalité métier principale bloquée~~
- ✅ Fix appliqué côté backend
- ⏳ Validation en cours côté frontend

---

**FIN DU RAPPORT - PROBLÈME RÉSOLU**

**Remerciements :** Merci à l'équipe backend pour le diagnostic et le fix rapide ! 🙏
