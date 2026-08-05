import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthError, Session, User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase/client'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const authRuntimeConfigured = Boolean(supabase) && import.meta.env.MODE !== 'test'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(authRuntimeConfigured)

  useEffect(() => {
    if (!supabase || !authRuntimeConfigured) return

    let mounted = true
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session)
        setLoading(false)
      }
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      configured: authRuntimeConfigured,
      signIn: async (email, password) => {
        if (!supabase || !authRuntimeConfigured)
          return { error: new Error('Supabase não configurado.') as AuthError }
        return supabase.auth
          .signInWithPassword({ email, password })
          .then(({ error }) => ({ error }))
      },
      signOut: async () => {
        if (!supabase || !authRuntimeConfigured) return { error: null }
        return supabase.auth.signOut()
      },
    }),
    [loading, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// The hook intentionally lives beside its provider to keep the auth boundary discoverable.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}
