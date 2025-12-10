# 📋 Inventaire exhaustif du texte hardcodé - SwiftApp

## 🚨 Priorité CRITIQUE découverte
- **0% d'utilisation** du système i18n pourtant parfaitement implémenté
- **7 langues disponibles** : EN, FR, PT, ES, IT, ZH, HI
- **Texte hardcodé partout** en français et anglais

## 🎯 Écrans CRITIQUES (parcours utilisateur principal)

### 1. ⚠️ paymentWindow.tsx - FRANÇAIS HARDCODÉ
**Localisation** : `src/screens/JobDetailsScreens/paymentWindow.tsx`

**Textes à traduire** :
```typescript
// Ligne 157: Alert.alert("Informations manquantes", "Veuillez remplir tous les champs de la carte.");
// Ligne 169: throw new Error('ID du job non trouvé');
// Ligne 217: "Erreur de paiement"
// Ligne 279: "Erreur"
// Ligne 840: 'Enregistrement...' : 'Confirmer le paiement'
// Commentaires: "Retourner le coût temps réel s'il est supérieur à 0"
```

**Clés i18n proposées** :
```typescript
payment.missingInfo.title = "Informations manquantes"
payment.missingInfo.message = "Veuillez remplir tous les champs de la carte."
payment.errors.jobIdNotFound = "ID du job non trouvé"
payment.errors.paymentError = "Erreur de paiement"
payment.errors.generic = "Erreur"
payment.buttons.processing = "Enregistrement..."
payment.buttons.confirm = "Confirmer le paiement"
```

### 2. ⚠️ staffCrewScreen.tsx - FRANÇAIS PARTIEL
**Localisation** : `src/screens/business/staffCrewScreen.tsx`

**Textes identifiés** :
```typescript
// Ligne 65: { text: 'Annuler', style: 'cancel' }
```

**Clés i18n proposées** :
```typescript
common.actions.cancel = "Annuler"
```

### 3. ⚠️ VehicleFleetScreen.tsx (trucksScreen.tsx) - FRANÇAIS MASSIF
**Localisation** : `src/screens/business/trucksScreen.tsx`

**Textes identifiés** :
```typescript
// Ligne 557: 'Modifier le véhicule'
// Ligne 568: 'Supprimer le véhicule'
// Ligne 571: { text: 'Annuler', style: 'cancel' }
// Ligne 573: text: 'Supprimer'
// Ligne 578: Alert.alert('Succès', 'Véhicule supprimé')
// Ligne 580: Alert.alert('Erreur', 'Impossible de supprimer le véhicule')
```

**Clés i18n proposées** :
```typescript
vehicles.actions.edit = "Modifier le véhicule"
vehicles.actions.delete = "Supprimer le véhicule" 
vehicles.alerts.deleteSuccess.title = "Succès"
vehicles.alerts.deleteSuccess.message = "Véhicule supprimé"
vehicles.alerts.deleteError.title = "Erreur"
vehicles.alerts.deleteError.message = "Impossible de supprimer le véhicule"
```

## 📱 Autres écrans avec texte hardcodé

### 4. summary.tsx
```typescript
// Ligne 155: 'Erreur de synchronisation'
// Ligne 229: 'Erreur', 'Impossible de sauvegarder la signature'
// Ligne 233: 'Erreur', 'Une erreur est survenue lors de la sauvegarde'
```

### 5. parameters_Modernized.tsx
```typescript
// Ligne 304: { text: 'Annuler', style: 'cancel' }
// Ligne 335: Alert.alert('Succès', 'Les paramètres ont été réinitialisés');
```

### 6. Écrans de connexion (login.tsx, subscribe.tsx)
```typescript
// Multiple erreurs de connexion, création compte, etc.
// subscribe.tsx ligne 358: 'Création du compte...' : 'Créer mon compte'
// login.tsx ligne 93+: Multiple 'Erreur de connexion', 'Erreur technique', etc.
```

## 📊 Statistiques du scan

### Volume identifié (scan partiel) :
- **50+ occurrences** de texte français hardcodé
- **30+ occurrences** de texte anglais hardcodé
- **3 écrans critiques** dans le parcours principal
- **10+ écrans secondaires** affectés

### Domaines métier identifiés :
1. **Payment** (paiements)
2. **Vehicles** (véhicules/flotte)
3. **Staff** (équipe)
4. **Jobs** (travaux)
5. **Authentication** (connexion)
6. **Common** (actions communes)
7. **Errors** (gestion erreurs)

## 🎯 Plan d'action immédiat

### Phase 1A : Écrans critiques (1-2 jours)
1. ✅ **paymentWindow.tsx** - Remplacer tout le français
2. ✅ **trucksScreen.tsx** - Remplacer tout le français  
3. ✅ **staffCrewScreen.tsx** - Remplacer les actions

### Phase 1B : Écrans secondaires (2-3 jours)
4. summary.tsx, parameters_Modernized.tsx
5. Écrans de connexion
6. Écrans business

### Phase 1C : Validation (1 jour)
7. Tests switching langue temps réel
8. Validation des 7 langues
9. Détection automatique texte hardcodé restant

## 📝 Notes techniques

### Infrastructure existante à valider :
- ✅ `useLocalization` hook
- ✅ `useTranslation` hook  
- ✅ 7 fichiers de langue
- ❓ Switching langue en temps réel
- ❓ Fallback EN si clé manquante

### Stratégie de migration :
1. **Conserver** la logique métier
2. **Remplacer** uniquement les chaînes hardcodées
3. **Tester** chaque remplacement
4. **Valider** comportement multilingue

---

*Inventaire généré le : Décembre 2025*
*Status : SCAN PARTIEL - Extension requise pour couverture 100%*