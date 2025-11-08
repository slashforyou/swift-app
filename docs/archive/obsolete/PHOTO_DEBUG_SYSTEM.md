# 🔍 Système de Debug Photos - Guide Complet

## 📋 Vue d'ensemble

Ce document décrit le système complet de traces de debug mis en place pour diagnostiquer les problèmes d'upload de photos dans l'application Swift App.

**Dernière mise à jour** : 27 octobre 2025  
**Commit** : `0af4a45` - "Add comprehensive debug alerts for photo upload flow"

---

## 🎯 Objectif

Suivre **chaque étape** du flux de prise/ajout de photos pour identifier précisément où se produit le plantage ou l'erreur.

---

## 📸 Flux Complet de la Photo

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUX PHOTO UPLOAD                         │
└─────────────────────────────────────────────────────────────┘

1. Utilisateur clique "Ajouter une photo"
   └─> PhotoSelectionModal s'ouvre
   
2. Utilisateur choisit Camera ou Galerie
   └─> handleTakePhoto() OU handleSelectFromGallery()
   
3. Demande de permissions
   └─> requestPermissions()
   
4. Lancement Camera/Galerie
   └─> ImagePicker.launchCameraAsync() OU launchImageLibraryAsync()
   
5. Photo capturée/sélectionnée
   └─> Résultat avec assets[0].uri
   
6. Compression de l'image
   └─> compressImage() - 1920x1080, quality 0.6
   
7. Envoi au composant parent
   └─> onPhotoSelected(compressed.uri)
   
8. Réception dans JobPhotosSection
   └─> handlePhotoSelection(photoUri)
   
9. Appel du hook useJobPhotos
   └─> uploadPhoto(photoUri, description)
   
10. Upload vers API
    └─> uploadJobPhoto(jobId, photoUri, description)
    
11a. SUCCÈS: Photo ajoutée
     └─> Affichage dans la liste
     
11b. ERREUR: Sauvegarde locale
     └─> AsyncStorage fallback
```

---

## 🔧 Points de Debug Instrumentés

### 1️⃣ **PhotoSelectionModal.tsx** (Modal de sélection)

#### 📍 Fonction `requestPermissions()`
```typescript
// Points de trace:
- 🔐 Demande des permissions
- 📷 Permission caméra: granted/denied
- 🖼️ Permission galerie: granted/denied
- Alert avec statut des permissions
```

#### 📍 Fonction `handleTakePhoto()`
```typescript
// Points de trace:
- 📸 DÉBUT de la prise de photo
- 🔐 Vérification des permissions
- ❌ Permission refusée (si applicable)
- ✅ Permission OK, lancement caméra
- 📸 Résultat caméra (canceled, assets count)
- ✅ Photo capturée (URI original)
- 🗜️ Début compression
- ✅ Image compressée (URI compressé)
- 📤 Envoi au parent
- ✅ Photo envoyée, fermeture modal
- ❌ Prise annulée par utilisateur
- ❌ ERREUR avec stack trace complète
```

#### 📍 Fonction `handleSelectFromGallery()`
```typescript
// Points de trace (identiques à handleTakePhoto):
- 🖼️ DÉBUT sélection galerie
- 🔐 Vérification des permissions
- ❌ Permission refusée (si applicable)
- ✅ Permission OK, ouverture galerie
- 🖼️ Résultat galerie (canceled, assets count)
- ✅ Photo sélectionnée (URI original)
- 🗜️ Début compression
- ✅ Image compressée (URI compressé)
- 📤 Envoi au parent
- ✅ Photo envoyée, fermeture modal
- ❌ Sélection annulée par utilisateur
- ❌ ERREUR avec stack trace complète
```

---

### 2️⃣ **JobPhotosSection.tsx** (Composant parent)

#### 📍 Fonction `handlePhotoSelection()`
```typescript
// Points de trace:
- 🎯 REÇU du modal
- 🎯 photoUri reçu (URI complet)
- Alert avec URI reçue
- ✅ Modal fermé
- 📤 Appel uploadPhoto
- Alert: Début upload vers API
- ✅ uploadPhoto terminé (résultat JSON)
- Alert: Upload terminé
- Alert: Succès
- ❌ ERREUR dans uploadPhoto (message + stack)
```

---

### 3️⃣ **useJobPhotos.ts** (Hook de gestion photos)

#### 📍 Fonction `uploadPhotoCallback()`
```typescript
// Points de trace:
- 📤 DÉBUT uploadPhotoCallback
- 📤 jobId, photoUri, description, profile
- ❌ Manque jobId ou profile (si applicable)
- 🔑 photoKey généré
- 🗜️ ÉTAPE 1: Compressing (status update)
- 📤 ÉTAPE 2: Uploading vers API (status update)
- 🌐 Appel uploadJobPhoto API
- ✅ API uploadJobPhoto réussi (newPhoto object)
- Alert: Photo uploadée (ID, filename)
- ✅ ÉTAPE 3: Success (status update)
- 📝 Ajout à la liste de photos
- 🧹 Nettoyage des statuts dans 3s
- ✅ FIN SUCCÈS

// En cas d'erreur API:
- ❌ ERREUR dans uploadPhotoCallback (message)
- 📝 errorMessage détaillé
- 💾 API non disponible, sauvegarde locale
- Alert: API non disponible
- 💾 Photo locale créée (localPhoto object)
- 💾 ÉTAPE 3b: Local (status update)
```

---

## 🎨 Format des Alerts de Debug

### ✅ Succès
```
Titre: DEBUG
Message: ✅ [Description de l'étape réussie]
       [Données pertinentes]
```

### ❌ Erreur
```
Titre: DEBUG ERREUR [Contexte]
Message: ❌ Erreur: [Message d'erreur]
       
       Stack: [Stack trace si disponible]
```

### 📊 Informations
```
Titre: DEBUG [Contexte]
Message: 🔑 [Donnée 1]
       🔑 [Donnée 2]
       ...
```

---

## 🔍 Comment Débugger

### Étape 1: Reproduire le bug
1. Ouvrir l'application
2. Naviguer vers un job
3. Cliquer sur "Ajouter une photo"
4. Choisir Camera ou Galerie
5. **Noter chaque alert qui apparaît**

### Étape 2: Identifier l'étape qui plante
Chercher la **dernière alert affichée** :

| Dernière Alert | Problème Identifié |
|----------------|-------------------|
| `🔐 Demande des permissions` | Problème de permissions |
| `✅ Lancement de la caméra` | Caméra ne s'ouvre pas |
| `✅ Photo capturée` | Problème de compression |
| `🗜️ Début de la compression` | compressImage() plante |
| `✅ Image compressée` | Problème d'envoi au parent |
| `📤 Envoi de la photo au parent` | onPhotoSelected() ne se déclenche pas |
| `🎯 Photo reçue du modal` | uploadPhoto() ne démarre pas |
| `📤 Début upload vers API` | Problème API uploadJobPhoto |
| `🌐 Appel uploadJobPhoto API` | API timeout/erreur |

### Étape 3: Examiner les logs console
Ouvrir les **DevTools React Native** :
```bash
npx react-native log-android  # Android
npx react-native log-ios      # iOS
```

Chercher les lignes avec `[DEBUG]` :
```
📸 [DEBUG] handleTakePhoto - DÉBUT
🔐 [DEBUG] Demande des permissions...
📷 [DEBUG] Permission caméra: granted
...
```

### Étape 4: Analyser l'erreur
Si une alert `DEBUG ERREUR` apparaît :
1. **Noter le message d'erreur complet**
2. **Noter le stack trace**
3. **Identifier la fonction qui a planté**
4. **Vérifier les données juste avant l'erreur**

---

## 🛠️ Fichiers Modifiés

### 1. `src/components/jobDetails/modals/PhotoSelectionModal.tsx`
- **+70 lignes** de traces de debug
- Alerts à chaque étape de `requestPermissions()`
- Alerts à chaque étape de `handleTakePhoto()`
- Alerts à chaque étape de `handleSelectFromGallery()`

### 2. `src/components/jobDetails/sections/JobPhotosSection.tsx`
- **+16 lignes** de traces de debug
- Alerts dans `handlePhotoSelection()`
- Tracking de la réception de la photo du modal
- Tracking de l'appel `uploadPhoto()`

### 3. `src/hooks/useJobPhotos.ts`
- **+72 lignes** de traces de debug
- Import de `Alert` depuis `react-native`
- Alerts complètes dans `uploadPhotoCallback()`
- Tracking de toutes les étapes d'upload
- Tracking de la sauvegarde locale en fallback

---

## 📊 Exemple de Trace Réussie

```
Alert 1:  DEBUG
          🔐 Demande des permissions caméra et galerie

Alert 2:  DEBUG Permissions
          Caméra: granted
          Galerie: granted

Alert 3:  DEBUG
          📸 Début de la prise de photo

Alert 4:  DEBUG
          ✅ Lancement de la caméra...

Alert 5:  DEBUG Résultat Caméra
          Canceled: false
          Assets: 1

Alert 6:  DEBUG
          ✅ Photo capturée:
          file:///data/.../image.jpg

Alert 7:  DEBUG
          🗜️ Début de la compression...

Alert 8:  DEBUG Compression
          Original: file:///data/.../image.jpg
          
          Compressé: file:///data/.../compressed.jpg

Alert 9:  DEBUG
          📤 Envoi de la photo au parent...

Alert 10: DEBUG
          ✅ Photo envoyée, fermeture du modal

Alert 11: DEBUG Parent
          🎯 Photo reçue du modal:
          file:///data/.../compressed.jpg

Alert 12: DEBUG
          📤 Début upload vers API...

Alert 13: DEBUG API
          ✅ Photo uploadée:
          ID: 12345
          Filename: photo_1730000000.jpg

Alert 14: DEBUG
          ✅ Upload terminé:
          {"id":"12345","filename":"photo_1730000000.jpg",...}

Alert 15: Succès
          Photo ajoutée avec succès !
```

---

## 🚨 Exemple de Trace avec Erreur

```
Alert 1:  DEBUG
          🔐 Demande des permissions caméra et galerie

Alert 2:  DEBUG Permissions
          Caméra: granted
          Galerie: granted

Alert 3:  DEBUG
          📸 Début de la prise de photo

Alert 4:  DEBUG
          ✅ Lancement de la caméra...

Alert 5:  DEBUG Résultat Caméra
          Canceled: false
          Assets: 1

Alert 6:  DEBUG
          ✅ Photo capturée:
          file:///data/.../image.jpg

Alert 7:  DEBUG
          🗜️ Début de la compression...

Alert 8:  DEBUG ERREUR
          ❌ Erreur: Image compression failed: ENOENT
          
          Stack: Error: Image compression failed
          at compressImage (imageCompression.ts:45)
          at handleTakePhoto (PhotoSelectionModal.tsx:89)
```

**Diagnostic** : Le problème vient de `compressImage()` - fichier introuvable (ENOENT)

---

## ✅ Actions Recommandées

### Si le bug est identifié

1. **Copier le message d'erreur complet**
2. **Copier le stack trace**
3. **Noter la dernière étape réussie**
4. **Fournir ces informations au développeur**

### Pour désactiver les alerts de debug

Une fois le problème identifié, vous pouvez désactiver les alerts en commentant les lignes `Alert.alert()` dans les 3 fichiers.

**Note** : Les `console.log()` resteront actifs pour le debugging en console.

---

## 📚 Références

- **MediaTypeOptions dépréciation fixée** : Commit `06fe85d`
- **Debug system implémenté** : Commit `0af4a45`
- **JobDetails 100% complet** : Commit `82dccb5`

---

## 🎓 Pour les Développeurs

### Ajouter une nouvelle trace
```typescript
// Dans n'importe quelle fonction
console.log('🔍 [DEBUG] Ma description:', variable);
Alert.alert('DEBUG', `🔍 Ma description:\n${JSON.stringify(variable, null, 2)}`);
```

### Pattern de gestion d'erreur
```typescript
try {
  console.log('▶️ [DEBUG] Début opération');
  // ... code ...
  console.log('✅ [DEBUG] Opération réussie');
} catch (error) {
  console.error('❌ [DEBUG] ERREUR:', error);
  Alert.alert(
    'DEBUG ERREUR',
    `❌ ${error instanceof Error ? error.message : String(error)}\n\nStack: ${error instanceof Error ? error.stack : 'N/A'}`
  );
}
```

---

**Prêt pour le debugging complet ! 🚀**
