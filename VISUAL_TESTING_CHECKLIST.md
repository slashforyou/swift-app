# 🧪 Visual Testing Checklist - Light/Dark Mode

> **Version :** 1.0.0  
> **Date :** 27 Décembre 2025  
> **Phase :** 1.5 Roadmap Frontend

---

## 📋 Instructions de Test

### Comment tester le mode sombre

1. **Sur iOS Simulateur :**
   - Settings → Developer → Dark Appearance
   - Ou : Settings → Display & Brightness → Dark

2. **Sur Android Emulator :**
   - Settings → Display → Dark theme

3. **Dans l'app (si paramètre existe) :**
   - Parameters → Theme → Dark/Light/Auto

### Critères de validation

Pour chaque écran, vérifier :
- [ ] ✅ Fond principal visible (pas blanc sur blanc ni noir sur noir)
- [ ] ✅ Texte lisible (bon contraste)
- [ ] ✅ Icônes visibles
- [ ] ✅ Boutons distincts
- [ ] ✅ Cartes/sections bien délimitées
- [ ] ✅ Pas de couleurs hardcodées visibles (#FFFFFF, #000000 bruts)

---

## 🏠 Écrans Principaux

### Navigation Tab

| Écran | Fichier | Light ✅ | Dark ✅ | Notes |
|-------|---------|----------|---------|-------|
| Home | `screens/home.tsx` | ⬜ | ⬜ | |
| Calendar | `screens/calendar/*.tsx` | ⬜ | ⬜ | |
| Jobs | `screens/jobs/*.tsx` | ⬜ | ⬜ | |
| Payments | `screens/payments/*.tsx` | ⬜ | ⬜ | |
| Profile | `screens/profile.tsx` | ⬜ | ⬜ | |
| Parameters | `screens/parameters.tsx` | ⬜ | ⬜ | |

---

## 📅 Calendrier

| Écran | Fichier | Light ✅ | Dark ✅ | Notes |
|-------|---------|----------|---------|-------|
| Month View | `calendar/monthScreen.tsx` | ⬜ | ⬜ | |
| Year View | `calendar/yearScreen.tsx` | ⬜ | ⬜ | |
| Multiple Years | `calendar/multipleYearsScreen.tsx` | ⬜ | ⬜ | |
| Day Details | `calendar/dayDetailsSheet.tsx` | ⬜ | ⬜ | |

---

## 💼 Jobs

| Écran | Fichier | Light ✅ | Dark ✅ | Notes |
|-------|---------|----------|---------|-------|
| Job List | `jobs/jobsScreen.tsx` | ⬜ | ⬜ | |
| Job Details | `JobDetailsScreens/*.tsx` | ⬜ | ⬜ | |
| Job Steps | `JobDetailsScreens/stepScreens/*.tsx` | ⬜ | ⬜ | |
| Summary | `JobDetailsScreens/summary.tsx` | ⬜ | ⬜ | |
| Payment | `JobDetailsScreens/payment.tsx` | ⬜ | ⬜ | |

---

## 💳 Paiements & Stripe

| Écran | Fichier | Light ✅ | Dark ✅ | Notes |
|-------|---------|----------|---------|-------|
| Stripe Payment | `payments/StripePaymentScreen.tsx` | ⬜ | ⬜ | |
| Payment Success | `payments/PaymentSuccessScreen.tsx` | ⬜ | ⬜ | |
| Stripe Onboarding | `Stripe/StripeOnboardingWebView.tsx` | ⬜ | ⬜ | WebView |
| Account Status | `Stripe/StripeAccountStatus.tsx` | ⬜ | ⬜ | |

---

## 🏢 Business

| Écran | Fichier | Light ✅ | Dark ✅ | Notes |
|-------|---------|----------|---------|-------|
| Business Info | `business/BusinessInfoPage.tsx` | ⬜ | ⬜ | |
| Trucks | `business/trucksScreen.tsx` | ⬜ | ⬜ | |
| Staff/Crew | `business/staffCrewScreen.tsx` | ⬜ | ⬜ | |
| Payout Schedule | `business/PayoutSchedulePage.tsx` | ⬜ | ⬜ | |

---

## 🔧 Composants Critiques

| Composant | Fichier | Light ✅ | Dark ✅ | Notes |
|-----------|---------|----------|---------|-------|
| Header Profile | `home/ProfileHeaderNewComplete.tsx` | ⬜ | ⬜ | |
| Today Section | `home/TodaySection.tsx` | ⬜ | ⬜ | |
| Job Timeline | `jobDetails/JobTimeLine.tsx` | ⬜ | ⬜ | |
| Signature Section | `jobDetails/sections/SignatureSection.tsx` | ⬜ | ⬜ | |
| Card Form | `CardForm.tsx` | ⬜ | ⬜ | |
| Unified Card | `cards/UnifiedCard.tsx` | ⬜ | ⬜ | |

---

## 🪟 Modals

| Modal | Fichier | Light ✅ | Dark ✅ | Notes |
|-------|---------|----------|---------|-------|
| Payment Detail | `modals/PaymentDetailModal.tsx` | ⬜ | ⬜ | |
| Payout Detail | `modals/PayoutDetailModal.tsx` | ⬜ | ⬜ | |
| Create Payment Link | `modals/CreatePaymentLinkModal.tsx` | ⬜ | ⬜ | |
| Add Note | `modals/AddNoteModal.tsx` | ⬜ | ⬜ | |
| Photo Viewer | `modals/PhotoViewerModal.tsx` | ⬜ | ⬜ | |

---

## 🚨 Problèmes Connus

| Problème | Écran/Composant | Statut | Notes |
|----------|-----------------|--------|-------|
| _Aucun problème identifié_ | - | - | - |

---

## 📊 Résumé des Tests

| Catégorie | Total | Testé Light | Testé Dark | OK |
|-----------|-------|-------------|------------|-----|
| Navigation | 6 | 0 | 0 | ⬜ |
| Calendrier | 4 | 0 | 0 | ⬜ |
| Jobs | 5 | 0 | 0 | ⬜ |
| Paiements | 4 | 0 | 0 | ⬜ |
| Business | 4 | 0 | 0 | ⬜ |
| Composants | 6 | 0 | 0 | ⬜ |
| Modals | 5 | 0 | 0 | ⬜ |
| **TOTAL** | **34** | **0** | **0** | ⬜ |

---

## 🛠️ Script de Vérification Automatique

Pour une vérification rapide des couleurs hardcodées restantes :

```bash
# Chercher les couleurs hexadécimales dans les fichiers TSX
grep -r "#[0-9A-Fa-f]\{6\}" --include="*.tsx" src/

# Ignorer les couleurs autorisées (blanc pur pour texte sur bouton primaire)
grep -r "#[0-9A-Fa-f]\{6\}" --include="*.tsx" src/ | grep -v "#FFFFFF" | grep -v "// allowed"
```

---

## ✅ Validation Finale

- [ ] Tous les écrans principaux testés en Light
- [ ] Tous les écrans principaux testés en Dark
- [ ] Aucun texte illisible
- [ ] Aucune icône invisible
- [ ] Transitions fluides entre thèmes
- [ ] Persistance du choix utilisateur

---

*Checklist créée le 27 Décembre 2025 - Phase 1.5 Roadmap Frontend*
