# 🚀 DÉMARRAGE - Instructions de Test

**Date:** 3 novembre 2025

---

## ✅ Serveur Expo Démarré

Le serveur Metro Bundler est en cours de démarrage avec le cache nettoyé.

---

## 📱 Comment Tester

### 1. Attendre que le QR code apparaisse

Dans le terminal PowerShell, vous devriez voir :
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

### 2. Ouvrir l'app sur votre téléphone

**Android:**
- Appuyez sur `a` dans le terminal, OU
- Scannez le QR code avec Expo Go

**iOS:**
- Appuyez sur `i` dans le terminal, OU
- Scannez le QR code avec l'app Caméra

---

## 🧪 Scénario de Test Principal

### Étape 1: Ouvrir un job
1. Dans l'app, ouvrir la liste des jobs
2. Sélectionner **JOB-NERD-SCHEDULED-004**
3. Laisser charger complètement (environ 2-3 secondes)

### Étape 2: Observer le badge debug
En haut de la page Summary, vous devriez voir un **badge jaune** :
```
🐛 DEBUG: Context step=X/5 | Job step=Y
```

**Notez les valeurs X et Y**

### Étape 3: Avancer le step
1. Cliquer sur **"Actions rapides"**
2. Cliquer sur **"Avancer étape"**
3. Dans le modal, sélectionner **"Étape 4"** (ou une autre étape)
4. Cliquer **"Avancer"**

### Étape 4: Observer les changements
1. **Toast notification** devrait apparaître : "Étape mise à jour: 4"
2. **Badge debug** devrait se mettre à jour
3. **Timeline** devrait afficher le nouveau step

---

## 📊 Logs à Surveiller

### Dans le terminal PowerShell, chercher ces logs :

**A. Déclenchement de l'action**
```
📊 [SUMMARY] Updating step to 4 for job JOB-NERD-SCHEDULED-004
```

**B. Appel API**
```
📊 [UPDATE JOB STEP] Updating job JOB-NERD-SCHEDULED-004 to step 4
```

**C. Réponse API ⚠️ CRITIQUE**
```
🔍 [UPDATE JOB STEP] Response structure check: {
  hasSuccess: true,
  hasData: true,          ← DOIT être TRUE
  hasJob: false,
  dataKeys: [...],
  dataCurrentStep: 4,     ← DOIT être le nouveau step
  dataCurrentStepType: "number"
}
```

**D. Parsing dans summary**
```
🔍 [SUMMARY] Response analysis: {
  hasData: true,
  dataCurrentStep: 4,
  targetStep: 4,
  willUse: 4              ← DOIT être le nouveau step
}
```

**E. setJob callback**
```
🔍 [SUMMARY] Inside setJob callback: {
  prevStep: { actualStep: 3 },
  newStep: 4              ← DOIT être le nouveau step
}
```

**F. Détection changement**
```
🔍 [SUMMARY] job.step changed: {
  actualStep: 4,          ← DOIT être le nouveau step
  contextCurrentStep: 3
}
```

**G. useMemo recalcul**
```
🔍 [jobDetails useMemo] Recalculating currentStep: {
  actualStep: 4,
  calculated: 4,          ← DOIT être le nouveau step
  jobStepExists: true
}
```

**H. Props au Provider**
```
🔍 [jobDetails] Props to JobTimerProvider: {
  jobId: "JOB-NERD-SCHEDULED-004",
  currentStep: 4,         ← DOIT être le nouveau step
  totalSteps: 5,
  jobStepActualStep: 4
}
```

**I. Sync du Provider**
```
🔍 [JobTimerProvider] Sync check: {
  propsCurrentStep: 4,
  timerCurrentStep: 3,
  isInternalUpdate: false,
  hasTimerData: true,
  isDifferent: true,
  isPositive: true,
  willSync: true          ← DOIT être TRUE
}
🔍 [JobTimerProvider] SYNCING step from 3 to 4
✅ [JobTimerProvider] Sync completed - new step: 4
```

**J. Display render**
```
🔍 [JobTimerDisplay] Rendering with: {
  contextCurrentStep: 4,  ← DOIT être le nouveau step
  contextTotalSteps: 5,
  jobStepActualStep: 4,
  match: true
}
```

---

## 🎯 Résultats Attendus

### ✅ SI TOUT FONCTIONNE :

1. **Toast** : "Étape mise à jour: 4"
2. **Badge debug** : `Context step=4/5 | Job step=4`
3. **Timeline** : Affiche "Étape 4/5"
4. **Tous les logs** de A à J apparaissent dans l'ordre
5. **Toutes les valeurs** sont correctes (4 partout)

### ❌ SI ÇA NE FONCTIONNE PAS :

Identifiez **quel log manque ou a une valeur incorrecte** :

| Log Manquant/Incorrect | Problème Identifié | Point de Rupture |
|------------------------|-------------------|------------------|
| **C** - `hasData: false` | API retourne mauvaise structure | Point 1 |
| **C** - `dataCurrentStep: undefined` | API ne retourne pas currentStep | Point 1 |
| **D** - `willUse: undefined` | Parsing response échoue | Point 2 |
| **E** - `newStep: undefined` | Mauvais parsing | Point 3 |
| **F** - `actualStep: 3` (reste à 3) | setJob() ne fonctionne pas | Point 4 |
| **G** - `calculated: 3` (reste à 3) | useMemo ne recalcule pas | Point 5 |
| **H** - `currentStep: 3` (reste à 3) | useMemo ne propage pas | Point 6 |
| **I** - `willSync: false` | Sync bloquée | Point 7 |
| **J** - `contextCurrentStep: 3` | Sync n'a pas fonctionné | Point 8 |

---

## 📸 Ce qu'il faut m'envoyer

### 1. Screenshot du badge debug
- Avant d'avancer le step
- Après avoir avancé le step

### 2. Copie des logs complets
Depuis le moment où vous cliquez "Avancer" jusqu'à ce que tout soit fini.

Commencez par :
```
📊 [SUMMARY] Updating step to...
```

Et terminez par :
```
🔍 [JobTimerDisplay] Rendering with: {...}
```

### 3. Description du comportement
- La timeline s'est-elle mise à jour ? (Oui/Non)
- Le toast est-il apparu ? (Oui/Non)
- Le badge debug a-t-il changé ? (Oui/Non)

---

## 🐛 Si Expo ne démarre pas

### Erreur "Body has already been read"

**Solution 1:**
```powershell
# Nettoyer complètement et redémarrer
Remove-Item -Path .expo -Recurse -Force
Remove-Item -Path node_modules/.cache -Recurse -Force -ErrorAction SilentlyContinue
npx expo start --clear
```

**Solution 2:**
```powershell
# Redémarrer avec tunnel (plus lent mais plus stable)
npx expo start --tunnel --clear
```

**Solution 3:**
```powershell
# Réinstaller les dépendances
npm install
npx expo start --clear
```

---

## ⏱️ Timeline Prévue

```
0:00 - Démarrer Expo (npx expo start --clear)
0:30 - QR code apparaît
1:00 - Scanner QR code / Ouvrir app
1:30 - App charge
2:00 - Ouvrir job JOB-NERD-SCHEDULED-004
2:30 - Noter le badge debug initial
3:00 - Cliquer "Avancer étape"
3:30 - Regarder les logs défiler
4:00 - Noter le badge debug final
4:30 - Copier tous les logs
5:00 - M'envoyer les résultats
```

---

## 🎯 Objectif

Avec ces logs ultra-détaillés, on va **identifier précisément** où la synchronisation échoue et appliquer le fix ciblé.

**Prêt ? Allez-y ! 🚀**
