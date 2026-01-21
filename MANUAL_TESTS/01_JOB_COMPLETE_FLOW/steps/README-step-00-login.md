# MANUEL D'UTILISATION - Step Login

## Description

Le step-00-login.ps1 est un step réutilisable qui se connecte à l'application Swift.

## Fonctionnalités

✅ **Détection intelligente** - Skip automatique si déjà connecté
✅ **Multi-écrans** - Détecte plusieurs écrans de l'app (Home, Jobs, Calendar, etc.)
✅ **Réutilisable** - Peut être utilisé dans toutes les suites de tests
✅ **Credentials** - Utilise les credentials dans `shared/config.ps1`

## Credentials utilisés

- **Email**: romaingiovanni@gmail.com
- **Password**: IllBeThere4_U

## Utilisation

### Depuis une suite

```powershell
$result = & .\steps\step-00-login.ps1 -Context $Context
if ($result.Success) {
    if ($result.Skipped) {
        # Deja connecte
    } else {
        # Connexion reussie
    }
} else {
    # Echec
    Write-Host "Erreur: $($result.Error)"
}
```

### Test standalone

```powershell
cd MANUAL_TESTS/01_JOB_COMPLETE_FLOW
.\steps\step-00-login.ps1 -Context @{}
```

## Pré-requis

⚠️ L'application Swift **DOIT être déjà lancée**

- Utilisez step-01-launch-app.ps1 avant

## Comportement

### Si déjà connecté

- Détecte un des écrans suivants:
  - Home (Today)
  - Jobs
  - Calendar
  - Create New Job
  - Pickup Address (job creation en cours)
- Retourne: `@{ Success = $true; Skipped = $true }`

### Si non connecté

1. Recherche le champ "Email"
2. Tap sur le champ
3. Saisit l'email
4. Recherche le champ "Password"
5. Tap sur le champ
6. Saisit le password
7. Recherche le bouton "Log In" ou "Sign In"
8. Clique sur le bouton
9. Attend 3 secondes
10. Vérifie que "Today" est visible
11. Retourne: `@{ Success = $true }` ou `@{ Success = $false; Error = "..." }`

## Erreurs possibles

| Erreur                          | Cause                            | Solution                              |
| ------------------------------- | -------------------------------- | ------------------------------------- |
| "Screen capture failed"         | Get-Screen retourne null         | Vérifier ADB, relancer l'app          |
| "Email field not found"         | Pas sur l'écran de login         | Lancer l'app d'abord (step-01)        |
| "Password field not found"      | Champ introuvable après email    | Vérifier l'UI                         |
| "Login button not found"        | Bouton introuvable               | Vérifier l'UI                         |
| "Login failed - Home not found" | Credentials invalides ou timeout | Vérifier credentials, augmenter delay |

## Dépendances

- `shared/utils.ps1` - Fonctions utilitaires
- `shared/config.ps1` - Configuration (credentials)
- ADB - doit être connecté
- App Swift - doit être lancée

## Exemple de flux complet

```powershell
# 1. Lancer l'app
& .\steps\step-01-launch-app.ps1 -Context $Context

# 2. Se connecter (skip si déjà connecté)
& .\steps\step-00-login.ps1 -Context $Context

# 3. Continuer avec les autres steps...
```

## Modifications possibles

Pour utiliser d'autres credentials:

1. Modifier `shared/config.ps1`
2. OU passer les credentials via le Context:

```powershell
$Context.Auth = @{
    Email = "autre@email.com"
    Password = "AutreMotDePasse"
}
```

Puis modifier le step pour utiliser `$Context.Auth` au lieu de `$global:TEST_AUTH`.
