# 🚀 PRODUCTION DEPLOYMENT GUIDE - Swift App

> **Version :** 1.0  
> **Date :** 28 Décembre 2025  
> **Statut :** Prêt pour configuration

---

## 📋 Checklist Pré-Déploiement

### 1. Configuration Stripe ✅

| Étape                  | Statut | Action                                          |
| ---------------------- | ------ | ----------------------------------------------- |
| Clé test configurée    | ✅     | `src/config/environment.ts`                     |
| Clé live à configurer  | ⏳     | Remplacer `pk_live_VOTRE_CLE_STRIPE_PRODUCTION` |
| Backend Stripe Connect | ✅     | Déjà configuré sur `cobbr-app.com`              |

**Pour activer la production Stripe :**

1. Aller sur [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copier la clé `Publishable key` en mode **Live**
3. Éditer `src/config/environment.ts` :

```typescript
const productionConfig: EnvironmentConfig = {
  // ...
  stripePublishableKey: "pk_live_VOTRE_VRAIE_CLE_ICI",
  // ...
};
```

---

### 2. Configuration API ✅

| Environnement | URL                                    | Statut     |
| ------------- | -------------------------------------- | ---------- |
| Development   | `https://cobbr-app.com/swift-app/`     | ✅         |
| Staging       | `https://api-staging.swiftapp.com.au/` | ⏳ À créer |
| Production    | `https://cobbr-app.com/swift-app/`     | ✅         |

**Fichier de configuration :** `src/config/environment.ts`

---

### 3. Sécurité ✅

| Critère                 | Statut | Détails                                    |
| ----------------------- | ------ | ------------------------------------------ |
| HTTPS                   | ✅     | Toutes les URLs production utilisent HTTPS |
| Tokens sécurisés        | ✅     | SecureStore (Keychain/EncryptedPrefs)      |
| PCI-DSS                 | ✅     | CardField Stripe natif                     |
| Pas de secrets frontend | ✅     | Seules les clés publiques                  |

**Rapport d'audit :** `SECURITY_AUDIT_28DEC2025.md`

---

### 4. Build Configuration

#### iOS (App Store)

```bash
# Build production iOS
npx expo build:ios --release-channel production

# OU avec EAS Build
eas build --platform ios --profile production
```

#### Android (Play Store)

```bash
# Build production Android
npx expo build:android --release-channel production

# OU avec EAS Build
eas build --platform android --profile production
```

---

## 🔧 Fichiers de Configuration

| Fichier                       | Rôle                                        |
| ----------------------------- | ------------------------------------------- |
| `src/config/environment.ts`   | Configuration centralisée (Stripe, API URL) |
| `src/constants/ServerData.ts` | Utilise `environment.ts`                    |
| `.env.example`                | Template des variables d'environnement      |
| `.env.local`                  | Variables locales (non commité)             |
| `app.json`                    | Configuration Expo                          |

---

## 📱 Étapes de Déploiement

### Phase 1 : Préparation (À faire)

- [ ] Obtenir clé Stripe Live depuis dashboard
- [ ] Mettre à jour `environment.ts` avec clé live
- [ ] Tester sur device réel en mode production
- [ ] Vérifier que les paiements fonctionnent

### Phase 2 : Build

- [ ] Créer build iOS production
- [ ] Créer build Android production
- [ ] Tester les builds sur TestFlight / Internal Testing

### Phase 3 : Soumission

- [ ] Soumettre à App Store Review
- [ ] Soumettre à Google Play Review
- [ ] Préparer les métadonnées (screenshots, description)

### Phase 4 : Lancement

- [ ] Activer le mode live Stripe
- [ ] Monitorer les premiers paiements
- [ ] Configurer les alertes

---

## ⚠️ Points d'Attention

### Ne PAS faire :

- ❌ Committer les clés secrètes (`sk_*`)
- ❌ Utiliser des clés test en production
- ❌ Désactiver HTTPS
- ❌ Logger des données sensibles

### À faire :

- ✅ Tester le flux paiement complet avant lancement
- ✅ Configurer Stripe webhooks sur le backend
- ✅ Activer les alertes de paiement échoué
- ✅ Préparer un plan de rollback

---

## 🔐 Gestion des Secrets

Les secrets doivent être gérés via :

1. **Variables d'environnement** pour le build
2. **EAS Secrets** pour les builds Expo
3. **Backend** pour les clés secrètes Stripe

```bash
# Avec EAS
eas secret:create --name STRIPE_PUBLISHABLE_KEY --value "pk_live_xxx"
```

---

## 📊 Monitoring Post-Lancement

| Outil            | Usage                      |
| ---------------- | -------------------------- |
| Stripe Dashboard | Paiements, revenus         |
| Expo             | Crash reports, OTA updates |
| Backend logs     | Erreurs API                |
| Analytics        | Engagement utilisateur     |

---

_Document généré le 28 Décembre 2025_
