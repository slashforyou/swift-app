# 📸 API Photos - Spécifications Techniques
**Date**: 28 octobre 2025  
**Pour**: Équipe Backend  
**De**: Équipe Mobile (Client Swift App)

---

## 🎯 Objectif

Implémenter les endpoints API pour la gestion des photos de jobs, permettant :
- Upload de photos depuis l'app mobile
- Récupération des photos d'un job
- Modification des descriptions
- Suppression de photos
- Affichage sécurisé des images

---

## 📋 Endpoints Requis (déjà documentés dans API-Doc.md)

### ✅ Déjà documentés (à implémenter)

```
POST   /swift-app/v1/job/{jobId}/image        # Upload 1 seule image
POST   /swift-app/v1/job/{jobId}/images       # Upload plusieurs images (max 10)
GET    /swift-app/v1/job/{jobId}/images       # Lister images d'un job
GET    /swift-app/v1/image/{id}               # Info d'une image
GET    /swift-app/v1/image/{id}/serve         # URL d'affichage sécurisée
GET    /swift-app/v1/user/{userId}/images     # Images d'un utilisateur
PATCH  /swift-app/v1/image/{id}              # Modifier description
PATCH  /swift-app/v1/image/{id}/restore      # Restaurer image supprimée
DELETE /swift-app/v1/image/{id}              # Supprimer (soft delete)
```

---

## 🔥 PRIORITÉ 1 - Upload Image (CRITIQUE)

### Endpoint
```http
POST /swift-app/v1/job/{jobId}/image
```

### Headers
```http
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data
```

### Request Body (FormData)
```typescript
{
  image: File,              // REQUIRED - JPEG/PNG, max 10MB
  description?: string      // OPTIONAL - Description de la photo
}
```

### Format image reçu (depuis mobile)
```typescript
{
  uri: string,              // "file:///data/user/0/host.exp.exponent/cache/..."
  type: "image/jpeg",
  name: "photo_1698456789123.jpg"
}
```

**Important** : 
- L'app envoie déjà des images **compressées** (max 1920px, quality 0.7)
- Format: **JPEG uniquement**
- Taille typique: **300-500KB**
- Pas besoin de re-compression côté serveur

### Response Success (200)
```json
{
  "success": true,
  "photo": {
    "id": "string",                    // ID unique (UUID ou auto-increment)
    "job_id": "string",                // ID du job
    "user_id": "string",               // ID de l'utilisateur qui a uploadé
    "filename": "string",              // Nom du fichier stocké
    "original_name": "string",         // Nom original du fichier
    "description": "string",           // Description fournie
    "file_size": number,               // Taille en bytes
    "mime_type": "image/jpeg",         // Type MIME
    "created_at": "2025-10-28T10:30:00.000Z",
    "updated_at": "2025-10-28T10:30:00.000Z"
  }
}
```

### Response Error (400/401/404/500)
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"           // OPTIONAL
}
```

### Erreurs possibles
```typescript
400 - Bad Request (image manquante, format invalide)
401 - Unauthorized (token invalide)
404 - Not Found (job inexistant)
413 - Payload Too Large (image > 10MB)
500 - Internal Server Error
```

---

## 🔥 PRIORITÉ 2 - Liste Images Job

### Endpoint
```http
GET /swift-app/v1/job/{jobId}/images
```

### Headers
```http
Authorization: Bearer {jwt_token}
```

### Query Parameters (OPTIONAL)
```typescript
?limit=50          // Nombre max de résultats (default: 50)
&offset=0          // Pagination offset (default: 0)
&sort=desc         // Tri par date (asc/desc, default: desc)
```

### Response Success (200)
```json
{
  "success": true,
  "images": [
    {
      "id": "string",
      "job_id": "string",
      "user_id": "string",
      "filename": "string",
      "original_name": "string",
      "description": "string",
      "file_size": number,
      "mime_type": "image/jpeg",
      "created_at": "2025-10-28T10:30:00.000Z",
      "updated_at": "2025-10-28T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": number,              // Total d'images
    "limit": number,              // Limite appliquée
    "offset": number              // Offset appliqué
  }
}
```

### Response si aucune image
```json
{
  "success": true,
  "images": [],
  "meta": {
    "total": 0,
    "limit": 50,
    "offset": 0
  }
}
```

---

## 🔥 PRIORITÉ 3 - Affichage Image (Serve)

### Endpoint
```http
GET /swift-app/v1/image/{id}/serve
```

### Headers
```http
Authorization: Bearer {jwt_token}
```

### Response Options

**Option A: Redirect vers URL signée (RECOMMANDÉ)**
```http
HTTP 302 Found
Location: https://storage.example.com/signed-url?token=xxx&expires=yyy
```

**Option B: Stream direct**
```http
HTTP 200 OK
Content-Type: image/jpeg
Content-Length: 456789
Cache-Control: max-age=3600

[BINARY IMAGE DATA]
```

**Recommandation** : Option A (redirect) pour :
- Meilleur caching
- Moins de charge serveur
- CDN compatible

---

## 📝 PRIORITÉ 4 - Modifier Description

### Endpoint
```http
PATCH /swift-app/v1/image/{id}
```

### Headers
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### Request Body
```json
{
  "description": "Nouvelle description"
}
```

### Response Success (200)
```json
{
  "success": true,
  "photo": {
    "id": "string",
    "description": "Nouvelle description",
    "updated_at": "2025-10-28T10:35:00.000Z"
    // ... autres champs
  }
}
```

---

## 🗑️ PRIORITÉ 5 - Supprimer Image

### Endpoint
```http
DELETE /swift-app/v1/image/{id}
```

### Headers
```http
Authorization: Bearer {jwt_token}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

**Important** : 
- Implémenter **soft delete** (marquer comme supprimé, ne pas supprimer physiquement)
- Garder le fichier pendant 30 jours pour récupération éventuelle
- Ajouter champ `deleted_at` dans la BDD

---

## 💾 Schéma Base de Données Suggéré

### Table: `job_images`
```sql
CREATE TABLE job_images (
  id VARCHAR(36) PRIMARY KEY,              -- UUID
  job_id VARCHAR(50) NOT NULL,             -- Référence au job
  user_id INT NOT NULL,                    -- Utilisateur qui a uploadé
  filename VARCHAR(255) NOT NULL,          -- Nom fichier stocké (unique)
  original_name VARCHAR(255) NOT NULL,     -- Nom fichier original
  description TEXT,                        -- Description
  file_size INT NOT NULL,                  -- Taille en bytes
  mime_type VARCHAR(50) NOT NULL,          -- Type MIME (image/jpeg, image/png)
  storage_path VARCHAR(500) NOT NULL,      -- Chemin de stockage
  deleted_at TIMESTAMP NULL,               -- Soft delete
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_job_id (job_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at),
  
  -- Foreign keys
  FOREIGN KEY (job_id) REFERENCES jobs(code) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 📁 Stockage Fichiers

### Recommandations

**Option A: Stockage local serveur**
```
/var/www/swift-app/storage/job_images/
  ├── 2025/
  │   ├── 10/
  │   │   ├── 28/
  │   │   │   ├── {uuid}.jpg
  │   │   │   └── {uuid}.jpg
```

**Option B: Cloud Storage (AWS S3, Google Cloud Storage)**
```
swift-app-production/
  ├── job_images/
  │   ├── 2025/10/28/{uuid}.jpg
```

### Naming Convention
```typescript
filename = `${uuid()}.jpg`
// Exemple: "a3f8d9e2-4b1c-4a8e-9f2d-3c5e6b7a8d9e.jpg"
```

**Avantages** :
- Unicité garantie
- Pas de collision
- Pas besoin de nettoyer nom original
- Extension explicite

---

## 🔒 Sécurité

### 1. Authentification
```typescript
// Vérifier JWT token valide
// Vérifier que user a accès au job
const job = await getJob(jobId);
if (!canUserAccessJob(user.id, job)) {
  throw new UnauthorizedError('Access denied');
}
```

### 2. Validation Fichier
```typescript
// Vérifier MIME type
const allowedTypes = ['image/jpeg', 'image/png'];
if (!allowedTypes.includes(file.mimetype)) {
  throw new BadRequestError('Invalid file type');
}

// Vérifier taille
const maxSize = 10 * 1024 * 1024; // 10MB
if (file.size > maxSize) {
  throw new PayloadTooLargeError('File too large');
}

// Vérifier vraiment une image (pas juste extension)
const isValidImage = await validateImageFile(file);
if (!isValidImage) {
  throw new BadRequestError('Invalid image file');
}
```

### 3. Sanitization
```typescript
// Nettoyer description
description = sanitizeHtml(description, {
  allowedTags: [],  // Pas de HTML
  allowedAttributes: {}
});
```

---

## 📊 Comportement Mobile Actuel

### Flow côté client (déjà implémenté)
```typescript
1. User clique "Ajouter photo"
2. PhotoSelectionModal s'ouvre
3. User choisit caméra/galerie
4. Image capturée → Compression (1920px, 70%)
5. Upload vers API: POST /v1/job/{jobId}/image
   
   Si SUCCESS:
     ✅ Photo ajoutée à la liste
     ✅ Affichée immédiatement
     ✅ Sauvegardée en BDD serveur
   
   Si ERROR 404 (API non déployée):
     📝 Fallback AsyncStorage local
     📝 Photo sauvegardée localement
     📝 Retry automatique dans 5 minutes
     📝 Affichée avec badge "Local"
```

### Ce qui attend du serveur
```typescript
// L'app envoie
FormData {
  image: {
    uri: "file:///...",
    type: "image/jpeg",
    name: "photo_1698456789.jpg"
  },
  description: "Photo du chargement"
}

// L'app attend
{
  success: true,
  photo: {
    id: "uuid-xxx",
    job_id: "JOB-001",
    user_id: "15",
    filename: "a3f8d9e2.jpg",
    description: "Photo du chargement",
    file_size: 456789,
    created_at: "2025-10-28T10:30:00.000Z"
  }
}
```

---

## 🧪 Tests Recommandés

### Tests unitaires serveur
```javascript
describe('POST /v1/job/:jobId/image', () => {
  it('should upload image successfully', async () => {
    const res = await request(app)
      .post('/v1/job/JOB-001/image')
      .set('Authorization', `Bearer ${validToken}`)
      .attach('image', imageBuffer, 'test.jpg')
      .field('description', 'Test photo');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.photo).toBeDefined();
    expect(res.body.photo.id).toBeDefined();
  });

  it('should reject unauthorized request', async () => {
    const res = await request(app)
      .post('/v1/job/JOB-001/image')
      .attach('image', imageBuffer, 'test.jpg');
    
    expect(res.status).toBe(401);
  });

  it('should reject file > 10MB', async () => {
    const largeFile = Buffer.alloc(11 * 1024 * 1024);
    const res = await request(app)
      .post('/v1/job/JOB-001/image')
      .set('Authorization', `Bearer ${validToken}`)
      .attach('image', largeFile, 'large.jpg');
    
    expect(res.status).toBe(413);
  });

  it('should reject invalid file type', async () => {
    const res = await request(app)
      .post('/v1/job/JOB-001/image')
      .set('Authorization', `Bearer ${validToken}`)
      .attach('image', textBuffer, 'test.txt');
    
    expect(res.status).toBe(400);
  });
});
```

---

## 🚀 Déploiement

### Checklist avant mise en prod

- [ ] Endpoints implémentés et testés
- [ ] Stockage fichiers configuré (local ou cloud)
- [ ] Permissions dossiers configurées (si stockage local)
- [ ] Validations sécurité en place
- [ ] Soft delete implémenté
- [ ] Logs configurés (upload, errors)
- [ ] Rate limiting configuré (max uploads/minute)
- [ ] Backup strategy en place
- [ ] Documentation API mise à jour
- [ ] Tests end-to-end réussis

### Configuration recommandée
```javascript
// config/upload.js
module.exports = {
  storage: {
    type: 'local', // ou 's3', 'gcs'
    path: '/var/www/swift-app/storage/job_images',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png'],
  },
  
  limits: {
    maxImagesPerJob: 100,
    maxImagesPerUpload: 10,
    maxUploadsPerMinute: 20,
  },
  
  cleanup: {
    deletedRetentionDays: 30,
    cleanupSchedule: '0 2 * * *', // 2am daily
  }
};
```

---

## 📞 Contact & Support

### Questions techniques
- **Slack**: #backend-api
- **Email**: backend-team@example.com

### Tests avec l'app mobile
- **Environnement**: Production API
- **Test account**: test@swift-app.com / password123
- **Test job**: JOB-NERD-ACTIVE-001

### Logs côté mobile
Quand l'API sera déployée, l'app logguera :
```
🌐 [DEBUG] Appel uploadJobPhoto API...
📤 [DEBUG] ÉTAPE 2: Uploading vers API...
✅ Photo uploadée avec succès: {photo_id}
```

---

## ✅ Résumé Exécutif

### Ce qui est attendu MINIMUM (Phase 1)
1. ✅ **POST /v1/job/{jobId}/image** - Upload 1 photo
2. ✅ **GET /v1/job/{jobId}/images** - Liste photos job
3. ✅ **GET /v1/image/{id}/serve** - Afficher photo

### Phase 2 (optionnel, pas urgent)
4. **PATCH /v1/image/{id}** - Modifier description
5. **DELETE /v1/image/{id}** - Supprimer photo
6. **POST /v1/job/{jobId}/images** - Upload multiple

### Délais suggérés
- **Phase 1** : 2-3 jours (endpoints critiques)
- **Phase 2** : 1-2 jours (fonctionnalités avancées)

### Côté mobile (déjà fait ✅)
- ✅ Upload avec compression
- ✅ Fallback AsyncStorage
- ✅ Retry automatique
- ✅ Gestion d'erreurs
- ✅ Interface utilisateur

**Dès que les endpoints sont déployés, l'app fonctionnera automatiquement ! 🚀**

---

**Date**: 28 octobre 2025  
**Version**: 1.0  
**Statut**: Prêt pour implémentation backend
