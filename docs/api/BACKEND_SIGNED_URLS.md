# Backend - Implémentation Signed URLs

## OBJECTIF
Rendre les photos accessibles UNIQUEMENT via l'app (pas publiques) en utilisant des URLs signées temporaires.

## MODIFICATIONS BACKEND REQUISES

### 1. Endpoint GET /jobs/:jobId/photos

**Fichier à modifier** : `backend/src/routes/photos.ts` (ou équivalent)

**AVANT** (retourne juste le filename) :
```typescript
app.get('/jobs/:jobId/photos', async (req, res) => {
  const { jobId } = req.params;
  
  const photos = await db.query(
    'SELECT * FROM job_photos WHERE job_id = ?',
    [jobId]
  );
  
  res.json({
    success: true,
    data: {
      images: photos // ❌ filename seul, app ne peut pas charger
    }
  });
});
```

**APRÈS** (génère des signed URLs) :
```typescript
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: 'swiftapp-475009',
  keyFilename: './service-account-key.json' // Votre clé de service
});

const bucket = storage.bucket('swift-images');

app.get('/jobs/:jobId/photos', async (req, res) => {
  const { jobId } = req.params;
  
  const photos = await db.query(
    'SELECT * FROM job_photos WHERE job_id = ?',
    [jobId]
  );
  
  // ✅ Générer une signed URL pour chaque photo
  const photosWithSignedUrls = await Promise.all(
    photos.map(async (photo) => {
      // Générer une URL signée valide 1 heure
      const [signedUrl] = await bucket
        .file(photo.filename) // ou photo.filePath
        .getSignedUrl({
          action: 'read',
          expires: Date.now() + 3600000, // 1 heure
        });
      
      return {
        ...photo,
        url: signedUrl, // ✅ URL temporaire sécurisée
        signedUrl: signedUrl,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };
    })
  );
  
  res.json({
    success: true,
    data: {
      images: photosWithSignedUrls
    }
  });
});
```

---

### 2. Service Account - Vérifier les permissions

Le compte de service `swiftapp-475009@swiftapp-475009.iam.gserviceaccount.com` doit avoir :

**Rôle requis** : `Storage Object Viewer` (ou `Storage Object Admin`)

**Vérifier dans Google Cloud Console** :
1. Aller sur : https://console.cloud.google.com/iam-admin/iam?project=swiftapp-475009
2. Chercher : `swiftapp-475009@swiftapp-475009.iam.gserviceaccount.com`
3. Vérifier qu'il a : "Storage Object Viewer" OU "Storage Admin"
4. Si non, cliquer "Edit" → Ajouter le rôle → Save

---

### 3. Clé de service (Service Account Key)

Le backend a besoin d'une clé pour signer les URLs.

**Si vous n'avez pas encore de clé** :
1. Aller sur : https://console.cloud.google.com/iam-admin/serviceaccounts?project=swiftapp-475009
2. Cliquer sur : `swiftapp-475009@swiftapp-475009.iam.gserviceaccount.com`
3. Onglet "Keys"
4. "Add Key" → "Create new key" → JSON
5. Télécharger le fichier `swiftapp-475009-xxxxx.json`
6. **NE PAS COMMITTER CE FICHIER!** Ajouter à `.gitignore`
7. Placer dans le backend : `backend/service-account-key.json`

**Ou utiliser les variables d'environnement** (recommandé) :
```typescript
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n')
  }
});
```

---

## MODIFICATIONS FRONTEND (React Native App)

### Option A : Utiliser les signed URLs directement (PLUS SIMPLE)

**Fichier** : `src/components/jobDetails/sections/JobPhotosSection.tsx`

**Modification** : PhotoItem utilise déjà `photo.url` si disponible!

```typescript
const PhotoItem: React.FC<PhotoItemProps> = ({ photo, onPress }) => {
  const photoUrl = React.useMemo(() => {
    // ✅ Si le backend a renvoyé une signed URL, l'utiliser
    if (photo.url) {
      return photo.url; // Signed URL du backend
    }
    
    // Sinon, photo locale
    const photoId = String(photo.id);
    return photoId.startsWith('local-') 
      ? photo.filename 
      : `https://storage.googleapis.com/swift-images/${photo.filename}`;
  }, [photo.id, photo.filename, photo.url]);
  
  // ... reste du code
};
```

**C'EST DÉJÀ PRESQUE BON!** Il suffit que le backend renvoie `url` dans la réponse.

---

### Option B : Endpoint dédié pour obtenir une signed URL (PLUS FLEXIBLE)

Si vous voulez générer les signed URLs à la demande (pas pour toutes les photos) :

**Backend - Nouvel endpoint** :
```typescript
app.get('/photos/:photoId/signed-url', async (req, res) => {
  const { photoId } = req.params;
  
  const photo = await db.query(
    'SELECT * FROM job_photos WHERE id = ?',
    [photoId]
  );
  
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  
  const [signedUrl] = await bucket
    .file(photo.filename)
    .getSignedUrl({
      action: 'read',
      expires: Date.now() + 3600000,
    });
  
  res.json({
    success: true,
    url: signedUrl,
    expiresAt: new Date(Date.now() + 3600000).toISOString()
  });
});
```

**Frontend - Hook pour obtenir signed URL** :
```typescript
const getSignedPhotoUrl = async (photoId: string): Promise<string> => {
  const response = await apiClient.get(`/photos/${photoId}/signed-url`);
  return response.data.url;
};
```

---

## AVANTAGES DES SIGNED URLs

✅ **Sécurité** : Seules les personnes avec l'URL temporaire peuvent accéder  
✅ **Contrôle** : Vous décidez qui obtient une URL et pour combien de temps  
✅ **Audit** : Vous savez qui demande quelles photos  
✅ **Révocation** : Les URLs expirent automatiquement  
✅ **Pas de bucket public** : Aucun risque d'exposition accidentelle  

---

## INCONVÉNIENTS (mineurs)

⚠️ **Performance** : Génération d'URL prend ~50ms par photo  
→ Solution : Générer en batch pour toutes les photos d'un job

⚠️ **Expiration** : URLs expirent après 1h  
→ Solution : L'app redemande les photos si elle les affiche > 1h après

⚠️ **Complexité backend** : Besoin de clé de service  
→ Solution : Configuration unique, ensuite automatique

---

## PLAN D'IMPLÉMENTATION

### Phase 1 : Backend (30-60 min)
1. ✅ Installer `@google-cloud/storage` dans le backend
2. ✅ Configurer la clé de service
3. ✅ Modifier l'endpoint GET /jobs/:jobId/photos
4. ✅ Tester avec Postman/curl

### Phase 2 : Frontend (5 min)
1. ✅ Vérifier que PhotoItem utilise `photo.url` si disponible
2. ✅ (Déjà fait dans le code actuel!)

### Phase 3 : Tests (15 min)
1. ✅ Reload l'app
2. ✅ Vérifier que les photos s'affichent
3. ✅ Vérifier dans les logs que les URLs sont signées
4. ✅ Essayer d'ouvrir une URL signée dans le navigateur (devrait marcher)
5. ✅ Attendre 1h, essayer de rouvrir (devrait être expirée)

---

## EXEMPLE DE RÉPONSE API AVEC SIGNED URLs

```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": 22,
        "filename": "1/1761734151864_5d30b3fc-a1b2-4816-8d58-fadaecbb3c0a.jpg",
        "url": "https://storage.googleapis.com/swift-images/1/1761734151864_5d30b3fc-a1b2-4816-8d58-fadaecbb3c0a.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=swiftapp-475009%40swiftapp-475009.iam.gserviceaccount.com%2F20251030%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20251030T143052Z&X-Goog-Expires=3600&X-Goog-SignedHeaders=host&X-Goog-Signature=...",
        "signedUrl": "https://storage.googleapis.com/...",
        "expiresAt": "2025-10-30T15:30:52.000Z",
        "description": "Photo pickup",
        "type": "before"
      }
    ]
  }
}
```

Notez la **longue URL** avec `X-Goog-Signature` → c'est la signature cryptographique!

---

## PROCHAINE ÉTAPE

**Quelle partie du backend gérez-vous?**
- Node.js/Express ?
- PHP/Laravel ?
- Python/FastAPI ?
- Autre ?

Je vous fournirai le code exact à ajouter dans votre backend!
