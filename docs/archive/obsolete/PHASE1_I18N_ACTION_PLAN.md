# 🌍 Phase 1 : i18n Completion - Plan d'Action

**Objectif** : Compléter toutes les traductions pour atteindre 197/197 tests (100% clean config)

**Date début** : 26 Octobre 2025  
**Durée estimée** : 1-2 jours

---

## 📊 État Actuel

| Langue | Code | Lignes | Completion | Status |
|--------|------|--------|------------|--------|
| English | en | 326 | 100% | ✅ Référence |
| French | fr | 326 | 100% | ✅ Complet |
| Spanish | es | 67 | 20% | ⚠️ À compléter |
| Portuguese | pt | 146 | 45% | ⚠️ À compléter |
| Italian | it | 44 | 13% | ⚠️ À compléter |
| Hindi | hi | 44 | 13% | ⚠️ À compléter |
| Chinese | zh | 0 | 0% | ❌ À créer |

**Total à faire** : 5 langues incomplètes + 1 fichier à créer

---

## 🎯 Plan d'Exécution

### Étape 1 : Compléter ES (Spanish) - 260 lignes manquantes

**Sections à ajouter** :
- `home.business` (manquant)
- `calendar` (structure complète manquante)
- `profile` (manquant)
- `jobDetails` (manquant)
- `settings` (manquant)
- `business` (manquant)
- `messages` (manquant)

**Stratégie** :
1. Copier structure depuis `en.ts`
2. Traduire avec DeepL/Google Translate
3. Vérifier cohérence terminologique
4. Validation TypeScript

---

### Étape 2 : Compléter PT (Portuguese) - 180 lignes manquantes

**Sections à ajouter** :
- `calendar` (partiellement manquant)
- `jobDetails` (manquant)
- `business` (manquant)

---

### Étape 3 : Compléter IT (Italian) - 282 lignes manquantes

**Sections à ajouter** : Presque tout (seulement `common` et partial `home`)

---

### Étape 4 : Compléter HI (Hindi) - 282 lignes manquantes

**Sections à ajouter** : Presque tout

**Note** : Hindi nécessitera attention particulière pour script Devanagari

---

### Étape 5 : Créer ZH (Chinese) - 326 lignes

**Création complète** du fichier

**Note** : Chinois nécessitera caractères simplifiés (中文)

---

### Étape 6 : Mettre à jour Tests

**Fichier** : `src/__tests__/localization.test.ts`

**Actions** :
1. Ajouter imports `hi` et `zh`
2. Ajouter au dictionnaire `translations`
3. Tests s'exécuteront automatiquement sur toutes les langues

---

### Étape 7 : Activer Tests Skippés

**Tests à activer** (3) :
```typescript
// Ligne ~40
test.skip('All translations should have the same structure as English', () => {
// → test('All translations should have the same structure as English', () => {

// Ligne ~65  
test.skip('No translation should be empty or missing', () => {
// → test('No translation should be empty or missing', () => {

// Ligne ~95
test.skip('Home screen translations should be appropriate', () => {
// → test('Home screen translations should be appropriate', () => {
```

---

## 🛠️ Outils & Ressources

### Traduction Automatique
- **DeepL** (recommandé) : https://www.deepl.com/translator
- **Google Translate** : https://translate.google.com
- **Microsoft Translator** : https://www.bing.com/translator

### Validation
- **TypeScript** : Vérification automatique de structure
- **Tests** : Validation completeness

### Terminologie de Référence

**Termes courants** :
- Save → Guardar (ES), Salvar (PT), Salva (IT), सहेजें (HI), 保存 (ZH)
- Cancel → Cancelar (ES/PT), Annulla (IT), रद्द करें (HI), 取消 (ZH)
- Delete → Eliminar (ES), Excluir (PT), Elimina (IT), हटाएं (HI), 删除 (ZH)

---

## ✅ Checklist d'Exécution

### ES (Spanish)
- [ ] Copier `en.ts` → `es.ts.draft`
- [ ] Traduire section par section
- [ ] Valider TypeScript
- [ ] Test unitaire
- [ ] Commit "Complete ES translations"

### PT (Portuguese)
- [ ] Copier sections manquantes depuis `en.ts`
- [ ] Traduire
- [ ] Valider TypeScript
- [ ] Test unitaire
- [ ] Commit "Complete PT translations"

### IT (Italian)
- [ ] Copier `en.ts` → `it.ts` (override)
- [ ] Traduire
- [ ] Valider TypeScript
- [ ] Test unitaire
- [ ] Commit "Complete IT translations"

### HI (Hindi)
- [ ] Copier `en.ts` → `hi.ts` (override)
- [ ] Traduire avec attention au Devanagari
- [ ] Valider TypeScript
- [ ] Test unitaire
- [ ] Commit "Complete HI translations"

### ZH (Chinese)
- [ ] Créer `zh.ts` depuis `en.ts`
- [ ] Traduire en chinois simplifié
- [ ] Valider TypeScript
- [ ] Test unitaire
- [ ] Commit "Add ZH (Chinese) translations"

### Tests
- [ ] Update `localization.test.ts` (imports)
- [ ] Activer test "same structure"
- [ ] Activer test "no empty"
- [ ] Activer test "home screen"
- [ ] Run `npm run test:clean -- localization.test.ts`
- [ ] Vérifier 9/9 passing
- [ ] Commit "Activate i18n tests - 9/9 passing"

### Final
- [ ] Run `npm run test:clean`
- [ ] Vérifier 197/197 passing (100%)
- [ ] Update PROGRESSION.md
- [ ] Commit "Phase 1 Complete: 197/197 (100% clean config)"

---

## 📝 Structure de Fichier Traduction

```typescript
import { TranslationKeys } from '../types';

export const [lang]Translations: TranslationKeys = {
    common: { ... },          // Termes communs
    home: { ... },            // Écran accueil
    navigation: { ... },      // Navigation
    jobs: { ... },            // Jobs & timer
    calendar: { ... },        // Calendrier complet
    profile: { ... },         // Profil utilisateur
    jobDetails: { ... },      // Détails job
    settings: { ... },        // Paramètres
    business: { ... },        // Business section
    messages: { ... },        // Messages système
};
```

---

## 🎯 Résultat Attendu

```
Tests Passing: 197/197 (100%)
Test Suites:  18/18 (100%)
Tests Skipped: 0

Langues complètes:
✅ EN (326 lignes)
✅ FR (326 lignes)
✅ ES (326 lignes)
✅ PT (326 lignes)
✅ IT (326 lignes)
✅ HI (326 lignes)
✅ ZH (326 lignes)
```

---

## ⏱️ Timeline

**Jour 1** :
- Matin : ES + PT (4h)
- Après-midi : IT + HI (4h)

**Jour 2** :
- Matin : ZH (2h)
- Après-midi : Tests + validation (2h)

**Total** : 12 heures de travail

---

**Prêt à commencer ?** 🚀

**Recommandation** : Commencer par ES (Spanish) car c'est le plus commencé (67/326 lignes)
