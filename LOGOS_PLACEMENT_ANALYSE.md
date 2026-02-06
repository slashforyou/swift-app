# 🎨 Analyse Complète - Placement des Logos Cobbr

Ce document liste tous les écrans de l'application et identifie où le logo Cobbr devrait être affiché.

## 📊 Vue d'Ensemble

- **Total écrans analysés** : 23 écrans principaux
- **Logos à ajouter (priorité haute)** : 6 écrans
- **Logos optionnels (priorité moyenne)** : 6 écrans
- **Pas de logo nécessaire** : 11 écrans
- **Logo déjà présent** : 1 écran ✅

---

## 🔐 ÉCRANS D'AUTHENTIFICATION (Priorité HAUTE)

### ✅ 1. `src/screens/connection.tsx`

- **Statut** : ✅ **LOGO DÉJÀ PRÉSENT**
- **Logo actuel** : Logo + nom au centre (200x200)
- **Version** : `logo-nom-512.png` / `logo-nom-dark-512.png`
- **Position** : Centre de l'écran
- **Action** : ✅ **Aucune** - Déjà parfait !

---

### 🎯 2. `src/screens/connectionScreens/login.tsx`

- **Statut** : ❌ **LOGO MANQUANT**
- **Type** : Écran de connexion (email + mot de passe)
- **Recommandation** : ✅ **AJOUTER** - Logo + nom en haut
- **Position suggérée** : Header centré, au-dessus des champs
- **Taille** : 100x100 (format carré) ou 200x60 (horizontal)
- **Version** : `logo-nom-512.png` / `logo-nom-dark-512.png`
- **Code suggéré** :

```tsx
<View style={{ alignItems: "center", marginBottom: 30, marginTop: 20 }}>
  <Image
    source={
      colorScheme === "dark"
        ? require("../../assets/images/logo-nom-dark-512.png")
        : require("../../assets/images/logo-nom-512.png")
    }
    style={{ width: 100, height: 100, resizeMode: "contain" }}
  />
</View>
```

---

### 🎯 3. `src/screens/connectionScreens/subscribe.tsx`

- **Statut** : ❌ **LOGO MANQUANT**
- **Type** : Écran d'inscription employé
- **Recommandation** : ✅ **AJOUTER** - Logo + nom en haut
- **Position suggérée** : Header centré, au-dessus du formulaire
- **Taille** : 100x100 (format carré) ou 200x60 (horizontal)
- **Version** : `logo-nom-512.png` / `logo-nom-dark-512.png`

---

### 🎯 4. `src/screens/connectionScreens/RegisterTypeSelection.tsx`

- **Statut** : ❌ **LOGO MANQUANT**
- **Type** : Sélection du type de compte (Business Owner / Staff)
- **Recommandation** : ✅ **AJOUTER** - Logo + nom en haut
- **Position suggérée** : Header centré, au-dessus des options
- **Taille** : 120x120 (format moyen)
- **Version** : `logo-nom-512.png` / `logo-nom-dark-512.png`
- **Note** : Écran décisif, logo prominent recommandé

---

### 🎯 5. `src/screens/connectionScreens/subscribeMailVerification.tsx`

- **Statut** : ❌ **LOGO MANQUANT**
- **Type** : Vérification d'email (code de confirmation)
- **Recommandation** : ✅ **AJOUTER** - Logo + nom en haut
- **Position suggérée** : Header centré, petit format
- **Taille** : 80x80 (format compact)
- **Version** : `logo-nom-512.png` / `logo-nom-dark-512.png`

---

### 🎯 6. `src/screens/registration/BusinessOwnerRegistration.tsx`

- **Statut** : ❌ **LOGO MANQUANT**
- **Type** : Inscription Business Owner (8 étapes)
- **Recommandation** : ✅ **AJOUTER** - Logo + nom fixe en haut de toutes les étapes
- **Position suggérée** : Header fixe, visible sur toutes les étapes
- **Taille** : 60-80px (format compact pour ne pas prendre de place)
- **Version** : `logo-192.png` (logo seul) ou `logo-nom-192.png`
- **Note** : Important pour rappeler la marque durant le long processus d'inscription

---

## 🏢 ÉCRANS BUSINESS (Priorité HAUTE)

### 🎯 7. `src/screens/businessScreens/business.tsx`

- **Statut** : ❌ **LOGO MANQUANT**
- **Type** : Informations entreprise
- **Recommandation** : ✅ **AJOUTER** - Logo + nom en haut
- **Position suggérée** : Header, à côté du nom de l'entreprise
- **Taille** : 80-100px
- **Version** : `logo-horizontal.png` ou `logo-rectangle-512.png`

---

## 💳 ÉCRANS PAIEMENT (Priorité MOYENNE)

### ⚠️ 8. `src/screens/payments/PaymentSuccessScreen.tsx`

- **Statut** : ❌ **LOGO MANQUANT**
- **Type** : Confirmation de paiement réussi
- **Recommandation** : ⚠️ **OPTIONNEL** - Logo + nom en bas
- **Position suggérée** : Footer ou coin supérieur droit
- **Taille** : 60-80px
- **Version** : `logo-nom-192.png`
- **Note** : Renforce la confiance après paiement

---

### ⚠️ 9. `src/screens/Stripe/StripeHub.tsx`

- **Statut** : ❌ **LOGO MANQUANT**
- **Type** : Hub de gestion Stripe
- **Recommandation** : ⚠️ **OPTIONNEL** - Logo dans header
- **Position suggérée** : Coin supérieur gauche
- **Taille** : 40-50px
- **Version** : `logo-192.png` (logo seul)

---

## 🏠 ÉCRANS PRINCIPAUX (Priorité BASSE)

### ⚠️ 10. `src/screens/home.tsx`

- **Statut** : ❌ **LOGO MANQUANT**
- **Type** : Écran d'accueil principal (utilise ProfileHeader)
- **Recommandation** : ⚠️ **OPTIONNEL** - Logo très petit coin supérieur gauche
- **Position suggérée** : À côté du ProfileHeader
- **Taille** : 30-40px
- **Version** : `logo-192.png` (logo seul)
- **Note** : ProfileHeader déjà présent avec avatar, logo discret suffit

---

### ⚠️ 11. `src/screens/Calendar.tsx`

- **Statut** : ❌ **LOGO MANQUANT**
- **Type** : Calendrier principal (utilise CalendarHeader)
- **Recommandation** : ⚠️ **OPTIONNEL** - Logo dans header
- **Position suggérée** : Coin supérieur gauche
- **Taille** : 30px
- **Version** : `logo-192.png` (logo seul)

---

### ⚠️ 12. `src/screens/leaderboard.tsx`

- **Statut** : ❌ **LOGO MANQUANT**
- **Type** : Classement / Leaderboard
- **Recommandation** : ⚠️ **OPTIONNEL** - Logo coin supérieur
- **Position suggérée** : Header
- **Taille** : 30-40px
- **Version** : `logo-192.png` (logo seul)

---

### ⚠️ 13. `src/screens/businessScreens/analytics.tsx`

- **Statut** : ❌ **LOGO MANQUANT**
- **Type** : Rapports analytics
- **Recommandation** : ⚠️ **OPTIONNEL** - Logo coin supérieur
- **Position suggérée** : Header
- **Taille** : 40px
- **Version** : `logo-192.png` (logo seul)

---

## ❌ ÉCRANS SANS LOGO NÉCESSAIRE

### 14. `src/screens/profile.tsx`

- **Recommandation** : ❌ **NON** - Focus sur l'utilisateur

### 15. `src/screens/parameters.tsx`

- **Recommandation** : ❌ **NON** - Écran utilitaire

### 16. `src/screens/badges.tsx`

- **Recommandation** : ❌ **NON** - Focus sur les badges

### 17. `src/screens/xpHistory.tsx`

- **Recommandation** : ❌ **NON** - Écran de données

### 18. `src/screens/jobDetails.tsx`

- **Recommandation** : ❌ **NON** - Écran de travail dense

### 19. `src/screens/dayScreen.tsx`, `monthScreen.tsx`, `yearScreen.tsx`

- **Recommandation** : ❌ **NON** - Vues calendrier

### 20. `src/screens/settings/TeamsManagementScreen.tsx`

- **Recommandation** : ❌ **NON** - Écran de gestion

### 21. `src/screens/settings/RolesManagementScreen.tsx`

- **Recommandation** : ❌ **NON** - Écran de gestion

### 22. `src/screens/Stripe/StripeAccountStatus.tsx`

- **Recommandation** : ❌ **NON** - Contexte technique

### 23. `src/screens/Stripe/StripeOnboardingWebView.tsx`

- **Recommandation** : ❌ **NON** - WebView externe

---

## 📦 VERSIONS DE LOGOS NÉCESSAIRES

### Pour les Implémentations

1. **Logo + Nom 512px** (`logo-nom-512.png` / `logo-nom-dark-512.png`)
   - ✅ Déjà disponible
   - Usage : Écrans connection, login, subscribe, registration type
   - Tailles d'affichage : 80x80 à 120x120

2. **Logo + Nom 192px** (`logo-nom-192.png` / `logo-nom-dark-192.png`)
   - ✅ Déjà disponible
   - Usage : Écrans de paiement, inscriptions multi-étapes
   - Tailles d'affichage : 60x60 à 80x80

3. **Logo Seul 192px** (`logo-192.png` / `logo-dark-192.png`)
   - ✅ Déjà disponible
   - Usage : Headers compacts (home, calendar, leaderboard)
   - Tailles d'affichage : 30x30 à 50x50

4. **Logo Rectangle/Horizontal** (`logo-horizontal.png` / `logo-rectangle-512.png`)
   - ✅ Déjà disponible
   - Usage : Écran business, headers larges
   - Tailles d'affichage : 200x60

---

## 🎯 PLAN D'IMPLÉMENTATION RECOMMANDÉ

### Phase 1 : ÉCRANS D'AUTHENTIFICATION (Priorité HAUTE) ⚡

**Impact** : Maximum - Première impression de l'app

1. ✅ `login.tsx` - Logo + nom centré (100x100)
2. ✅ `subscribe.tsx` - Logo + nom centré (100x100)
3. ✅ `RegisterTypeSelection.tsx` - Logo + nom centré (120x120)
4. ✅ `subscribeMailVerification.tsx` - Logo + nom centré (80x80)
5. ✅ `BusinessOwnerRegistration.tsx` - Logo fixe header (60-80px)

**Estimation** : 2-3 heures

---

### Phase 2 : ÉCRANS BUSINESS (Priorité MOYENNE) 📊

**Impact** : Important - Renforce l'identité de marque

6. ✅ `business.tsx` - Logo horizontal header (80-100px)

**Estimation** : 30 minutes

---

### Phase 3 : ÉCRANS OPTIONNELS (Priorité BASSE) ⚠️

**Impact** : Faible - Branding subtil

7. ⚠️ `PaymentSuccessScreen.tsx` - Logo petit format (60-80px)
8. ⚠️ `home.tsx` - Logo coin supérieur (30-40px)
9. ⚠️ `Calendar.tsx` - Logo header (30px)
10. ⚠️ `leaderboard.tsx` - Logo header (30-40px)
11. ⚠️ `analytics.tsx` - Logo header (40px)
12. ⚠️ `StripeHub.tsx` - Logo header (40-50px)

**Estimation** : 2-3 heures

---

## ✅ CHECKLIST DE VALIDATION

Pour chaque écran avec logo ajouté :

- [ ] Logo visible et centré correctement
- [ ] Taille appropriée (ni trop grand, ni trop petit)
- [ ] Support du mode sombre (logo-dark si nécessaire)
- [ ] Pas de déformation de l'image (`resizeMode: 'contain'`)
- [ ] Bon contraste avec le fond
- [ ] Ne gêne pas l'utilisation de l'écran
- [ ] Responsive sur différentes tailles d'écran
- [ ] Testé sur iOS et Android

---

## 📱 EXEMPLE DE CODE RÉUTILISABLE

### Composant Logo pour Headers

```tsx
import React from "react";
import { Image, View, useColorScheme } from "react-native";

interface HeaderLogoProps {
  size?: number; // default: 80
  variant?: "square" | "horizontal" | "icon-only";
}

export const HeaderLogo: React.FC<HeaderLogoProps> = ({
  size = 80,
  variant = "square",
}) => {
  const colorScheme = useColorScheme();

  const getLogoSource = () => {
    switch (variant) {
      case "icon-only":
        return colorScheme === "dark"
          ? require("../../assets/images/logo-dark-192.png")
          : require("../../assets/images/logo-192.png");
      case "horizontal":
        return require("../../assets/images/logo-horizontal.png");
      case "square":
      default:
        return colorScheme === "dark"
          ? require("../../assets/images/logo-nom-dark-512.png")
          : require("../../assets/images/logo-nom-512.png");
    }
  };

  return (
    <View style={{ alignItems: "center", marginVertical: 16 }}>
      <Image
        source={getLogoSource()}
        style={{
          width: size,
          height: size,
          resizeMode: "contain",
        }}
        accessible={true}
        accessibilityLabel="Logo Cobbr"
      />
    </View>
  );
};
```

### Utilisation

```tsx
// Dans login.tsx
<HeaderLogo size={100} variant="square" />

// Dans BusinessOwnerRegistration.tsx
<HeaderLogo size={60} variant="icon-only" />

// Dans business.tsx
<HeaderLogo size={80} variant="horizontal" />
```

---

## 📊 STATISTIQUES FINALES

- **Écrans avec logo prioritaire** : 6 écrans
- **Temps d'implémentation estimé (phase 1+2)** : 2.5 - 3.5 heures
- **Écrans optionnels** : 6 écrans
- **Temps d'implémentation estimé (phase 3)** : 2-3 heures
- **Total** : 12 écrans avec logo / 23 écrans analysés

---

_Dernière mise à jour : 31 janvier 2026_
_Analyse basée sur Cobbr React Native App - Expo SDK 54_
