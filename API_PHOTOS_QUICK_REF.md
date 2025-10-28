# 🎯 Quick Reference - API Photos (Pour l'équipe Backend)

## TL;DR - Ce dont on a besoin MAINTENANT

### 🔥 URGENT - Endpoint Prioritaire

```http
POST /swift-app/v1/job/{jobId}/image
Authorization: Bearer {jwt_token}
Content-Type: multipart/form-data

Body FormData:
- image: File (JPEG, max 10MB, déjà compressé par mobile)
- description?: string (optional)

Response 200:
{
  "success": true,
  "photo": {
    "id": "string",
    "job_id": "string",
    "user_id": "string",
    "filename": "string",
    "original_name": "string",
    "description": "string",
    "file_size": number,
    "mime_type": "image/jpeg",
    "created_at": "ISO 8601",
    "updated_at": "ISO 8601"
  }
}
```

---

## 📋 Endpoints Phase 1 (Minimum Viable)

| Method | Endpoint | Priorité | Description |
|--------|----------|----------|-------------|
| **POST** | `/v1/job/{jobId}/image` | 🔥🔥🔥 | Upload 1 photo |
| **GET** | `/v1/job/{jobId}/images` | 🔥🔥 | Liste photos d'un job |
| **GET** | `/v1/image/{id}/serve` | 🔥 | Afficher une photo |

---

## 💾 BDD Schema (Minimum)

```sql
CREATE TABLE job_images (
  id VARCHAR(36) PRIMARY KEY,
  job_id VARCHAR(50) NOT NULL,
  user_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  description TEXT,
  file_size INT NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_job_id (job_id),
  FOREIGN KEY (job_id) REFERENCES jobs(code) ON DELETE CASCADE
);
```

---

## 🔒 Sécurité Checklist

- [ ] JWT token validation
- [ ] User has access to job
- [ ] File type validation (JPEG/PNG only)
- [ ] File size check (max 10MB)
- [ ] Actual image validation (not just extension)
- [ ] Description sanitization (no HTML)
- [ ] Rate limiting (20 uploads/min per user)

---

## 🧪 Quick Test avec cURL

```bash
# Upload photo
curl -X POST https://altivo.fr/swift-app/v1/job/JOB-001/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test.jpg" \
  -F "description=Test photo from cURL"

# List photos
curl -X GET https://altivo.fr/swift-app/v1/job/JOB-001/images \
  -H "Authorization: Bearer YOUR_TOKEN"

# Serve photo
curl -X GET https://altivo.fr/swift-app/v1/image/PHOTO_ID/serve \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Ce que l'app mobile envoie ACTUELLEMENT

```javascript
// FormData envoyé par React Native
{
  image: {
    uri: "file:///data/user/0/host.exp.exponent/cache/ImageManipulator/xxx.jpg",
    type: "image/jpeg",
    name: "photo_1698456789123.jpg"
  },
  description: "Photo du chargement"
}

// Headers automatiques
Authorization: Bearer d78aab73ea074a99b626...
Content-Type: multipart/form-data
```

---

## ✅ Test Endpoints Ready

Quand prêt, tester avec :
- **Job test**: `JOB-NERD-ACTIVE-001`
- **User test**: ID `15` (Romain)
- **Token**: Disponible dans logs app mobile

---

## 🚨 Erreurs à retourner

```javascript
400 - Image manquante ou format invalide
401 - Token invalide ou manquant
404 - Job inexistant
413 - Fichier trop gros (> 10MB)
500 - Erreur serveur
```

---

## 📁 Stockage Suggéré

```
/var/www/swift-app/storage/job_images/2025/10/28/{uuid}.jpg
```

ou

```
s3://swift-app-production/job_images/2025/10/28/{uuid}.jpg
```

---

## 🎯 Behavior Attendu

### Scénario 1: API fonctionne ✅
```
Mobile → POST /v1/job/1/image
Serveur → 200 OK {photo object}
Mobile → Affiche photo immédiatement
Mobile → Photo en BDD serveur ✅
```

### Scénario 2: API offline ❌ (actuel)
```
Mobile → POST /v1/job/1/image
Serveur → 404 Not Found
Mobile → Fallback AsyncStorage local
Mobile → Photo affichée avec badge "Local"
Mobile → Retry dans 5 minutes
```

---

## 📞 Contact

**Mobile team ready** : L'app est 100% prête côté client !  
**Documentation complète** : `API_PHOTOS_REQUIREMENTS.md`  
**Questions** : Contacte l'équipe mobile

---

**Date**: 28 octobre 2025  
**Status**: ⏳ En attente implémentation backend
