# 🔴 DIAGNOSTIC PROBLÈME SIGNATURE - 26 Décembre 2025

## 📋 RÉSUMÉ DU PROBLÈME

**Symptôme:** Quand l'utilisateur signe un job puis quitte et revient, la signature est redemandée malgré qu'elle soit déjà sauvegardée sur le serveur.

**Preuves dans les logs:**
```
LOG  📤 [SigningBloc] Uploading NEW signature to server for job: 8
ERROR  ❌ [SAVE SIGNATURE] Upload failed: {"error": "Une signature de type \"client\" existe déjà pour ce job", "existing_signature_id":7}
```

→ Le backend **confirme** que la signature existe (ID=7), mais l'app ne la **reconnaît pas** au chargement.

---

## 🔍 ANALYSE DÉTAILLÉE

### 1. Ce qui fonctionne ✅

- **La signature est bien sauvegardée** sur le serveur (signature_id: 7)
- **L'endpoint POST** `/v1/job/{id}/signature` fonctionne
- **L'endpoint GET** `/v1/job/{id}/full` retourne les données du job
- **Le hook `useJobDetails`** charge les données correctement

### 2. Ce qui ne fonctionne pas ❌

Le problème est que la signature n'est **pas reconnue au chargement** du job.

**Hypothèses possibles:**

| # | Hypothèse | Probabilité | Vérification |
|---|-----------|-------------|--------------|
| 1 | Le backend ne retourne PAS `signature_blob` dans `/full` | Haute | Tester avec un token valide |
| 2 | Le frontend ne lit pas correctement `signature_blob` | Moyenne | Vérifier la transformation des données |
| 3 | Les signatures sont dans une table séparée | Haute | Vérifier l'endpoint `/signatures` |
| 4 | Le state n'est pas synchronisé | Basse | Déjà corrigé dans client.tsx |

---

## 🧪 TESTS BACKEND EFFECTUÉS

### Test sans authentification

```
=== TEST 3: GET /v1/job/8/full ===
Status: 401
Réponse: {"success": false, "error": "Missing access token"}

=== TEST 4: GET /v1/job/8/signatures ===
Status: 401
Réponse: {"success": false, "error": "Token d'authentification requis pour récupérer les signatures"}
```

**Observation importante:** L'endpoint `/v1/job/8/signatures` **existe** (retourne 401, pas 404).

→ Cela suggère que les signatures sont dans une **table séparée** et doivent être récupérées via un endpoint dédié.

### Test du login

```
Status: 400
Réponse: {"error": "Login failed", "details": {"status": 401, "json": {"message": "Invalid mail or password"}}}
```

**Action requise:** Fournir des credentials valides pour tester complètement.

---

## 📊 FLUX ACTUEL (CASSÉ)

```
┌──────────────────────────────────────────────────────────────┐
│ 1. UTILISATEUR SIGNE LE JOB                                  │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. POST /v1/job/8/signature → 201 Created (signature_id: 7)  │
│    ✅ Signature sauvée dans table `signatures`               │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. UTILISATEUR QUITTE ET REVIENT                             │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. GET /v1/job/8/full → 200 OK                               │
│    ❓ signature_blob: NULL (pas inclus dans la réponse?)     │
│    ❓ Ou bien: signatures stockées séparément                │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. SignatureSection: isContractSigned = false                │
│    ❌ Affiche "Faire Signer" au lieu de "Contrat Signé"      │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. UTILISATEUR RE-SIGNE                                      │
│    POST /v1/job/8/signature → 400 "signature existe déjà"    │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 CAUSES PROBABLES

### Cause #1: Les signatures sont dans une table séparée (PROBABLE)

L'endpoint `/v1/job/8/signatures` existe → les signatures sont probablement stockées dans une table `signatures` séparée et non directement dans la table `jobs`.

**Conséquence:** L'endpoint `/full` ne retourne **que** les données de la table `jobs`, pas les signatures de la table `signatures`.

**Solution:** Ajouter un appel à `/v1/job/{id}/signatures` lors du chargement du job.

### Cause #2: Le backend ne joint pas les signatures au job

Même si `signature_blob` existe dans la table `jobs`, l'endpoint `/full` peut ne pas le retourner dans certains cas (ex: utilisateur non autorisé, champ exclu).

**Vérification:** Inspecter la réponse brute de `/full` avec un token valide.

---

## 🛠️ SOLUTIONS PROPOSÉES

### Solution A: Charger les signatures séparément (RECOMMANDÉE)

1. **Ajouter un appel** à `/v1/job/{id}/signatures` dans `useJobDetails`
2. **Merger les données** de signatures avec le job
3. **Utiliser ces données** dans `SignatureSection`

```typescript
// Dans useJobDetails.ts
const [jobDetails, setJobDetails] = useState(null);
const [signatures, setSignatures] = useState([]);

useEffect(() => {
    const loadData = async () => {
        const job = await getJobDetails(jobId);
        const sigs = await getJobSignatures(jobId); // NOUVEAU
        setJobDetails({ ...job, signatures: sigs });
    };
    loadData();
}, [jobId]);
```

### Solution B: Vérifier l'endpoint `/full` (SIMPLE)

1. **Tester avec un token valide** pour voir si `signature_blob` est retourné
2. Si oui, le problème est côté frontend (transformation des données)
3. Si non, demander au backend d'inclure `signature_blob` dans la réponse

### Solution C: Vérifier avant de signer (FALLBACK)

1. **Avant d'ouvrir le modal de signature**, appeler `/v1/job/{id}/signatures`
2. **Si une signature existe**, afficher "Contrat Signé"
3. **Sinon**, permettre de signer

---

## 📝 PROCHAINES ÉTAPES

1. **Obtenir un token valide** pour tester les endpoints
2. **Vérifier** si `/v1/job/8/full` retourne `signature_blob`
3. **Vérifier** le contenu de `/v1/job/8/signatures`
4. **Implémenter** la solution appropriée

---

## 🔗 FICHIERS IMPLIQUÉS

| Fichier | Rôle | Modification nécessaire |
|---------|------|------------------------|
| `src/hooks/useJobDetails.ts` | Charge les données du job | Ajouter appel `/signatures` |
| `src/services/jobs.ts` | `getJobDetails()` | Ajouter `getJobSignatures()` |
| `src/components/jobDetails/sections/SignatureSection.tsx` | Affiche statut signature | Utiliser données signatures |
| `src/screens/JobDetailsScreens/client.tsx` | Page client | ✅ Déjà corrigé |
| `src/screens/JobDetailsScreens/payment.tsx` | Page paiement | ✅ Déjà corrigé |

---

## 📋 CHECKLIST DE RÉSOLUTION

- [ ] Tester GET `/v1/job/8/full` avec token → vérifier `signature_blob`
- [ ] Tester GET `/v1/job/8/signatures` avec token → voir structure
- [ ] Implémenter `getJobSignatures()` dans services
- [ ] Charger les signatures dans `useJobDetails`
- [ ] Mettre à jour `SignatureSection` pour utiliser ces données
- [ ] Tester le flux complet de signature
