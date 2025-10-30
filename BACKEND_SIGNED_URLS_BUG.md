# 🔴 BUG CRITIQUE: Double Slash dans Signed URLs Backend

**Date**: 30 Octobre 2025  
**Priorité**: HAUTE  
**Status**: WORKAROUND FRONTEND APPLIQUÉ - FIX BACKEND REQUIS

---

## 📊 SYMPTÔMES

Les photos ne s'affichent pas dans l'app mobile. Erreur HTTP 404 sur toutes les images.

### Logs d'erreur:
```
ERROR ❌ [PhotoItem] Image load error: {
  "id": 1,
  "url": "https://storage.googleapis.com/swift-images//uploads/jobs/1/job_1_pickup_001.jpg?GoogleAccessId=...",
  "errorMessage": "Unexpected HTTP code Response{code=404}"
}
```

**Remarquez le double slash**: `swift-images//uploads/` ❌

---

## 🔍 ANALYSE DU PROBLÈME

### 1. Ce que le backend renvoie actuellement:

```json
{
  "id": 1,
  "filename": "job_1_pickup_001.jpg",
  "url": "https://storage.googleapis.com/swift-images//uploads/jobs/1/job_1_pickup_001.jpg?GoogleAccessId=swiftaccount%40swiftapp-475009.iam.gserviceaccount.com&Expires=1761827759&Signature=..."
}
```

**URL problématique**: `swift-images//uploads/` (double slash)

### 2. Ce que Google Cloud Storage attend:

```
https://storage.googleapis.com/swift-images/uploads/jobs/1/job_1_pickup_001.jpg
                                             ^
                                             UN SEUL SLASH
```

### 3. Pourquoi ça échoue:

- GCS traite `//uploads/` comme un path invalide
- Le fichier existe à `/uploads/jobs/1/photo.jpg`
- Mais la signed URL pointe vers `//uploads/jobs/1/photo.jpg`
- Résultat: **HTTP 404 Not Found**

---

## 🛠️ WORKAROUND FRONTEND (TEMPORAIRE)

**Fichier modifié**: `src/components/jobDetails/sections/JobPhotosSection.tsx`

### PhotoItem (ligne ~405):
```typescript
const photoUrl = React.useMemo(() => {
  if (photo.url) {
    // 🔧 WORKAROUND: Corriger le double slash du backend
    return photo.url.replace(/\/\/uploads\//g, '/uploads/');
  }
  // ...
}, [photo.url, ...]);
```

### PhotoViewModal (ligne ~278):
```typescript
<Image
  source={{ 
    uri: photo.url 
      ? photo.url.replace(/\/\/uploads\//g, '/uploads/')  // Workaround
      : // ...fallback
  }}
/>
```

**Ce workaround**:
- ✅ Fonctionne pour corriger l'affichage
- ✅ N'a pas d'effet secondaire
- ⚠️ **MAIS** masque le vrai problème backend
- ⚠️ Ne corrige pas les autres double slashes possibles

---

## ✅ SOLUTION BACKEND REQUISE

### Localiser le code qui génère les signed URLs

**Fichier probable**: `backend/routes/jobs/images.js` ou similaire

**Code actuel (hypothétique)**:
```javascript
// ❌ MAUVAIS - Génère double slash
const filePath = `/${photo.filename}`;  // filename = "/uploads/jobs/1/photo.jpg"
const signedUrl = await storage
  .bucket('swift-images')
  .file(filePath)  // Résultat: "//uploads/jobs/1/photo.jpg"
  .getSignedUrl({
    action: 'read',
    expires: Date.now() + 24 * 60 * 60 * 1000
  });
```

**Code corrigé**:
```javascript
// ✅ CORRECT - Nettoie le path avant signature
const cleanPath = photo.filename.replace(/^\/+/, '');  // Enlève les "/" au début
const signedUrl = await storage
  .bucket('swift-images')
  .file(cleanPath)  // Résultat: "uploads/jobs/1/photo.jpg" ✅
  .getSignedUrl({
    action: 'read',
    expires: Date.now() + 24 * 60 * 60 * 1000
  });
```

### Ou mieux: Normaliser à l'upload

**Lors de l'upload** (fichier upload handler):
```javascript
// ❌ MAUVAIS
const filename = `/${jobId}/${timestamp}_${originalName}`;
// Stocké en DB: "/uploads/jobs/1/photo.jpg"

// ✅ CORRECT
const filename = `${jobId}/${timestamp}_${originalName}`;
// Stocké en DB: "uploads/jobs/1/photo.jpg" (sans "/" au début)
```

---

## 🧪 TESTS BACKEND

### Test 1: Vérifier les filenames en DB

```sql
SELECT id, filename, file_path 
FROM job_images 
WHERE job_id = 1 
LIMIT 5;
```

**Chercher**:
- ❌ Filenames qui commencent par `/` : `/uploads/...`
- ❌ Filenames qui contiennent `//` : `//uploads/...`

**Corriger**:
```sql
-- Nettoyer les filenames existants
UPDATE job_images 
SET filename = TRIM(LEADING '/' FROM filename)
WHERE filename LIKE '/%';
```

### Test 2: Vérifier la signed URL générée

```javascript
// Dans le endpoint GET /v1/job/:id/images
console.log('Raw filename from DB:', photo.filename);
console.log('Signed URL generated:', signedUrl);

// Devrait afficher:
// Raw filename from DB: uploads/jobs/1/photo.jpg
// Signed URL: https://storage.googleapis.com/swift-images/uploads/jobs/1/photo.jpg?GoogleAccessId=...
//                                                         ^
//                                                         UN SEUL SLASH
```

### Test 3: Tester manuellement dans navigateur

```bash
# Copier une signed URL depuis les logs
# Coller dans navigateur
# L'image devrait s'afficher, PAS une erreur 404
```

---

## 📋 CHECKLIST FIX BACKEND

- [ ] **1. Localiser le code de génération des signed URLs**
  - Fichier: `routes/jobs/images.js` ou équivalent
  - Fonction: Probablement dans `GET /v1/job/:id/images`

- [ ] **2. Nettoyer les paths avant getSignedUrl()**
  ```javascript
  const cleanPath = filename.replace(/^\/+/, '');
  ```

- [ ] **3. Nettoyer la base de données (migrations)**
  ```sql
  UPDATE job_images 
  SET filename = TRIM(LEADING '/' FROM filename);
  ```

- [ ] **4. Corriger le handler d'upload**
  - Ne PAS préfixer avec `/`
  - Stocker: `uploads/jobs/1/photo.jpg`
  - Pas: `/uploads/jobs/1/photo.jpg`

- [ ] **5. Ajouter validation**
  ```javascript
  // Après upload
  if (filename.startsWith('/') || filename.includes('//')) {
    throw new Error('Invalid filename format');
  }
  ```

- [ ] **6. Tester**
  - Upload nouvelle photo
  - Vérifier filename en DB (pas de `/` au début)
  - Vérifier signed URL (pas de `//`)
  - Tester affichage dans app mobile

- [ ] **7. Supprimer le workaround frontend**
  - Une fois backend fixé
  - Remove `.replace(/\/\/uploads\//g, '/uploads/')`
  - Dans PhotoItem et PhotoViewModal

---

## 📝 NOTES ADDITIONNELLES

### Pourquoi le frontend ne peut pas tout résoudre

Le workaround actuel (`replace(/\/\/uploads\//g, '/uploads/')`) fonctionne MAIS:

1. **Assume le pattern `//uploads/`**: Si le backend génère d'autres doubles slashes (`//media/`, `//files/`), ils ne seront pas corrigés

2. **Masque le problème**: Les logs backend ne montreront pas l'erreur

3. **Performance**: Chaque URL est nettoyée 2 fois (PhotoItem + PhotoViewModal)

4. **Maintenance**: Code technique temporaire qui devrait être retiré

### Impact utilisateur actuel

**AVANT le workaround**:
- ❌ Toutes les photos affichent des carrés gris
- ❌ HTTP 404 sur toutes les images
- ❌ Expérience utilisateur cassée

**APRÈS le workaround**:
- ✅ Photos s'affichent correctement
- ✅ Pagination fonctionne
- ⚠️ Quelques images corrompues (problème séparé)
- ⚠️ Fichier .txt uploadé comme image (validation manquante)

---

## 🎯 TIMELINE RECOMMANDÉE

**Immédiat** (Fait ✅):
- Workaround frontend appliqué
- App fonctionne pour utilisateurs

**Court terme** (Cette semaine):
- Fix backend: nettoyer paths avant signed URLs
- Migration DB: enlever `/` au début des filenames
- Ajouter validation upload

**Moyen terme** (Prochaine release):
- Retirer workaround frontend
- Tests automatisés backend pour paths
- Documentation API mise à jour

---

## 💬 CONTACT

Questions? → Romain Giovanni (@slashforyou)

**Fichiers frontend modifiés**:
- `src/components/jobDetails/sections/JobPhotosSection.tsx`

**Commits**:
- `ac0e562` - Workaround double slash signed URLs
- `a5df54d` - Gestion erreurs images corrompues
- `5b5ec5d` - Fix boucle infinie + double slash (première tentative)
