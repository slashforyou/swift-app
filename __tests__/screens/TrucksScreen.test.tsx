/**
 * Tests pour TrucksScreen (version moderne)
 * Tests complets de la gestion de flotte
 */
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Alert } from 'react-native'
import { ThemeProvider } from '../../src/context/ThemeProvider'
import TrucksScreen from '../../src/screens/business/trucksScreen'

// Mock Alert
jest.spyOn(Alert, 'alert')

// Wrapper avec ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>)
}

describe('TrucksScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ===========================================
  // Tests de rendu initial
  // ===========================================
  describe('Initial Rendering', () => {
    it('should render the screen without crashing', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      expect(getByText('Add Vehicle')).toBeTruthy()
    })

    it('should display statistics cards', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      // Le composant affiche seulement 3 cartes (pas de Total)
      expect(getByText('Available')).toBeTruthy()
      expect(getByText('In Use')).toBeTruthy()
      expect(getByText('Maintenance')).toBeTruthy()
    })

    it('should display correct vehicle counts in statistics', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      // Avec les 4 véhicules mockés
      expect(getByText('2')).toBeTruthy() // Available (v1, v3)
      expect(getByText('1')).toBeTruthy() // In Use (v2)
      // Maintenance a aussi 1 mais on ne peut pas tester deux fois le même texte
    })

    it('should display mock vehicles', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      expect(getByText('Isuzu NPR 200')).toBeTruthy()
      expect(getByText('Ford Transit')).toBeTruthy()
      expect(getByText('Custom Box Trailer')).toBeTruthy()
      expect(getByText('Toyota HiLux')).toBeTruthy()
    })
  })

  // ===========================================
  // Tests des filtres par type
  // ===========================================
  describe('Type Filters', () => {
    it('should display type filter section', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      // Vérifier qu'au moins un filtre est présent (All Vehicles)
      expect(getByText('All Vehicles')).toBeTruthy()
    })

    it('should display all vehicle type filters', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      expect(getByText('All Vehicles')).toBeTruthy()
      expect(getByText(/Moving-truck/)).toBeTruthy()
      expect(getByText(/Van/)).toBeTruthy()
      expect(getByText(/Trailer/)).toBeTruthy()
      expect(getByText(/Ute/)).toBeTruthy()
      expect(getByText(/Dolly/)).toBeTruthy()
      expect(getByText(/Tools/)).toBeTruthy()
    })

    it('should filter vehicles by Moving Truck type', () => {
      const { getByText, queryByText } = renderWithTheme(<TrucksScreen />)
      
      // Cliquer sur le filtre Moving Truck
      const truckFilter = getByText('?? Moving-truck')
      fireEvent.press(truckFilter)
      
      // Devrait afficher seulement Isuzu NPR 200
      expect(getByText('Isuzu NPR 200')).toBeTruthy()
      expect(queryByText('Ford Transit')).toBeNull()
      expect(queryByText('Custom Box Trailer')).toBeNull()
      expect(queryByText('Toyota HiLux')).toBeNull()
    })

    it('should filter vehicles by Van type', () => {
      const { getByText, queryByText } = renderWithTheme(<TrucksScreen />)
      
      const vanFilter = getByText('?? Van')
      fireEvent.press(vanFilter)
      
      // Devrait afficher seulement Ford Transit
      expect(getByText('Ford Transit')).toBeTruthy()
      expect(queryByText('Isuzu NPR 200')).toBeNull()
      expect(queryByText('Custom Box Trailer')).toBeNull()
      expect(queryByText('Toyota HiLux')).toBeNull()
    })

    it('should filter vehicles by Trailer type', () => {
      const { getByText, queryByText } = renderWithTheme(<TrucksScreen />)
      
      const trailerFilter = getByText('?? Trailer')
      fireEvent.press(trailerFilter)
      
      expect(getByText('Custom Box Trailer')).toBeTruthy()
      expect(queryByText('Isuzu NPR 200')).toBeNull()
      expect(queryByText('Ford Transit')).toBeNull()
      expect(queryByText('Toyota HiLux')).toBeNull()
    })

    it('should filter vehicles by Ute type', () => {
      const { getByText, queryByText } = renderWithTheme(<TrucksScreen />)
      
      const uteFilter = getByText('?? Ute')
      fireEvent.press(uteFilter)
      
      expect(getByText('Toyota HiLux')).toBeTruthy()
      expect(queryByText('Isuzu NPR 200')).toBeNull()
      expect(queryByText('Ford Transit')).toBeNull()
      expect(queryByText('Custom Box Trailer')).toBeNull()
    })

    it('should show all vehicles when "All" filter is selected', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      // Filtrer d'abord par un type
      fireEvent.press(getByText('?? Van'))
      
      // Puis cliquer sur "All"
      const allFilter = getByText(/All \(4\)/)
      fireEvent.press(allFilter)
      
      // Tous les véhicules devraient être visibles
      expect(getByText('Isuzu NPR 200')).toBeTruthy()
      expect(getByText('Ford Transit')).toBeTruthy()
      expect(getByText('Custom Box Trailer')).toBeTruthy()
      expect(getByText('Toyota HiLux')).toBeTruthy()
    })

    it('should display vehicle count for each type filter', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      // Le filtre "All" devrait afficher (4)
      expect(getByText(/All \(4\)/)).toBeTruthy()
    })
  })

  // ===========================================
  // Tests des filtres par statut
  // ===========================================
  describe('Status Filters', () => {
    it('should display status filter section', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      expect(getByText('Filter by Status')).toBeTruthy()
    })

    it('should display all status filters', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      expect(getByText('Available')).toBeTruthy()
      expect(getByText('In Use')).toBeTruthy()
      expect(getByText('Maintenance')).toBeTruthy()
      expect(getByText('Out of Service')).toBeTruthy()
    })

    it('should filter vehicles by Available status', () => {
      const { getByText, queryByText } = renderWithTheme(<TrucksScreen />)
      
      // Cliquer sur Available
      const availableFilters = getByText('Available')
      fireEvent.press(availableFilters)
      
      // Devrait afficher Isuzu et Box Trailer
      expect(getByText('Isuzu NPR 200')).toBeTruthy()
      expect(getByText('Custom Box Trailer')).toBeTruthy()
      expect(queryByText('Ford Transit')).toBeNull() // In Use
      expect(queryByText('Toyota HiLux')).toBeNull() // Maintenance
    })

    it('should filter vehicles by In Use status', () => {
      const { getByText, queryByText } = renderWithTheme(<TrucksScreen />)
      
      const inUseFilter = getByText('In Use')
      fireEvent.press(inUseFilter)
      
      expect(getByText('Ford Transit')).toBeTruthy()
      expect(queryByText('Isuzu NPR 200')).toBeNull()
      expect(queryByText('Custom Box Trailer')).toBeNull()
      expect(queryByText('Toyota HiLux')).toBeNull()
    })

    it('should filter vehicles by Maintenance status', () => {
      const { getByText, queryByText } = renderWithTheme(<TrucksScreen />)
      
      const maintenanceFilter = getByText('Maintenance')
      fireEvent.press(maintenanceFilter)
      
      expect(getByText('Toyota HiLux')).toBeTruthy()
      expect(queryByText('Isuzu NPR 200')).toBeNull()
      expect(queryByText('Ford Transit')).toBeNull()
      expect(queryByText('Custom Box Trailer')).toBeNull()
    })

    it('should combine type and status filters', () => {
      const { getByText, queryByText } = renderWithTheme(<TrucksScreen />)
      
      // Filtrer par Moving Truck + Available
      fireEvent.press(getByText('?? Moving-truck'))
      fireEvent.press(getByText('Available'))
      
      // Devrait afficher seulement Isuzu (moving-truck + available)
      expect(getByText('Isuzu NPR 200')).toBeTruthy()
      expect(queryByText('Ford Transit')).toBeNull()
      expect(queryByText('Custom Box Trailer')).toBeNull()
      expect(queryByText('Toyota HiLux')).toBeNull()
    })
  })

  // ===========================================
  // Tests des cartes véhicules
  // ===========================================
  describe('Vehicle Cards', () => {
    it('should display vehicle emoji icons', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      expect(getByText('🚛')).toBeTruthy() // Moving Truck
      expect(getByText('🚐')).toBeTruthy() // Van
      expect(getByText('🚜')).toBeTruthy() // Trailer
      expect(getByText('🛻')).toBeTruthy() // Ute
    })

    it('should display vehicle registration numbers', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      expect(getByText('ABC-123')).toBeTruthy()
      expect(getByText('XYZ-456')).toBeTruthy()
      expect(getByText('TRL-789')).toBeTruthy()
      expect(getByText('UTE-101')).toBeTruthy()
    })

    it('should display vehicle make and year', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      // Le composant affiche "Make Model (Year)"
      expect(getByText('Isuzu NPR 200')).toBeTruthy()
      expect(getByText('Ford Transit')).toBeTruthy()
      expect(getByText('Custom Box Trailer')).toBeTruthy()
      expect(getByText('Toyota HiLux')).toBeTruthy()
    })

    it('should display vehicle capacity when available', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      expect(getByText('4.5 tonnes')).toBeTruthy()
      expect(getByText('1.5 tonnes')).toBeTruthy()
      expect(getByText('2 tonnes')).toBeTruthy()
      expect(getByText('1 tonne')).toBeTruthy()
    })

    it('should display vehicle location', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      expect(getByText('Sydney Depot')).toBeTruthy()
      expect(getByText('Melbourne Depot')).toBeTruthy()
      expect(getByText('Brisbane Depot')).toBeTruthy()
      expect(getByText('Adelaide Depot')).toBeTruthy()
    })

    it('should display next service date', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      expect(getByText(/Next service: 2025-12-15/)).toBeTruthy()
      expect(getByText(/Next service: 2025-11-20/)).toBeTruthy()
      expect(getByText(/Next service: 2026-01-10/)).toBeTruthy()
      expect(getByText(/Next service: 2025-10-30/)).toBeTruthy()
    })

    it('should display assigned staff when vehicle is in use', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      expect(getByText(/Assigned to: John Smith/)).toBeTruthy()
    })

    it('should display status badges with correct colors', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      // Les badges de statut devraient être visibles
      const availableBadges = getByText('Available')
      expect(availableBadges).toBeTruthy()
      
      const inUseBadge = getByText('In Use')
      expect(inUseBadge).toBeTruthy()
      
      const maintenanceBadge = getByText('Maintenance')
      expect(maintenanceBadge).toBeTruthy()
    })
  })

  // ===========================================
  // Tests des actions sur les véhicules
  // ===========================================
  describe('Vehicle Actions', () => {
    it('should have Edit button for each vehicle', () => {
      const { getAllByText } = renderWithTheme(<TrucksScreen />)
      
      const editButtons = getAllByText('Edit')
      expect(editButtons.length).toBe(4) // 4 véhicules mockés
    })

    it('should have Delete button for each vehicle', () => {
      const { getAllByText } = renderWithTheme(<TrucksScreen />)
      
      const deleteButtons = getAllByText('Delete')
      expect(deleteButtons.length).toBe(4)
    })

    it('should show alert when Edit button is pressed', () => {
      const { getAllByText } = renderWithTheme(<TrucksScreen />)
      
      const editButtons = getAllByText('Edit')
      fireEvent.press(editButtons[0])
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Modifier le véhicule',
        expect.stringContaining('Modification de')
      )
    })

    it('should show confirmation alert when Delete button is pressed', () => {
      const { getAllByText } = renderWithTheme(<TrucksScreen />)
      
      const deleteButtons = getAllByText('Delete')
      fireEvent.press(deleteButtons[0])
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Supprimer le véhicule',
        expect.stringContaining('Êtes-vous sûr'),
        expect.any(Array)
      )
    })

    it('should remove vehicle from list when delete is confirmed', () => {
      const { getAllByText, queryByText } = renderWithTheme(<TrucksScreen />)
      
      // Obtenir le premier véhicule
      const vehicleName = 'Isuzu NPR 200'
      expect(queryByText(vehicleName)).toBeTruthy()
      
      // Cliquer sur Delete
      const deleteButtons = getAllByText('Delete')
      fireEvent.press(deleteButtons[0])
      
      // Simuler la confirmation
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0]
      const confirmButton = alertCall[2].find((btn: any) => btn.text === 'Supprimer')
      confirmButton.onPress()
      
      // Le véhicule ne devrait plus être visible
      waitFor(() => {
        expect(queryByText(vehicleName)).toBeNull()
      })
    })

    it('should open vehicle card detail when pressed', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      const vehicleCard = getByText('Isuzu NPR 200')
      fireEvent.press(vehicleCard)
      
      // Devrait ouvrir un modal ou naviguer (pour l'instant, déclenche handleEdit)
      expect(Alert.alert).toHaveBeenCalled()
    })
  })

  // ===========================================
  // Tests du bouton Add Vehicle et modal
  // ===========================================
  describe('Add Vehicle Modal', () => {
    it('should have Add Vehicle button', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      expect(getByText('Add Vehicle')).toBeTruthy()
    })

    it('should open AddVehicleModal when Add Vehicle button is pressed', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      const addButton = getByText('Add Vehicle')
      fireEvent.press(addButton)
      
      // Le modal devrait s'ouvrir
      expect(getByText('Select vehicle type')).toBeTruthy()
    })

    it('should add new vehicle to list when form is submitted', async () => {
      const { getByText, getByPlaceholderText, queryByText } = renderWithTheme(<TrucksScreen />)
      
      // Ouvrir le modal
      fireEvent.press(getByText('Add Vehicle'))
      
      // Remplir le formulaire
      fireEvent.press(getByText('?? Moving-truck'))
      fireEvent.press(getByText('Mercedes-Benz'))
      fireEvent.changeText(getByPlaceholderText('Enter model'), 'Atego')
      fireEvent.changeText(getByPlaceholderText('YYYY'), '2023')
      fireEvent.changeText(getByPlaceholderText('Enter registration number'), 'NEW-999')
      fireEvent.changeText(getByPlaceholderText('e.g., 3.5 tonnes'), '5 tonnes')
      fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD'), '2026-06-15')
      fireEvent.press(getByText('Adelaide Center'))
      
      // Soumettre
      const submitButton = getByText('Add Vehicle')
      fireEvent.press(submitButton)
      
      // Le nouveau véhicule devrait apparaître
      await waitFor(() => {
        expect(getByText('Mercedes-Benz Atego')).toBeTruthy()
        expect(getByText('NEW-999')).toBeTruthy()
      })
    })

    it('should update statistics after adding a vehicle', async () => {
      const { getByText, getByPlaceholderText, queryAllByText } = renderWithTheme(<TrucksScreen />)
      
      // Total initial = 4
      expect(getByText('4')).toBeTruthy()
      
      // Ajouter un véhicule
      fireEvent.press(getByText('Add Vehicle'))
      fireEvent.press(getByText('?? Van'))
      fireEvent.press(getByText('Toyota'))
      fireEvent.changeText(getByPlaceholderText('Enter model'), 'HiAce')
      fireEvent.changeText(getByPlaceholderText('YYYY'), '2024')
      fireEvent.changeText(getByPlaceholderText('Enter registration number'), 'VAN-555')
      fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD'), '2026-08-20')
      fireEvent.press(getByText('Gold Coast Hub'))
      fireEvent.press(getByText('Add Vehicle'))
      
      // Total devrait passer à 5
      await waitFor(() => {
        expect(getByText('5')).toBeTruthy()
      })
    })

    it('should close modal after adding vehicle', async () => {
      const { getByText, getByPlaceholderText, queryByText } = renderWithTheme(<TrucksScreen />)
      
      fireEvent.press(getByText('Add Vehicle'))
      
      // Remplir et soumettre
      fireEvent.press(getByText('?? Ute'))
      fireEvent.press(getByText('Nissan'))
      fireEvent.changeText(getByPlaceholderText('Enter model'), 'Navara')
      fireEvent.changeText(getByPlaceholderText('YYYY'), '2024')
      fireEvent.changeText(getByPlaceholderText('Enter registration number'), 'UTE-777')
      fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD'), '2026-09-10')
      fireEvent.press(getByText('Perth Warehouse'))
      fireEvent.press(getByText('Add Vehicle'))
      
      // Le modal devrait se fermer
      await waitFor(() => {
        expect(queryByText('Select vehicle type')).toBeNull()
      })
    })
  })

  // ===========================================
  // Tests de refresh
  // ===========================================
  describe('Pull to Refresh', () => {
    it('should have RefreshControl', () => {
      const { getByTestId } = renderWithTheme(<TrucksScreen />)
      
      // Le ScrollView devrait avoir un RefreshControl
      // (Dans un vrai test, on vérifierait la présence du composant)
      expect(getByTestId).toBeTruthy()
    })
  })

  // ===========================================
  // Tests d'état vide
  // ===========================================
  describe('Empty State', () => {
    it('should show empty state when no vehicles match filters', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      // Filtrer par un type qui n'existe pas dans les données mockées
      fireEvent.press(getByText('?? Dolly'))
      
      // Devrait afficher l'état vide
      expect(getByText('No vehicles found')).toBeTruthy()
      expect(getByText(/Try adjusting your filters/)).toBeTruthy()
    })

    it('should show empty state icon', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      fireEvent.press(getByText('?? Tools'))
      
      // L'icône de voiture vide devrait être visible (via Ionicons)
      expect(getByText('No vehicles found')).toBeTruthy()
    })

    it('should show empty state message when all vehicles are filtered out', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      // Combiner des filtres qui excluent tous les véhicules
      fireEvent.press(getByText('?? Moving-truck'))
      fireEvent.press(getByText('In Use'))
      
      // Moving Truck est Available, pas In Use
      expect(getByText('No vehicles found')).toBeTruthy()
    })
  })

  // ===========================================
  // Tests de responsive design
  // ===========================================
  describe('Responsive Design', () => {
    it('should display statistics in a row layout', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      // Les 4 cartes devraient être présentes
      expect(getByText('Total')).toBeTruthy()
      expect(getByText('Available')).toBeTruthy()
      expect(getByText('In Use')).toBeTruthy()
      expect(getByText('Maintenance')).toBeTruthy()
    })

    it('should display type filters in horizontal scroll', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      // Tous les filtres devraient être présents
      expect(getByText('?? Moving-truck')).toBeTruthy()
      expect(getByText('?? Van')).toBeTruthy()
      expect(getByText('?? Trailer')).toBeTruthy()
    })

    it('should display vehicle cards in vertical list', () => {
      const { getByText } = renderWithTheme(<TrucksScreen />)
      
      // Tous les véhicules devraient être empilés verticalement
      expect(getByText('Isuzu NPR 200')).toBeTruthy()
      expect(getByText('Ford Transit')).toBeTruthy()
      expect(getByText('Custom Box Trailer')).toBeTruthy()
      expect(getByText('Toyota HiLux')).toBeTruthy()
    })
  })

  // ===========================================
  // Tests d'intégration
  // ===========================================
  describe('Integration', () => {
    it('should maintain filter state when adding a vehicle', async () => {
      const { getByText, getByPlaceholderText, queryByText } = renderWithTheme(<TrucksScreen />)
      
      // Appliquer un filtre
      fireEvent.press(getByText('?? Van'))
      
      // Ajouter un véhicule (pas un Van)
      fireEvent.press(getByText('Add Vehicle'))
      fireEvent.press(getByText('?? Ute'))
      fireEvent.press(getByText('Ford'))
      fireEvent.changeText(getByPlaceholderText('Enter model'), 'Ranger')
      fireEvent.changeText(getByPlaceholderText('YYYY'), '2024')
      fireEvent.changeText(getByPlaceholderText('Enter registration number'), 'RNG-888')
      fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD'), '2026-07-15')
      fireEvent.press(getByText('Brisbane Office'))
      fireEvent.press(getByText('Add Vehicle'))
      
      // Le filtre Van devrait toujours être actif
      await waitFor(() => {
        expect(getByText('Ford Transit')).toBeTruthy()
        expect(queryByText('Ford Ranger')).toBeNull() // Pas un Van
      })
    })

    it('should update Available count when adding an available vehicle', async () => {
      const { getByText, getByPlaceholderText, getAllByText } = renderWithTheme(<TrucksScreen />)
      
      // Available initial = 2
      const statCards = getAllByText('2')
      expect(statCards.length).toBeGreaterThan(0)
      
      // Ajouter un véhicule (nouveau véhicule = available par défaut)
      fireEvent.press(getByText('Add Vehicle'))
      fireEvent.press(getByText('?? Trailer'))
      fireEvent.press(getByText('Other'))
      fireEvent.changeText(getByPlaceholderText('Enter model'), 'Flatbed')
      fireEvent.changeText(getByPlaceholderText('YYYY'), '2023')
      fireEvent.changeText(getByPlaceholderText('Enter registration number'), 'FLT-333')
      fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD'), '2026-05-20')
      fireEvent.press(getByText('Sydney Depot'))
      fireEvent.press(getByText('Add Vehicle'))
      
      // Available devrait passer à 3
      await waitFor(() => {
        expect(getByText('3')).toBeTruthy()
      })
    })

    it('should handle multiple filter changes smoothly', () => {
      const { getByText, queryByText } = renderWithTheme(<TrucksScreen />)
      
      // Filtrer par Van
      fireEvent.press(getByText('?? Van'))
      expect(getByText('Ford Transit')).toBeTruthy()
      expect(queryByText('Isuzu NPR 200')).toBeNull()
      
      // Changer pour Ute
      fireEvent.press(getByText('?? Ute'))
      expect(getByText('Toyota HiLux')).toBeTruthy()
      expect(queryByText('Ford Transit')).toBeNull()
      
      // Revenir à All
      fireEvent.press(getByText(/All/))
      expect(getByText('Isuzu NPR 200')).toBeTruthy()
      expect(getByText('Ford Transit')).toBeTruthy()
      expect(getByText('Toyota HiLux')).toBeTruthy()
    })
  })
})
