# 📝 API SIGNATURE - RÉFÉRENCE TECHNIQUE

## 🎯 **ENVOI DE LA SIGNATURE À L'API**

### **Endpoint**
```
POST https://altivo.fr/swift-app/v1/job/{jobId}/signature
```

### **Headers**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

### **Body (JSON)**
```json
{
  "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "signature_type": "client"
}
```

### **Paramètres du Body**

| Champ | Type | Requis | Valeurs possibles | Description |
|-------|------|--------|-------------------|-------------|
| `signature_data` | `string` | ✅ Oui | `data:image/png;base64,...` | Chaîne Base64 complète de l'image avec préfixe data URI |
| `signature_type` | `string` | ✅ Oui | `"client"`, `"delivery"`, `"pickup"` | Type de signature |

---

## 📤 **EXEMPLE COMPLET DE REQUÊTE**

### **Code TypeScript (fonction saveJobSignature)**
```typescript
// Fichier: src/services/jobDetails.ts

export async function saveJobSignature(
  jobId: number | string,
  signatureDataUrl: string,
  signatureType: 'client' | 'delivery' | 'pickup' = 'client'
): Promise<{
  success: boolean;
  signatureUrl?: string;
  signatureId?: string;
  message?: string;
}> {
  try {
    // ✅ Validation format
    if (!signatureDataUrl.startsWith('data:image/')) {
      return {
        success: false,
        message: 'Format de signature invalide'
      };
    }

    // ✅ Préparation du body
    const requestBody = {
      signature_data: signatureDataUrl,
      signature_type: signatureType
    };

    // ✅ Envoi à l'API
    const uploadResponse = await authenticatedFetch(
      `${API}v1/job/${jobId}/signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      return {
        success: false,
        message: `Erreur lors de l'upload: ${uploadResponse.status}`
      };
    }

    const result = await uploadResponse.json();
    
    return {
      success: true,
      signatureUrl: result.signatureUrl || result.url,
      signatureId: result.signatureId || result.id,
      message: 'Signature enregistrée avec succès'
    };

  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Erreur inconnue'
    };
  }
}
```

### **Exemple de requête cURL**
```bash
curl -X POST https://altivo.fr/swift-app/v1/job/6/signature \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer c5ef8925f93269246b9a..." \
  -d '{
    "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyoAAAHCCAYAAAAAQT0BAAAQAElEQVR4Aey9jbnsuJFgmRoL1BZMyQJpLSitBb1jQakt...",
    "signature_type": "client"
  }'
```

---

## 📥 **RÉPONSE ATTENDUE DE L'API**

### **Réponse Success (200 OK)**
```json
{
  "success": true,
  "signatureUrl": "https://storage.googleapis.com/.../signature_client_job6_1730976062.png",
  "signatureId": "123",
  "message": "Signature saved successfully"
}
```

### **Structure de la réponse**

| Champ | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | Statut de l'opération |
| `signatureUrl` | `string` | URL publique de la signature stockée (GCS/S3) |
| `signatureId` | `string` | ID unique de la signature en DB |
| `message` | `string` | Message de confirmation |

### **Réponse Error (4xx/5xx)**
```json
{
  "success": false,
  "message": "Invalid signature format"
}
```

---

## 🔄 **FLUX COMPLET DE SIGNATURE**

```mermaid
sequenceDiagram
    participant U as User
    participant C as SigningBloc Component
    participant S as summary.tsx
    participant A as saveJobSignature()
    participant API as Backend API
    participant DB as Database
    participant GCS as Google Cloud Storage

    U->>C: Dessine signature
    C->>C: Génère data URL (base64)
    C->>S: onSave(signatureDataUrl)
    S->>A: saveJobSignature(jobId, dataUrl, 'client')
    
    A->>A: Valide format data:image/
    A->>API: POST /v1/job/{jobId}/signature
    Note over A,API: Body: {signature_data, signature_type}
    
    API->>API: Décode Base64
    API->>GCS: Upload image PNG
    GCS-->>API: URL publique
    
    API->>DB: UPDATE jobs SET signature_blob = url
    API-->>A: {success, signatureUrl, signatureId}
    
    A-->>S: {success, signatureUrl}
    S->>S: setJob({...job, signature_blob: url})
    S->>U: Affiche "Signature saved!"
```

---

## 💾 **FORMAT DE LA SIGNATURE**

### **Étape 1 : Canvas → Data URL**
Le composant `react-native-signature-canvas` génère :
```typescript
const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyoAAAHCCAYAAAAAQT0BAAAQAElEQVR4Aey9jbnsuJFgmRoL...";
```

**Caractéristiques** :
- Format : `data:image/png;base64,{BASE64_STRING}`
- Taille : ~50-200 KB (selon complexité)
- Contenu : Image PNG encodée en Base64

### **Étape 2 : Envoi à l'API**
```json
{
  "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyoAAAHCCAYAAAAAQT0BAAAQAElEQVR4Aey9jbnsuJFgmRoL...",
  "signature_type": "client"
}
```

### **Étape 3 : Backend traite**
```python
# Backend doit :
1. Extraire le Base64 (enlever "data:image/png;base64,")
2. Décoder en bytes
3. Sauvegarder en fichier PNG
4. Upload vers GCS/S3
5. Retourner l'URL publique
```

---

## 🗃️ **STOCKAGE EN BASE DE DONNÉES**

### **Table : `jobs`**
```sql
UPDATE jobs 
SET 
  signature_blob = 'https://storage.googleapis.com/.../signature_client_job6_1730976062.png',
  signature_date = CURRENT_TIMESTAMP,
  signature_type = 'client'
WHERE id = 6;
```

### **Colonnes concernées**

| Colonne | Type | Description |
|---------|------|-------------|
| `signature_blob` | `VARCHAR(500)` | URL publique de l'image stockée |
| `signature_date` | `TIMESTAMP` | Date/heure de la signature |
| `signature_type` | `ENUM` | Type : `client`, `delivery`, `pickup` |

---

## 🔍 **RÉCUPÉRATION DE LA SIGNATURE**

### **Endpoint de récupération**
```
GET https://altivo.fr/swift-app/v1/job/{jobId}/full
```

### **Réponse incluant signature**
```json
{
  "success": true,
  "data": {
    "job": {
      "id": 6,
      "code": "JOB-NERD-URGENT-006",
      "signature_blob": "https://storage.googleapis.com/.../signature_client_job6_1730976062.png",
      "signature_date": "2025-11-07T10:30:00.000Z",
      "signature_type": "client",
      // ... autres champs
    }
  }
}
```

---

## ⚙️ **UTILISATION DANS L'APP**

### **1. Sauvegarder une signature**
```typescript
// Dans summary.tsx
const result = await saveJobSignature(
  job.id,           // 6
  signatureDataUrl, // "data:image/png;base64,..."
  'client'          // Type de signature
);

if (result.success) {
  setJob({ 
    ...job, 
    signature_blob: result.signatureUrl,
    signatureDataUrl: signatureDataUrl,
    signatureFileUri: fileUri
  });
}
```

### **2. Vérifier si un job est signé**
```typescript
// Dans payment.tsx ou JobTimerDisplay.tsx
const hasSignature = () => {
    return !!(
        job?.signatureDataUrl ||    // Signature locale (session en cours)
        job?.signatureFileUri ||    // Fichier local (session en cours)
        job?.signature_blob ||      // URL de l'API (persistante)
        job?.job?.signature_blob    // URL de l'API (structure imbriquée)
    );
};
```

### **3. Afficher la signature**
```tsx
{hasSignature() && (
  <Image 
    source={{ uri: job.signature_blob || job.signatureDataUrl }} 
    style={{ width: 200, height: 100 }}
  />
)}
```

---

## 🐛 **DEBUGGING**

### **Logs côté client**
```typescript
// Dans saveJobSignature()
console.log('📝 [SAVE SIGNATURE] Starting signature save for job:', jobId);
console.log('📝 [SAVE SIGNATURE] Signature format valid:', {
  length: signatureDataUrl.length,
  type: signatureDataUrl.substring(0, 30) + '...'
});
console.log('📝 [SAVE SIGNATURE] Sending to API:', {
  jobId,
  signature_type: signatureType,
  signature_data_length: signatureDataUrl.length
});
console.log('✅ [SAVE SIGNATURE] Signature saved successfully:', result);
```

### **Vérifications à faire**

1. ✅ **Format valide** : Commence par `data:image/`
2. ✅ **Taille raisonnable** : Entre 10 KB et 500 KB
3. ✅ **API retourne success** : `result.success === true`
4. ✅ **URL retournée** : `result.signatureUrl` existe
5. ✅ **Stockage en DB** : Vérifier `SELECT signature_blob FROM jobs WHERE id = 6`

### **Erreurs courantes**

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Invalid signature format` | Data URL ne commence pas par `data:image/` | Vérifier la génération du canvas |
| `HTTP 400` | Body JSON malformé | Vérifier le JSON.stringify |
| `HTTP 401` | Token expiré/invalide | Rafraîchir le token |
| `HTTP 500` | Erreur backend | Vérifier les logs serveur |
| `signature_blob: null` après GET | API ne sauvegarde pas en DB | Vérifier la fonction d'upload backend |

---

## 📋 **CHECKLIST IMPLÉMENTATION**

### **Backend requis** ✅

- [ ] Endpoint `POST /v1/job/{jobId}/signature` existe
- [ ] Accepte `Content-Type: application/json`
- [ ] Décode correctement le Base64 avec préfixe `data:image/png;base64,`
- [ ] Upload vers GCS/S3
- [ ] Sauvegarde `signature_blob` (URL) en DB
- [ ] Retourne `{success, signatureUrl, signatureId}`
- [ ] Endpoint `GET /v1/job/{jobId}/full` retourne `signature_blob`

### **Frontend implémenté** ✅

- [x] Composant `SigningBloc` génère data URL
- [x] Fonction `saveJobSignature()` envoie à l'API
- [x] Mise à jour locale du job après sauvegarde
- [x] Vérification `hasSignature()` avec 4 sources
- [x] Mapping `signature_blob` depuis l'API dans `getJobDetails()`
- [x] Logs de debug complets

---

## 🔗 **FICHIERS CONCERNÉS**

1. **Service API** : `src/services/jobDetails.ts` (fonction `saveJobSignature`)
2. **Appel** : `src/screens/JobDetailsScreens/summary.tsx` (dans `onSave`)
3. **Composant** : `src/components/signingBloc.tsx` (génère la signature)
4. **Récupération** : `src/services/jobs.ts` (fonction `getJobDetails`)
5. **Vérifications** : 
   - `src/screens/JobDetailsScreens/payment.tsx`
   - `src/components/jobDetails/JobTimerDisplay.tsx`
   - `src/components/jobDetails/sections/SignatureSection.tsx`

---

**Dernière mise à jour** : 7 novembre 2025 - 16h15
