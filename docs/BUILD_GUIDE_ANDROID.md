# Guide de Build Android - Swift App

## 📱 Génération d'APK pour Tests

**Date**: 28 janvier 2026  
**Version**: 1.0.0  
**Build en cours**: ✅ Gradle `assembleRelease`

---

## 🎯 Objectif

Créer une version testable de l'application Swift App sur téléphone Android pour valider :

- ✅ Système de paiement Stripe (correction montant 450$ au lieu de 45000$)
- ✅ Génération et envoi automatique de facture
- ✅ Détection des jobs déjà payés
- ✅ Bouton "Payé" au lieu de "Pay now" après paiement

---

## 🔨 Méthodes de Build

### Méthode 1: Build Local avec Gradle (EN COURS)

**Commande**:

```bash
cd android
.\gradlew assembleRelease
```

**Avantages**:

- ✅ Rapide (local)
- ✅ Pas besoin de serveurs EAS
- ✅ APK immédiatement disponible

**Localisation du fichier**:

```
android/app/build/outputs/apk/release/app-release.apk
```

**Signature**: L'APK sera signé avec le keystore de debug par défaut (non adapté pour production, mais OK pour tests internes).

---

### Méthode 2: Build EAS Cloud (ALTERNATIVE)

**Configuration nécessaire**:

1. Installer `expo-updates`: ✅ Fait
2. Configurer EAS Update: ✅ Fait
3. Lancer le build cloud

**Commande**:

```bash
eas build --platform android --profile preview
```

**Problème rencontré**: Le processus se bloque après la configuration des variables d'environnement.

**Statut**: À investiguer (probablement besoin de credentials Android ou configuration supplémentaire)

---

### Méthode 3: Build Production avec Signing Key (PRODUCTION)

**Pour plus tard** - Nécessite:

1. Keystore de production (fichier .jks)
2. Configuration dans `android/app/build.gradle`
3. Credentials configurés dans EAS

```bash
eas build --platform android --profile production
```

---

## 📦 Installation sur Téléphone

### Étape 1: Localiser l'APK

Après le build Gradle, le fichier sera ici :

```
C:\Users\romai\OneDrive\Documents\client\Swift\App\swift-app\android\app\build\outputs\apk\release\app-release.apk
```

### Étape 2: Transférer sur Android

**Option A - USB**:

1. Connecter le téléphone en mode transfert de fichiers
2. Copier `app-release.apk` sur le téléphone
3. Ouvrir le fichier avec le gestionnaire de fichiers
4. Autoriser l'installation depuis des sources inconnues si demandé
5. Installer l'application

**Option B - Cloud**:

1. Upload de l'APK sur Google Drive / Dropbox
2. Télécharger depuis le téléphone
3. Installer

**Option C - ADB**:

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## ⚠️ Important - Installation de Sources Inconnues

L'APK de debug/test n'est PAS signé avec le certificat officiel.

**Sur Android 8.0+** :

1. Ouvrir Paramètres → Sécurité
2. Activer "Sources inconnues" pour l'app de fichiers

**OU** lors de l'installation :

1. Android demandera l'autorisation
2. Accepter temporairement pour cette installation

---

## 🧪 Tests à Effectuer sur l'APK

### Test 1: Vérification Montant Paiement

1. ✅ Ouvrir un job terminé
2. ✅ Vérifier montant affiché (doit être ~450$ pas 45000$)
3. ✅ Initier paiement carte
4. ✅ Vérifier montant dans PaymentSheet Stripe
5. ✅ Confirmer paiement
6. ✅ Vérifier montant débité (450$)

### Test 2: Facture Automatique

1. ✅ Effectuer un paiement (carte ou espèces)
2. ✅ Vérifier email du client
3. ✅ Ouvrir facture Stripe reçue
4. ✅ Valider contenu du PDF

### Test 3: Job Déjà Payé

1. ✅ Rouvrir PaymentWindow sur job payé
2. ✅ Vérifier affichage "Paiement confirmé"
3. ✅ Vérifier bouton "Envoyer la facture" disponible
4. ✅ Tester renvoi de facture

### Test 4: Bouton Payé dans JobDetails

1. ✅ Ouvrir job non payé → Bouton "Payer maintenant"
2. ✅ Effectuer paiement
3. ✅ Revenir sur JobDetails
4. ✅ Vérifier bouton affiche "Payé" (vert pâle, désactivé)

---

## 📊 Statut du Build Actuel

**Build en cours**: ✅ Gradle `assembleRelease`  
**Durée estimée**: 5-10 minutes (première fois)  
**Suivis**: Les builds suivants seront plus rapides grâce au cache Gradle

**Progression**:

```
> Task :app:compileReleaseKotlin
> Task :app:processReleaseResources
> Task :app:assembleRelease
```

---

## 🔧 Dépannage

### Erreur: "SDK not found"

```bash
# Installer Android SDK via Android Studio
# OU définir ANDROID_HOME
$env:ANDROID_HOME="C:\Users\romai\AppData\Local\Android\Sdk"
```

### Erreur: "Keystore not found"

```bash
# Le build debug utilisera le keystore de debug automatiquement
# Pour production, créer un keystore:
keytool -genkey -v -keystore swift-app-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias swift-app
```

### Build EAS bloqué

```bash
# Alternative: Build local Gradle (méthode actuelle)
cd android
.\gradlew assembleRelease
```

---

## 🚀 Prochaines Étapes

1. ✅ **Maintenant**: Attendre la fin du build Gradle
2. ⏳ **Ensuite**: Transférer l'APK sur téléphone
3. ⏳ **Puis**: Installer et tester
4. ⏳ **Enfin**: Valider tous les tests ci-dessus

---

## 📝 Notes de Version

**Version**: 1.0.0 (Test Build)

**Nouveautés dans ce build**:

- ✅ Correction montant paiement (450$ → 450$, pas 45000$)
- ✅ Génération automatique de facture Stripe
- ✅ Envoi email facture au client après paiement
- ✅ Détection jobs déjà payés
- ✅ Bouton "Payé" après paiement réussi
- ✅ Traductions FR/EN pour nouveaux messages

**Fichiers modifiés**:

- `src/screens/JobDetailsScreens/paymentWindow.tsx` - Correction montant + facturation
- `src/screens/JobDetailsScreens/payment.tsx` - Bouton "Payé"
- `src/hooks/useInvoice.ts` - Nouveau hook de facturation
- `src/localization/translations/*.ts` - Traductions

---

## 🔗 Liens Utiles

- **Dashboard EAS**: https://expo.dev/accounts/slash4u/projects/swiftapp
- **Documentation EAS Build**: https://docs.expo.dev/build/introduction/
- **Stripe Dashboard**: https://dashboard.stripe.com/test/payments
- **Repo GitHub**: https://github.com/slashforyou/swift-app

---

**Dernière mise à jour**: 28 janvier 2026, 10h30
