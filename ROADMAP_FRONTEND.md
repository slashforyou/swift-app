# 🗺️ Roadmap Frontend Swift-App

> **Date de création :** 26 Décembre 2025  
> **Version :** 1.0  
> **Objectif :** Améliorer la cohérence visuelle, supporter le mode sombre et terminer l'intégration backend

---

## 📋 Vue d'ensemble

Cette roadmap résume les actions prioritaires pour améliorer la cohérence visuelle, supprimer les doublons de design tokens, supporter le mode sombre et terminer l'intégration des services backend.

---

## 🎨 1. Harmonisation du Design System

### 1.1 Centraliser les DESIGN_TOKENS
**Priorité : Haute**

- [ ] Supprimer les définitions locales de `DESIGN_TOKENS` (ex. `MonthCalendarScreen`)
- [ ] Importer les tokens depuis `src/design-system` pour :
  - Espacements (`spacing`)
  - Rayons (`radius`)
  - Ombres (`shadows`)
  - Typographie (`typography`)

**Fichiers concernés :**
- `src/screens/calendar/monthScreen.tsx`
- Autres écrans avec tokens redéfinis localement

### 1.2 Supprimer les couleurs codées en dur
**Priorité : Haute**

- [ ] Remplacer les codes couleurs hexadécimaux par les couleurs sémantiques de `Colors.ts`
- [ ] Vérifier que tous les écrans respectent le mode sombre

**Couleurs à remplacer :**
| Couleur actuelle | Remplacer par |
|-----------------|---------------|
| `#FF6B6B` | `colors.error` |
| `#f44336` | `colors.error` |
| `#4CAF50` | `colors.success` |
| `#2196F3` | `colors.primary` |
| `#FFC107` | `colors.warning` |

### 1.3 Utiliser useCommonThemedStyles
**Priorité : Haute**

- [ ] Migrer tous les écrans vers `useCommonThemedStyles()` ou `useTheme()`
- [ ] **Objectif :** 100% des composants utilisent le système unifié (actuellement ~20%)

**Catégories d'écrans à migrer :**
- `calendar/*` - Écrans de calendrier
- `jobDetails/*` - Détails des jobs
- `business/*` - Écrans business
- `components/*` - Composants réutilisables

### 1.4 Créer un guide d'intégration
**Priorité : Moyenne**

- [ ] Documenter les bonnes pratiques d'utilisation du design system
- [ ] Expliquer la prise en charge du mode sombre
- [ ] Créer des exemples de code pour :
  - Utilisation des tokens
  - Hooks de thème
  - Primitives UI

### 1.5 Tests visuels Light/Dark
**Priorité : Moyenne**

- [ ] Mettre en place des tests visuels (screenshot ou Storybook)
- [ ] Vérifier chaque écran en mode clair et sombre
- [ ] Automatiser les validations avant livraison

---

## 🔌 2. Implémentation des Endpoints Backend

### 2.1 Endpoints Logs & Analytics
**Priorité : Haute** | **Requiert : Backend Team**

- [ ] Implémenter `/swift-app/v1/logs`
- [ ] Implémenter `/swift-app/v1/analytics/events`
- [ ] Mettre à jour `logger.ts` pour utiliser le vrai endpoint
- [ ] Mettre à jour `analytics.ts` pour utiliser le vrai endpoint
- [ ] Supprimer les fallback locaux

### 2.2 Endpoints Avancement des Jobs
**Priorité : Haute** | **Requiert : Backend Team**

Endpoints à implémenter :
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/job/{id}/advance-step` | Avancer à l'étape suivante |
| `GET` | `/job/{id}/step` | Récupérer l'étape actuelle |
| `GET` | `/jobs/{id}/steps` | Liste des étapes du job |
| `POST` | `/job/{id}/complete` | Marquer le job comme terminé |

- [ ] Connecter ces endpoints à `jobSteps.ts`
- [ ] Supprimer `isAvailable = true` forcé
- [ ] Supprimer les données locales de fallback

### 2.3 Améliorer apiDiscovery
**Priorité : Moyenne**

- [ ] Supporter les endpoints dynamiques (`/job/:id`)
- [ ] Éviter les contournements manuels
- [ ] Améliorer le caching des découvertes

### 2.4 Harmoniser la gestion d'erreurs
**Priorité : Moyenne**

- [ ] Distinguer clairement les retours 404 (endpoint absent) des erreurs serveur
- [ ] Remonter des messages précis à l'utilisateur
- [ ] Suivre le pattern de `updateJobStep` pour la gestion d'erreurs

---

## ⚙️ 3. Internationalisation et Performance

### 3.1 Migration i18n
**Priorité : Moyenne**

- [ ] S'assurer que tous les textes utilisent `useTranslation`
- [ ] Vérifier qu'aucun libellé n'est codé en dur
- [ ] Auditer les fichiers de traduction pour les clés manquantes

### 3.2 Optimiser le temps de lancement
**Priorité : Moyenne**

**Objectif : < 2 secondes**

- [ ] Analyser le bundle React Native
- [ ] Activer le lazy-loading des écrans
- [ ] Réduire la taille des assets
- [ ] Optimiser les imports

### 3.3 Audits de performance
**Priorité : Basse**

- [ ] Utiliser les services d'analytics pour mesurer les temps de réponse API
- [ ] Identifier les goulets d'étranglement
- [ ] Créer des dashboards de monitoring

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
