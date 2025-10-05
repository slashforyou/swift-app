import { useState, useEffect } from 'react'
import loadCalendarDays, { CalendarDay, CalendarApiError } from '../services/calendar/loadCalendarDays'

interface UseCalendarState {
  data: CalendarDay[]
  isLoading: boolean
  error: string | null
  lastFetch: Date | null
}

interface UseCalendarReturn extends UseCalendarState {
  loadDays: (startDate: Date, endDate: Date) => Promise<void>
  refresh: () => Promise<void>
  clearError: () => void
  hasData: boolean
}

/**
 * Custom hook for managing calendar data - Version simplifiée
 */
export function useCalendar(): UseCalendarReturn {
  const [state, setState] = useState<UseCalendarState>({
    data: [],
    isLoading: false,
    error: null,
    lastFetch: null
  })

  const [lastQuery, setLastQuery] = useState<{
    startDate: Date
    endDate: Date
  } | null>(null)

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  const loadDays = async (startDate: Date, endDate: Date) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const data = await loadCalendarDays(startDate, endDate)
      
      setState(prev => ({
        ...prev,
        data,
        isLoading: false,
        lastFetch: new Date()
      }))
      
      setLastQuery({ startDate, endDate })
      
    } catch (error) {
      let errorMessage = 'Failed to load calendar data'
      
      if (error instanceof CalendarApiError) {
        errorMessage = error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      
      if (__DEV__) {
        console.error('Calendar loading error:', error)
      }
    }
  }

  const refresh = async () => {
    if (lastQuery) {
      await loadDays(lastQuery.startDate, lastQuery.endDate)
    }
  }

  return {
    ...state,
    loadDays,
    refresh,
    clearError,
    hasData: state.data.length > 0
  }
}

/**
 * Hook for loading calendar data with initial load
 * Version simplifiée sans boucles infinies
 */
export function useCalendarData(
  startDate: Date,
  endDate: Date,
  autoLoad: boolean = true
) {
  const calendar = useCalendar()
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false)

  // Chargement initial une seule fois
  useEffect(() => {
    if (autoLoad && !hasInitialLoaded) {
      calendar.loadDays(startDate, endDate)
      setHasInitialLoaded(true)
    }
  }, []) // Pas de dépendances = une seule fois

  // Recharger seulement si les dates changent ET qu'on a déjà fait un chargement initial
  useEffect(() => {
    if (hasInitialLoaded && autoLoad) {
      calendar.loadDays(startDate, endDate)
    }
  }, [startDate.getTime(), endDate.getTime()]) // Utiliser getTime() pour éviter les références d'objets

  return calendar
}