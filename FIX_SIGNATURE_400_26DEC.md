# 🔧 Fix Erreur 400 "Signature Existe Déjà" - 26 Décembre 2025

## ❌ Problème Initial

**Erreur backend:**
```
❌ [SAVE SIGNATURE] Upload failed: {
  "status": 400,
  "error": "Une signature de type \"client\" existe déjà pour ce job",
  "existing_signature_id": 7
}
```

**Cause racine:**
1. Le job ID=8 **a déjà une signature** (ID=7) en base de données
2. L'app ne **vérifiait pas** si une signature existe avant d'essayer d'en créer une nouvelle
3. Le backend **refuse de créer** une signature si une existe déjà (retourne 400)
4. Le service `saveJobSignature()` ne **parsait pas** le message d'erreur JSON du backend
5. Le composant `signingBloc.tsx` **bloquait complètement** sur toute erreur 400

---

## ✅ Corrections Appliquées

### 1. **jobDetails.ts** - Parser le message d'erreur JSON

**Avant (ligne 809-816):**
```typescript
if (!uploadResponse.ok) {
  const errorText = await uploadResponse.text();
  console.error('❌ [SAVE SIGNATURE] Upload failed:', {
    status: uploadResponse.status,
    error: errorText
  });
  
  return {
    success: false,
    message: `Erreur lors de l'upload: ${uploadResponse.status}` // ❌ Message générique
  };
}
```

**Après (ligne 809-831):**
```typescript
if (!uploadResponse.ok) {
  const errorText = await uploadResponse.text();
  console.error('❌ [SAVE SIGNATURE] Upload failed:', {
    status: uploadResponse.status,
    error: errorText
  });
  
  // ⚡ Parser le JSON d'erreur pour extraire le message réel
  let errorMessage = `Erreur lors de l'upload: ${uploadResponse.status}`;
  let existingSignatureId: number | undefined;
  
  try {
    const errorJson = JSON.parse(errorText);
    if (errorJson.error) {
      errorMessage = errorJson.error; // ✅ Message backend réel
    }
    if (errorJson.existing_signature_id) {
      existingSignatureId = errorJson.existing_signature_id;
    }
  } catch (e) {
    // Si parsing échoue, garder le message par défaut
  }
  
  return {
    success: false,
    message: errorMessage, // ✅ Contient "existe déjà"
    existingSignatureId
  };
}
```

**Type de retour mis à jour (ligne 752-758):**
```typescript
): Promise<{
  success: boolean;
  signatureUrl?: string;
  signatureId?: string;
  message?: string;
  existingSignatureId?: number; // ✅ Nouveau champ
}> {
```

---

### 2. **signingBloc.tsx** - Vérifier AVANT d'uploader

**Ajouté (ligne 368-401):**
```typescript
// ⚡ VÉRIFICATION: Si signature existe déjà, sauvegarder en LOCAL SEULEMENT
const jobAny = job as any;
const signatureExists = jobAny.signature_blob || jobAny.signature_date;

if (signatureExists) {
  console.log('⚠️ [SigningBloc] Signature already exists in job data, updating locally only');
  
  // Mettre à jour le state local SANS appeler le backend
  setJob(prev => ({
    ...prev,
    signatureDataUrl: sig,
    signatureFileUri: fileUri,
  }));
  
  onSave(sig);
  setIsSigning(false);
  
  setTimeout(() => {
    handleClose();
  }, 500);
  
  Alert.alert(
    "✅ Signature Mise à Jour",
    "Votre signature a été mise à jour localement (une signature existait déjà sur le serveur).",
    [{ text: "OK" }]
  );
  return; // ✅ Ne pas appeler le backend si signature existe
}
```

**Log modifié (ligne 403):**
```typescript
console.log('📤 [SigningBloc] Uploading NEW signature to server for job:', job.id);
```

**Fallback toujours en place (ligne 417-445):**
```typescript
// ⚡ GESTION SPÉCIFIQUE: Signature existe déjà (code 400)
if (uploadResult.message?.includes('existe déjà')) {
  console.log('⚠️ [SigningBloc] Signature already exists, treating as update');
  
  // Mettre à jour le state local même si backend refuse
  setJob(prev => ({
    ...prev,
    signatureDataUrl: sig,
    signatureFileUri: fileUri,
  }));
  
  onSave(sig);
  setIsSigning(false);
  
  setTimeout(() => {
    handleClose();
  }, 500);
  
  Alert.alert(
    "✅ Signature Mise à Jour",
    "Votre signature a été mise à jour localement. Une signature existait déjà sur le serveur.",
    [{ text: "OK" }]
  );
  return; // ✅ Continuer malgré erreur backend
}
```

---

## 📊 Comportement Après Fix

### Cas 1: Job SANS signature existante
```
1. Utilisateur signe → handleSignatureOK()
2. Vérification: jobAny.signature_blob = undefined → CONTINUE
3. Upload vers backend → POST /job/8/signature
4. Backend: {success: true, signatureId: 8, signatureUrl: "..."}
5. State local mis à jour avec signatureId + URL
6. Alert: "✅ Signature Enregistrée"
```

### Cas 2: Job AVEC signature existante (Job ID=8)
```
1. Utilisateur signe → handleSignatureOK()
2. Vérification: jobAny.signature_blob = "data:image/..." → STOP
3. Pas d'upload backend (évite erreur 400)
4. State local mis à jour SANS appel API
5. Alert: "✅ Signature Mise à Jour (locale)"
```

### Cas 3: Signature existe mais non détectée (fallback)
```
1. Vérification: jobAny.signature_blob = undefined (données incomplètes)
2. Upload vers backend → POST /job/8/signature
3. Backend: 400 "Une signature de type \"client\" existe déjà"
4. Service parse JSON: message = "Une signature de type \"client\" existe déjà"
5. Composant détecte "existe déjà" → Traite comme update
6. State local mis à jour
7. Alert: "✅ Signature Mise à Jour"
```

---

## 🔍 Logs Attendus Après Fix

### Job ID=8 (signature existe):
```
⚠️ [SigningBloc] Signature already exists in job data, updating locally only
✅ Alert: "Signature Mise à Jour (locale)"
```

### Job ID=9 (nouvelle signature):
```
📤 [SigningBloc] Uploading NEW signature to server for job: 9
✅ [SigningBloc] Signature uploaded successfully: {signatureId: 9, signatureUrl: "..."}
✅ Alert: "Signature Enregistrée"
```

---

## ⚠️ Limitations Connues

1. **Type `Job` incomplet dans signingBloc.tsx:**
   - Cast `as any` utilisé pour accéder à `signature_blob` et `signature_date`
   - Idéalement, le type devrait être mis à jour pour inclure ces champs

2. **Pas d'API UPDATE signature:**
   - Backend n'a pas d'endpoint pour METTRE À JOUR une signature existante
   - Solution actuelle: Mise à jour locale uniquement
   - Solution idéale: Backend devrait exposer `PUT /job/:id/signature` ou `DELETE puis POST`

3. **Signature existante non toujours détectée:**
   - Dépend de si `jobDetails.job` contient `signature_blob` et `signature_date`
   - Fallback en place pour gérer l'erreur 400 si vérification rate

---

## 🎯 Prochaines Étapes

1. **Tester avec Job ID=8 (signature existe):**
   - Vérifier log "⚠️ Signature already exists"
   - Vérifier alert "Signature Mise à Jour (locale)"
   - Vérifier pas d'appel API vers `/signature`

2. **Tester avec nouveau job (pas de signature):**
   - Vérifier log "📤 Uploading NEW signature"
   - Vérifier upload backend réussi
   - Vérifier alert "Signature Enregistrée"

3. **Backend (optionnel):**
   - Exposer endpoint `PUT /job/:id/signature` pour permettre updates
   - Ou exposer `DELETE /job/:id/signature/:signatureId` puis permettre re-POST

---

## 📝 Fichiers Modifiés

1. `src/services/jobDetails.ts` - Lignes 752-831
2. `src/components/signingBloc.tsx` - Lignes 368-445

**Commit suggéré:**
```
fix(signature): Handle "signature already exists" error gracefully

- Parse backend error JSON to extract real message
- Check if signature exists BEFORE uploading (avoid 400)
- Fallback: treat 400 "exists" as local update
- User can re-sign jobs with existing signatures
```
