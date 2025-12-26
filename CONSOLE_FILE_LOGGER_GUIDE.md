# 📁 Console File Logger - Guide d'utilisation

## 🎯 Objectif

Ce système capture automatiquement **TOUS** les logs console de l'application en temps réel et les sauvegarde dans un fichier. Le fichier est effacé à chaque redémarrage de l'application.

## ✨ Fonctionnalités

- **Capture automatique** : Intercepte console.log, console.error, console.warn, console.info, console.debug
- **Timestamps** : Chaque log est horodaté au format ISO
- **Formatage JSON** : Les objets sont automatiquement sérialisés
- **Nettoyage automatique** : Le fichier est effacé au redémarrage de l'app
- **Protection contre les erreurs** : Le système continue même en cas d'erreur d'écriture
- **API d'accès** : Interface pour consulter les logs

## 🚀 Utilisation

### 1. Automatique
Le système s'initialise automatiquement au démarrage de l'application. Aucune action requise !

### 2. Via l'API Copilot (en développement)
```javascript
// Obtenir le chemin du fichier de logs
const logPath = global.copilotAPI.consoleLogger.getLogFilePath();

// Lire tout le contenu des logs
const allLogs = await global.copilotAPI.consoleLogger.getLogContent();

// Obtenir seulement les 50 dernières lignes
const recentLogs = await global.copilotAPI.consoleLogger.getRecentLogs(50);

// Restaurer les fonctions console originales
global.copilotAPI.consoleLogger.restore();
```

### 3. Via les scripts de lecture

#### PowerShell (recommandé pour Windows)
```powershell
# Afficher les 100 dernières lignes
.\read-console-logs.ps1

# Mode temps réel
.\read-console-logs.ps1 -Tail

# Filtrer par contenu
.\read-console-logs.ps1 -Filter "Error"

# Filtrer par niveau
.\read-console-logs.ps1 -Level ERROR

# Afficher 50 lignes
.\read-console-logs.ps1 -Lines 50

# Effacer les logs
.\read-console-logs.ps1 -Clear

# Aide
.\read-console-logs.ps1 -Help
```

#### Node.js
```bash
# Afficher les 100 dernières lignes
node read-console-logs.js

# Mode temps réel
node read-console-logs.js --tail

# Filtrer par contenu
node read-console-logs.js --filter "Error"

# Filtrer par niveau
node read-console-logs.js --level ERROR

# Afficher 50 lignes
node read-console-logs.js --lines 50

# Effacer les logs
node read-console-logs.js --clear

# Aide
node read-console-logs.js --help
```

## 📍 Emplacement du fichier

Le fichier de logs est automatiquement créé à :
```
{ExpoDocumentDirectory}/app-console-logs.txt
```

**Note** : Ce chemin est dans le système de fichiers de l'application Expo, pas directement accessible depuis l'ordinateur.

## 🔍 Format des logs

```
[2024-12-12T10:30:45.123Z] [LOG] Message normal
[2024-12-12T10:30:46.456Z] [ERROR] Message d'erreur
[2024-12-12T10:30:47.789Z] [WARN] Message d'avertissement
[2024-12-12T10:30:48.012Z] [INFO] Message d'information
[2024-12-12T10:30:49.345Z] [DEBUG] Message de debug
```

## ⚠️ Cas d'utilisation typiques

### Crash avec logs longs
```javascript
console.log('Très long message...'.repeat(1000));
// ✅ Sera sauvegardé intégralement dans le fichier
// ✅ Visible même si la console crash
```

### Erreurs en cascade
```javascript
for (let i = 0; i < 100; i++) {
  console.error(`Erreur #${i}:`, complexObject);
}
// ✅ Toutes les erreurs seront capturées dans le fichier
```

### Debug d'objets complexes
```javascript
console.log('État de l\'app:', {
  user: userObject,
  state: appState,
  config: configuration
});
// ✅ L'objet sera sérialisé en JSON dans le fichier
```

## 🛠️ Test du système

Pour tester que le système fonctionne :
```bash
node test-console-logging.js
```

Ce script génère différents types de logs pour valider le fonctionnement.

## 🔧 Configuration avancée

### Désactiver temporairement
```javascript
global.copilotAPI.consoleLogger.restore();
// Les logs ne seront plus sauvegardés dans le fichier
```

### Réactiver (nécessite un redémarrage de l'app)
Le système ne peut être réactivé qu'au redémarrage de l'application.

## 📊 Monitoring en temps réel

### Mode tail avec PowerShell
```powershell
.\read-console-logs.ps1 -Tail
```

### Mode tail avec Node.js
```bash
node read-console-logs.js --tail
```

Ces commandes affichent les nouveaux logs en temps réel, similaire à `tail -f` sur Linux.

## ❓ Dépannage

### Le fichier de logs n'existe pas
- Vérifiez que l'application est démarrée
- Les logs ne sont créés qu'après le premier console.log

### Erreurs d'écriture
- Le système continue de fonctionner même si l'écriture échoue
- Les erreurs d'écriture sont affichées dans la console originale

### Performances
- L'écriture est asynchrone, pas de blocage
- Les erreurs circulaires sont gérées automatiquement

## 🔗 Intégration

Le système est automatiquement intégré dans :
- `src/App.tsx` - Initialisation au démarrage
- `src/services/consoleFileLogger.ts` - Code principal
- `src/services/testCommunication.ts` - API Copilot
- Scripts de lecture en PowerShell et Node.js

## 📋 Changelog

### Version 1.0
- Capture automatique de tous les logs console
- Sauvegarde dans un fichier avec timestamps
- Scripts de lecture PowerShell et Node.js
- API d'accès via Copilot
- Nettoyage automatique au redémarrage