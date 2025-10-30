# Configuration Google Cloud Storage Bucket

## PROBLÈME ACTUEL
- Les photos sont uploadées avec succès dans `swift-images` bucket
- Mais l'accès public retourne HTTP 403 Forbidden
- Les images ne peuvent pas être affichées dans l'app

## SOLUTION : Rendre le bucket public

### Option 1 : Via Google Cloud Console (Interface Web) ⭐ RECOMMANDÉ

1. **Accéder au bucket** :
   - Aller sur https://console.cloud.google.com/storage
   - Sélectionner le projet `swiftapp-475009`
   - Cliquer sur le bucket `swift-images`

2. **IMPORTANT - Vérifier l'accès actuel** :
   - Onglet "Permissions"
   - Chercher "swiftapp-475009@swiftapp-475009.iam.gserviceaccount.com"
   - ⚠️ Si vous voyez "Viewer" au niveau projet → PAS SUFFISANT!
   
3. **Configurer les permissions publiques** :
   - Toujours dans l'onglet "Permissions"
   - Cliquer "Grant Access" (bouton bleu en haut)
   - Ajouter un nouveau principal :
     * **New principals** : `allUsers` (exactement ce texte)
     * **Select a role** : 
       - Chercher "Storage Object Viewer"
       - OU taper directement : "roles/storage.objectViewer"
     * ⚠️ Un avertissement "This resource will be public" apparaîtra → C'EST NORMAL
   - Cliquer "Save"
   - Confirmer "Allow public access"

4. **Vérification** :
   - Vous devriez voir dans la liste des permissions :
     ```
     allUsers  →  Storage Object Viewer
     ```
   - Un badge "Public to internet" devrait apparaître sur le bucket

3. **Vérifier CORS (si nécessaire)** :
   - Onglet "Configuration"
   - Section "CORS configuration"
   - Ajouter :
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET", "HEAD"],
       "responseHeader": ["Content-Type"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

### Option 2 : Via gcloud CLI (Ligne de commande)

```bash
# Rendre tous les objets du bucket publics
gsutil iam ch allUsers:objectViewer gs://swift-images

# Configurer CORS
echo '[{"origin": ["*"], "method": ["GET", "HEAD"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 3600}]' > cors.json
gsutil cors set cors.json gs://swift-images
```

### Option 3 : Via API backend (Recommandé pour production)

Modifier l'upload pour rendre chaque fichier public automatiquement :

```typescript
// Dans votre backend (uploadPhoto endpoint)
const file = bucket.file(filePath);
await file.save(buffer, {
  metadata: { contentType: mimeType },
  public: true  // ← Rend le fichier public
});

// Obtenir l'URL publique
const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
```

## VÉRIFICATION

Après configuration, tester l'accès :

### Test 1 : Vérifier dans la console
```
1. Aller sur https://console.cloud.google.com/storage/browser/swift-images
2. Cliquer sur une image (ex: 1/1761734151864_5d30b3fc-a1b2-4816-8d58-fadaecbb3c0a.jpg)
3. Regarder "Public access" → devrait dire "Public to internet"
4. Cliquer sur le lien "Authenticated URL" 
5. Copier l'URL publique qui ressemble à :
   https://storage.googleapis.com/swift-images/1/1761734151864_xxx.jpg
```

### Test 2 : Vérifier dans le navigateur
```bash
# Ouvrir une image dans le navigateur (mode navigation privée)
https://storage.googleapis.com/swift-images/1/1761734151864_5d30b3fc-a1b2-4816-8d58-fadaecbb3c0a.jpg

# ✅ SUCCÈS : L'image s'affiche
# ❌ ÉCHEC : "AccessDenied" ou erreur 403
```

### Test 3 : Via curl (optionnel)
```bash
curl -I https://storage.googleapis.com/swift-images/1/1761734151864_5d30b3fc-a1b2-4816-8d58-fadaecbb3c0a.jpg

# ✅ SUCCÈS : HTTP/2 200
# ❌ ÉCHEC : HTTP/2 403
```

## DIFFÉRENCE : Viewer vs Public Access

⚠️ **IMPORTANT À COMPRENDRE** :

| Qui | Rôle actuel | Peut voir les images dans l'app ? |
|-----|-------------|-----------------------------------|
| `swiftapp-475009@...iam.gserviceaccount.com` | Viewer (projet) | ❌ NON - Peut uploader mais pas accès public |
| `swiftapp-475009@...iam.gserviceaccount.com` | Storage Object Viewer (bucket) | ❌ NON - Seulement si authentifié |
| `allUsers` | Storage Object Viewer (bucket) | ✅ OUI - N'importe qui peut voir |

**Explication** :
- **Viewer au niveau projet** = Peut voir que le bucket existe
- **Storage Object Viewer pour compte de service** = Ce compte peut lire les fichiers (pour upload/backup)
- **Storage Object Viewer pour `allUsers`** = **TOUT LE MONDE** peut lire les fichiers (nécessaire pour l'app mobile!)

L'app mobile React Native charge les images comme un navigateur web normal, sans authentification. Elle a donc besoin que les images soient **publiques** (`allUsers`).

## SÉCURITÉ (Pour production)

⚠️ **IMPORTANT** : Rendre le bucket public expose TOUTES les images.

**Alternatives sécurisées** :
1. **Signed URLs** : Générer des URLs temporaires avec expiration
2. **Firebase Storage Rules** : Contrôle d'accès par utilisateur
3. **Proxy API** : L'app demande l'image via votre API qui vérifie les permissions

Exemple avec Signed URLs :
```typescript
// Backend : générer une URL signée valide 1 heure
const [signedUrl] = await file.getSignedUrl({
  action: 'read',
  expires: Date.now() + 3600000 // 1 heure
});

// Retourner signedUrl au lieu de l'URL publique
```

## PROCHAINES ÉTAPES

1. ✅ Rendre le bucket public (Option 1 ou 2)
2. ✅ Tester l'URL dans le navigateur
3. ✅ Reload l'app React Native
4. ✅ Les images devraient s'afficher !
5. 🔒 (Plus tard) Implémenter Signed URLs pour la sécurité
