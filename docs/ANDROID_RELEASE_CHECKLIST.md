# Checklist Release Android — Cobbr v1.0.0

> Créé le 21/03/2026 — Suivi de toutes les tâches nécessaires pour publier sur le Google Play Store.

---

## Légende

| Badge | Signification                               |
| ----- | ------------------------------------------- |
| 🔴    | **BLOQUEUR** — Release impossible sans ça   |
| 🟠    | **REQUIS** — Nécessaire pour un MVP honnête |
| 🟡    | **QA** — Validation visuelle / device       |
| ✅    | **FAIT**                                    |
| 👤    | Assigné à Romain (manuel)                   |
| 🤖    | Assigné à Copilot (code)                    |

---

## 1. 🔴 Bloqueurs — Priorité 1

### 1.1 👤 Privacy Policy & Terms of Service

- [x] Rédiger la politique de confidentialité
- [x] Rédiger les conditions d'utilisation
- [x] Héberger les pages sur une URL publique → `cobbr-app.com/privacy` et `cobbr-app.com/terms`
- [x] Ajouter les URLs dans l'app (écrans d'inscription + settings)
- [ ] Renseigner l'URL dans la Play Console

### 1.2 👤 Google Service Account (projet GCP: `swiftapp-475009`)

> ⚠️ Non bloquant pour la v1 — seulement nécessaire pour automatiser `eas submit`.
> Pour la première release, on upload l'AAB manuellement dans la Play Console.

- [x] Projet Google Cloud existant : `swiftapp-475009`
- [x] Service account existant : `swiftapp-475009@swiftapp-475009.iam.gserviceaccount.com`
- [x] Google Play Console accessible
- [ ] _(optionnel, post-v1)_ Lier le projet GCP + créer clé JSON pour `eas submit` automatique

### 1.2b 👤 Build & Upload Android

- [ ] Lancer `eas build --platform android --profile production` → AAB
- [ ] Télécharger l'AAB depuis Expo
- [ ] Upload manuel dans la Play Console → Production / Internal testing track

### 1.3 👤 Stripe Live — Validation backend

- [ ] Configurer les secrets Stripe live côté serveur (secret key + webhook signing secret)
- [ ] Exécuter un paiement réel de faible montant en production
- [ ] Valider les webhooks Stripe en live (account status, payment intent)
- [ ] Confirmer que la clé `pk_live_*` dans `environment.ts` est correcte

### 1.4 🤖 Plugins manquants dans `app.json`

- [x] Ajouter `expo-notifications` dans les plugins (permissions `POST_NOTIFICATIONS` Android 13+)
- [x] Ajouter `expo-image-picker` dans les plugins (permission `CAMERA`)

### 1.5 🤖 URLs hardcodées — Centralisation

- [x] `src/services/analytics.ts` — remplacer URL en dur par config centralisée
- [x] `src/services/logger.ts` — remplacer URL en dur par config centralisée
- [x] `src/services/alertService.ts` — remplacer URL en dur par config centralisée
- [x] `src/services/jobSteps.ts` — remplacer URL en dur par config centralisée
- [x] `src/services/jobCorrection.ts` — remplacer URL en dur par config centralisée
- [x] `src/services/safeApiClient.ts` — remplacer URL en dur par config centralisée
- [x] `src/services/apiDiscovery.ts` — remplacer URL en dur par config centralisée

---

## 2. 🟠 Requis — Priorité 2

### 2.1 Push Notifications — Test device physique

- [ ] Tester l'enregistrement du device token sur Android physique
- [ ] Confirmer que le token est bien persisté côté backend
- [ ] Envoyer un push test réel depuis le backend (Expo Push API)
- [ ] Valider le comportement : foreground / background / app-open routing
- [ ] Tester les edge cases : permission refusée, badge count

### 2.2 Permission `RECORD_AUDIO`

- [ ] Retirer `RECORD_AUDIO` du `AndroidManifest.xml` (non utilisée par l'app)
- [ ] Ou justifier son usage dans la Data Safety form si nécessaire

### 2.3 Double config API — Nettoyage

- [ ] Décider de la source de vérité : `environment.ts` vs `api.config.ts`
- [ ] Supprimer ou aligner le fichier non retenu
- [ ] Vérifier que staging pointe vers la bonne URL

### 2.4 Store Listing

- [ ] Rédiger la description courte (80 caractères max)
- [ ] Rédiger la description longue (4000 caractères max)
- [ ] Préparer la Feature Graphic (1024x500px)
- [ ] Prendre au moins 4 screenshots (phone)
- [ ] Choisir la catégorie (Business / Productivity)
- [ ] Renseigner les coordonnées de contact (email, site web)

### 2.5 Data Safety Form (Play Console)

- [ ] Déclarer les données collectées : email, nom, téléphone
- [ ] Déclarer : données de paiement (Stripe)
- [ ] Déclarer : push notification tokens
- [ ] Déclarer : données de localisation (si activé)
- [ ] Déclarer : données d'analytics/logs
- [ ] Indiquer le lien vers la Privacy Policy

### 2.6 Content Rating (IARC)

- [ ] Remplir le questionnaire IARC sur la Play Console
- [ ] Obtenir la classification

### 2.7 Test flow multi-utilisateurs

- [ ] Tester le flow complet owner → créer job → assigner
- [ ] Tester manager → accepter/décliner
- [ ] Tester worker → voir job assigné, compléter
- [ ] Tester le paiement entre 2 comptes
- [ ] Tester les restrictions cross-company

---

## 3. 🟡 QA — Validation finale

### 3.1 Validation visuelle

- [ ] Passe complète en light mode sur device Android
- [ ] Passe complète en dark mode sur device Android
- [ ] Vérifier le rendu sur petit écran (< 5.5")
- [ ] Vérifier le rendu sur tablette

### 3.2 Icônes et branding

- [ ] Vérifier l'icône adaptative Android sur build installé
- [ ] Vérifier le splash screen
- [ ] Vérifier la cohérence visuelle globale

### 3.3 Deep linking

- [ ] Tester `cobbr://home`, `cobbr://job/:id`
- [ ] Vérifier que les liens fonctionnent depuis une notification push

### 3.4 Performance

- [ ] Temps de démarrage cold start < 3s
- [ ] Navigation fluide entre les écrans
- [ ] Pas de crash sur les scénarios principaux

---

## 4. ✅ Déjà prêt

- [x] Tous les écrans implémentés et fonctionnels
- [x] Stripe onboarding 100% in-app
- [x] Guard paiement si compte Stripe incomplet
- [x] Plans & commissions (free 3%, pro/enterprise masqués)
- [x] ErrorBoundary
- [x] 7 langues (EN, FR, PT, ES, IT, ZH, HI)
- [x] Deep linking configuré (`cobbr://`)
- [x] Icons adaptatifs Android + splash screen
- [x] EAS build profiles (dev/preview/production AAB)
- [x] Système de rôles et permissions
- [x] `expo-updates` pour OTA updates
- [x] Broken Access Control corrigé (4 endpoints critiques)
- [x] Push notifications — infrastructure frontend
- [x] Job actions tracking system
