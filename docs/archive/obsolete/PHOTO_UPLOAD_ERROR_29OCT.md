# 📸 Diagnostic Upload Photo - 29 Octobre 2025

## 🔍 Analyse de l'Erreur

### Logs Reçus
```
✅ [DEBUG] Photo envoyée, fermeture modal...
✅ [DEBUG] handleTakePhoto - FIN SUCCÈS
ERROR Error uploading photo: [Error: Unable to add the photo. Please try again.]
```

### Problème Identifié

**L'upload réussit côté serveur (photo en BDD) MAIS échoue côté client !**

---

## 📋 Ce Que le Client Attend du Serveur

### Format de Réponse Attendu

Le code dans `src/services/jobPhotos.ts` attend cette structure EXACTE :

```typescript
{
  "success": true,           // ⚠️ REQUIS
  "photo": {                 // ⚠️ REQUIS (objet photo)
    "id": "uuid-xxx",        // ⚠️ REQUIS
    "job_id": "JOB-001",     // ⚠️ REQUIS
    "user_id": "15",         // ⚠️ REQUIS
    "filename": "abc.jpg",   // ⚠️ REQUIS
    "original_name": "photo.jpg",  // ⚠️ REQUIS
    "description": "...",    // Optionnel
    "file_size": 456789,     // ⚠️ REQUIS (en bytes)
    "mime_type": "image/jpeg", // ⚠️ REQUIS
    "width": 1200,           // Optionnel
    "height": 800,           // Optionnel
    "created_at": "2025-10-29T10:00:00.000Z",  // ⚠️ REQUIS
    "updated_at": "2025-10-29T10:00:00.000Z",  // ⚠️ REQUIS
    "deleted_at": null       // Optionnel
  }
}
```

### Validation Côté Client

```typescript
// Dans uploadJobPhoto() ligne 75-78
const data: UploadPhotoResponse = await res.json();
if (!data.photo) {
  throw new Error('No photo returned from server');  // ⚠️ ERREUR ICI
}
return data.photo;
```

**Ce qui se passe**:
1. ✅ Serveur reçoit l'image
2. ✅ Serveur sauvegarde en BDD
3. ❌ Serveur retourne une réponse SANS `photo` object
4. ❌ Client lance erreur: "Unable to add the photo"

---

## 🔧 Solutions Possibles

### Option 1: Vérifier la Réponse Serveur (RECOMMANDÉ)

**Checker ce que le serveur retourne actuellement**:

```bash
# Test avec cURL
curl -X POST "https://altivo.fr/swift-app/v1/job/JOB-NERD-ACTIVE-001/image" \
  -H "Authorization: Bearer TON_TOKEN" \
  -F "image=@photo.jpg" \
  -F "description=Test"
```

**Exemples de réponses INCORRECTES** :

❌ **Cas 1**: Juste `{success: true}`
```json
{
  "success": true
}
```
**Problème**: Manque `photo` object

❌ **Cas 2**: Object photo dans mauvais format
```json
{
  "success": true,
  "image": {...}  // Devrait être "photo", pas "image"
}
```

❌ **Cas 3**: Champs manquants
```json
{
  "success": true,
  "photo": {
    "id": "123"
    // Manque: job_id, user_id, filename, etc.
  }
}
```

### Option 2: Adapter le Code Client (Temporaire)

Si tu ne peux pas modifier le serveur immédiatement:

```typescript
// Dans src/services/jobPhotos.ts ligne 75-80
const data: UploadPhotoResponse = await res.json();

// ✅ Version flexible (accepte plusieurs formats)
const photo = data.photo || data.image || data.data || data;

if (!photo || !photo.id) {
  throw new Error('No photo returned from server');
}

return photo;
```

---

## 📊 Format Réponse Recommandé

### Réponse SUCCESS (200)
```json
{
  "success": true,
  "photo": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "job_id": "JOB-NERD-ACTIVE-001",
    "user_id": "15",
    "filename": "abc123.jpg",
    "original_name": "photo_1730195678123.jpg",
    "description": "Job photo 1",
    "file_size": 245678,
    "mime_type": "image/jpeg",
    "width": 1200,
    "height": 800,
    "created_at": "2025-10-29T10:30:00.000Z",
    "updated_at": "2025-10-29T10:30:00.000Z",
    "deleted_at": null
  }
}
```

### Réponse ERREUR (400/500)
```json
{
  "success": false,
  "message": "Invalid file type",
  "error": "FILE_TYPE_INVALID"
}
```

---

## 🗜️ Optimisation Compression Photos

### Standards Pour App Mobile

**Taille recommandée** : 150-300 KB par photo

**Paramètres actuels** (trop conservateurs):
```typescript
maxWidth: 1920px
maxHeight: 1080px
quality: 0.6  (60%)
```

**Paramètres recommandés** :
```typescript
maxWidth: 1200px   // ⬇️ Réduit de 1920
maxHeight: 800px   // ⬇️ Réduit de 1080
quality: 0.5       // ⬇️ Réduit de 0.6 (60% → 50%)
```

### Pourquoi Ces Valeurs ?

**Résolution 1200x800** :
- ✅ Assez pour affichage mobile (même Full HD)
- ✅ 40% plus léger que 1920x1080
- ✅ Chargement 2x plus rapide
- ✅ Économise data utilisateur
- ✅ Standard industrie (Instagram, WhatsApp, etc.)

**Qualité 50%** :
- ✅ Imperceptible à l'œil nu sur mobile
- ✅ Taille fichier ~200KB (vs 400KB actuellement)
- ✅ Upload 2x plus rapide
- ✅ Moins de risque timeout

### Comparaison Tailles

| Config | Résolution | Quality | Taille Estimée | Upload Time (4G) |
|--------|-----------|---------|----------------|------------------|
| **Actuel** | 1920x1080 | 60% | ~400 KB | ~2 secondes |
| **Recommandé** | 1200x800 | 50% | ~200 KB | ~1 seconde |
| **Aggressif** | 800x600 | 40% | ~100 KB | ~0.5 seconde |

### Standards Industrie

**Instagram** : 1080x1080, quality 85% (mais JPEG optimisé)
**WhatsApp** : 1600x1600, quality 75% (re-compressé serveur)
**Facebook** : 2048x2048, quality 85% (re-compressé serveur)
**Slack** : 800x600, quality 70%
**Discord** : 1024x1024, quality 80%

**Notre cas (app business)** :
- Photos de chantier, inventaire, signatures
- Pas besoin haute résolution
- Priorité: rapidité + économie data
- **Recommandation: 1200x800, 50%** ✅

---

## 🎯 Actions à Faire

### 1. Vérifier Réponse Serveur (URGENT)

```bash
# Test upload
curl -X POST "https://altivo.fr/swift-app/v1/job/JOB-NERD-ACTIVE-001/image" \
  -H "Authorization: Bearer TON_TOKEN" \
  -F "image=@test.jpg" \
  -v  # Verbose pour voir response complète
```

**Checker**:
- [ ] Status code 200 ?
- [ ] Response JSON contient `photo` object ?
- [ ] Object `photo` contient tous les champs requis ?

### 2. Optimiser Compression

Modifier `src/utils/imageCompression.ts` :

```typescript
// Ligne 73-76
const {
    maxWidth = 1200,    // ⬇️ Était 1920
    maxHeight = 800,    // ⬇️ Était 1080
    quality = 0.5,      // ⬇️ Était 0.6
    format = SaveFormat.JPEG
} = options;
```

### 3. Tester Upload

1. Prendre photo dans l'app
2. Vérifier logs:
   ```
   🗜️ [DEBUG] Compression: 3000x2000 → 1200x800
   📤 [DEBUG] ÉTAPE 2: Uploading vers API...
   ✅ [DEBUG] API uploadJobPhoto réussi: {id, filename, ...}
   ```
3. Vérifier UI: Photo apparaît dans grille

---

## 📝 Checklist Debug

- [ ] Vérifier format réponse serveur (doit contenir `photo` object)
- [ ] Tous les champs requis présents (id, job_id, user_id, filename, etc.)
- [ ] Dates au format ISO 8601 (`2025-10-29T10:30:00.000Z`)
- [ ] `file_size` est un nombre (pas string)
- [ ] Optimiser compression (1200x800, quality 0.5)
- [ ] Tester upload complet
- [ ] Vérifier taille fichier < 300KB
- [ ] Vérifier temps upload < 2 secondes

---

## 🐛 Code à Débuguer

### Ajouter Logs Serveur

```typescript
// Côté serveur (après sauvegarde photo)
const photoData = {
  success: true,
  photo: {
    id: savedPhoto.id,
    job_id: savedPhoto.job_id,
    user_id: savedPhoto.user_id,
    filename: savedPhoto.filename,
    original_name: savedPhoto.original_name,
    description: savedPhoto.description,
    file_size: savedPhoto.file_size,
    mime_type: savedPhoto.mime_type,
    created_at: savedPhoto.created_at,
    updated_at: savedPhoto.updated_at
  }
};

console.log('🔍 Sending response:', JSON.stringify(photoData));
return res.json(photoData);
```

### Ajouter Logs Client

```typescript
// Dans src/services/jobPhotos.ts ligne 75
const data: UploadPhotoResponse = await res.json();
console.log('🔍 Server response:', JSON.stringify(data));

if (!data.photo) {
  console.error('❌ Missing photo object in response');
  console.error('Response keys:', Object.keys(data));
  throw new Error('No photo returned from server');
}
```

---

**Date**: 29 octobre 2025  
**Status**: ⚠️ Upload serveur OK, validation client KO  
**Action**: Vérifier format réponse serveur + optimiser compression
