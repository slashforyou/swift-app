# 🧪 Suite de Tests Staff System

Une suite complète de tests pour le système de gestion du personnel (employés TFN et prestataires ABN) de Swift App.

## 📋 Vue d'ensemble

Cette suite de tests couvre l'intégralité du système Staff avec plus de 150 tests répartis dans différentes catégories :

### 🎯 Composants testés

- **Hook useStaff** - Gestion centrale des employés et prestataires
- **Types Staff** - Interfaces TypeScript pour Employee et Contractor  
- **InviteEmployeeModal** - Workflow d'invitation d'employés avec TFN
- **AddContractorModal** - Recherche et ajout de prestataires avec ABN
- **StaffCrewScreen** - Interface principale de gestion du staff
- **Tests E2E** - Workflows complets du système

### 🏗️ Architecture des tests

```
__tests__/
├── hooks/
│   └── useStaff.test.ts              (~25 tests)
├── types/
│   └── staff.test.ts                 (~20 tests)
├── components/modals/
│   ├── InviteEmployeeModal.test.tsx  (~30 tests)
│   └── AddContractorModal.test.tsx   (~35 tests)
├── screens/
│   └── staffCrewScreen.test.tsx      (~25 tests)
├── integration/
│   └── staff-e2e.test.ts             (~15 tests)
└── utils/
    └── staffTestUtils.ts             (Utilitaires partagés)
```

## 🚀 Exécution des tests

### Commandes rapides

```bash
# Tous les tests Staff
npm run test:staff

# Avec couverture de code
npm run test:staff:coverage

# Mode watch (développement)
npm run test:staff:watch

# Mode verbose (détaillé)
npm run test:staff:verbose

# Mise à jour des snapshots
npm run test:staff:update
```

### Tests spécifiques

```bash
# Test d'un composant spécifique
npm run test:staff -- --test="InviteEmployeeModal"

# Test d'une fonction spécifique
npm run test:staff -- --test="should invite employee"

# Tests unitaires uniquement
npx jest __tests__/hooks/useStaff.test.ts

# Tests de composants uniquement
npx jest __tests__/components/modals/

# Tests E2E uniquement
npx jest __tests__/integration/staff-e2e.test.ts
```

## 📊 Couverture de code

### Objectifs de couverture

- **Global** : 80% (branches, fonctions, lignes, statements)
- **useStaff.ts** : 90% (composant critique)
- **staff.ts** : 100% (types TypeScript)

### Rapport de couverture

Après exécution avec `--coverage`, consultez :
- **Terminal** : Résumé immédiat
- **HTML** : `coverage/staff/index.html`
- **LCOV** : `coverage/staff/lcov.info`

## 🧩 Types de tests

### 1. Tests unitaires

**Hook useStaff** (`__tests__/hooks/useStaff.test.ts`)
- ✅ Initialisation et données mockées
- ✅ Invitation d'employés (TFN)
- ✅ Recherche de prestataires (ABN)
- ✅ Ajout de prestataires avec statuts contractuels
- ✅ Gestion d'erreurs et états de chargement
- ✅ Filtrage et statistiques

**Types Staff** (`__tests__/types/staff.test.ts`)
- ✅ Validation des interfaces Employee et Contractor
- ✅ Formats australiens (TFN, ABN, téléphone)
- ✅ Statuts d'invitation et contractuels
- ✅ Union types et discrimination

### 2. Tests de composants

**InviteEmployeeModal** (`__tests__/components/modals/InviteEmployeeModal.test.tsx`)
- ✅ Rendu et interaction de formulaire
- ✅ Validation des champs (email, téléphone, TFN)
- ✅ Soumission et gestion d'erreurs
- ✅ États de chargement et fermeture de modal
- ✅ Accessibilité et navigation clavier

**AddContractorModal** (`__tests__/components/modals/AddContractorModal.test.tsx`)
- ✅ Workflow 3 étapes (recherche → résultats → contrat)
- ✅ Recherche par nom et ABN
- ✅ Sélection de statuts contractuels
- ✅ Gestion des prestataires vérifiés
- ✅ Navigation entre étapes et gestion d'erreurs

**StaffCrewScreen** (`__tests__/screens/staffCrewScreen.test.tsx`)
- ✅ Affichage des sections employés/prestataires
- ✅ Cartes avec statuts et informations
- ✅ Intégration des modales
- ✅ Statistiques en temps réel
- ✅ États vides et de chargement

### 3. Tests d'intégration E2E

**Staff E2E** (`__tests__/integration/staff-e2e.test.ts`)
- ✅ Workflow complet d'invitation d'employé
- ✅ Processus de recherche et ajout de prestataire
- ✅ Gestion mixte employés + prestataires
- ✅ Scénarios d'erreur et récupération
- ✅ Tests de performance et charges

## 🛠️ Utilitaires de test

### Factories

```typescript
// Créer des employés de test
const employee = createMockEmployee({
  firstName: 'John',
  role: 'Moving Supervisor',
  hourlyRate: 35
});

// Créer des prestataires de test
const contractor = createMockContractor({
  firstName: 'Mike',
  contractStatus: 'preferred',
  isVerified: true
});

// Données d'invitation
const inviteData = createInviteEmployeeData({
  email: 'new@swift.com',
  role: 'Senior Mover'
});
```

### Validateurs

```typescript
// Valider la structure d'un employé
expectValidEmployee(employee);

// Valider la structure d'un prestataire
expectValidContractor(contractor);

// Valider les formats australiens
expectValidAustralianPhone('+61 412 345 678');
expectValidTFN('123-456-789');
expectValidABN('12 345 678 901');
```

### Données mockées

```typescript
import { MOCK_EMPLOYEES, MOCK_CONTRACTORS } from './utils/staffTestUtils';

// Employés avec différents statuts
const employees = MOCK_EMPLOYEES; // 3 employés variés

// Prestataires avec différents contrats
const contractors = MOCK_CONTRACTORS; // 3 prestataires variés
```

## 🎯 Scénarios de test clés

### Employés TFN

1. **Invitation réussie** : Email → Compte créé → TFN renseigné
2. **Invitation expirée** : Email non accepté après 7 jours
3. **Validation formulaire** : Email, téléphone, rôle, équipe requis
4. **États d'invitation** : pending → accepted → completed

### Prestataires ABN

1. **Recherche par nom** : "John Smith" → Résultats filtrés
2. **Recherche par ABN** : "12345678901" → Prestataire exact
3. **Statuts contractuels** : standard, preferred, exclusive, non-exclusive
4. **Prestataires vérifiés** : Badge et statut de vérification

### Workflows mixtes

1. **Équipe mixte** : Employés TFN + Prestataires ABN
2. **Statistiques** : Comptes actifs, prestataires vérifiés
3. **Performance** : Opérations bulk, recherches simultanées

## 🔧 Configuration

### Jest Staff Config

```javascript
// jest.staff.config.js
module.exports = {
  preset: '@testing-library/react-native',
  testMatch: ['**/*staff*.test.{js,ts,tsx}'],
  collectCoverageFrom: [
    'src/hooks/useStaff.ts',
    'src/types/staff.ts',
    'src/components/business/modals/*Employee*.tsx',
    'src/components/business/modals/*Contractor*.tsx',
    'src/screens/business/staffCrewScreen.tsx',
  ],
  coverageThreshold: { /* seuils définis */ }
};
```

### Environnement de test

- **React Native Testing Library** : Rendu et interaction composants
- **Jest** : Runner de tests et assertions
- **jsdom** : Environnement DOM simulé
- **Mocks** : API, navigation, alertes

## 📈 Métriques et qualité

### Métriques actuelles

- **Tests totaux** : ~150 tests
- **Couverture cible** : 80% global, 90% critiques
- **Performance** : <1s pour 10 opérations bulk
- **Fiabilité** : Gestion d'erreurs complète

### Critères de qualité

- ✅ Tous les paths de code couverts
- ✅ Validation des formats australiens
- ✅ Gestion d'erreurs robuste
- ✅ Tests de régression complets
- ✅ Performance sous charge

## 🚨 Résolution d'erreurs

### Erreurs communes

```bash
# Modules manquants
npm install @testing-library/react-native

# Fichiers de test manquants
npm run test:staff # Vérification automatique

# Échec de couverture
npm run test:staff:coverage # Voir détails
```

### Debug

```bash
# Mode verbose pour plus d'infos
npm run test:staff:verbose

# Test spécifique avec logs
npx jest --verbose __tests__/hooks/useStaff.test.ts

# Snapshots à jour
npm run test:staff:update
```

## 📚 Documentation liée

- [Système Staff](../STAFF_SYSTEM.md) - Architecture générale
- [Types Staff](../src/types/staff.ts) - Interfaces TypeScript
- [Hook useStaff](../src/hooks/useStaff.ts) - Logique métier
- [Guides de test](../docs/TESTING_GUIDE.md) - Bonnes pratiques

## 🤝 Contribution

### Ajouter des tests

1. Suivre la structure existante
2. Utiliser les utilitaires partagés
3. Respecter les seuils de couverture
4. Documenter les scénarios complexes

### Standards de qualité

- **Nommage** : Descriptif et explicite
- **Isolation** : Tests indépendants
- **Assertions** : Spécifiques et claires
- **Mocks** : Minimaux et réalistes

---

🎉 **Suite de tests Staff** : Garantit la fiabilité du système de gestion dual TFN/ABN pour Swift App !