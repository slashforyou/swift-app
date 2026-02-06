# 📱 Télécharger l'APK depuis Expo Dashboard

## 🎯 Accès Direct

**Dashboard Expo Builds**:  
👉 https://expo.dev/accounts/slash4u/projects/swiftapp/builds

---

## 📥 Comment Télécharger l'APK

### Méthode 1: Via le Dashboard Web (RECOMMANDÉ)

1. **Ouvrir le dashboard** : https://expo.dev/accounts/slash4u/projects/swiftapp/builds

2. **Vérifier les builds** :
   - Statut : ✅ **Finished** (vert)
   - Platform : **Android**
   - Profile : **preview** ou **production**

3. **Télécharger** :
   - Cliquer sur le build souhaité
   - Bouton **"Download"** en haut à droite
   - L'APK se télécharge directement

4. **Installer** :
   - Transférer sur téléphone Android
   - Ouvrir le fichier
   - Autoriser installation depuis sources inconnues
   - Installer

---

### Méthode 2: Via QR Code

1. Ouvrir le build sur le dashboard
2. Scanner le QR Code avec votre téléphone Android
3. Téléchargement direct sur le téléphone
4. Installer

---

### Méthode 3: Via CLI

```bash
# Lister les builds disponibles
eas build:list --platform android

# Télécharger un build spécifique
eas build:download --platform android --latest
```

---

## 🔄 Lancer un Nouveau Build

Si aucun build n'est disponible sur le dashboard, lancez-en un :

### Option A: Via CLI (Simple)

```bash
eas build --platform android --profile preview
```

**Répondre "Yes" aux prompts**:

- Build credentials setup? → Yes
- Generate a new keystore? → Yes

### Option B: Via Dashboard Web

1. Aller sur https://expo.dev/accounts/slash4u/projects/swiftapp
2. Onglet **"Builds"**
3. Bouton **"Create a build"**
4. Sélectionner :
   - Platform: **Android**
   - Profile: **preview** (pour test) ou **production**
5. Cliquer **"Build"**

---

## ⏱️ Durée d'un Build

- **Preview (APK)** : ~10-15 minutes
- **Production (AAB)** : ~15-20 minutes

Une notification email sera envoyée quand le build est terminé.

---

## 📧 Partager l'APK

Une fois le build terminé sur Expo :

### Lien de Partage Direct

1. Ouvrir le build sur le dashboard
2. Copier le **"Share link"**
3. Envoyer par email/SMS aux testeurs
4. Ils peuvent télécharger directement depuis leur téléphone

**Exemple de lien** :

```
https://expo.dev/accounts/slash4u/projects/swiftapp/builds/abc123-def456
```

### Via Expo Go (Development uniquement)

Si vous utilisez le profil **development** :

```bash
eas build --profile development --platform android
```

Puis sur le téléphone :

1. Installer **Expo Go** depuis Play Store
2. Scanner le QR Code du build
3. L'app se lance dans Expo Go

---

## 🚨 Problèmes Courants

### Build "In Queue" trop longtemps

- **Cause** : Serveurs EAS occupés
- **Solution** : Attendre ou réessayer plus tard

### Build "Failed"

1. Cliquer sur le build pour voir les logs
2. Vérifier l'erreur
3. Corriger et relancer

### Cannot download APK

- **Cause** : Build encore en cours
- **Solution** : Attendre que le statut soit "Finished"

---

## 🎯 Avantages du Build EAS Cloud

✅ **Pas besoin d'Android Studio**  
✅ **Build sur serveurs puissants** (plus rapide)  
✅ **Génération automatique des credentials**  
✅ **Téléchargement direct depuis n'importe où**  
✅ **Partage facile avec testeurs**  
✅ **Historique de tous les builds**  
✅ **Compatible avec tous les OS** (Windows, Mac, Linux)

---

## 🔗 Liens Utiles

- **Dashboard Builds** : https://expo.dev/accounts/slash4u/projects/swiftapp/builds
- **Documentation EAS Build** : https://docs.expo.dev/build/introduction/
- **Documentation Download** : https://docs.expo.dev/build/internal-distribution/

---

## 📝 Résumé

**Pour télécharger l'APK** :

1. ✅ Aller sur : https://expo.dev/accounts/slash4u/projects/swiftapp/builds
2. ✅ Vérifier qu'un build Android est **Finished**
3. ✅ Cliquer dessus → Bouton **Download**
4. ✅ Transférer sur téléphone → Installer

**Si aucun build disponible** :

```bash
eas build --platform android --profile preview
```

Attendre 10-15 min, puis télécharger depuis le dashboard ! 🚀
