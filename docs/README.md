# 📚 Documentation Swift App

> **React Native / Expo** - Application mobile de gestion de jobs  
> **Dernière mise à jour** : 8 novembre 2025

---

## 📖 **TABLE DES MATIÈRES**

- [🐛 Bugs](#-bugs)
- [📖 Guides](#-guides)
- [🔧 API](#-api)
- [🏗️ Système](#️-système)
- [📝 Sessions](#-sessions)
- [📦 Archive](#-archive)

---

## 🐛 **BUGS**

### 🔴 **Bugs Actifs** (`bugs/active/`)

| Fichier | Description | Priorité | Statut |
|---------|-------------|----------|--------|
| `TOKEN_REFRESH_BUG_07NOV2025.md` | ✅ **RÉSOLU** - Erreur 400 sur /auth/refresh (résolu par l'utilisateur) | 🔴 Critique | ✅ Résolu |
| `SIGNATURE_ISSUE_FIX_07NOV2025.md` | ❌ **ACTIF** - Signature sauvegardée mais ne persiste pas après rechargement | 🔴 Critique | 🔄 En cours |
| `BUG_404_VALIDE_08NOV2025.md` | ✅ **RÉSOLU** - Job Details retournait 404 (endpoint corrigé) | 🟡 Majeur | ✅ Résolu |
| `BUG_404_RESOLU_08NOV2025.md` | ✅ **RÉSOLU** - Documentation de la correction du bug 404 | 🟡 Majeur | ✅ Résolu |

### ✅ **Bugs Résolus** (`bugs/resolved/`)

Tous les bugs résolus et diagnostics historiques sont archivés dans ce dossier :
- FIX_*, CORRECTIFS_*, ANALYSE_*, DIAGNOSTIC_*
- RECAPITULATIF_*, AUDIT_*, RESUME_*, RECAP_*
- DEBUG_*, INTEGRATION_*, DONE_*, SOLUTION_*

---

## 📖 **GUIDES**

**Localisation** : `guides/`

| Guide | Description |
|-------|-------------|
| `GUIDE_INTEGRATION_HOOKS.md` | Intégration des hooks métier |
| `GUIDE_RESOLUTION_TOKEN_REFRESH.md` | Guide de résolution des problèmes de refresh token |
| `GUIDE_STEP_HISTORY_UI_03NOV2025.md` | Interface utilisateur pour l'historique des étapes |
| `GUIDE_TEST_API.md` | Guide de test des endpoints API |
| `GUIDE_TESTS_OPTIMISATIONS.md` | Optimisations et bonnes pratiques pour les tests |
| `GUIDE_VERSION_MISMATCH_FIX.md` | Correction des problèmes de version |
| `TESTING_GUIDE.md` | Guide complet des tests |
| `TESTING_COMMANDS.md` | Commandes de test disponibles |
| `INSTRUCTIONS_TEST_TOKEN_REFRESH.md` | Instructions pour tester le refresh token |
| `PRET_A_TESTER_TOKEN_REFRESH.md` | Préparation des tests de refresh token |
| `TEST_GUIDE_STEP_SYNC_02NOV2025.md` | Guide de test de synchronisation des étapes |
| `TESTS_PLAN.md` | Plan de tests général |

---

## 🔧 **API**

**Localisation** : `api/`

### **Documentation Générale**

| Document | Description |
|----------|-------------|
| `API-Doc.md` | Documentation principale de l'API |
| `API_MIGRATION_COMPLETE.md` | Migration complète de l'API |

### **API Photos**

| Document | Description |
|----------|-------------|
| `API_PHOTOS_QUICK_REF.md` | Référence rapide API Photos |
| `API_PHOTOS_REQUIREMENTS.md` | Spécifications API Photos |
| `PHOTOS_API_TESTING_GUIDE.md` | Guide de test API Photos |
| `PHOTOS_API_VALIDATION.md` | Validation API Photos |

### **API Signature**

| Document | Description |
|----------|-------------|
| `API_SIGNATURE_REFERENCE.md` | Référence API Signature |

### **Backend & Infrastructure**

| Document | Description |
|----------|-------------|
| `BACKEND_CURRENT_STEP_SPEC.md` | Spécifications de l'étape courante backend |
| `BACKEND_SIGNED_URLS.md` | URLs signées backend |
| `BACKEND_SIGNED_URLS_BUG.md` | Bug des URLs signées |
| `BACKEND_STEP_CHANGES_SPEC.md` | Spécifications des changements d'étapes |
| `BACKEND_API_TIMER_REQUIREMENTS_03NOV2025.md` | Spécifications API Timer backend |
| `GCS_BUCKET_SETUP.md` | Configuration Google Cloud Storage |

---

## 🏗️ **SYSTÈME**

**Localisation** : `system/`

### **Architecture**

| Document | Description |
|----------|-------------|
| `TIMER_SYSTEM.md` | Système de timer |
| `THEME_SYSTEM.md` | Système de thème |
| `STYLES_SYSTEM.md` | Système de styles |
| `JOB_DETAILS_SYSTEM.md` | Système de détails des jobs |
| `JOB_STEPS_SYSTEM.md` | Système des étapes de job |
| `SYNC_FLOW_DOCUMENTATION.md` | Documentation du flux de synchronisation |

### **Validation & Business Logic**

| Document | Description |
|----------|-------------|
| `INDEX_VALIDATION_SYSTEM.md` | Système de validation d'index |
| `VALIDATION_SYSTEM_04NOV2025.md` | Système de validation général |
| `STEP_VALIDATION_SYSTEM_02NOV2025.md` | Validation des étapes |
| `BUSINESS_HOOKS_SUMMARY.md` | Résumé des hooks métier |
| `JOBSBILLING_SUMMARY.md` | Résumé du système de facturation |

---

## 📝 **SESSIONS**

**Localisation** : `sessions/`

Logs de toutes les sessions de développement :
- SESSION_25OCT2025_*, SESSION_26OCT2025_*, SESSION_27OCT2025_*, SESSION_28OCT_*
- SESSION_COMPLETE_04NOV2025.md, SESSION_DEBUG_TIMER_04NOV2025.md

---

## 📦 **ARCHIVE**

**Localisation** : `archive/obsolete/`

Tous les fichiers historiques et obsolètes :
- PHASE*, PRIORITE_*, PROGRESSION*, ROADMAP*, PLAN_*
- MASTER_*, NEXT_*, UPDATE_*, QUICK_*, FINAL_*, VISUAL_*
- CURRENT_STATUS.md, DASHBOARD_*, JOBDETAILS_*, PHOTO_*
- INFINITE_*, SIMPLIFICATION_*, TRANSFORMATION_*, TIMER_*
- EXPO_*, ENCODING_*, CI_CD_*, PATCH_*, REBUILD_*
- START_*, STATUS_*, TEST_*, TESTS_*
- Documentation de progression ancienne (documentation/progression/)

---

## 🚀 **DÉMARRAGE RAPIDE**

### **Bugs en cours**
```bash
# Voir le bug de signature actif
cat docs/bugs/active/SIGNATURE_ISSUE_FIX_07NOV2025.md
```

### **Consulter l'API**
```bash
# Documentation API complète
cat docs/api/API-Doc.md

# Référence rapide Photos
cat docs/api/API_PHOTOS_QUICK_REF.md
```

### **Architecture système**
```bash
# Système de timer
cat docs/system/TIMER_SYSTEM.md

# Système de jobs
cat docs/system/JOB_DETAILS_SYSTEM.md
```

---

## 📊 **STATISTIQUES**

- **Bugs actifs** : 1 (Signature Persistence)
- **Bugs résolus** : 2 (Token Refresh, Job Details 404)
- **Guides** : 12+
- **Documentation API** : 13 fichiers
- **Documentation système** : 11 fichiers
- **Sessions archivées** : 10+
- **Fichiers historiques** : 100+

---

## 🎯 **PROCHAINES ÉTAPES**

1. ✅ ~~Token Refresh 400~~ - **RÉSOLU**
2. ✅ ~~Job Details 404~~ - **RÉSOLU**
3. 🔄 **Signature Persistence** - **EN COURS**
   - La signature est sauvegardée mais ne persiste pas après rechargement
   - Vérifier que l'API retourne `signature_blob`
   - Tester le cycle complet : signer → sauvegarder → recharger

---

## 📞 **CONTACTS & RESSOURCES**

- **API Backend** : `https://altivo.fr/swift-app/`
- **Repo GitHub** : `slashforyou/swift-app`
- **Framework** : React Native + Expo
- **Tests** : Jest + React Native Testing Library

---

**Maintenu par** : GitHub Copilot  
**Dernière révision** : 8 novembre 2025
