# 📋 SPÉCIFICATION : Fonctionnement de la Signature de Job

## 📅 Date : 26 Décembre 2025

---

## 🎯 OBJECTIF

Permettre à un utilisateur de signer un job une seule fois, et que cette signature soit **persistée** dans le backend. Lorsque l'utilisateur revient sur le job, la signature doit être **affichée comme déjà effectuée** (pas de bouton "Faire Signer").

---

## 📐 FLUX ATTENDU

### 1️⃣ Première Signature (Job non signé)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ÉTAT INITIAL : Job sans signature                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ÉCRAN CLIENT / PAYMENT                                             │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │  SignatureSection                                          │      │
│  │  ┌─────────────────────────────────────────────────────┐  │      │
│  │  │  📝 Signature En Attente                             │  │      │
│  │  │  Le contrat doit être signé par le client           │  │      │
│  │  │                                                      │  │      │
│  │  │  [ 🖋️ Faire Signer le Contrat ]                     │  │      │
│  │  └─────────────────────────────────────────────────────┘  │      │
│  └───────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Clic sur "Faire Signer"
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  MODAL SigningBloc                                                  │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │  Canvas de signature (react-native-signature-canvas)      │      │
│  │  ┌─────────────────────────────────────────────────────┐  │      │
│  │  │                                                      │  │      │
│  │  │           [Signature manuscrite ici]                 │  │      │
│  │  │                                                      │  │      │
│  │  └─────────────────────────────────────────────────────┘  │      │
│  │  [ ✖️ Annuler ]              [ ✅ Valider Signature ]    │      │
│  └───────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Clic sur "Valider Signature"
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PROCESSUS DE SAUVEGARDE                                            │
│                                                                      │
│  1. SigningBloc.handleSignatureOK() appelé avec `sig` (data URL)    │
│  2. Sauvegarde fichier local: dataUrlToPngFile(sig)                 │
│  3. Appel API: POST /swift-app/v1/job/{jobId}/signature             │
│     Body: { signature_data: "data:image/png;base64,...",            │
│             signature_type: "client" }                               │
│  4. Backend répond 201 Created avec { signatureId, signatureUrl }   │
│  5. Mise à jour state local: job.signature_blob = sig               │
│  6. Alert "✅ Signature Enregistrée"                                │
│  7. Fermeture modal                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ÉCRAN CLIENT / PAYMENT (après signature)                           │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │  SignatureSection                                          │      │
│  │  ┌─────────────────────────────────────────────────────┐  │      │
│  │  │            ✓                                         │  │      │
│  │  │     Contrat Signé !                                  │  │      │
│  │  │  Le client a validé et signé le contrat             │  │      │
│  │  └─────────────────────────────────────────────────────┘  │      │
│  └───────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2️⃣ Retour sur le Job (Après reload / navigation)

```
┌─────────────────────────────────────────────────────────────────────┐
│  USER QUITTE ET REVIENT SUR LE JOB                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CHARGEMENT DES DONNÉES                                             │
│                                                                      │
│  1. Navigation vers écran JobDetails                                 │
│  2. useJobDetails(jobId) appelé                                      │
│  3. API: GET /swift-app/v1/job/{jobId}/full                         │
│  4. Réponse inclut: { job: { signature_blob: "data:...",            │
│                              signature_date: "2025-12-26T..." } }   │
│  5. jobDetails.job contient signature_blob                           │
│  6. Synchronisation: setJob({ ...jobDetails.job })                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ÉCRAN CLIENT / PAYMENT                                             │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │  SignatureSection                                          │      │
│  │  - Vérifie: job.signature_blob OU job.job?.signature_blob │      │
│  │  - isContractSigned = true                                 │      │
│  │  ┌─────────────────────────────────────────────────────┐  │      │
│  │  │            ✓                                         │  │      │
│  │  │     Contrat Signé !                                  │  │      │
│  │  │  Le client a validé et signé le contrat             │  │      │
│  │  └─────────────────────────────────────────────────────┘  │      │
│  └───────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API BACKEND REQUISES

### 1. POST /swift-app/v1/job/{jobId}/signature

**Objectif :** Créer une nouvelle signature pour un job

**Request :**
```json
POST /swift-app/v1/job/8/signature
Content-Type: application/json
Authorization: Bearer {token}

{
  "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
  "signature_type": "client"
}
```

**Response Success (201) :**
```json
{
  "success": true,
  "signatureId": 7,
  "signatureUrl": "https://api.example.com/signatures/7.png",
  "message": "Signature enregistrée avec succès"
}
```

**Response Error - Signature existe (400) :**
```json
{
  "success": false,
  "error": "Une signature de type \"client\" existe déjà pour ce job",
  "existing_signature_id": 7
}
```

### 2. GET /swift-app/v1/job/{jobId}/full

**Objectif :** Récupérer toutes les données du job, y compris la signature

**Request :**
```
GET /swift-app/v1/job/8/full
Authorization: Bearer {token}
```

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "job": {
      "id": 8,
      "code": "JOB-2025-001",
      "status": "in_progress",
      "current_step": 5,
      "signature_blob": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
      "signature_date": "2025-12-26T07:25:44.000Z",
      ...
    },
    "client": { ... },
    "workflow": { ... }
  }
}
```

### 3. (Optionnel) GET /swift-app/v1/job/{jobId}/signature

**Objectif :** Vérifier si une signature existe avant d'en créer une nouvelle

**Request :**
```
GET /swift-app/v1/job/8/signature?type=client
Authorization: Bearer {token}
```

**Response :**
```json
{
  "success": true,
  "exists": true,
  "signature": {
    "id": 7,
    "signature_type": "client",
    "signature_blob": "data:image/png;base64,...",
    "created_at": "2025-12-26T07:25:44.000Z"
  }
}
```

---

## 📁 FICHIERS IMPLIQUÉS

| Fichier | Rôle |
|---------|------|
| `src/components/signingBloc.tsx` | Modal de signature, capture canvas, upload vers backend |
| `src/components/jobDetails/sections/SignatureSection.tsx` | Affiche l'état de signature (bouton ou "Signé") |
| `src/screens/JobDetailsScreens/client.tsx` | Utilise SignatureSection, doit synchroniser job avec backend |
| `src/screens/JobDetailsScreens/payment.tsx` | Utilise SigningBloc, gère paiement après signature |
| `src/hooks/useJobDetails.ts` | Hook pour charger les données du job depuis l'API |
| `src/services/jobs.ts` | Fonction `getJobDetails()` - appel API /job/{id}/full |
| `src/services/jobDetails.ts` | Fonction `saveJobSignature()` - appel API POST /job/{id}/signature |

---

## ✅ CRITÈRES DE SUCCÈS

1. **Signature unique :** Un job ne peut avoir qu'UNE signature de type "client"
2. **Persistance :** La signature est stockée dans la table `signatures` du backend
3. **Récupération :** L'API `/job/{id}/full` retourne `signature_blob` et `signature_date`
4. **Affichage correct :** `SignatureSection` affiche "Contrat Signé !" si signature existe
5. **Pas de re-signature :** Le bouton "Faire Signer" n'apparaît PAS si signature existe
6. **Gestion erreur 400 :** Si signature existe déjà, l'app traite comme succès (pas d'erreur user)

---

## 🐛 PROBLÈMES ACTUELS IDENTIFIÉS (26 Décembre 2025)

### Symptômes observés dans les logs :

1. **Erreur HTTP 404 sur getJobDetails :**
   ```
   ERROR  ❌ [getJobDetails] HTTP 404:
   ERROR  ❌ [useJobDetails] Error loading job details
   ```
   → Le hook `useJobDetails` dans `client.tsx` appelle une URL invalide

2. **Signature existe déjà mais re-demandée :**
   ```
   LOG  📤 [SigningBloc] Uploading NEW signature to server for job: 8
   ERROR  ❌ [SAVE SIGNATURE] Upload failed: {"status":400,"error":"Une signature de type \"client\" existe déjà...
   ```
   → L'app tente de créer une nouvelle signature alors qu'une existe

3. **Pas de synchronisation signature_blob :**
   - `jobDetails.job.signature_blob` n'est pas récupéré correctement
   - Ou la synchronisation `setJob()` ne s'exécute pas
   - Résultat : `isContractSigned = false` → Bouton "Faire Signer" affiché

---

## 🔍 TESTS À EFFECTUER

### Test 1 : Vérifier que l'API retourne signature_blob
```bash
curl -X GET "https://api.example.com/swift-app/v1/job/8/full" \
  -H "Authorization: Bearer {token}"
```
**Vérifier :** La réponse contient `data.job.signature_blob` non null

### Test 2 : Vérifier l'état de la signature dans la DB
```sql
SELECT id, job_id, signature_type, signature_blob IS NOT NULL as has_blob, created_at
FROM signatures
WHERE job_id = 8;
```

### Test 3 : Vérifier l'endpoint POST signature
```bash
curl -X POST "https://api.example.com/swift-app/v1/job/8/signature" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"signature_data": "data:image/png;base64,TEST", "signature_type": "client"}'
```
**Attendu :** 400 "signature existe déjà" (si déjà signé)

---

## 📝 PROCHAINES ÉTAPES

1. **Tester le backend** avec les appels curl ci-dessus
2. **Identifier** où se situe exactement le bug (backend ou frontend)
3. **Corriger** le problème identifié
4. **Tester** le flux complet de signature
