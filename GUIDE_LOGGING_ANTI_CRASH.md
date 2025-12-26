# Guide du Système de Logging Anti-Crash

## 🚀 Résumé

Le système de logging a été amélioré pour éviter les crashes causés par des logs trop longs. Les logs sont maintenant écrits simultanément dans la **console** ET dans un **fichier persistant** pour permettre l'analyse post-crash.

## 📁 Localisation des fichiers de logs

### En production React Native/Expo
- **Fichier principal** : `{DocumentDirectory}/swift-app-session.log`
- **Accès via DevTools** : Utiliser `LogViewer.tsx` dans l'app
- **Chemin typique iOS** : `/var/mobile/Containers/Data/Application/{APP-ID}/Documents/swift-app-session.log`
- **Chemin typique Android** : `/data/data/{PACKAGE}/files/swift-app-session.log`

### En développement
- **Logs de test** : Dans le dossier du projet (`test-crash-logs.txt`, `crash-simulation-logs.txt`)
- **Console Metro** : Logs en temps réel pendant le développement

## 🛠️ Comment utiliser le nouveau système

### 1. Import du système de logging sécurisé

```typescript
import { safeLog } from '../utils/crashSafeLogger';
```

### 2. Utilisation basique

```typescript
// Logs normaux
await safeLog.info('Message d\'information', { data: 'value' }, 'context');
await safeLog.error('Erreur détectée', errorObject, 'error-context');
await safeLog.debug('Debug info', debugData, 'debug-context');
await safeLog.warn('Attention', warningData, 'warning-context');
```

### 3. Logs d'objets volumineux

```typescript
// Pour les réponses API volumineuses, données Stripe, etc.
await safeLog.large('info', 'Réponse Stripe reçue', largeStripeResponse, 'stripe-api');
await safeLog.large('debug', 'Configuration utilisateur', bigConfigObject, 'user-config');
```

### 4. Exemple dans useStripeConnection

Le hook `useStripeConnection.ts` a été mis à jour pour utiliser ce système :

```typescript
// Logs d'information
await safeLog.info('Checking Stripe connection started', undefined, 'stripe-hook');

// Logs de données volumineuses (réponses Stripe)
await safeLog.large('debug', 'Stripe connection status result', status, 'stripe-hook');

// Logs d'erreurs avec stack trace
await safeLog.error('Error checking Stripe connection', err, 'stripe-hook');
```

## 🔧 Protection contre les crashes

### Fonctionnalités automatiques

1. **Troncature des chaînes longues** : Chaînes > 1000 chars sont tronquées
2. **Limitation de profondeur d'objets** : Max 3 niveaux de profondeur
3. **Gestion des références circulaires** : Détectées et marquées `[Circular reference]`
4. **Limite de taille totale** : Logs > 5KB sont tronqués
5. **Gestion des erreurs de sérialisation** : Fallback sûr en cas d'échec

### Exemple de données protégées

```typescript
const problematicData = {
  largeArray: Array(1000).fill('data'),  // Sera tronqué
  deepNested: { a: { b: { c: { d: 'too deep' } } } },  // Profondeur limitée
  circular: circularRef,  // Sera marqué [Circular reference]
  longString: 'very long string...'.repeat(1000)  // Sera tronqué
};

// ✅ Sûr - ne plantera pas l'app
await safeLog.large('debug', 'Données problématiques', problematicData, 'test');
```

## 📱 Accès aux logs après un crash

### 1. Via l'application (si elle redémarre)

```typescript
import { sessionLogger } from '../services/sessionLogger';

// Lire le fichier de log
const logContent = await sessionLogger.readLogContent();
console.log('Logs du crash:', logContent);

// Partager le fichier pour analyse
await sessionLogger.shareLogFile();
```

### 2. Via le DevTools LogViewer

L'application inclut un composant `LogViewer.tsx` accessible depuis le menu développeur pour visualiser les logs même après un crash.

### 3. Via les outils de développement

- **Expo** : `npx expo logs`
- **React Native Debugger** : Logs persistés dans les DevTools
- **Accès direct** : Via ADB (Android) ou dispositifs iOS connectés

## 🧪 Tests et validation

### Script de test inclus

```bash
# Tester le système complet
node test-simple-logging.js

# Ou via PowerShell (Windows)
.\test-crash-safe-logging.ps1
```

### Tests couverts

1. ✅ Sérialisation sécurisée d'objets complexes
2. ✅ Écriture persistante dans un fichier
3. ✅ Gestion des références circulaires  
4. ✅ Troncature automatique des données volumineuses
5. ✅ Préservation des logs critiques avant crash
6. ✅ Performance (logging non-bloquant)

## 🚨 Que faire en cas de crash

### 1. Récupération immédiate

```bash
# Chercher les fichiers de log récents
Get-ChildItem -Path $env:USERPROFILE -Filter "*swift-app*" -Recurse -ErrorAction SilentlyContinue

# Ou sur Mac/Linux
find ~ -name "*swift-app-session*" -mtime -1
```

### 2. Analyse des logs

Les logs incluront :
- **Timestamp précis** du crash
- **Context** de l'opération en cours  
- **Données d'état** avant le crash
- **Stack traces** des erreurs
- **Progression des opérations** Stripe

### 3. Exemple de log de crash typique

```
2025-12-13T02:57:20.465Z [INFO] Checking Stripe connection started (stripe-hook)
2025-12-13T02:57:20.466Z [DEBUG] Stripe connection status result (stripe-hook)
Data: {
  "account": {
    "id": "acct_...",
    "business_profile": { ... },
    "large_response_data": "... [String truncated]"
  },
  "status": "active"
}
2025-12-13T02:57:20.467Z [ERROR] Critical error before crash (stripe-hook)
Data: {
  "error": "Memory overflow due to large logs",
  "stack": "Error: ...\n    at checkStripeConnectionStatus...",
  "lastOperation": "Processing Stripe connection response"
}
```

## 💡 Bonnes pratiques

### 1. Utiliser le bon niveau de log

```typescript
// Information générale
await safeLog.info('User logged in', { userId }, 'auth');

// Debug détaillé (uniquement en dev)
await safeLog.debug('API response details', responseData, 'api');

// Attention/avertissements
await safeLog.warn('Slow response detected', { responseTime }, 'performance');

// Erreurs critiques
await safeLog.error('Database connection failed', error, 'database');
```

### 2. Utiliser des contextes descriptifs

```typescript
// ✅ Bon - contexte clair
await safeLog.info('Connection established', data, 'stripe-hook');
await safeLog.error('Payment failed', error, 'payment-processing');

// ❌ Éviter - contexte vague
await safeLog.info('Something happened', data, 'general');
```

### 3. Pour les données très volumineuses

```typescript
// ✅ Utiliser safeLog.large pour les gros objets
await safeLog.large('info', 'Full API response', largeApiResponse, 'api-call');

// ❌ Éviter les logs directs de gros objets
console.log('API response:', largeApiResponse); // Peut causer un crash
```

## 🔧 Configuration avancée

### Ajustement des limites

Dans `crashSafeLogger.ts`, vous pouvez ajuster :

```typescript
// Taille maximale d'un log
const MAX_LOG_SIZE = 5000; // caractères

// Profondeur maximale des objets
const MAX_OBJECT_DEPTH = 3; // niveaux
```

### Rotation des fichiers de log

Le `sessionLogger.ts` gère automatiquement :
- **Taille max** : 10MB par fichier
- **Rotation** : Conservation des 1000 dernières lignes
- **Nettoyage** : Nouveau fichier à chaque session

## 📞 Support et dépannage

### Si les logs ne s'écrivent pas dans le fichier

1. Vérifier les permissions d'écriture
2. Vérifier l'espace disque disponible
3. S'assurer que `expo-file-system` est correctement installé
4. Tester avec `sessionLogger.getLogFilePath()` pour voir le chemin

### Si l'application continue à crasher

1. Vérifier que `safeLog` est bien utilisé partout
2. Chercher d'autres `console.log` avec des objets volumineux
3. Activer le logging de débogage pour tracer la source du crash
4. Utiliser les tests inclus pour valider le système

---

## ✅ Installation terminée

Le système de logging anti-crash est maintenant **opérationnel** dans votre application Swift App. 

**Prochaine étape** : Testez avec votre application React Native en déclenchant `useStripeConnection` avec des données volumineuses pour vérifier que les logs sont bien préservés dans le fichier `swift-app-session.log` même en cas de crash.