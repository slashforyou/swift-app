# 📋 Guide de la Suite de Tests SwiftApp

## Vue d'ensemble

Cette suite de tests a été conçue pour permettre un suivi complet de l'évolution de l'application SwiftApp. Elle couvre **171 tests** répartis en **23 catégories** fonctionnelles, incluant des tests CRUD détaillés pour chaque type d'élément.

## 📊 Statistiques

### Par priorité
| Priorité | Nombre | Signification |
|----------|--------|---------------|
| 🔴 Critical | 35 | Bloquants - Doivent passer avant toute release |
| 🟠 High | 78 | Importants - Fonctionnalités majeures |
| 🟡 Medium | 42 | Normaux - Améliorations UX |
| 🟢 Low | 1 | Optionnels - Nice to have |

### Par type
| Type | Nombre | Description |
|------|--------|-------------|
| Functional | 68 | Logique métier |
| Integration | 62 | Tests API et backend |
| UI | 20 | Interface utilisateur |
| Security | 8 | Sécurité des données |
| Performance | 6 | Vitesse et fluidité |
| i18n | 4 | Traductions |
| Analytics | 3 | Tracking d'événements |

## 🗂️ Catégories de tests

### Catégories principales (12)

| # | Catégorie | Tests | Description |
|---|-----------|-------|-------------|
| 1 | Authentication & Session | 6 | Login, logout, token, biométrie |
| 2 | Home Screen | 5 | Dashboard, stats, actions |
| 3 | Calendar & Day View | 9 | Navigation, jobs, création |
| 4 | Job Details & Workflow | 11 | Timer, étapes, notes, photos |
| 5 | Stripe Payments | 15 | Paiements, remboursements, webhooks |
| 6 | Business Management | 12 | Staff, véhicules, clients |
| 7 | Settings & Preferences | 6 | Notifications, thème, langue |
| 8 | Profile & User | 5 | Avatar, niveau, stats |
| 9 | Internationalization | 6 | FR/EN/IT, formats |
| 10 | Performance & Reliability | 7 | Temps, offline, erreurs |
| 11 | Analytics & Logging | 4 | Tracking, logs |
| 12 | Security | 5 | Token, permissions, validation |

### Catégories CRUD détaillées (11)

| # | Catégorie | Tests | Opérations couvertes |
|---|-----------|-------|---------------------|
| 13 | CRUD - Photos & Media | 10 | Capture, upload, suppression, offline |
| 14 | CRUD - Vehicles | 15 | 6 types, validation, assignation |
| 15 | CRUD - Employees | 12 | Invitation, rôles, équipes |
| 16 | CRUD - Contractors | 14 | Recherche, ajout, statuts |
| 17 | CRUD - Clients | 12 | Création inline, recherche |
| 18 | CRUD - Jobs | 12 | Création, statuts, duplication |
| 19 | CRUD - Notes | 8 | Ajout, modification, offline |
| 20 | CRUD - Signatures | 6 | Capture, validation, affichage |
| 21 | CRUD - Additional Items | 8 | Facturation, totaux |
| 22 | CRUD - Teams & Roles | 8 | Équipes, permissions |

## 🚀 Plan d'exécution

### Phase 1 - Tests critiques (18 tests)
À exécuter **avant chaque release** :
- Login/Logout
- Chargement des données
- Navigation job
- Timer et étapes
- Signature
- Paiements Stripe (connexion, création, confirmation)
- Permissions de rôle
- Traductions FR/EN
- Sécurité token et API

### Phase 2 - Tests high priority (38 tests)
À exécuter **hebdomadairement** ou avant releases majeures.

### Phase 3 - Tests medium/low (28 tests)
À exécuter **mensuellement** ou lors de refactoring.

## 📝 Format des tests

Chaque test dans le JSON suit cette structure :

```json
{
  "id": "unique_test_id",
  "type": "integration|functional|ui|performance|security|i18n|analytics",
  "priority": "critical|high|medium|low",
  "description": "Description détaillée du test avec critères de succès"
}
```

## 🔧 Utilisation

### Trouver un test par ID
```bash
# Rechercher dans le JSON
grep -A3 "day_job_details_navigation" docs/SWIFT_APP_TEST_SUITE.json
```

### Lister les tests critiques
```bash
# Utiliser jq pour filtrer
cat docs/SWIFT_APP_TEST_SUITE.json | jq '.categories[].tests[] | select(.priority == "critical")'
```

### Compter les tests par catégorie
```bash
cat docs/SWIFT_APP_TEST_SUITE.json | jq '.categories[] | {name, count: (.tests | length)}'
```

## ✅ Checklist avant release

- [ ] Tous les tests **critical** passent
- [ ] 90% des tests **high** passent
- [ ] Aucun test **security** ne fail
- [ ] Les 3 langues (FR/EN/IT) sont complètes
- [ ] Temps de démarrage <2s
- [ ] Pas de crash observé sur les 3 flux principaux :
  1. Login → Home → Calendar → Day → Job Details
  2. Job Details → Start Timer → Complete Steps → Signature
  3. Payment → Stripe → Confirmation

## 📈 Suivi de l'évolution

Ce fichier JSON peut être versionné avec Git pour :
- Comparer les tests entre versions
- Identifier les régressions
- Documenter les nouvelles fonctionnalités testées
- Générer des rapports de couverture

## 🔗 Fichiers associés

- Tests Jest : `__tests__/`
- Services testés : `src/services/`
- Écrans testés : `src/screens/`
- Guide Stripe : `JOB_PAYMENT_INTEGRATION_GUIDE.md`
- Guide E2E : `GUIDE_TESTS_E2E_AUTO_CORRECTION.md`

---

*Dernière mise à jour : 12 janvier 2026*
