# 🧪 Suites de Tests Manuels - Swift App

Cette structure modulaire permet de créer, organiser et réutiliser des tests automatisés pour l'application Swift.

## 📁 Structure

```
MANUAL_TESTS/
├── shared/                          # Ressources partagées
│   ├── config.ps1                  # Configuration globale (ADB, credentials, etc.)
│   └── utils.ps1                   # Fonctions utilitaires réutilisables
│
├── 01_JOB_COMPLETE_FLOW/           # Suite: Création de job complète
│   ├── suite.ps1                   # Script principal de la suite
│   └── steps/                      # Steps individuels
│       ├── step-00-login.ps1
│       ├── step-01-launch-app.ps1
│       ├── step-02-navigate-to-jobs.ps1
│       └── ...
│
├── 02_COMPANY_ONBOARDING/          # Suite: Onboarding entreprise
│   ├── suite.ps1
│   └── steps/
│
└── 03_EMPLOYEE_ONBOARDING/         # Suite: Onboarding employé
    ├── suite.ps1
    └── steps/
```

## 🎯 Concept

### Steps Modulaires

Chaque step est un fichier PowerShell indépendant qui :

- ✅ Accomplit une tâche précise et atomique
- ✅ Peut être réutilisé dans plusieurs suites
- ✅ Retourne un résultat standardisé
- ✅ Reçoit un contexte partagé

### Suite de Tests

Une suite est un ensemble de steps exécutés dans un ordre précis :

- 📋 Définit la liste des steps à exécuter
- 🔄 Gère le flux d'exécution
- 📊 Collecte les statistiques
- ⚠️ Gère les erreurs et les reprises

## 🚀 Utilisation

### Exécuter une suite complète

```powershell
cd MANUAL_TESTS/01_JOB_COMPLETE_FLOW
.\suite.ps1
```

### Reprendre depuis un step spécifique

```powershell
.\suite.ps1 -StartFromStep 5
```

### Exécuter une plage de steps

```powershell
.\suite.ps1 -StepRange 1,5
```

### Exécuter des steps spécifiques

```powershell
.\suite.ps1 -Steps 1,3,7
```

### Mode verbeux

```powershell
.\suite.ps1 -Verbose
```

## 📝 Créer un nouveau step

```powershell
# Template d'un step
param(
    [hashtable]$Context
)

# Importer les utilitaires
if (-not (Get-Command Write-Step -ErrorAction SilentlyContinue)) {
    . "$PSScriptRoot\..\..\shared\utils.ps1"
}

Write-Step X "Description du step"

# Votre logique ici...
$ui = Get-Screen
# ...

# Retourner le résultat
if ($success) {
    Write-OK "Reussi"
    return @{ Success = $true }
} else {
    Write-FAIL "Echec"
    return @{ Success = $false; Error = "Raison de l'echec" }
}
```

## 🔧 Fonctions Utilitaires Disponibles

### Affichage

- `Write-Step` - Affiche un titre de step
- `Write-OK` - Message de succès
- `Write-FAIL` - Message d'échec
- `Write-Info` - Information
- `Write-Debug` - Debug (si -Verbose)
- `Write-Skip` - Step ignoré

### ADB & UI

- `Connect-ADB` - Connexion ADB
- `Get-Screen` - Capture du XML UI
- `Find-Element` - Recherche un élément par texte
- `Find-FieldByHint` - Recherche un champ par hint
- `Test-ElementExists` - Vérifie l'existence d'un élément
- `Wait-ForElement` - Attend l'apparition d'un élément

### Actions

- `Invoke-Tap` - Tap sur des coordonnées
- `Invoke-Input` - Saisie de texte
- `Invoke-Swipe` - Swipe/scroll

### Données de Test

- `Get-TestClient` - Génère des données client
- `Get-TestPickupAddress` - Adresse de pickup
- `Get-TestDeliveryAddress` - Adresse de delivery
- `Get-TestSchedule` - Horaires
- `Get-TestDetails` - Détails du job

## 🎨 Avantages de cette Architecture

### 1. Réutilisabilité

Les steps comme `login`, `launch-app`, `navigate-to-jobs` peuvent être réutilisés dans toutes les suites.

```powershell
# Suite A: Job Creation
steps/step-00-login.ps1
steps/step-01-launch-app.ps1
steps/step-02-navigate-to-jobs.ps1
steps/step-03-create-job.ps1

# Suite B: Job Editing
steps/step-00-login.ps1          # ← Réutilisé
steps/step-01-launch-app.ps1     # ← Réutilisé
steps/step-02-navigate-to-jobs.ps1  # ← Réutilisé
steps/step-05-edit-job.ps1       # ← Spécifique
```

### 2. Maintenance Simplifiée

Un bug dans "login" ? Corrigez un seul fichier, toutes les suites en bénéficient.

### 3. Tests Composables

Créez rapidement de nouvelles suites en combinant des steps existants.

### 4. Debugging Facile

```powershell
# Tester uniquement le step problématique
.\suite.ps1 -Steps 9

# Reprendre après correction
.\suite.ps1 -StartFromStep 9
```

### 5. Parallélisation Future

Les steps indépendants peuvent potentiellement être exécutés en parallèle.

## 📊 Format de Retour d'un Step

Chaque step DOIT retourner un hashtable avec :

```powershell
@{
    Success = $true/$false    # Obligatoire
    Skipped = $true/$false    # Optionnel (si step ignoré)
    Error = "message"         # Optionnel (si échec)
    Data = @{ ... }           # Optionnel (données à partager)
}
```

## 🌐 Contexte Partagé

Le contexte est passé à chaque step et peut contenir :

- Données de test (client, adresses, etc.)
- Résultats des steps précédents
- Variables partagées

```powershell
# Dans suite.ps1
$Context = @{
    TestClient = Get-TestClient
    Results = @()
}

# Dans un step
param([hashtable]$Context)
$client = $Context.TestClient
```

## ✅ Bonnes Pratiques

1. **Un step = Une responsabilité**
   - Évitez les steps qui font trop de choses
   - Préférez plusieurs petits steps

2. **Gestion d'erreur robuste**
   - Vérifiez toujours les éléments avant de cliquer
   - Retournez des messages d'erreur clairs

3. **Délais appropriés**
   - Utilisez des délais réalistes après chaque action
   - Utilisez `Wait-ForElement` pour les animations

4. **Nommage cohérent**
   - `step-XX-nom-descriptif.ps1`
   - Numérotation à 2 chiffres (step-01, step-09, step-15)

5. **Documentation**
   - Commentez la logique complexe
   - Expliquez les workarounds

## 🔮 Évolutions Futures

- [ ] Support des steps asynchrones
- [ ] Génération de rapports HTML
- [ ] Intégration CI/CD
- [ ] Enregistrement vidéo des échecs
- [ ] Retry automatique des steps flaky
- [ ] Steps conditionnels (if/else)
- [ ] Boucles (for/while)
- [ ] Parallélisation intelligente

---

**Créé le**: 18 janvier 2026  
**Version**: 1.0.0
