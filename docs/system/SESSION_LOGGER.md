# 📋 Session Logger System

Un système de logs de session qui s'efface automatiquement à chaque rechargement de l'application.

## 🎯 Fonctionnalités

- **Logs en mémoire uniquement** : Aucun fichier persistant, tout est effacé au rechargement
- **Niveaux de log** : DEBUG, INFO, WARN, ERROR
- **Catégories** : Organisation des logs par composant/service
- **Performance tracking** : Mesure des durées d'opération
- **Export** : Possibilité d'exporter les logs pour debugging

## 🚀 Utilisation

### Dans un composant React

```typescript
import { useSessionLogger } from '../hooks/useSessionLogger';

const MyComponent: React.FC = () => {
  const logger = useSessionLogger('MyComponent');

  const handleAction = () => {
    logger.info('User performed action');
    logger.debug('Action details', { userId: 123, timestamp: Date.now() });
  };

  return <button onClick={handleAction}>Click me</button>;
};
```

### Logging direct (sans hook)

```typescript
import { sessionLogger } from '../services/sessionLogger';

// Logs simples
sessionLogger.info('App', 'Application started');
sessionLogger.error('API', 'Request failed', { endpoint: '/users' }, error);

// Logs spécialisés
sessionLogger.logNavigation('Home', 'Profile', { userId: 123 });
sessionLogger.logApiCall('/api/jobs', 'GET', 250);
sessionLogger.logUserAction('add_note', 'JobDetails', { noteId: 'abc123' });
sessionLogger.logPerformance('data_processing', 1250, 'JobScreen');
```

## 🔧 Configuration

### Niveaux de log

```typescript
export enum LogLevel {
  DEBUG = 0,  // Informations de débogage
  INFO = 1,   // Informations générales
  WARN = 2,   // Avertissements
  ERROR = 3,  // Erreurs
}
```

### Méthodes disponibles

| Méthode | Description | Exemple |
|---------|-------------|---------|
| `debug()` | Logs de débogage | `logger.debug('Component mounted')` |
| `info()` | Informations générales | `logger.info('Data loaded successfully')` |
| `warn()` | Avertissements | `logger.warn('Deprecated function used')` |
| `error()` | Erreurs | `logger.error('API call failed', data, error)` |
| `logNavigation()` | Navigation | `logger.logNavigation('Profile', params)` |
| `logUserAction()` | Actions utilisateur | `logger.logUserAction('button_click', data)` |
| `logApiCall()` | Appels API | `logger.logApiCall('/api/data', 'GET', 150)` |
| `logPerformance()` | Performance | `logger.logPerformance('render', 45)` |

## 📤 Export des logs

```typescript
// Via le hook
const logger = useSessionLogger('MyComponent');
const exportedLogs = logger.exportLogs();
console.log(exportedLogs);

// Directement
import { sessionLogger } from '../services/sessionLogger';
const allLogs = sessionLogger.exportLogs();
```

## 🛠️ Développement

### Composant de test

Pour tester le système de logs, utilisez le composant `SessionLogsDemo` :

```typescript
import { SessionLogsDemo } from '../components/dev/SessionLogsDemo';

// Ajoutez-le temporairement à un écran pour tester
<SessionLogsDemo />
```

### Configuration avancée

```typescript
// Désactiver les logs
sessionLogger.setEnabled(false);

// Limiter le nombre de logs en mémoire
sessionLogger.setMaxLogs(500);

// Récupérer les logs filtrés
const errorLogs = sessionLogger.getLogsByLevel(LogLevel.ERROR);
const apiLogs = sessionLogger.getLogsByCategory('API');
```

## 🔒 Sécurité et Performance

- **Pas de persistance** : Les logs ne sont jamais sauvegardés sur le disque
- **Limite mémoire** : Maximum 1000 logs par défaut pour éviter la surcharge
- **Développement uniquement** : Les logs console ne s'affichent qu'en mode `__DEV__`
- **Optimisé** : Utilisation de useCallback et useMemo dans les hooks

## 📁 Structure des fichiers

```
src/
├── services/
│   └── sessionLogger.ts      # Service principal
├── hooks/
│   └── useSessionLogger.ts   # Hook React
└── components/dev/
    └── SessionLogsDemo.tsx   # Composant de test
```

## 🎨 Format des logs

```
[2025-10-11T14:30:25.123Z] INFO [JobNote] Note added successfully | Data: {"content":"Test note"}
[2025-10-11T14:30:25.456Z] ERROR [API] Request failed | Data: {"endpoint":"/api/notes"}
Stack: Error: Network timeout
    at fetch (/path/to/file.js:123:45)
```

## 🚫 .gitignore

Le système est configuré pour exclure les fichiers de logs de Git :

```gitignore
# Session logs (cleared on app reload)
session_logs/
*.session.log
```

---

**Note** : Ce système est conçu pour le développement et le debugging. Les logs sont automatiquement effacés à chaque rechargement de l'application.