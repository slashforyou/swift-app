import { useState, useEffect } from 'react'
import { ensureSession } from '../utils/session'

interface SessionState {
  isAuthenticated: boolean | null
  isLoading: boolean
  user: any | null
  error: string | null
}

/**
 * Custom hook for session management
 * Simple et sans boucles infinies
 */
export function useSession() {
  const [sessionState, setSessionState] = useState<SessionState>({
    isAuthenticated: null,
    isLoading: true,
    user: null,
    error: null
  })

  // Fonction pour vérifier la session (sans useCallback pour éviter les boucles)
  const checkSession = async () => {
    try {
      setSessionState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const userLoggedIn = await ensureSession()
      
      if (userLoggedIn && userLoggedIn.authenticated) {
        setSessionState({
          isAuthenticated: true,
          isLoading: false,
          user: userLoggedIn,
          error: null
        })
      } else {
        setSessionState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Session check failed'
      setSessionState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: errorMessage
      })
      
      if (__DEV__) {
        console.error("Session check error:", error)
      }
    }
  }

  // Fonction pour refresh (créée à chaque rendu mais c'est OK pour un event handler)
  const refreshSession = () => {
    checkSession()
  }

  // Vérification initiale une seule fois au mount
  useEffect(() => {
    checkSession()
  }, []) // Tableau vide = une seule fois au mount

  return {
    ...sessionState,
    refreshSession
  }
}

/**
 * Hook for protecting routes with authentication
 * Simplifié sans useEffect complexe
 */
export function useAuthGuard(navigation: any) {
  const session = useSession()

  useEffect(() => {
    // Seulement naviguer si explicitement non-authentifié
    if (session.isAuthenticated === false && !session.isLoading) {
      navigation.navigate('Connection')
    }
  }, [session.isAuthenticated, session.isLoading, navigation])

  return session
}