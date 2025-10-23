# Guide d'utilisation des Business Hooks

## Vue d'ensemble

Ce dossier contient tous les hooks React personnalisés pour gérer les aspects business de l'application Swift Removals. Chaque hook encapsule la logique d'état et les appels API pour un domaine spécifique.

## Hooks disponibles

### 1. `useBusinessInfo`
Gère les informations de l'entreprise.

```typescript
import { useBusinessInfo } from './hooks/business';

const MyComponent = () => {
  const {
    businesses,
    currentBusiness,
    isLoading,
    error,
    createNewBusiness,
    updateBusiness,
    refreshData
  } = useBusinessInfo();

  // Utilisation...
};
```

### 2. `useBusinessVehicles`
Gère la flotte de véhicules de l'entreprise.

```typescript
import { useBusinessVehicles } from './hooks/business';

const VehicleScreen = () => {
  const {
    vehicles,
    isLoading,
    createVehicle,
    updateVehicle,
    getActiveVehicles
  } = useBusinessVehicles('company-id');

  // Utilisation...
};
```

### 3. `useJobTemplates`
Gère les templates de jobs/devis.

```typescript
import { useJobTemplates } from './hooks/business';

const TemplatesScreen = () => {
  const {
    templates,
    createTemplate,
    duplicateTemplate,
    searchTemplates
  } = useJobTemplates();

  // Utilisation...
};
```

### 4. `useInvoices`
Gère les factures et la facturation.

```typescript
import { useInvoices } from './hooks/business';

const InvoicesScreen = () => {
  const {
    invoices,
    createNewInvoice,
    sendInvoiceToClient,
    markAsPaid,
    getInvoiceStats
  } = useInvoices();

  // Utilisation...
};
```

### 5. `useBusinessStaff`
Gère le personnel de l'entreprise (stockage local).

```typescript
import { useBusinessStaff } from './hooks/business';

const StaffScreen = () => {
  const {
    staff,
    createStaffMember,
    updateStaffMember,
    getActiveStaff,
    calculateTeamCosts
  } = useBusinessStaff();

  // Utilisation...
};
```

### 6. `useBusinessManager` (Hook composite)
Combine tous les hooks pour une gestion centralisée.

```typescript
import { useBusinessManager } from './hooks/business';

const DashboardScreen = () => {
  const {
    business,
    vehicles,
    templates,
    invoices,
    staff,
    isAnyLoading,
    refreshAll,
    getBusinessOverview
  } = useBusinessManager();

  const overview = getBusinessOverview();
  
  // Utilisation centralisée...
};
```

## Patterns d'utilisation recommandés

### 1. Gestion des erreurs
```typescript
const { error, clearError } = useBusinessInfo();

useEffect(() => {
  if (error) {
    Alert.alert('Erreur', error);
    clearError();
  }
}, [error, clearError]);
```

### 2. États de chargement
```typescript
const { isLoading, isCreating } = useBusinessVehicles();

if (isLoading) {
  return <ActivityIndicator />;
}
```

### 3. Recherche et filtres
```typescript
const { searchTemplates, getTemplatesByType } = useJobTemplates();

// Recherche
const handleSearch = (query: string) => {
  const results = searchTemplates(query);
  setFilteredTemplates(results);
};

// Filtre par type
const residentialTemplates = getTemplatesByType('residential');
```

### 4. Actions CRUD
```typescript
const { createVehicle, updateVehicle, removeVehicle } = useBusinessVehicles();

const handleCreateVehicle = async (data: VehicleCreateData) => {
  const newVehicle = await createVehicle(data);
  if (newVehicle) {
    Alert.alert('Succès', 'Véhicule créé avec succès');
  }
};
```

## Intégration avec les écrans existants

### BusinessInfoPage
```typescript
// Remplacer les données statiques
const BusinessInfoPage = () => {
  const { currentBusiness, updateBusiness, isLoading } = useBusinessInfo();
  
  // Utiliser currentBusiness au lieu des données hardcodées
};
```

### VehicleFleetScreen
```typescript
// Intégrer la gestion des véhicules
const VehicleFleetScreen = () => {
  const { vehicles, createVehicle, getVehicleStats } = useBusinessVehicles();
  
  // Remplacer mockVehicles par vehicles
};
```

### JobsBillingScreen
```typescript
// Intégrer templates et invoices
const JobsBillingScreen = () => {
  const { templates } = useJobTemplates();
  const { invoices, createNewInvoice } = useInvoices();
  
  // Logic intégrée...
};
```

## Architecture des données

### API vs Local Storage
- **API**: Business Info, Vehicles, Templates, Invoices (via endpoints existants)
- **Local Storage**: Staff (pas d'endpoints dédiés, utilise AsyncStorage)

### Synchronisation
- Les hooks API se synchronisent automatiquement avec le serveur
- Le hook Staff utilise AsyncStorage comme source de vérité locale
- Le hook Manager coordonne toutes les données

### États partagés
- `currentBusiness`: Enterprise courante sélectionnée
- `companyId`: ID utilisé pour les appels API véhicules
- États de chargement et erreurs indépendants par domaine

## Prochaines étapes

1. **Intégration progressive**: Remplacer les données mockées dans les écrans existants
2. **Tests**: Ajouter des tests unitaires pour chaque hook
3. **Optimisation**: Implémenter le cache et la persistance
4. **Validation**: Ajouter la validation des formulaires avec les hooks
5. **Synchronisation**: Gérer les conflits et la synchronisation offline