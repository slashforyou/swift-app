# 🧪 Guide de Test API Photos

**Date**: 28 octobre 2025  
**API déployée**: ✅ OUI (28 oct 2025)

---

## 🎯 Objectif

Vérifier que les endpoints API photos fonctionnent correctement côté serveur.

---

## 📋 Tests à Effectuer

### ✅ Option 1: Test Manuel avec Script Node.js (RECOMMANDÉ)

1. **Récupérer ton token JWT**:
   ```javascript
   // Dans l'app mobile (console DevTools)
   import AsyncStorage from '@react-native-async-storage/async-storage';
   AsyncStorage.getItem('session_token').then(console.log);
   ```

2. **Configurer le script**:
   ```bash
   # Ouvrir scripts/test-photos-api-manual.js
   # Ligne 18: Remplacer AUTH_TOKEN par ton token
   ```

3. **Exécuter les tests**:
   ```bash
   node scripts/test-photos-api-manual.js
   ```

4. **Résultats attendus**:
   ```
   ✅ GET /v1/job/{jobId}/images - Liste des photos
   ✅ GET /v1/image/{id}/serve - URL d'affichage
   ✅ PATCH /v1/image/{id} - Mise à jour description
   ✅ Sécurité: Requête sans token rejetée (401)
   ```

---

### ✅ Option 2: Test avec cURL

#### 1. GET - Récupérer photos d'un job
```bash
curl -X GET "https://altivo.fr/swift-app/v1/job/JOB-NERD-ACTIVE-001/images" \
  -H "Authorization: Bearer TON_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

**Réponse attendue (200)**:
```json
{
  "success": true,
  "images": [
    {
      "id": "uuid-xxx",
      "job_id": "JOB-NERD-ACTIVE-001",
      "user_id": "15",
      "filename": "a3f8d9e2.jpg",
      "description": "Photo du chargement",
      "file_size": 456789,
      "mime_type": "image/jpeg",
      "created_at": "2025-10-28T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

#### 2. POST - Upload une photo
```bash
curl -X POST "https://altivo.fr/swift-app/v1/job/JOB-NERD-ACTIVE-001/image" \
  -H "Authorization: Bearer TON_TOKEN_JWT" \
  -F "image=@photo.jpg" \
  -F "description=Test photo from cURL"
```

**Réponse attendue (200)**:
```json
{
  "success": true,
  "photo": {
    "id": "new-uuid",
    "job_id": "JOB-NERD-ACTIVE-001",
    "filename": "generated-name.jpg",
    "file_size": 123456,
    "created_at": "2025-10-28T11:00:00.000Z"
  }
}
```

#### 3. GET - Afficher une photo
```bash
curl -X GET "https://altivo.fr/swift-app/v1/image/PHOTO_ID/serve" \
  -H "Authorization: Bearer TON_TOKEN_JWT" \
  -I
```

**Réponse attendue**:
- **Option A (redirect)**: `302 Found` avec `Location: https://...`
- **Option B (stream)**: `200 OK` avec `Content-Type: image/jpeg`

#### 4. PATCH - Modifier description
```bash
curl -X PATCH "https://altivo.fr/swift-app/v1/image/PHOTO_ID" \
  -H "Authorization: Bearer TON_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"description":"Nouvelle description"}'
```

**Réponse attendue (200)**:
```json
{
  "success": true,
  "photo": {
    "id": "PHOTO_ID",
    "description": "Nouvelle description",
    "updated_at": "2025-10-28T11:05:00.000Z"
  }
}
```

#### 5. DELETE - Supprimer photo
```bash
curl -X DELETE "https://altivo.fr/swift-app/v1/image/PHOTO_ID" \
  -H "Authorization: Bearer TON_TOKEN_JWT"
```

**Réponse attendue (200)**:
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

### ✅ Option 3: Test avec l'App Mobile (END-TO-END)

**C'est le test le plus complet !**

1. **Upload photo**:
   - Ouvre l'app mobile
   - Va dans Job Details (`JOB-NERD-ACTIVE-001`)
   - Clique "Ajouter Photo"
   - Sélectionne/capture image
   - Ajoute description
   - Upload

2. **Vérifier les logs**:
   ```
   ✅ Console devrait afficher:
   📸 [DEBUG] Image sélectionnée: file:///...
   🗜️ [DEBUG] Compression...
   🌐 [DEBUG] Appel uploadJobPhoto API...
   📤 [DEBUG] ÉTAPE 2: Uploading vers API...
   ✅ [DEBUG] API uploadJobPhoto réussi: {photo}
   💾 [DEBUG] Photo sauvegardée en state
   ```

3. **Vérifier l'UI**:
   - Photo apparaît dans la grille
   - Description affichée
   - Pas de badge "Local" (synced avec serveur)

4. **Tester modification**:
   - Clique sur photo
   - Modifie description
   - Enregistre
   - Vérifie mise à jour

5. **Tester suppression**:
   - Clique sur icône poubelle
   - Confirme
   - Photo disparaît de la liste

---

## 🔒 Tests de Sécurité

### Test 1: Requête sans token
```bash
curl -X GET "https://altivo.fr/swift-app/v1/job/JOB-001/images"
```
**Attendu**: `401 Unauthorized`

### Test 2: Token invalide
```bash
curl -X GET "https://altivo.fr/swift-app/v1/job/JOB-001/images" \
  -H "Authorization: Bearer invalid_token_123"
```
**Attendu**: `401 Unauthorized`

### Test 3: Upload fichier trop gros (> 10MB)
```bash
# Créer fichier 11MB
dd if=/dev/zero of=large.jpg bs=1M count=11

curl -X POST "https://altivo.fr/swift-app/v1/job/JOB-001/image" \
  -H "Authorization: Bearer TON_TOKEN" \
  -F "image=@large.jpg"
```
**Attendu**: `413 Payload Too Large`

### Test 4: Upload fichier non-image
```bash
curl -X POST "https://altivo.fr/swift-app/v1/job/JOB-001/image" \
  -H "Authorization: Bearer TON_TOKEN" \
  -F "image=@document.pdf"
```
**Attendu**: `400 Bad Request` (invalid file type)

---

## 📊 Checklist de Validation

### Backend (API)
- [ ] GET /v1/job/{jobId}/images retourne liste photos
- [ ] POST /v1/job/{jobId}/image accepte upload
- [ ] GET /v1/image/{id}/serve retourne image ou redirect
- [ ] PATCH /v1/image/{id} met à jour description
- [ ] DELETE /v1/image/{id} supprime (soft delete)
- [ ] Requêtes sans token rejetées (401)
- [ ] Fichiers > 10MB rejetés (413)
- [ ] Fichiers non-image rejetés (400)
- [ ] Response format conforme à la spec
- [ ] Timestamps au format ISO 8601

### Frontend (Mobile)
- [ ] Upload photo fonctionne
- [ ] Photos affichées dans la grille
- [ ] Modification description fonctionne
- [ ] Suppression photo fonctionne
- [ ] Fallback AsyncStorage si API down
- [ ] Retry automatique après 5 min
- [ ] Logs clean (pas d'erreurs HTTP 404)
- [ ] Performance acceptable (< 3s upload)

---

## 🐛 Debugging

### Problème: HTTP 401 Unauthorized
**Cause**: Token JWT invalide ou expiré  
**Solution**:
1. Vérifie que le token est correct
2. Vérifie que le token n'est pas expiré
3. Vérifie le header `Authorization: Bearer {token}`

### Problème: HTTP 404 Not Found
**Cause**: Endpoint non déployé ou route incorrecte  
**Solution**:
1. Vérifie l'URL: `https://altivo.fr/swift-app/v1/...`
2. Vérifie que les routes sont configurées côté serveur
3. Check nginx/apache config

### Problème: HTTP 500 Internal Server Error
**Cause**: Erreur côté serveur  
**Solution**:
1. Check les logs serveur
2. Vérifie la BDD (table `job_images` existe ?)
3. Vérifie les permissions fichiers
4. Vérifie le stockage (disque plein ?)

### Problème: Upload photo échoue (400)
**Cause**: Fichier invalide ou FormData incorrect  
**Solution**:
1. Vérifie type MIME (image/jpeg ou image/png)
2. Vérifie taille < 10MB
3. Vérifie FormData key = "image"
4. Vérifie que c'est vraiment une image

---

## 📈 Performance

### Benchmarks attendus
- **GET photos** : < 500ms
- **POST upload** : < 3s (pour image 500KB)
- **GET serve** : < 200ms (redirect) ou < 1s (stream)
- **PATCH description** : < 300ms
- **DELETE photo** : < 300ms

### Si performance faible
1. Activer cache côté serveur
2. Utiliser CDN pour serve
3. Optimiser requêtes BDD (indexes)
4. Compresser images côté serveur si besoin

---

## ✅ Résumé Tests Réussis

Une fois tous les tests passés, tu devrais avoir :

```
╔═══════════════════════════════════════════════════════════╗
║           ✅ API PHOTOS - VALIDATION COMPLÈTE            ║
╚═══════════════════════════════════════════════════════════╝

Backend:
✅ 5 endpoints fonctionnels
✅ Sécurité validée (JWT, validations)
✅ Performance OK (< 3s)
✅ Response format conforme
✅ Soft delete implémenté

Frontend:
✅ Upload photo OK
✅ Liste photos OK
✅ Modification OK
✅ Suppression OK
✅ Fallback local OK
✅ Retry automatique OK

Tests effectués:
✅ Script Node.js manuel
✅ Tests cURL
✅ Tests end-to-end mobile
✅ Tests sécurité
✅ Tests performance

🎉 Système photos 100% fonctionnel !
```

---

**Prochaines étapes**:
1. ✅ Tester avec script Node.js
2. ✅ Tester upload via app mobile
3. ✅ Vérifier sécurité
4. ✅ Monitorer performance
5. 🚀 Déployer en production !
