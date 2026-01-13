# StripeHub - Hub de Gestion des Paiements Stripe

## 🎯 **Vue d'ensemble**

StripeHub remplace l'ancienne page JobsBilling pour offrir une interface moderne et dédiée à la gestion des paiements Stripe dans l'application Swift Moving.

## 📍 **Localisation**
- **Fichier**: `src/screens/business/StripeHub.tsx`
- **Navigation**: Onglet "Stripe" dans la section Business
- **Route**: `JobsBilling` (conservée pour compatibilité)

## 🎨 **Design System**

### Composants utilisés
- **SafeAreaView** : Zone sûre pour l'affichage
- **ScrollView** : Défilement avec RefreshControl
- **TouchableOpacity** : Boutons interactifs
- **Ionicons** : Icônes vectorielles

### Styles
- **DESIGN_TOKENS** : Système de spacing, typography, radius
- **useTheme** : Couleurs dynamiques selon le thème
- **StyleSheet** : Styles React Native optimisés

## 🏗️ **Architecture**

### Structure des données
```typescript
interface StripeStats {
  totalRevenue: number
  monthlyRevenue: number
  pendingPayouts: number
  successfulPayments: number
  currency: string
}

interface StripeAccount {
  id: string
  displayName: string
  country: string
  isActive: boolean
  defaultCurrency: string
  payoutsEnabled: boolean
  detailsSubmitted: boolean
}
```

### Sections principales
1. **Header avec statut** : Indicateur d'état du compte Stripe
2. **Informations du compte** : Détails et actions rapides
3. **Statistiques** : Revenus et métriques
4. **Actions rapides** : Boutons d'actions principales

## 🔧 **Fonctionnalités**

### Implémentées
- ✅ Interface responsive avec DESIGN_TOKENS
- ✅ RefreshControl pour actualisation
- ✅ Formatage des devises (AUD)
- ✅ Navigation vers les écrans de paiement
- ✅ Actions modales (Alerts)

### À implémenter
- 🔄 Intégration API Stripe réelle
- 🔄 Navigation vers StripePaymentScreen
- 🔄 Navigation vers PaymentSuccessScreen  
- 🔄 Gestion des webhooks Stripe
- 🔄 Historique des transactions

## 🔗 **Intégration Navigation**

```typescript
// src/navigation/business.tsx
import { StripeHub } from '../screens/business'

{businessPanel === 'JobsBilling' && <StripeHub />}
```

```typescript
// src/components/business/BusinessTabMenu.tsx
{ 
  id: 'JobsBilling', 
  label: 'Stripe',
  icon: 'card',
  routeName: 'JobsBilling',
  accessibilityLabel: 'Stripe Payments Hub Tab'
}
```

## 🎯 **Actions Disponibles**

### Actions principales
- **handleStripeConnect()** : Configuration du compte Stripe
- **handleViewPayments()** : Liste des paiements
- **handleViewPayouts()** : Gestion des payouts
- **handleCreatePaymentLink()** : Création de liens de paiement

### Actions rapides (Quick Actions)
- **Settings** : Paramètres du compte Stripe
- **Payouts** : Gestion des virements
- **Payment Link** : Création rapide de liens

## 🧪 **Testing**

### Test manuel
1. Naviguer vers la section Business
2. Cliquer sur l'onglet "Stripe" 
3. Vérifier l'affichage des statistiques mock
4. Tester le RefreshControl
5. Tester les boutons d'action (Alerts)

### Tests automatisés
```bash
# Lancer les tests du composant
npm test -- StripeHub.test.tsx
```

## 📚 **Dépendances**

### Externes
- `@react-native-vector-icons/ionicons` : Icônes
- `react-native-safe-area-context` : SafeAreaView

### Internes
- `useTheme` : Gestion du thème
- `DESIGN_TOKENS` : Tokens de design
- `colors` : Palette de couleurs

## 🚀 **Prochaines étapes**

1. **Intégration Stripe API**
   - Configuration des clés API
   - Endpoints pour statistiques
   - Webhooks pour événements

2. **Navigation avancée**
   - Lien vers PaymentsList
   - Lien vers PayoutsList
   - Modal pour Payment Link creation

3. **Fonctionnalités avancées**
   - Graphiques de revenus
   - Filtres par période
   - Export des données

## 💡 **Notes techniques**

- **Sauvegarde** : L'ancien JobsBillingScreen est sauvé en `jobsBillingScreen_backup.tsx`
- **Route conservée** : L'ID de route `JobsBilling` est conservé pour éviter les breaking changes
- **Design cohérent** : Utilise le même système de design que les autres écrans modernisés
- **Extensible** : Architecture préparée pour l'ajout de fonctionnalités Stripe avancées

## 🔧 **Configuration requise**

Pour l'intégration Stripe complète :
1. Compte Stripe configuré
2. Clés API Stripe (test et production)
3. Webhooks configurés pour les événements
4. SSL/HTTPS pour la production