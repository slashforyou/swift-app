# 🖋️ FIX SIGNATURE JOB - 26 Décembre 2025

## ❌ PROBLÈME IDENTIFIÉ

### Comportement actuel (AVANT fix) :

**User pouvait signer un job MAIS la signature n'était JAMAIS enregistrée dans la base de données !**

**Workflow cassé :**
```
1. User ouvre modal signature
2. User dessine signature sur canvas
3. User clique "Sauvegarder"
4. ✅ signingBloc.tsx sauvegarde LOCALEMENT dans job state
   - signatureDataUrl: "data:image/png;base64,..."
   - signatureFileUri: "file:///..."
5. ❌ Signature JAMAIS envoyée au backend !
6. ❌ signature_blob reste NULL en DB
7. ❌ Après reload app: signature disparaît (pas persistée)
```

**Code problématique dans `signingBloc.tsx` (lignes 365-398) :**
```typescript
const handleSignatureOK = async (sig: string) => {
  try {
    setIsSaving(true);
    const fileUri = await dataUrlToPngFile(sig);

    // ❌ SEULEMENT sauvegarde locale !
    setJob(prev => ({
      ...prev,
      signatureDataUrl: sig,
      signatureFileUri: fileUri,
    }));

    // ❌ Pas d'appel API ici !
    onSave(sig);
    
    // ❌ Success toast MAIS rien envoyé au serveur !
    Alert.alert("✅ Signature Saved", "...");
  } catch (error) {
    // ...
  }
};
```

**Conséquences :**
- ✅ User voit "Signature Saved" → Pense que c'est enregistré
- ❌ MAIS: Signature jamais en DB
- ❌ Reload app → Signature disparaît
- ❌ Validation `signed_but_not_completed` jamais déclenchée
- ❌ Job ne peut jamais passer à `completed` via signature

---

## ✅ SOLUTION APPLIQUÉE

### Modifications dans `signingBloc.tsx` (lignes 365-430)

**AVANT :**
```typescript
const handleSignatureOK = async (sig: string) => {
  try {
    setIsSaving(true);
    const fileUri = await dataUrlToPngFile(sig);

    // ❌ Sauvegarde locale uniquement
    setJob(prev => ({
      ...prev,
      signatureDataUrl: sig,
      signatureFileUri: fileUri,
    }));

    onSave(sig);
    Alert.alert("✅ Signature Saved", "...");
  } catch (error) {
    // ...
  } finally {
    setIsSaving(false);
  }
};
```

**APRÈS (FIX COMPLET) :**
```typescript
const handleSignatureOK = async (sig: string) => {
  try {
    setIsSaving(true);
    
    // ✅ ÉTAPE 1: Sauvegarder le fichier localement
    const fileUri = await dataUrlToPngFile(sig);

    // ✅ ÉTAPE 2: Envoyer la signature au backend
    console.log('📤 [SigningBloc] Uploading signature to server for job:', job.id);
    
    // Import dynamique pour éviter les dépendances circulaires
    const { saveJobSignature } = await import('../services/jobDetails');
    
    const uploadResult = await saveJobSignature(
      job.id,
      sig, // Data URL complète: "data:image/png;base64,..."
      'client' // Type de signature
    );

    if (!uploadResult.success) {
      console.error('❌ [SigningBloc] Server upload failed:', uploadResult.message);
      Alert.alert(
        'Erreur Serveur',
        `La signature n'a pas pu être enregistrée sur le serveur: ${uploadResult.message}`,
        [{ text: "OK" }]
      );
      return; // ⚠️ Ne pas continuer si upload échoue
    }

    console.log('✅ [SigningBloc] Signature uploaded successfully:', {
      signatureId: uploadResult.signatureId,
      signatureUrl: uploadResult.signatureUrl
    });

    // ✅ ÉTAPE 3: Mettre à jour le state local avec la signature ET l'URL serveur
    setJob(prev => ({
      ...prev,
      signatureDataUrl: sig,
      signatureFileUri: fileUri,
      signature_blob: sig, // ⚡ IMPORTANT: Pour la validation côté client
      signature_date: new Date().toISOString(),
      signatureId: uploadResult.signatureId,
      signatureUrl: uploadResult.signatureUrl,
    }));

    // Callback externe
    onSave(sig);
    setIsSigning(false);
    
    // Animation de succès puis fermeture
    setTimeout(() => {
      handleClose();
    }, 500);
    
    // Confirmation moderne
    Alert.alert(
      "✅ Signature Enregistrée",
      "Votre signature a été enregistrée avec succès sur le serveur.",
      [{ text: "Parfait !" }]
    );
  } catch (error) {
    console.error('❌ [SigningBloc] Signature save error:', error);
    Alert.alert(
      'Erreur de Sauvegarde',
      "Impossible d'enregistrer la signature. Veuillez réessayer.",
      [{ text: "OK" }]
    );
  } finally {
    setIsSaving(false);
  }
};
```

---

## 🔧 API UTILISÉE

L'API `saveJobSignature` existait déjà dans `src/services/jobDetails.ts` (lignes 748-830) :

```typescript
export async function saveJobSignature(
  jobId: number | string,
  signatureDataUrl: string,
  signatureType: 'client' | 'delivery' | 'pickup' = 'client'
): Promise<{
  success: boolean;
  signatureUrl?: string;
  signatureId?: string;
  message?: string;
}>
```

**Endpoint appelé :**
```
POST https://altivo.fr/swift-app/v1/job/{jobId}/signature
```

**Body envoyé :**
```json
{
  "signature_data": "data:image/png;base64,...",
  "signature_type": "client"
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "signatureUrl": "https://...",
  "signatureId": "123"
}
```

---

## 📊 WORKFLOW COMPLET (APRÈS FIX)

### Étape 1: User signe le job

```
1. User ouvre JobDetails screen
2. User scroll vers bas → Section "✍️ Signature Contrat"
3. Clic bouton "🖋️ Faire Signer le Contrat"
4. Modal SigningBloc s'ouvre (animation smooth)
5. User dessine signature sur canvas blanc
6. User clique "💾 Sauvegarder la Signature"
```

### Étape 2: Sauvegarde (NOUVEAU avec fix)

```
7. ⏳ setIsSaving(true) → Bouton disabled + spinner
8. 📁 dataUrlToPngFile() → Sauvegarde fichier local .png
9. 📤 [SigningBloc] Uploading signature to server for job: 8
10. 📡 POST /swift-app/v1/job/8/signature
11. 📦 Backend enregistre signature_blob en DB
12. ✅ [SigningBloc] Signature uploaded successfully
13. 🔄 Update job state:
    - signatureDataUrl ✅
    - signatureFileUri ✅
    - signature_blob ✅
    - signature_date ✅
    - signatureId ✅
    - signatureUrl ✅
14. 🎉 Toast: "✅ Signature Enregistrée"
15. 🚪 Modal se ferme avec animation
```

### Étape 3: Vérifications

**Côté client :**
```typescript
// SignatureSection.tsx vérifie:
const isContractSigned = !!(
  (job.signatureDataUrl && job.signatureFileUri) ||
  job.signature_blob ||
  job.job?.signature_blob
);

// Après signature: isContractSigned = true
// → Affiche "✓ Contrat Signé !" au lieu du bouton
```

**Côté validation :**
```typescript
// jobValidation.ts détectera:
if (signatureBlob !== null && status !== 'completed') {
  inconsistencies.push({
    type: 'signed_but_not_completed',
    severity: 'critical',
    suggestedFix: 'Marquer le job comme "completed" et avancer à l\'étape 5',
    serverCorrectable: true,
    correctionType: 'mark_completed'
  });
}
```

**Côté DB :**
```sql
-- Table jobs:
UPDATE jobs SET
  signature_blob = 'data:image/png;base64,...',
  signature_date = '2025-12-26T06:30:00.000Z',
  updated_at = NOW()
WHERE id = 8;
```

---

## 🎯 LOGS ATTENDUS

Après le fix, lors de la signature d'un job, vous devriez voir :

```
LOG  🖋️ [JobClient] handleSignContract called - Opening signature modal
LOG  📤 [SigningBloc] Uploading signature to server for job: 8
LOG  📝 [SAVE SIGNATURE] Starting signature save for job: 8
LOG  📝 [SAVE SIGNATURE] Signature format valid: { length: 45678, type: "data:image/png;base64,..." }
LOG  📝 [SAVE SIGNATURE] Sending to API: {
  jobId: 8,
  signature_type: "client",
  signature_data_length: 45678
}
LOG  ✅ [SAVE SIGNATURE] Signature saved successfully: {
  success: true,
  signatureUrl: "https://storage.altivo.fr/signatures/job_8_client_1735197000.png",
  signatureId: "sig_abc123"
}
LOG  ✅ [SigningBloc] Signature uploaded successfully: {
  signatureId: "sig_abc123",
  signatureUrl: "https://storage.altivo.fr/signatures/job_8_client_1735197000.png"
}
TOAST ✅ Signature Enregistrée
```

---

## ⚠️ PROBLÈME RÉSIDUEL: Boucle Infinie Corrections

**ATTENTION:** Même après ce fix, il reste le problème de la **boucle infinie des corrections** `timer_not_started` :

```
1. Job ID=8 signé ✅
2. validateJobConsistency() détecte timer_not_started (car backend ne l'a jamais créé)
3. requestServerCorrection() appelle backend
4. Backend répond: {applied: true, forced: true}
5. MAIS timer_started_at reste NULL en DB ❌
6. Reload job
7. Retour à l'étape 2 → BOUCLE INFINIE
```

**Solution temporaire recommandée :**

Désactiver la détection `timer_not_started` dans `jobValidation.ts` jusqu'à ce que le dev backend corrige réellement la création du timer :

```typescript
// src/utils/jobValidation.ts ligne ~60
// ⚠️ TEMP DISABLED: Désactivé car backend ne crée pas vraiment le timer
/*
if (currentStep > 1 && !timerStartedAt && timerTotalHours === 0) {
  // ... détection timer_not_started ...
}
*/
console.log('ℹ️ [JobValidation] timer_not_started detection temporarily disabled');
```

---

## ✅ CHECKLIST TEST

### Test 1: Signature simple

- [ ] Ouvrir Job ID=8
- [ ] Cliquer "🖋️ Faire Signer le Contrat"
- [ ] Dessiner signature sur canvas
- [ ] Cliquer "Sauvegarder"
- [ ] ✅ Observer logs: "📤 Uploading signature"
- [ ] ✅ Observer logs: "✅ Signature uploaded successfully"
- [ ] ✅ Toast: "Signature Enregistrée"
- [ ] ✅ Section signature affiche "✓ Contrat Signé !"

### Test 2: Persistence après reload

- [ ] Après signature, fermer app complètement
- [ ] Rouvrir app
- [ ] Ouvrir Job ID=8
- [ ] ✅ Section signature affiche TOUJOURS "✓ Contrat Signé !"
- [ ] ✅ signature_blob présent dans job data

### Test 3: Vérification DB

```sql
SELECT 
  id, 
  code,
  status,
  signature_blob IS NOT NULL as has_signature,
  signature_date,
  updated_at
FROM jobs
WHERE id = 8;

-- Résultat attendu:
-- id=8, code=JOB-DEC-002, status=in_progress, has_signature=TRUE, signature_date=2025-12-26T...
```

### Test 4: Validation automatique

- [ ] Après signature, observer logs validation
- [ ] ✅ Devrait détecter: `signed_but_not_completed`
- [ ] ✅ Devrait proposer: `mark_completed`
- [ ] (SI correction serveur fonctionne): Job status → "completed"

---

## 📝 RÉSUMÉ DES CHANGEMENTS

| Fichier | Lignes | Changement |
|---------|--------|------------|
| `src/components/signingBloc.tsx` | 365-430 | ✅ Ajouté appel `saveJobSignature()` dans `handleSignatureOK` |
| | | ✅ Ajouté logs "📤 Uploading signature" et "✅ uploaded successfully" |
| | | ✅ Ajouté gestion erreur upload avec Alert |
| | | ✅ Ajouté fields: `signature_blob`, `signature_date`, `signatureId`, `signatureUrl` |
| | | ✅ Toast changé: "Signature Saved" → "Signature Enregistrée" |
| `src/services/jobDetails.ts` | 748-830 | ℹ️ API `saveJobSignature` déjà existante (pas de changement) |

---

## 🚀 PROCHAINES ÉTAPES

1. **Test signature** (User)
   - Signer Job ID=8
   - Observer logs complets
   - Vérifier persistence après reload

2. **Vérifier DB** (Dev backend OU User avec accès DB)
   ```sql
   SELECT signature_blob, signature_date FROM jobs WHERE id = 8;
   ```

3. **Désactiver boucle infinie** (si nécessaire)
   - Commenter détection `timer_not_started` temporairement
   - OU: Contacter dev backend pour fix création timer

4. **Test E2E signature complète**
   - Signer → Vérifier DB → Reload → Vérifier persistence
   - Tester sur autre job (ID=1, etc.)
   - Valider workflow complet

---

**Date:** 26 Décembre 2025, 18:45 CET  
**Agent:** GitHub Copilot  
**Status:** ✅ Fix appliqué, awaiting user test  
**Compilation:** ✅ No errors
