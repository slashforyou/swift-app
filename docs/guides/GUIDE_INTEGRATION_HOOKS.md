# 🔌 GUIDE D'INTÉGRATION - useVehicles Hook
## Plan d'action pour l'intégration complète des hooks API

---

## 📋 CONTEXTE

**Fichiers créés aujourd'hui :**
- ✅ `src/services/vehiclesService.ts` (450 lignes) - Service API avec mock data
- ✅ `src/hooks/useVehicles.ts` (350 lignes) - Hooks React pour gestion véhicules  
- ✅ Jest configuration fixée - Tests fonctionnent maintenant

**État actuel :**
- Les composants (TrucksScreen, AddVehicleModal, EditVehicleModal, VehicleDetailsScreen) utilisent encore des mock data locaux
- Les hooks sont prêts mais pas encore intégrés
- Il y a une différence de types entre les composants existants et l'API

---

## 🎯 OBJECTIF

Intégrer le hook `useVehicles` dans les composants existants pour qu'ils utilisent le service API (qui utilise des mocks pour l'instant, mais sera facile à migrer vers l'API réelle).

---

## 🔍 PROBLÈME DE TYPES IDENTIFIÉ

### Types existants dans les composants :
```typescript
// Dans TrucksScreen, EditVehicleModal
interface Vehicle {
  type: 'moving-truck' | 'van' | 'trailer' | 'ute' | 'dolly' | 'tools'
}
```

### Types dans l'API :
```typescript
// Dans vehiclesService.ts
interface VehicleAPI {
  type: 'truck' | 'van' | 'trailer' | 'ute' | 'dolly' | 'tool'
}
```

**Mapping nécessaire :**
- `'moving-truck'` ↔ `'truck'`
- `'tools'` ↔ `'tool'`

---

## 📝 PLAN D'INTÉGRATION DÉTAILLÉ

### **ÉTAPE 1 : Créer des fonctions de mapping (5 min)**

Ajouter au début de `TrucksScreen.tsx` :

```typescript
// Helper functions to convert between API and UI types
const apiToUIType = (apiType: VehicleAPI['type']): 'moving-truck' | 'van' | 'trailer' | 'ute' | 'dolly' | 'tools' => {
  const mapping = {
    'truck': 'moving-truck' as const,
    'van': 'van' as const,
    'trailer': 'trailer' as const,
    'ute': 'ute' as const,
    'dolly': 'dolly' as const,
    'tool': 'tools' as const,
  }
  return mapping[apiType] || 'moving-truck'
}

const uiToAPIType = (uiType: 'moving-truck' | 'van' | 'trailer' | 'ute' | 'dolly' | 'tools'): VehicleAPI['type'] => {
  const mapping = {
    'moving-truck': 'truck' as const,
    'van': 'van' as const,
    'trailer': 'trailer' as const,
    'ute': 'ute' as const,
    'dolly': 'dolly' as const,
    'tools': 'tool' as const,
  }
  return mapping[uiType] || 'truck'
}

const apiToVehicle = (api: VehicleAPI) => ({
  id: api.id,
  name: `${api.make} ${api.model}`,
  type: apiToUIType(api.type),
  registration: api.registration,
  make: api.make,
  model: api.model,
  year: api.year,
  status: api.status,
  nextService: api.nextService,
  location: api.location,
  capacity: api.capacity || '',
  assignedTo: api.assignedStaff,
})
```

### **ÉTAPE 2 : Remplacer l'état local par le hook (10 min)**

**Dans `TrucksScreen.tsx`, remplacer :**

```typescript
// AVANT
const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles)
const [isLoading, setIsLoading] = useState(false)
```

**PAR :**

```typescript
// APRÈS
import { useVehicles } from '../../hooks/useVehicles'

const {
  vehicles: apiVehicles,
  isLoading: isLoadingVehicles,
  error: vehiclesError,
  totalVehicles,
  availableCount,
  inUseCount,
  maintenanceCount,
  refetch,
  addVehicle: addVehicleApi,
  editVehicle: editVehicleApi,
  removeVehicle: removeVehicleApi,
} = useVehicles()

// Convert API vehicles to UI format
const vehicles = apiVehicles.map(apiToVehicle)
```

### **ÉTAPE 3 : Mettre à jour les handlers (15 min)**

#### **A. handleAddVehicle**

```typescript
const handleAddVehicle = async (vehicleData: VehicleCreateData) => {
  const apiType = uiToAPIType(vehicleData.type)
  const result = await addVehicleApi({
    ...vehicleData,
    type: apiType,
  })
  
  if (result) {
    setIsModalVisible(false)
    Alert.alert('Succès', 'Le véhicule a été ajouté avec succès')
  } else {
    Alert.alert('Erreur', vehiclesError || 'Impossible d\'ajouter le véhicule')
  }
}
```

#### **B. handleUpdateVehicle**

```typescript
const handleUpdateVehicle = async (data: VehicleEditData) => {
  const apiType = uiToAPIType(data.type)
  const result = await editVehicleApi(data.id, {
    make: data.make,
    model: data.model,
    year: data.year,
    registration: data.registration,
    capacity: data.capacity,
    nextService: data.nextService,
    location: data.location,
  })
  
  if (result) {
    setIsEditModalVisible(false)
    setSelectedVehicle(null)
    Alert.alert('Succès', 'Le véhicule a été modifié')
  } else {
    Alert.alert('Erreur', vehiclesError || 'Impossible de modifier le véhicule')
  }
}
```

#### **C. handleDeleteVehicle**

```typescript
const handleDeleteVehicle = (vehicle: Vehicle) => {
  Alert.alert(
    'Supprimer le véhicule',
    `Êtes-vous sûr de vouloir supprimer ${vehicle.name} ?`,
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const success = await removeVehicleApi(vehicle.id)
          if (success) {
            Alert.alert('Succès', 'Le véhicule a été supprimé')
          } else {
            Alert.alert('Erreur', vehiclesError || 'Impossible de supprimer')
          }
        },
      },
    ]
  )
}
```

#### **D. handleRefresh**

```typescript
const handleRefresh = async () => {
  setIsRefreshing(true)
  await refetch()
  setIsRefreshing(false)
}
```

### **ÉTAPE 4 : Mettre à jour les statistiques (5 min)**

**Remplacer :**

```typescript
// AVANT
const stats = {
  total: vehicles.length,
  available: vehicles.filter(v => v.status === 'available').length,
  inUse: vehicles.filter(v => v.status === 'in-use').length,
  maintenance: vehicles.filter(v => v.status === 'maintenance').length,
}
```

**PAR :**

```typescript
// APRÈS - Utiliser directement les valeurs du hook
const stats = {
  total: totalVehicles,
  available: availableCount,
  inUse: inUseCount,
  maintenance: maintenanceCount,
}
```

### **ÉTAPE 5 : Mettre à jour le loading state (2 min)**

**Remplacer :**

```typescript
// AVANT
if (isLoading) {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  )
}
```

**PAR :**

```typescript
// APRÈS
if (isLoadingVehicles) {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ color: colors.text, marginTop: 10 }}>
        Chargement des véhicules...
      </Text>
    </View>
  )
}
```

---

## 🔧 INTÉGRATION DANS VehicleDetailsScreen

### **ÉTAPE 1 : Utiliser useVehicleDetails (10 min)**

**Ajouter au début du composant :**

```typescript
import { useVehicleDetails } from '../../hooks/useVehicles'

export default function VehicleDetailsScreen({ route }) {
  const { vehicleId } = route.params
  
  const {
    vehicle: apiVehicle,
    maintenanceHistory,
    isLoading,
    error,
    updateVehicle: updateVehicleApi,
    addMaintenanceRecord,
  } = useVehicleDetails(vehicleId)
  
  // Convert API vehicle to UI format
  const vehicle = apiVehicle ? apiToVehicle(apiVehicle) : null
  
  // ... rest of component
}
```

### **ÉTAPE 2 : Remplacer mock maintenance data (5 min)**

**Supprimer :**

```typescript
// SUPPRIMER
const mockMaintenanceRecords = [...]
```

**Utiliser directement :**

```typescript
// maintenanceHistory est déjà disponible du hook
{maintenanceHistory.map((record) => (
  <View key={record.id} style={styles.maintenanceCard}>
    <Text>{record.description}</Text>
    <Text>${record.cost}</Text>
  </View>
))}
```

---

## 📊 TESTS À METTRE À JOUR

### **Après l'intégration, mettre à jour :**

1. **TrucksScreen.test.tsx**
   - Mocker `useVehicles` hook
   - Tester les appels API
   - Vérifier les états de chargement

2. **VehicleDetailsScreen.test.tsx** (nouveau)
   - Mocker `useVehicleDetails` hook
   - Tester l'affichage des détails
   - Tester les actions (edit, delete, etc.)

3. **Exemple de mock :**

```typescript
jest.mock('../../hooks/useVehicles', () => ({
  useVehicles: () => ({
    vehicles: mockApiVehicles,
    isLoading: false,
    error: null,
    totalVehicles: 4,
    availableCount: 2,
    inUseCount: 1,
    maintenanceCount: 1,
    refetch: jest.fn(),
    addVehicle: jest.fn(),
    editVehicle: jest.fn(),
    removeVehicle: jest.fn(),
  }),
}))
```

---

## ✅ CHECKLIST D'INTÉGRATION

### **TrucksScreen.tsx :**
- [ ] Ajouter imports (useVehicles, VehicleAPI)
- [ ] Créer fonctions de mapping (apiToUIType, uiToAPIType, apiToVehicle)
- [ ] Remplacer useState par useVehicles hook
- [ ] Convertir apiVehicles vers UI vehicles
- [ ] Mettre à jour handleAddVehicle
- [ ] Mettre à jour handleUpdateVehicle
- [ ] Mettre à jour handleDeleteVehicle
- [ ] Mettre à jour handleRefresh
- [ ] Utiliser statistiques du hook
- [ ] Utiliser isLoadingVehicles
- [ ] Supprimer les mock data locaux

### **VehicleDetailsScreen.tsx :**
- [ ] Ajouter import useVehicleDetails
- [ ] Utiliser le hook avec vehicleId
- [ ] Convertir apiVehicle vers UI vehicle
- [ ] Utiliser maintenanceHistory du hook
- [ ] Mettre à jour handleEdit pour utiliser updateVehicleApi
- [ ] Supprimer les mock data locaux

### **AddVehicleModal.tsx :**
- [ ] Pas de changements nécessaires (déjà compatible)
- [ ] onAddVehicle callback reste identique

### **EditVehicleModal.tsx :**
- [ ] Pas de changements nécessaires (déjà compatible)
- [ ] onUpdateVehicle callback reste identique

---

## 🚀 MIGRATION FUTURE VERS API RÉELLE

**Une fois les endpoints backend créés, il suffira de :**

1. **Dans `vehiclesService.ts` :**
   - Décommenter les appels `fetchWithAuth`
   - Supprimer les mock data
   - Supprimer les `setTimeout` simulant le délai réseau

2. **Aucun changement nécessaire dans :**
   - TrucksScreen.tsx
   - VehicleDetailsScreen.tsx
   - AddVehicleModal.tsx
   - EditVehicleModal.tsx
   - useVehicles.ts hook

**Tout fonctionnera automatiquement ! 🎉**

---

## 📝 NOTES IMPORTANTES

1. **Types consistency :**
   - Les fonctions de mapping gèrent la conversion entre types UI et API
   - Pattern réutilisable pour d'autres entités (staff, jobs, etc.)

2. **Error handling :**
   - Toutes les actions affichent des Alerts en cas d'erreur
   - Le message d'erreur vient du hook via `vehiclesError`

3. **Loading states :**
   - `isLoadingVehicles` pour l'état global
   - `isRefreshing` pour le pull-to-refresh

4. **Optimistic updates :**
   - Le hook gère automatiquement la mise à jour de l'état local
   - Les composants restent réactifs pendant les appels API

---

## 🎯 PROCHAINES ÉTAPES (Après intégration)

1. **Tests mis à jour** (3h)
   - Mocker les hooks
   - Atteindre 80%+ de couverture

2. **Maintenance CRUD** (6h)
   - AddMaintenanceModal
   - EditMaintenanceModal
   - Intégration dans VehicleDetailsScreen

3. **Recherche StaffCrewScreen** (3h)
   - Réutiliser pattern TrucksScreen
   - Multi-field search

---

**Temps estimé total pour l'intégration : 1-2 heures** ⏱️

**Difficulté : Moyenne** (principalement du refactoring)

**Priorité : HAUTE** (bloque la migration API réelle)
