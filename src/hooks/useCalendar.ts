import React, { useState, useCallback, useEffect, useRef } from 'react'
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
 * Custom hook for managing calendar data
 * Provides loading state, error handling, and caching
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

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const loadDays = async (startDate: Date, endDate: Date) => {

    if (__DEV__) {
      console.log("***** LoadDays called *****");
    }
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
 * Hook for loading calendar data with automatic retry and caching
 * @param startDate Initial start date
 * @param endDate Initial end date
 * @param autoLoad Whether to load data immediately
 */
export function useCalendarData(
  startDate: Date,
  endDate: Date,
  autoLoad: boolean = true
) {
  const calendar = useCalendar()
  const hasLoaded = useRef(false)

    //   If autoLoad is true, load data on mount
    // Console log for debug if the user is authenticated
    if (autoLoad && !hasLoaded.current) {
      console.log('User is authenticated, loading calendar data...')
    }

  // Auto-load data seulement une fois au mount
  useEffect(() => {
    if (autoLoad && !hasLoaded.current) {
      hasLoaded.current = true
      calendar.loadDays(startDate, endDate)
    }
  }, []) // Pas de dépendances = une seule fois

  return calendar
}