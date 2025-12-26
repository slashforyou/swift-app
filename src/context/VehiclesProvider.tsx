/**
 * VehiclesProvider - Context pour la gestion des véhicules
 * Fournit state management pour l'ajout, modification et suppression de véhicules
 */
import React, { createContext, ReactNode, useContext, useState } from 'react'

// Types pour les véhicules
export type VehicleType = 'moving-truck' | 'van' | 'trailer' | 'ute' | 'dolly' | 'tools'
export type VehicleStatus = 'available' | 'in-use' | 'maintenance' | 'out-of-service'

export interface Vehicle {
  id: string
  type: VehicleType
  make: string
  model: string
  year: number
  registration: string
  status: VehicleStatus
  capacity?: string
  location?: string
  nextService?: string
  notes?: string
}

interface VehiclesContextType {
  vehicles: Vehicle[]
  loading: boolean
  error: string | null
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<void>
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => Promise<void>
  deleteVehicle: (id: string) => Promise<void>
  getVehicleById: (id: string) => Vehicle | undefined
}

const VehiclesContext = createContext<VehiclesContextType | undefined>(undefined)

// Données mock initiales (même structure que TrucksScreen)
const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    type: 'moving-truck',
    make: 'Isuzu',
    model: 'NPR 200',
    year: 2020,
    registration: 'ABC-123',
    status: 'available',
    capacity: '3.5 tonnes',
    location: 'Sydney Depot',
  },
  {
    id: 'v2',
    type: 'van',
    make: 'Ford',
    model: 'Transit',
    year: 2021,
    registration: 'XYZ-456',
    status: 'in-use',
    capacity: '2 tonnes',
    location: 'Melbourne Branch',
  },
  {
    id: 'v3',
    type: 'trailer',
    make: 'Custom',
    model: 'Box Trailer',
    year: 2019,
    registration: 'TRL-789',
    status: 'available',
    capacity: '4 tonnes',
    location: 'Brisbane Office',
  },
  {
    id: 'v4',
    type: 'ute',
    make: 'Toyota',
    model: 'HiLux',
    year: 2022,
    registration: 'UTE-101',
    status: 'maintenance',
    capacity: '1 tonne',
    location: 'Perth Warehouse',
  },
]

export function VehiclesProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id'>) => {
    try {
      setLoading(true)
      setError(null)

      // Générer un ID unique
      const newId = `v${vehicles.length + 1}`
      
      const newVehicle: Vehicle = {
        ...vehicleData,
        id: newId,
      }

      // Ajouter le véhicule
      setVehicles(prev => [...prev, newVehicle])
      
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add vehicle')
      setLoading(false)
      throw err
    }
  }

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    try {
      setLoading(true)
      setError(null)

      setVehicles(prev =>
        prev.map(vehicle =>
          vehicle.id === id ? { ...vehicle, ...updates } : vehicle
        )
      )

      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vehicle')
      setLoading(false)
      throw err
    }
  }

  const deleteVehicle = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      setVehicles(prev => prev.filter(vehicle => vehicle.id !== id))

      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vehicle')
      setLoading(false)
      throw err
    }
  }

  const getVehicleById = (id: string) => {
    return vehicles.find(vehicle => vehicle.id === id)
  }

  const value: VehiclesContextType = {
    vehicles,
    loading,
    error,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleById,
  }

  return (
    <VehiclesContext.Provider value={value}>
      {children}
    </VehiclesContext.Provider>
  )
}

// Hook personnalisé pour utiliser le contexte
export function useVehicles() {
  const context = useContext(VehiclesContext)
  if (context === undefined) {
    throw new Error('useVehicles must be used within a VehiclesProvider')
  }
  return context
}
