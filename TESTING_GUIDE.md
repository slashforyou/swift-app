# 🧪 Système de Tests - Swift App

## ✅ Status: Opérationnel

Ce projet utilise **Jest** et **TypeScript** pour assurer la qualité du code et la fiabilité de l'application.

**Résultats des Tests** : 
- ✅ **18 tests passent** sur 3 suites de tests
- ✅ **Couverture de code** : 1.36% globale (démarrée avec les utilitaires métier)
- ✅ **Configuration fonctionnelle** pour les tests unitaires et d'intégration

## Configuration

### Outils installés
- **Jest** : Framework de test JavaScript
- **@testing-library/react-native** : Utilitaires pour tester les composants React Native
- **@types/jest** : Types TypeScript pour Jest

### Configuration Jest (`jest.config.js`)
- Support TypeScript/JSX
- Mocks pour React Native et Expo
- Configuration des chemins d'alias
- Couverture de code automatique

### Setup (`jest.setup.js`)
- Mocks globaux pour React Native
- Configuration des modules Expo
- Utilitaires de test pré-configurés

## Structure des Tests

```
__tests__/
├── components/          # Tests des composants React Native
├── hooks/              # Tests des hooks personnalisés
├── services/           # Tests des services API
├── utils/              # Tests des utilitaires
└── App.test.tsx        # Tests d'intégration de l'app
```

## Scripts disponibles

```bash
# Lancer tous les tests
npm test

# Lancer les tests en mode watch (développement)
npm run test:watch

# Générer un rapport de couverture
npm run test:coverage

# Tests pour CI/CD
npm run test:ci
```

## 📋 Collection de Tests Implémentés

### ✅ Composants
- **NotificationsPanel** : Modal de notifications avec animations
  - Rendu conditionnel selon `visible`
  - Gestion des événements (fermeture, lecture)
  - Animation de hauteur
  - Affichage correct des notifications
  - Gestion des types de notifications

### ✅ Hooks
- **useGamificationFixed** : Système de gamification
  - Initialisation des données par défaut
  - Calcul des niveaux et XP
  - Ajout d'XP et mise à jour des niveaux
  - Gestion du streak et des jobs complétés

### ✅ Services
- **Calendar Service** : API de calendrier
  - `fetchCalendarOverview()` - Vue d'ensemble
  - `fetchJobsForDate()` - Jobs pour une date
  - `fetchCalendarMonth()` - Données mensuelles
  - Gestion des erreurs réseau et API
  - Integration avec l'authentification

### ✅ Utilitaires
- **Auth Utils** : Authentification
  - `login()` - Connexion utilisateur
  - `getAuthHeaders()` - Headers d'authentification
  - `isLoggedIn()` - Vérification de session
  - `refreshToken()` - Renouvellement des tokens
  - Gestion du SecureStore

- **Date Utils** : Manipulation des dates
  - `formatDate()` - Formatage français des dates
  - `formatTime()` - Formatage des heures
  - `isToday()` - Vérification date du jour
  - `addDays()` - Ajout/soustraction de jours

### ✅ Intégration
- **App** : Tests de l'application principale
  - Rendu sans erreur
  - Initialisation de la navigation

## 🚀 Meilleures Pratiques

### Structure des Tests
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup avant chaque test
    jest.clearAllMocks();
  });

  it('should do something specific', () => {
    // Arrange
    const props = { /* ... */ };
    
    // Act
    const { getByText } = render(<Component {...props} />);
    
    // Assert
    expect(getByText('Expected Text')).toBeTruthy();
  });
});
```

### Mocking
```typescript
// Mock d'un module
jest.mock('../../src/utils/auth');

// Mock d'une fonction spécifique
const mockFn = jest.fn().mockReturnValue('mocked value');

// Mock avec résolution asynchrone
mockFetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: 'test' })
});
```

### Tests d'Événements
```typescript
// Test d'un événement de presse
const { getByTestId } = render(<Button onPress={mockHandler} />);
fireEvent.press(getByTestId('button'));
expect(mockHandler).toHaveBeenCalledTimes(1);

// Test d'input
fireEvent.changeText(getByTestId('input'), 'new value');
```

## 📊 Couverture de Code

Le rapport de couverture est généré dans `/coverage/` et inclut :
- **Statements** : Instructions couvertes
- **Branches** : Conditions couvertes 
- **Functions** : Fonctions testées
- **Lines** : Lignes exécutées

### Objectifs de couverture
- Components : > 80%
- Services/Utils : > 90%
- Hooks : > 85%

## 🔧 Dépannage

### Problèmes courants

1. **Erreur de modules manquants**
   ```bash
   npm install --save-dev @types/jest --legacy-peer-deps
   ```

2. **Problèmes avec React Native mocks**
   - Vérifier `jest.setup.js` pour les mocks globaux
   - Ajouter des mocks spécifiques dans les tests

3. **Tests qui échouent avec Animated**
   ```typescript
   jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
   ```

## 📈 Prochaines Étapes

### Tests à ajouter
- [ ] Tests E2E avec Detox
- [ ] Tests de performance
- [ ] Tests d'accessibilité
- [ ] Snapshot testing pour l'UI
- [ ] Tests de régression pour les APIs

### Améliorations
- [ ] Setup CI/CD avec GitHub Actions
- [ ] Integration avec SonarQube
- [ ] Tests de mutation
- [ ] Benchmarking automatisé

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing React Native Apps](https://reactnative.dev/docs/testing-overview)

---

**Note** : Ce système de tests évolue avec l'application. Maintenir une couverture élevée et ajouter des tests pour chaque nouvelle fonctionnalité.