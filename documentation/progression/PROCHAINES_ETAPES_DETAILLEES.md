# 🎯 PROCHAINES ÉTAPES DÉTAILLÉES - SWIFT APP

## 📅 Date : 22 octobre 2025
## 📊 État actuel : 47% (8.65/18 sections)

---

## 🚀 PLAN D'ACTION IMMÉDIAT

### SEMAINE 1 : Compléter la section Business Modals

#### 🎯 JOUR 1-2 : Modal Add Vehicle (8h)
**Objectif** : Permettre l'ajout de véhicules dans TrucksScreen

**Fichier à créer** : `/src/components/modals/AddVehicleModal.tsx`

**Fonctionnalités requises** :
```typescript
interface AddVehicleModalProps {
  visible: boolean
  onClose: () => void
  onAddVehicle: (vehicleData: VehicleCreateData) => Promise<void>
}

interface VehicleCreateData {
  type: 'moving-truck' | 'van' | 'trailer' | 'ute' | 'dolly' | 'tools'
  make: string
  model: string
  year: number
  registration: string
  capacity: string
  location: string
  nextService: string
  status: 'available' | 'in-use' | 'maintenance' | 'out-of-service'
}
```

**Structure du modal** :
1. **Étape 1** : Sélection type de véhicule (horizontal scroll)
   - 🚛 Moving Truck
   - 🚐 Van
   - 🚜 Trailer
   - 🛻 Ute
   - 🛒 Dolly
   - 🔧 Tools

2. **Étape 2** : Informations véhicule
   - Marque (dropdown: Isuzu, Ford, Toyota, Mitsubishi, etc.)
   - Modèle (text input)
   - Année (number input)
   - Registration (format: ABC-123)
   - Capacité (ex: "3.5 tonnes" ou "8 cubic meters")
   - Location (dropdown: Sydney Depot, Melbourne Branch, etc.)
   - Next Service (date picker)

3. **Étape 3** : Confirmation et validation
   - Preview des informations
   - Bouton "Ajouter le véhicule"

**Validation nécessaire** :
- ✅ Registration format australien (ABC-123 ou AB-12-CD)
- ✅ Année entre 1990 et année actuelle
- ✅ Next Service date dans le futur
- ✅ Tous les champs requis remplis

**Design** :
- Pattern identique à AddStaffModal
- Codes couleur par type de véhicule
- Icons pour chaque type
- Animation de transition entre étapes

**Estimation** : 8h (6h dev + 2h tests)

---

#### 🎯 JOUR 3 : Tests AddVehicleModal (4h)

**Fichier à créer** : `/src/components/modals/__tests__/AddVehicleModal.test.tsx`

**Tests à implémenter** :
```typescript
describe('AddVehicleModal', () => {
  it('should render vehicle type selection', () => {})
  it('should navigate to form after type selection', () => {})
  it('should validate registration format', () => {})
  it('should validate year range', () => {})
  it('should validate required fields', () => {})
  it('should call onAddVehicle with correct data', () => {})
  it('should show loading state during submission', () => {})
  it('should display error messages', () => {})
  it('should reset form on close', () => {})
})
```

**Estimation** : 4h

---

#### 🎯 JOUR 4 : Intégration TrucksScreen (4h)

**Modifications dans** : `/src/screens/business/trucksScreen.tsx`

**Changements requis** :
1. Ajouter bouton "Ajouter un véhicule"
2. Gérer l'état du modal
3. Implémenter `handleAddVehicle`
4. Rafraîchir la liste après ajout
5. Afficher toast de confirmation

**Code à ajouter** :
```typescript
const [isAddModalVisible, setIsAddModalVisible] = useState(false)

const handleAddVehicle = async (vehicleData: VehicleCreateData) => {
  try {
    await vehicleService.createVehicle(vehicleData)
    showToast('Véhicule ajouté avec succès', 'success')
    refreshVehicles()
    setIsAddModalVisible(false)
  } catch (error) {
    showToast('Erreur lors de l\'ajout du véhicule', 'error')
  }
}
```

**Estimation** : 4h

---

### SEMAINE 2 : API Integration Business

#### 🎯 JOUR 5-6 : Service API Business (12h)

**Fichier à créer** : `/src/services/business/businessService.ts`

**Endpoints à intégrer** :
```typescript
// Staff Management
GET    /business/staff              - Liste des employés
POST   /business/staff              - Créer employé
PUT    /business/staff/:id          - Modifier employé
DELETE /business/staff/:id          - Supprimer employé

// Vehicles Management
GET    /business/vehicles           - Liste des véhicules
POST   /business/vehicles           - Créer véhicule
PUT    /business/vehicles/:id       - Modifier véhicule
DELETE /business/vehicles/:id       - Supprimer véhicule

// Job Templates
GET    /business/job-templates      - Liste templates
POST   /business/job-templates      - Créer template
PUT    /business/job-templates/:id  - Modifier template
DELETE /business/job-templates/:id  - Supprimer template

// Invoices
GET    /business/invoices           - Liste factures
POST   /business/invoices           - Créer facture
PUT    /business/invoices/:id       - Modifier facture
DELETE /business/invoices/:id       - Supprimer facture
```

**Structure du service** :
```typescript
export const businessService = {
  // Staff
  staff: {
    getAll: () => apiClient.get('/business/staff'),
    getById: (id: string) => apiClient.get(`/business/staff/${id}`),
    create: (data: StaffCreateData) => apiClient.post('/business/staff', data),
    update: (id: string, data: Partial<StaffCreateData>) => apiClient.put(`/business/staff/${id}`, data),
    delete: (id: string) => apiClient.delete(`/business/staff/${id}`),
  },
  
  // Vehicles
  vehicles: {
    getAll: () => apiClient.get('/business/vehicles'),
    getById: (id: string) => apiClient.get(`/business/vehicles/${id}`),
    create: (data: VehicleCreateData) => apiClient.post('/business/vehicles', data),
    update: (id: string, data: Partial<VehicleCreateData>) => apiClient.put(`/business/vehicles/${id}`, data),
    delete: (id: string) => apiClient.delete(`/business/vehicles/${id}`),
  },
  
  // Templates & Invoices...
}
```

**Estimation** : 12h (8h dev + 4h tests)

---

#### 🎯 JOUR 7-8 : Hooks Business avec API (8h)

**Fichiers à modifier** :
- `/src/hooks/useStaff.ts`
- `/src/hooks/useVehicles.ts` (à créer)
- `/src/hooks/useJobTemplates.ts` (à créer)
- `/src/hooks/useInvoices.ts` (à créer)

**Pattern hook business** :
```typescript
export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVehicles = async () => {
    setIsLoading(true)
    try {
      const response = await businessService.vehicles.getAll()
      setVehicles(response.data)
      setError(null)
    } catch (err) {
      setError('Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const addVehicle = async (data: VehicleCreateData) => {
    await businessService.vehicles.create(data)
    await fetchVehicles()
  }

  const updateVehicle = async (id: string, data: Partial<VehicleCreateData>) => {
    await businessService.vehicles.update(id, data)
    await fetchVehicles()
  }

  const deleteVehicle = async (id: string) => {
    await businessService.vehicles.delete(id)
    await fetchVehicles()
  }

  return {
    vehicles,
    isLoading,
    error,
    fetchVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
  }
}
```

**Estimation** : 8h

---

### SEMAINE 3 : Navigation et Détails

#### 🎯 JOUR 9-10 : Écrans de détails (12h)

**Fichiers à créer** :
1. `/src/screens/business/StaffDetailScreen.tsx`
2. `/src/screens/business/VehicleDetailScreen.tsx`
3. `/src/screens/business/TemplateDetailScreen.tsx`
4. `/src/screens/business/InvoiceDetailScreen.tsx`

**Structure écran détail** :
```typescript
interface DetailScreenProps {
  route: {
    params: {
      id: string
    }
  }
  navigation: any
}

export default function StaffDetailScreen({ route, navigation }: DetailScreenProps) {
  const { id } = route.params
  const { getStaffById, updateStaff, deleteStaff } = useStaff()
  
  // Affichage détaillé
  // Actions : Edit, Delete, Archive
  // Historique d'activité
  // Statistiques personnelles
}
```

**Estimation** : 12h (3h par écran)

---

#### 🎯 JOUR 11 : Navigation vers détails (4h)

**Modifications requises** :
1. Ajouter navigation Stack pour Business
2. Configurer routes pour détails
3. Ajouter boutons "Voir détails" sur chaque carte
4. Gérer transitions animées

**Navigation config** :
```typescript
const BusinessStack = createStackNavigator()

export default function BusinessNavigation() {
  return (
    <BusinessStack.Navigator>
      <BusinessStack.Screen name="BusinessMain" component={Business} />
      <BusinessStack.Screen name="StaffDetail" component={StaffDetailScreen} />
      <BusinessStack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
      <BusinessStack.Screen name="TemplateDetail" component={TemplateDetailScreen} />
      <BusinessStack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
    </BusinessStack.Navigator>
  )
}
```

**Estimation** : 4h

---

### SEMAINE 4 : Actions CRUD et Filtres

#### 🎯 JOUR 12-13 : Modales d'édition (10h)

**Fichiers à créer** :
1. `/src/components/modals/EditStaffModal.tsx`
2. `/src/components/modals/EditVehicleModal.tsx`
3. `/src/components/modals/EditTemplateModal.tsx`
4. `/src/components/modals/EditInvoiceModal.tsx`

**Pattern modal édition** :
- Réutiliser composants des modals d'ajout
- Pré-remplir les champs avec données existantes
- Bouton "Enregistrer" au lieu de "Créer"
- Confirmation avant fermeture si modifications

**Estimation** : 10h

---

#### 🎯 JOUR 14 : Système de recherche (6h)

**Fonctionnalités requises** :
1. Barre de recherche dans chaque page business
2. Recherche en temps réel (debounced)
3. Filtrage par multiple critères
4. Highlight des résultats

**Composant à créer** :
```typescript
interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder: string
  filters?: Filter[]
}

export default function SearchBar({ onSearch, placeholder, filters }: SearchBarProps) {
  const [query, setQuery] = useState('')
  
  const debouncedSearch = useDebounce(query, 300)
  
  useEffect(() => {
    onSearch(debouncedSearch)
  }, [debouncedSearch])
  
  // UI avec input + filtres
}
```

**Estimation** : 6h

---

#### 🎯 JOUR 15 : Filtres avancés (6h)

**Filtres à implémenter** :
- **Staff** : Type (employee/contractor), Status, Team, Role
- **Vehicles** : Type, Status, Location
- **Templates** : Category, Price Range
- **Invoices** : Status, Date Range, Amount Range

**Composant FilterPanel** :
```typescript
interface FilterPanelProps {
  filters: FilterConfig[]
  activeFilters: ActiveFilters
  onFilterChange: (filters: ActiveFilters) => void
}
```

**Estimation** : 6h

---

## 📊 RÉCAPITULATIF PLANNING

| Semaine | Focus | Heures | Livrables |
|---------|-------|--------|-----------|
| **1** | Modales Business | 16h | AddVehicleModal + Tests + Intégration |
| **2** | API Integration | 20h | Service API + Hooks Business |
| **3** | Navigation | 16h | Écrans détails + Routes |
| **4** | CRUD & Filtres | 22h | Edit Modals + Recherche + Filtres |

**TOTAL : 74 heures** (environ 9 jours de travail)

---

## 🎯 OBJECTIFS PAR SECTION

### Section Business (de 65% à 90%)
- ✅ StaffCrewScreen complet (FAIT)
- ⏳ AddVehicleModal (Semaine 1)
- ⏳ API Integration (Semaine 2)
- ⏳ Navigation détails (Semaine 3)
- ⏳ CRUD complet (Semaine 4)

### Tests (de 30% à 50%)
- ⏳ Tests AddVehicleModal
- ⏳ Tests services API
- ⏳ Tests hooks business
- ⏳ Tests écrans détails

### Design System (de 60% à 80%)
- ⏳ Uniformisation composants
- ⏳ Standardisation layouts
- ⏳ Cohérence navigation

---

## 📈 PROGRESSION ATTENDUE

**Après 1 mois (4 semaines)** :
- Section Business : **90%** (de 65%)
- Couverture tests : **50%** (de 30%)
- Design uniformisé : **80%** (de 60%)
- **Couverture globale : 52%** (de 47%)

---

## 🚦 PROCHAINE SESSION DE TRAVAIL

### 🎯 Action immédiate recommandée :
**Créer AddVehicleModal.tsx**

**Durée estimée** : 8 heures  
**Prérequis** : 
- ✅ useStaff pattern compris (référence AddStaffModal)
- ✅ Types Vehicle définis dans types/business
- ✅ Hook useVehicles existant (à créer si manquant)

**Commencer par** :
1. Créer le fichier modal
2. Définir les interfaces TypeScript
3. Implémenter la sélection de type
4. Créer le formulaire véhicule
5. Ajouter validations
6. Intégrer dans TrucksScreen
7. Tester manuellement
8. Créer tests unitaires

---

## ✅ CRITÈRES DE VALIDATION

**Pour chaque étape** :
- [ ] Code fonctionne sans erreur
- [ ] Tests unitaires passent à 100%
- [ ] Design cohérent avec pattern établi
- [ ] Documentation à jour
- [ ] Demo fonctionnelle présentée
- [ ] **Validation client obtenue**

---

**Document créé le** : 22 octobre 2025  
**Prochaine mise à jour** : Après complétion AddVehicleModal
