import { useState, useEffect, useRef } from 'react'
import { ensureSession } from '../utils/session'

interface SessionState {
  isAuthenticated: boolean | null
  isLoading: boolean
  user: any | null
  error: string | null
}

/**
 * Custom hook for session management
 * Version ultra-simplifiée pour éviter les boucles infinies
 */
export function useSession() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hasInitialized = useRef(false)

  // Vérification initiale une seule fois
  useEffect(() => {
    if (hasInitialized.current) return
    
    hasInitialized.current = true
    
    const checkSession = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const userLoggedIn = await ensureSession()
        
        if (userLoggedIn && userLoggedIn.authenticated) {
          setIsAuthenticated(true)
          setUser(userLoggedIn)
          setError(null)
        } else {
          setIsAuthenticated(false)
          setUser(null)
          setError(null)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Session check failed'
        setIsAuthenticated(false)
        setUser(null)
        setError(errorMessage)
        
        if (__DEV__) {
          console.error("Session check error:", error)
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  // Fonction de refresh simple
  const refreshSession = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const userLoggedIn = await ensureSession()
      
      if (userLoggedIn && userLoggedIn.authenticated) {
        setIsAuthenticated(true)
        setUser(userLoggedIn)
        setError(null)
      } else {
        setIsAuthenticated(false)
        setUser(null)
        setError(null)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Session check failed'
      setIsAuthenticated(false)
      setUser(null)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
    refreshSession
  }
}

/**
 * Hook for protecting routes with authentication
 * Ultra-simplifié pour éviter les boucles
 */
export function useAuthGuard(navigation: any) {
  const session = useSession()
  const hasNavigated = useRef(false)

  useEffect(() => {
    // Reset le flag si on devient authentifié
    if (session.isAuthenticated === true) {
      hasNavigated.current = false
    }
    
    // Navigation seulement si pas déjà navigué et explicitement non-authentifié
    if (session.isAuthenticated === false && 
        !session.isLoading && 
        !hasNavigated.current) {
      hasNavigated.current = true
      navigation.navigate('Connection')
    }
  }, [session.isAuthenticated, session.isLoading])

  return session
}