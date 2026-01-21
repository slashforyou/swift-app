# 🚚 Suite de Test: Job Complete Flow

Cette suite teste le flux complet de création d'un job depuis la connexion jusqu'à la confirmation finale.

## 📋 Steps (0-24)

### Phase 1: Authentification et Navigation (0-4)

- **Step 0**: Connexion à l'application (conditionnelle)
- **Step 1**: Lancement de l'app via Expo
- **Step 2**: Navigation vers l'écran Jobs
- **Step 3**: Ouverture du modal de création
- **Step 4**: Ouverture du formulaire Add Client

### Phase 2: Création du Client (5-9)

- **Step 5**: Remplir First Name
- **Step 6**: Remplir Last Name
- **Step 7**: Remplir Email (unique à chaque exécution)
- **Step 8**: Remplir Phone
- **Step 9**: Cliquer sur Create Client

### Phase 3: Adresses (10-19)

- **Step 10**: Remplir Pickup Street
- **Step 11**: Remplir Pickup City
- **Step 12**: Remplir Pickup State
- **Step 13**: Remplir Pickup Zip
- **Step 14**: Scroll vers Delivery Address
- **Step 15**: Remplir Delivery Street
- **Step 16**: Remplir Delivery City
- **Step 17**: Remplir Delivery State
- **Step 18**: Remplir Delivery Zip
- **Step 19**: Cliquer sur Next (Addresses → Schedule)

### Phase 4: Horaires (20-21)

- **Step 20**: Vérifier les valeurs par défaut du Schedule
- **Step 21**: Cliquer sur Next (Schedule → Details)

### Phase 5: Détails (22-24)

- **Step 22**: Sélectionner la priorité (Medium)
- **Step 23**: Remplir les notes
- **Step 24**: Cliquer sur Next (Details → Confirmation)

## 🚀 Utilisation

### Exécution complète

```powershell
.\suite.ps1
```

### Reprendre après un échec

```powershell
# Si le test échoue au step 9
.\suite.ps1 -StartFromStep 9
```

### Tester une phase spécifique

```powershell
# Phase 2: Client (steps 5-9)
.\suite.ps1 -StepRange 5,9

# Phase 3: Adresses (steps 10-19)
.\suite.ps1 -StepRange 10,19
```

### Tester des steps isolés

```powershell
# Tester uniquement la création du client
.\suite.ps1 -Steps 9

# Tester plusieurs steps
.\suite.ps1 -Steps 5,6,7,8,9
```

### Mode verbeux

```powershell
.\suite.ps1 -Verbose
```

## 📊 Données de Test

Les données sont générées automatiquement à chaque exécution :

**Client:**

- Prénom: Jean
- Nom: Dupont
- Email: jean.dupont.`[timestamp]`@test.com
- Téléphone: 0612345678

**Pickup Address:**

- Street: 123 Main Street
- City: Sydney
- State: NSW
- Zip: 2000

**Delivery Address:**

- Street: 456 Oak Avenue
- City: Melbourne
- State: VIC
- Zip: 3000

**Schedule:**

- Start: 09:00
- End: 17:00
- Duration: 4h

**Details:**

- Priority: Medium
- Notes: Test job - automated test

## ✅ Résultat Attendu

À la fin de la suite (step 24), le job devrait être visible dans l'écran de confirmation avec toutes les informations saisies.

## 🔧 Dépannage

### Le test échoue au step 0 (Login)

- Vérifier que l'app est lancée
- Vérifier les credentials dans `shared/config.ps1`

### Le test échoue au step 9 (Create Client)

- Le bouton peut être représenté par une icône
- Vérifier que tous les champs sont remplis

### Le test échoue au step 19 (Next Addresses)

- Vérifier que les 4 champs de chaque adresse sont remplis
- Le bouton Next est désactivé si les champs sont incomplets

### Le test échoue au step 24 (Next Details)

- Vérifier que la priorité est sélectionnée
- Le scroll peut être nécessaire pour voir le bouton

## 🎯 Prochaines Étapes

Pour compléter le flow, il faudra ajouter:

- **Step 25**: Vérifier les données dans la confirmation
- **Step 26**: Cliquer sur Create Job
- **Step 27**: Vérifier la création du job
- **Step 28**: Naviguer vers le job créé

## 📝 Notes

- Chaque step est indépendant et réutilisable
- Les steps utilisent les fonctions partagées de `shared/utils.ps1`
- Les données de test sont dans `shared/config.ps1`
- Le contexte est partagé entre tous les steps
