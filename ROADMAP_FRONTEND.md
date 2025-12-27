# 🗺️ Roadmap Frontend Swift-App

> **Date de création :** 26 Décembre 2025  
> **Version :** 1.0  
> **Objectif :** Améliorer la cohérence visuelle, supporter le mode sombre et terminer l'intégration backend

---

## 📋 Vue d'ensemble

Cette roadmap résume les actions prioritaires pour améliorer la cohérence visuelle, supprimer les doublons de design tokens, supporter le mode sombre et terminer l'intégration des services backend.

---

## 🎨 1. Harmonisation du Design System

### 1.1 Centraliser les DESIGN_TOKENS ✅
**Priorité : Haute** | **Statut : TERMINÉ**

- [x] Supprimer les définitions locales de `DESIGN_TOKENS` (ex. `MonthCalendarScreen`)
- [x] Importer les tokens depuis `src/constants/Styles.ts` pour :
  - Espacements (`spacing`)
  - Rayons (`radius`)
  - Ombres (`shadows`)
  - Typographie (`typography`)

**Fichiers migrés :**
- `src/screens/calendar/monthScreen.tsx` ✅
- `src/screens/calendar/yearScreen.tsx` ✅
- `src/screens/calendar/multipleYearsScreen.tsx` ✅

### 1.2 Supprimer les couleurs codées en dur ✅
**Priorité : Haute** | **Statut : TERMINÉ**

- [x] Remplacer les codes couleurs hexadécimaux par les couleurs sémantiques du thème
- [x] Vérifier que tous les écrans respectent le mode sombre

**Fichiers migrés :**
- `src/components/modals/PayoutDetailModal.tsx` ✅
- `src/components/modals/PaymentDetailModal.tsx` ✅
- `src/components/modals/CreatePaymentLinkModal.tsx` ✅
- `src/screens/business/trucksScreen.tsx` ✅
- `src/screens/business/BusinessInfoPage.tsx` ✅
- `src/screens/JobDetailsScreens/payment.tsx` ✅
- `src/screens/calendar/monthScreen.tsx` ✅
- `src/screens/calendar/yearScreen.tsx` ✅

### 1.3 Utiliser useTheme() ✅
**Priorité : Haute** | **Statut : TERMINÉ**

- [x] Migrer les écrans principaux vers `useTheme()`
- [x] **Objectif :** Écrans et composants critiques migrés

**Fichiers migrés :**
- `src/screens/home.tsx` ✅
- `src/screens/parameters.tsx` ✅
- `src/components/home/ProfileHeaderNewComplete.tsx` ✅
- `src/components/home/TodaySection.tsx` ✅
- `src/components/CardForm.tsx` ✅

### 1.4 Créer un guide d'intégration ✅
**Priorité : Moyenne** | **Statut : TERMINÉ**

- [x] Documenter les bonnes pratiques d'utilisation du design system
- [x] Expliquer la prise en charge du mode sombre
- [x] Créer des exemples de code pour :
  - Utilisation des tokens
  - Hooks de thème
  - Primitives UI

**Document créé :** `DESIGN_SYSTEM_INTEGRATION_GUIDE.md`

### 1.5 Tests visuels Light/Dark ✅
**Priorité : Moyenne** | **Statut : TERMINÉ**

- [x] Mettre en place des tests visuels (screenshot ou Storybook)
- [x] Vérifier chaque écran en mode clair et sombre
- [x] Automatiser les validations avant livraison

**Document créé :** `VISUAL_TESTING_CHECKLIST.md`

> **Note :** Storybook n'étant pas installé, une checklist de test manuel a été créée. L'installation de Storybook est optionnelle pour le futur.

---

## 🔌 2. Implémentation des Endpoints Backend

### 2.1 Endpoints Logs & Analytics ✅
**Priorité : Haute** | **Statut : TERMINÉ**

- [x] Implémenter `/swift-app/v1/logs` ✅ Backend OK
- [x] Implémenter `/swift-app/v1/analytics/events` ✅ Backend OK
- [x] `logger.ts` utilise déjà apiDiscovery correctement ✅
- [x] `analytics.ts` utilise déjà apiDiscovery correctement ✅
- [x] Fallbacks gardés pour robustesse (bonne pratique) ✅

### 2.2 Endpoints Avancement des Jobs ✅
**Priorité : Haute** | **Statut : TERMINÉ**

Endpoints implémentés :
| Méthode | Endpoint | Statut |
|---------|----------|--------|
| `POST` | `/job/{id}/advance-step` | ✅ OK |
| `GET` | `/job/{id}/step` | ✅ OK |
| `GET` | `/jobs/{id}/steps` | ✅ OK |
| `POST` | `/job/{id}/complete` | ✅ OK |
| `GET` | `/job-steps/definitions` | ✅ OK |

- [x] `jobSteps.ts` connecté via apiDiscovery ✅
- [x] Supprimé `isAvailable = true` forcé ✅
- [x] Fallback local gardé pour robustesse ✅

### 2.3 Améliorer apiDiscovery ✅
**Priorité : Moyenne** | **Statut : TERMINÉ**

- [x] API Discovery disponible via `/api/discover` ✅ Backend
- [x] Support des patterns dynamiques (`/job/:id/step`) ✅ Phase 2.3
- [x] Suppression des contournements manuels ✅
- [x] Méthode `pathMatchesPattern()` ajoutée ✅

### 2.4 Harmoniser la gestion d'erreurs ✅
**Priorité : Moyenne** | **Statut : TERMINÉ**

- [x] Distinction 404 vs erreur serveur dans tous les services ✅
- [x] `safeApiClient.ts` gère automatiquement les fallbacks ✅
- [x] Pattern unifié avec invalidation du cache Discovery ✅

---

## ⚙️ 3. Internationalisation et Performance

### 3.1 Migration i18n ✅
**Priorité : Moyenne** | **Statut : TERMINÉ (audit + clés)**

- [x] Audit des textes hardcodés créé
- [x] Types TranslationKeys mis à jour avec settings.*
- [x] Traductions EN/FR ajoutées pour paramètres
- [ ] Migration complète des écrans (optionnel - progressif)

**Documents :** `I18N_AUDIT_PHASE3.md`

### 3.2 Optimiser le temps de lancement ✅
**Priorité : Moyenne** | **Statut : TERMINÉ (guide créé)**

**Objectif : < 2 secondes**

- [x] Analyse de l'architecture navigation
- [x] Guide d'optimisation créé
- [ ] Implémenter lazy-loading (optionnel)
- [ ] Créer metro.config.js (optionnel)

**Documents :** `PERFORMANCE_OPTIMIZATION_GUIDE.md`

### 3.3 Audits de performance
**Priorité : Basse** | **Statut : Reporté**

- [ ] Analytics temps de réponse API (backend déjà en place)
- [ ] Dashboards de monitoring
- [ ] Identification des goulets d'étranglement

---

## 🧪 4. Tests et Qualité

### 4.1 Tests unitaires et d'intégration
**Priorité : Moyenne**

Services à couvrir :
- [ ] `logger.ts`
- [ ] `analytics.ts`
- [ ] `jobSteps.ts`
- [ ] Écrans migrés vers le design system

### 4.2 Tests visuels automatiques
**Priorité : Basse**

- [ ] Intégrer captures d'écran automatiques
- [ ] Tester en mode light/dark
- [ ] Exécuter après chaque commit

### 4.3 Bonnes pratiques React
**Priorité : Haute**

- [ ] Vérifier les `key` de liste (éviter les index comme keys)
- [ ] Éviter les imports dépréciés
- [ ] Assurer la cohérence des hooks d'état
- [ ] Corriger les bugs récurrents identifiés

---

## 📊 Priorisation

### Phase 1 - Critique (Semaine 1-2)
1. 🎨 Centraliser DESIGN_TOKENS
2. 🎨 Supprimer couleurs codées en dur
3. 🧪 Bonnes pratiques React

### Phase 2 - Important (Semaine 3-4)
4. 🎨 Migrer vers useCommonThemedStyles
5. 🔌 Endpoints avancement jobs (avec backend)
6. 🔌 Endpoints logs/analytics (avec backend)

### Phase 3 - Amélioration (Semaine 5-6)
7. 🎨 Guide d'intégration
8. ⚙️ Migration i18n
9. 🔌 Améliorer apiDiscovery

### Phase 4 - Optimisation (Semaine 7+)
10. ⚙️ Optimiser temps de lancement
11. 🧪 Tests unitaires et visuels
12. ⚙️ Audits de performance

---

## 📝 Notes

### Dépendances Backend
Les tâches suivantes nécessitent une coordination avec l'équipe backend :
- Endpoints logs/analytics
- Endpoints avancement jobs

### Références
- Audit Design System : `AUDIT_SYSTEME_STYLES.md`
- Guide Design System : `DESIGN_SYSTEM_GUIDE.md`
- Migration complète : `DESIGN_SYSTEM_MIGRATION_COMPLETE.md`

---

*Dernière mise à jour : 26 Décembre 2025*
