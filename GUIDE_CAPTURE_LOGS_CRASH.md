# 🔍 GUIDE CAPTURE DE LOGS - CRASH NAVIGATION

## 🚨 PROBLÈME
Logs trop longs lors d'un crash de navigation, impossible de tout voir dans la console.

---

## ✅ SOLUTIONS RAPIDES

### **Solution 1 : Capturer dans un fichier (RECOMMANDÉ)** 📝

#### **Windows PowerShell**
```powershell
# Capturer tous les logs dans un fichier
npm start 2>&1 | Tee-Object -FilePath "crash-logs.txt"

# OU juste les erreurs
npm start 2>&1 | Select-String "Error|FATAL|Warning" | Out-File "crash-errors.txt"

# Reproduire le bug, puis analyser le fichier
code crash-logs.txt
```

#### **Script Automatique**
```bash
# Utiliser le script fourni
node capture-crash-logs.js

# Options:
# 1 - Capturer Metro logs
# 2 - Capturer Android logs
# 3 - Analyser fichier existant
```

---

### **Solution 2 : Filtrer les Logs en Temps Réel** 🔎

#### **PowerShell avec Filtres**
```powershell
# Filtrer seulement les erreurs critiques
npm start 2>&1 | Select-String -Pattern "Error|FATAL|Exception|at.*\.tsx"

# Exclure les warnings non importants
npm start 2>&1 | Select-String -Pattern "Error|FATAL" -NotMatch "Warning"
```

#### **Expo CLI avec Logs Minimalistes**
```bash
# Démarrer avec logs minimaux
npx expo start --no-dev --minify

# OU mode production
npx expo start --prod
```

---

### **Solution 3 : Utiliser React Native Debugger** 🐛

#### **Installation**
```bash
# Télécharger React Native Debugger
# https://github.com/jhen0409/react-native-debugger/releases

# OU installer via chocolatey (Windows)
choco install react-native-debugger
```

#### **Usage**
```
1. Lancer React Native Debugger
2. Démarrer l'app (npm start)
3. Dans l'app : Shake device → "Debug"
4. Les logs apparaissent dans le debugger
5. Console filtrée et stacktrace cliquable
```

---

### **Solution 4 : Logs Expo Go** 📱

#### **Via Expo Go App**
```
1. Ouvrir Expo Go sur le device
2. Shake le device
3. Cliquer "Show Developer Menu"
4. "Enable Remote JS Debugging"
5. Logs apparaissent dans Chrome DevTools
```

#### **Chrome DevTools**
```
1. Ouvrir Chrome: chrome://inspect
2. Cliquer "inspect" sur le device
3. Console tab → Tous les logs
4. Filtrer par "Error" ou "Warn"
5. Stacktrace cliquable
```

---

## 🎯 MÉTHODE RECOMMANDÉE POUR TON CAS

### **Étape 1 : Capturer le Crash**

```powershell
# Terminal 1 - Capturer les logs
npm start 2>&1 | Tee-Object -FilePath "navigation-crash-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').txt"
```

### **Étape 2 : Reproduire le Bug**
```
1. Lancer l'app
2. Naviguer comme d'habitude
3. Déclencher le crash
4. Logs sauvegardés automatiquement
```

### **Étape 3 : Analyser les Logs**

#### **Option A : Recherche Manuelle**
```powershell
# Rechercher les erreurs dans le fichier
Select-String -Path "navigation-crash-*.txt" -Pattern "Error|FATAL|Exception" | Select-Object -First 20

# Rechercher un mot clé spécifique
Select-String -Path "navigation-crash-*.txt" -Pattern "navigation|navigate|screen" -Context 3,3
```

#### **Option B : Script Automatique**
```bash
# Analyser avec le script
node capture-crash-logs.js analyze navigation-crash-2025-12-17_14-30-00.txt

# Résultat :
# - Résumé des erreurs
# - Stack traces principales
# - Rapport condensé créé
```

---

## 🔍 IDENTIFIER LE BUG DE NAVIGATION

### **Patterns d'Erreurs Courantes**

#### **1. Navigation Stack Corruption**
```
Error: The action 'NAVIGATE' with payload {"name":"Screen"} 
was not handled by any navigator.

→ Cause: Screen non déclaré dans le navigator
→ Fix: Vérifier que le screen existe dans navigation/index.tsx
```

#### **2. Params Invalides**
```
Error: A navigator can only contain 'Screen' components as its 
direct children (found 'undefined')

→ Cause: Passage de params undefined
→ Fix: Vérifier route.params avec fallbacks
```

#### **3. NavigationIndependentTree Issues**
```
Error: Couldn't find a navigation object. Is your component 
inside NavigationContainer?

→ Cause: Problème avec NavigationIndependentTree
→ Fix: Vérifier structure CalendarNavigation
```

#### **4. Circular Navigation**
```
Warning: Cannot update a component while rendering a different component

→ Cause: Navigation dans useEffect sans deps
→ Fix: Ajouter dependencies ou useCallback
```

---

## 🛠️ DEBUGGING ÉTAPE PAR ÉTAPE

### **1. Reproduire de Manière Consistente**
```
1. Partir de Home
2. Suivre exactement ces étapes:
   - [ ] Clic sur "Today"
   - [ ] Clic sur job
   - [ ] Navigation vers tab X
   - [ ] Crash à l'étape Y
3. Noter l'étape exacte du crash
```

### **2. Activer Logs Détaillés**

#### **Dans App.tsx**
```typescript
// Ajouter au début
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0]?.includes('navigation')) {
      console.log('🔍 NAVIGATION WARNING:', ...args);
    }
    originalWarn(...args);
  };
  
  const originalError = console.error;
  console.error = (...args) => {
    console.log('🔴 ERROR:', ...args);
    console.trace(); // Stack trace
    originalError(...args);
  };
}
```

### **3. Logger Navigation Events**

#### **Dans navigation/index.tsx**
```typescript
import { NavigationContainer } from '@react-navigation/native';

export default function Navigation() {
  return (
    <NavigationContainer
      onStateChange={(state) => {
        if (__DEV__) {
          console.log('🧭 Navigation State:', JSON.stringify(state, null, 2));
        }
      }}
      onReady={() => {
        console.log('✅ Navigation Ready');
      }}
    >
      {/* ... */}
    </NavigationContainer>
  );
}
```

---

## 📊 CHECKLIST DE DEBUG

### **Avant de Partager les Logs**
- [ ] Logs capturés dans un fichier
- [ ] Fichier < 5MB (sinon compresser ou extraire erreurs)
- [ ] Erreur principale identifiée
- [ ] Stack trace complète
- [ ] Étapes de reproduction notées
- [ ] Device/OS/Version app

### **Informations à Inclure**
```markdown
**Bug:** Crash navigation vers [Screen]

**Reproduction:**
1. Home → Today
2. Clic sur job
3. Navigation vers [Tab/Screen]
4. Crash immédiat

**Device:** iPhone 12 / Pixel 5
**OS:** iOS 17 / Android 13
**App Version:** 1.0.0

**Erreur principale:**
```
[Coller les 20 premières lignes d'erreur]
```

**Stack trace:**
```
[Coller le stack trace filtré]
```

**Logs complets:** [Lien vers fichier]
```

---

## 🚀 COMMANDES RAPIDES

```powershell
# 1. Capturer les logs
npm start 2>&1 | Tee-Object -FilePath "crash.txt"

# 2. Reproduire le bug
# (dans l'app)

# 3. Analyser (chercher "Error")
Select-String -Path "crash.txt" -Pattern "Error" -Context 5,5 | Out-File "errors-only.txt"

# 4. Ouvrir le rapport
code errors-only.txt

# 5. Partager les erreurs principales
# (copier/coller dans chat)
```

---

## 📞 BESOIN D'AIDE ?

**Si les logs sont trop longs même dans un fichier :**

1. **Utiliser le script d'analyse**
   ```bash
   node capture-crash-logs.js analyze crash.txt
   ```
   → Génère un rapport condensé automatiquement

2. **Extraire juste l'erreur principale**
   ```powershell
   Select-String -Path "crash.txt" -Pattern "Error:" -Context 0,10 | Select-Object -First 1
   ```

3. **Partager le fichier**
   - Compresser : `Compress-Archive crash.txt crash.zip`
   - Uploader sur GitHub Gist ou Pastebin
   - Partager le lien

---

*Guide créé le 17 Décembre 2025*  
*Pour SwiftApp Crash Navigation Debugging*
