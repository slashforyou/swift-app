# 🐛 Bugs Critiques Identifiés - 17 Décembre 2025

## 📊 Résumé

| Bug | Sévérité | Statut | Impact |
|-----|----------|--------|--------|
| Boucle infinie console.error | 🔴 CRITIQUE | ✅ CORRIGÉ | Crash app, logs illisibles |
| SafeAreaView déprécié | 🟡 MOYENNE | ✅ CORRIGÉ | Warning React Native |
| Timer API "Not Found" | 🔴 CRITIQUE | 🔍 LOGS ACTIVÉS | Job workflow bloqué |
| Job Step Update API "Not Found" | 🔴 CRITIQUE | 🔍 LOGS ACTIVÉS | Impossible de progresser dans les steps |

---

## 🔴 Bug #1 : Boucle Infinie Console.Error

### **Symptômes**
```
[ERROR] [global] Global console.error caught
[ERROR] [global] Global console.error caught {"console_error_args":3,...}
[ERROR] [global] Global console.error caught {"console_error_args":3,...}
... (infini)
```

### **Cause Racine**
Le global error handler dans `src/services/logger.ts` interceptait `console.error` et appelait `this.error()` qui elle-même appelle `console.error` → **récursion infinie**.

```typescript
// ❌ AVANT (BUGGÉ)
console.error = (...args) => {
  originalConsoleError.apply(console, args);
  this.error('Global console.error caught', ...); // ← Rappel console.error !
}
```

### **Solution Appliquée** ✅
Ajout d'un **flag de protection** contre la récursion :

```typescript
// ✅ APRÈS (CORRIGÉ)
let isLoggingConsoleError = false;

console.error = (...args) => {
  originalConsoleError.apply(console, args);
  
  if (isLoggingConsoleError) return; // Protection récursion
  
  try {
    isLoggingConsoleError = true;
    
    // Éviter duplication si déjà un message "[ERROR] [global]"
    if (message.includes('[ERROR] [global] Global console.error caught')) {
      return;
    }
    
    this.error('Global console.error caught', ...);
  } finally {
    isLoggingConsoleError = false;
  }
}
```

### **Fichiers Modifiés**
- ✅ `src/services/logger.ts` (lignes 285-320)

---

## 🟡 Bug #2 : SafeAreaView Déprécié

### **Symptômes**
```
SafeAreaView has been deprecated and will be removed in a future release.
Please use 'react-native-safe-area-context' instead.
Error in: ConnectionScreen
```

### **Cause Racine**
Import de `SafeAreaView` depuis `react-native` au lieu de `react-native-safe-area-context`.

```tsx
// ❌ AVANT
import { SafeAreaView, ... } from 'react-native';
```

### **Solution Appliquée** ✅
Migration vers la version moderne :

```tsx
// ✅ APRÈS
import { ... } from 'react-native'; // SafeAreaView retiré
import { SafeAreaView } from 'react-native-safe-area-context';
```

### **Fichiers Modifiés**
- ✅ `src/screens/connection.tsx` (lignes 1-8)

### **Note**
✅ Le package `react-native-safe-area-context` est déjà installé dans le projet (vérifié dans `package.json`).

---

## 🔴 Bug #3 : Timer API "Not Found" (EN INVESTIGATION)

### **Symptômes**
```
⚠️ [JobValidation] AUTO-CORRECTION: Timer non démarré
❌ [startTimerAPI] Timer start failed: {"error":"Not Found"}
```

### **Contexte Détecté**
1. **Auto-correction lancée** : Le système `jobValidation.ts` a détecté qu'un job `IN_PROGRESS` n'avait pas de timer démarré
2. **Tentative de correction** : Appel automatique à `startTimerAPI(jobCode)`
3. **Échec API** : Backend retourne `404 Not Found`

### **Hypothèses**

#### **Hypothèse #1 : Job n'existe pas dans la BDD** 🔍
- Le `jobCode` utilisé est invalide ou le job a été supprimé
- Le job existe côté frontend (AsyncStorage/cache) mais pas côté backend

#### **Hypothèse #2 : Endpoint API incorrect** 🔍
- URL actuelle : `POST /v1/job/{jobCode}/timer/start`
- Vérifier si le backend attend `/v1/jobs/{id}/start` (pluriel ? ID numérique ?)

#### **Hypothèse #3 : Problème d'authentification** 🔍
- Le token est expiré ou invalide
- Le job existe mais n'appartient pas à l'utilisateur authentifié → 404 au lieu de 403

#### **Hypothèse #4 : JobCode vs JobID confusion** 🔍
```typescript
// Dans jobValidation.ts ligne 339
await startTimerAPI(String(correction.jobId)); // ← conversion Number → String
```
- Si le backend attend un `jobCode` (string unique) mais reçoit un `jobId` (number)
- Ou inversement

### **Actions d'Investigation Nécessaires**

#### 1️⃣ **Vérifier le jobCode envoyé** (logs activés)
```typescript
// Logs maintenant actifs dans jobTimer.ts
console.log('🚀 [startTimerAPI] Starting timer for job:', jobCode);
console.log('🚀 [startTimerAPI] Full URL:', url);
console.log('🚀 [startTimerAPI] Response status:', response.status);
console.log('🚀 [startTimerAPI] Response data:', data);
```

**→ Reproduire le bug et vérifier dans les logs :**
- Quelle valeur de `jobCode` est envoyée ?
- L'URL complète générée est-elle correcte ?
- Le status code exact (404, 401, 403 ?)

#### 2️⃣ **Vérifier le backend**
```bash
# Tester directement l'endpoint avec curl/Postman
POST https://api.swiftapp.com/v1/job/{VOTRE_JOB_CODE}/timer/start
Authorization: Bearer {VOTRE_TOKEN}
Content-Type: application/json

{}
```

**Questions à vérifier :**
- ✅ Le job existe-t-il dans la BDD ?
- ✅ L'endpoint attend-il `/job/{code}` ou `/jobs/{id}` ?
- ✅ Le token est-il valide ?
- ✅ Le job appartient-il à l'utilisateur connecté ?

#### 3️⃣ **Vérifier la cohérence des données**
```typescript
// Dans jobValidation.ts
console.log('🔍 Job correction details:', {
  jobId: correction.jobId,
  jobCode: correction.jobCode, // Si disponible
  status: correction.status
});
```

**Vérifier :**
- Le job existe-t-il localement dans AsyncStorage ?
- Les données sont-elles cohérentes (ID, code, status) ?
- Y a-t-il eu une synchronisation récente avec le backend ?

#### 4️⃣ **Tester manuellement le workflow**
Selon `GUIDE_TEST_MANUEL_JOB_WORKFLOW.md` :
1. Créer un nouveau job via l'app
2. L'assigner à un staff
3. Tenter de démarrer le timer
4. Observer les logs détaillés

### **Fichiers Impliqués**
- `src/services/jobTimer.ts` (ligne 126-159) - Appel API
- `src/utils/jobValidation.ts` (ligne 252-339) - Auto-correction
- Backend: `/v1/job/{code}/timer/start` endpoint

### **Impact**
🔴 **CRITIQUE** : Bloque le workflow job complet
- ❌ Impossible de démarrer un timer
- ❌ Auto-correction échoue systématiquement
- ❌ Données incohérentes entre frontend et backend

### **Prochaines Étapes**
1. ✅ Logs activés dans `jobTimer.ts`
2. 🔄 Reproduire le bug et capturer les logs détaillés
3. 🔍 Analyser le `jobCode` envoyé et la réponse backend
4. 🔧 Corriger selon la cause identifiée

---

## � Bug #4 : Job Step Update API "Not Found" (NOUVEAU)

### **Symptômes**
```
❌ Failed to update job step: 404  {"error":"Not Found"}
[ERROR] [global] Global console.error caught 
{console_error_args: 2, console_error_message: '❌ Failed to update job step: 404...'}
```

### **Contexte Détecté**
L'API `PATCH /jobs/{jobId}/step` retourne **404 Not Found** lors de la mise à jour de l'étape du job.

### **Cause Probable**
Similaire au Bug #3 (Timer API), il s'agit probablement de :
1. **Job inexistant** : Le jobId n'existe pas dans la BDD backend
2. **Endpoint incorrect** : Le backend attend peut-être un format différent
3. **Format jobId** : Confusion entre jobCode (string) et jobId (number)

### **Action Prise** ✅
Logs détaillés activés dans `src/services/jobSteps.ts` :
```typescript
console.log('📊 [UPDATE JOB STEP] Calling API:', {
  jobId,
  current_step,
  notes,
  endpoint: `${API_BASE_URL}/jobs/${jobId}/step`
});
```

### **Prochaines Étapes**
1. Reproduire le workflow job avec les logs activés
2. Vérifier le `jobId` exact envoyé à l'API
3. Tester l'endpoint directement avec Postman/curl
4. Vérifier si le job existe dans la BDD backend

---

## �📋 Checklist de Validation Post-Correction

### Bug #1 (Console Error Loop)
- [x] Code modifié avec protection récursion
- [x] Double vérification des messages dupliqués
- [ ] Test : Reproduire une erreur console et vérifier qu'elle n'est loggée qu'une seule fois

### Bug #2 (SafeAreaView)
- [x] Import migré vers `react-native-safe-area-context`
- [x] Package déjà installé
- [x] **Script de vérification automatique créé** (`find-deprecated-safeareaview.js`)
- [x] **Tous les fichiers corrigés** : connection.tsx, profile.tsx, profile_user_only.tsx, profile_unified.tsx, profile_backup.tsx, LanguageSelector.tsx
- [ ] Test : Vérifier que le warning a disparu au démarrage de l'app

### Bug #3 (Timer API)
- [x] Logs détaillés activés
- [ ] Reproduction du bug avec logs capturés
- [ ] Identification de la cause racine
- [ ] Correction appliquée
- [ ] Test : Démarrer un timer avec succès

### Bug #4 (Job Step Update API)
- [x] Logs détaillés activés dans jobSteps.ts
- [ ] Reproduction avec logs capturés
- [ ] Analyse du jobId envoyé
- [ ] Correction appliquée
- [ ] Test : Mettre à jour un step avec succès

---

## 🎯 Tests de Régression Recommandés

Après corrections, exécuter :
1. **Test manuel** : `GUIDE_TEST_MANUEL_JOB_WORKFLOW.md`
2. **Test automatique** : `node test-job-workflow.js`
3. **Test edge cases** :
   - Job sans timer démarré
   - Job en cours interrompu
   - Offline → Online synchronisation

---

## 📊 Métriques Cibles

- ✅ 0 erreurs console infinie
- ✅ 0 warnings SafeAreaView
- 🎯 95%+ succès démarrage timer
- 🎯 < 2s latence API timer/start
- 🎯 0 incohérences données frontend/backend

---

**Date Rapport** : 17 Décembre 2025  
**Status Global** : 2/3 bugs corrigés, 1 en investigation  
**Prochaine Révision** : Après reproduction du bug #3 avec logs détaillés
