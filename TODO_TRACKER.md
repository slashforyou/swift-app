# 📋 SUIVI DES TODOs - SWIFTAPP

> **Dernière mise à jour :** 26 Décembre 2025  
> **Total TODOs :** 45  
> **Résolus cette session :** 5 (Bug signature)

---

## 📊 RÉSUMÉ PAR CATÉGORIE

| Catégorie | Count | Priorité |
|-----------|-------|----------|
| 🔌 API Integration | 15 | 🔴 Haute |
| 💳 Stripe & Paiements | 8 | 🔴 Haute |
| 🚗 Véhicules | 7 | 🟡 Moyenne |
| 👥 Staff & Business | 5 | 🟡 Moyenne |
| 📸 Photos | 2 | 🟢 Basse |
| 🌍 Traductions | 2 | 🟢 Basse |
| 🔧 Divers | 6 | 🟢 Basse |

---

## ✅ RÉSOLUS RÉCEMMENT

### 26 Décembre 2025 - Bug Signature
- [x] **Signature redemandée après avoir quitté le job** - Commits `a89ac90` → `c271c1f`
  - ✅ Ajout `getJobSignatures()` et `checkJobSignatureExists()` dans jobDetails.ts
  - ✅ SignatureSection vérifie le serveur avant d'afficher le bouton
  - ✅ signingBloc vérifie avant upload pour éviter erreur 400
  - ✅ payment.tsx corrigé (boucle infinie + vérification serveur)
  - ✅ Utilisation de job.code au lieu de job.id pour getJobDetails

---

## 🔴 PRIORITÉ HAUTE

### 🔌 API Integration - Endpoints Manquants

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/services/vehiclesService.ts` | 197 | Replace with real API call when /business/vehicles is ready | ⏳ En attente backend |
| `src/services/vehiclesService.ts` | 217 | Replace with real API call | ⏳ En attente backend |
| `src/services/vehiclesService.ts` | 240 | Replace with real API call | ⏳ En attente backend |
| `src/services/vehiclesService.ts` | 277 | Replace with real API call | ⏳ En attente backend |
| `src/services/vehiclesService.ts` | 311 | Replace with real API call | ⏳ En attente backend |
| `src/services/vehiclesService.ts` | 339 | Replace with real API call | ⏳ En attente backend |
| `src/services/vehiclesService.ts` | 364 | Replace with real API call | ⏳ En attente backend |
| `src/services/business/staffService.ts` | 4 | Connecter aux endpoints Job Crew quand disponible | ⏳ En attente backend |
| `src/context/JobStateProvider.tsx` | 298 | Appeler l'API pour sync l'état | ⏳ À implémenter |

### 💳 Stripe & Paiements

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/services/StripeService.ts` | 440 | Récupérer les comptes bancaires | ⏳ À implémenter |
| `src/services/StripeService.ts` | 572 | Implémenter l'API réelle | ⏳ À implémenter |
| `src/services/StripeService.ts` | 578 | Implémenter l'API réelle | ⏳ À implémenter |
| `src/services/StripeService.ts` | 584 | Implémenter l'API réelle | ⏳ À implémenter |
| `src/screens/payments/StripePaymentScreen.tsx` | 60 | Intégrer avec la vraie API Stripe | ⏳ À implémenter |
| `src/hooks/usePayouts.ts` | 37 | Remplacer par vraie API | ⏳ En attente backend |
| `src/hooks/usePayouts.ts` | 81 | Remplacer par vraie API | ⏳ En attente backend |
| `src/hooks/useStripeConnect.ts` | 31 | Remplacer par vraie API | ⏳ En attente backend |
| `src/hooks/useStripeConnect.ts` | 63 | Remplacer par vraie API | ⏳ En attente backend |
| `src/hooks/useStripeConnect.ts` | 79 | Remplacer par vraie API | ⏳ En attente backend |
| `src/hooks/useStripeReports.ts` | 144 | Remplacer par appel API réel Stripe | ⏳ En attente backend |
| `src/hooks/useStripeReports.ts` | 172 | Générer et télécharger CSV | ⏳ À implémenter |
| `src/hooks/useStripeReports.ts` | 208 | Filtre par période/dates | ⏳ À implémenter |

---

## 🟡 PRIORITÉ MOYENNE

### 👥 Staff & Business

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/components/modals/AddStaffModal.tsx` | 189 | Implémenter l'invitation de prestataire | ⏳ À implémenter |
| `src/screens/business/staffCrewScreen.tsx` | 72 | Implémenter la suppression | ⏳ À implémenter |
| `src/screens/business/staffCrewScreen.tsx` | 81 | Implement edit functionality | ⏳ À implémenter |
| `src/screens/business/PayoutsScreen.tsx` | 100 | Navigation vers le détail du payout | ⏳ À implémenter |
| `src/screens/business/PaymentsListScreen.tsx` | 83 | Navigation vers le détail du paiement | ⏳ À implémenter |

### 🚗 Véhicules

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/screens/business/VehicleDetailsScreen.tsx` | 57 | Add mileage to API | ⏳ En attente backend |
| `src/screens/business/VehicleDetailsScreen.tsx` | 58 | Add purchaseDate to API | ⏳ En attente backend |
| `src/screens/business/VehicleDetailsScreen.tsx` | 59 | Add lastService to API | ⏳ En attente backend |
| `src/screens/business/trucksScreen.tsx` | 551 | Ouvrir détails du véhicule | ⏳ À implémenter |

### ⚙️ Stripe Settings

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/screens/business/StripeSettingsScreen.tsx` | 83 | Ouvrir Stripe Connect Onboarding | ⏳ À implémenter |
| `src/screens/business/StripeSettingsScreen.tsx` | 100 | Navigation vers configuration webhooks | ⏳ À implémenter |
| `src/screens/business/StripeSettingsScreen.tsx` | 117 | Créer un paiement test | ⏳ À implémenter |
| `src/screens/business/StripeSettingsScreen.tsx` | 135 | Déconnecter le compte Stripe | ⏳ À implémenter |

### 💰 Stripe Hub

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/screens/business/StripeHub.tsx` | 234 | Ouvrir modal de création de lien de paiement | ⏳ À implémenter |
| `src/screens/business/StripeHub.tsx` | 243 | Créer un lien de paiement rapide | ⏳ À implémenter |
| `src/screens/business/StripeHub.tsx` | 250 | Navigation vers création personnalisée | ⏳ À implémenter |

---

## 🟢 PRIORITÉ BASSE

### 📸 Photos

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/components/jobDetails/modals/PhotoSelectionModal.tsx` | 70 | Code pour prendre la photo manquant | ⏳ À implémenter |
| `src/components/jobDetails/modals/PhotoSelectionModal.tsx` | 107 | Code pour sélectionner la photo manquant | ⏳ À implémenter |

### 🌍 Traductions

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/localization/translations/es.ts` | 315 | Add complete translations | ⏳ À traduire |

### 🔧 Divers

| Fichier | Ligne | TODO | Status |
|---------|-------|------|--------|
| `src/services/jobTimer.ts` | 58 | Calculer breaks par step si nécessaire | ⏳ À évaluer |
| `src/services/sessionLogger.ts` | 315 | Implémenter sharing avec react-native-share | ⏳ Nice to have |
| `src/services/testReporter.ts` | 64 | Get appVersion from package.json safely | ⏳ Nice to have |
| `src/screens/home.tsx` | 225 | Ouvrir modal DevTools | ⏳ Dev only |
| `src/screens/jobDetails.tsx` | 305 | Logique pour déterminer le template depuis l'API | ⏳ À implémenter |
| `src/context/ThemeProvider_Advanced.tsx` | 12 | Refactoriser quand système couleurs unifié | ⏳ À évaluer |

---

## 📈 HISTORIQUE DES SESSIONS

### Session 26 Décembre 2025
**Focus :** Bug signature redemandée après avoir quitté le job

**Résolu :**
- ✅ Signatures stockées dans table séparée, pas dans l'objet job
- ✅ Ajout vérification serveur avant affichage bouton "Signer"
- ✅ Correction boucle infinie dans payment.tsx (useMemo)
- ✅ Correction erreur 404 (utiliser job.code au lieu de job.id)

**Commits :**
1. `a89ac90` - feat(signature): add server-side signature verification API
2. `865dff0` - feat(signature): check server for existing signature before requesting
3. `4902fab` - fix(payment): add server signature check and fix infinite loop
4. `37e9c9e` - fix(client): use job code instead of id for getJobDetails
5. `c271c1f` - docs: add signature bug fix documentation

---

## 🎯 PROCHAINES PRIORITÉS SUGGÉRÉES

1. **Véhicules API** - 7 TODOs bloqués par backend
2. **Stripe Payouts/Reports** - 6 TODOs pour fonctionnalités avancées
3. **Staff Management** - 3 TODOs pour CRUD complet
4. **Job Workflow** - Sync état avec API

---

## 📝 NOTES

- Les TODOs marqués "En attente backend" nécessitent des endpoints API côté serveur
- Les TODOs dans `/coverage/` sont des duplicatas (fichiers générés)
- Utiliser `grep -r "TODO:" src/` pour une liste à jour
