import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoadingState } from '../../components/feedback/LoadingState'
import { useAuth } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase/client'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth()
  const location = useLocation()
  const [adminLoading, setAdminLoading] = useState(Boolean(user))
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let active = true
    if (!user || !supabase) {
      setAdminLoading(false)
      setIsAdmin(false)
      return () => {
        active = false
      }
    }
    setAdminLoading(true)
    void (async () => {
      try {
        const { data } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', user.id)
          .eq('active', true)
          .maybeSingle()
        if (active) {
          setIsAdmin(Boolean(data))
          setAdminLoading(false)
        }
      } catch {
        if (active) {
          setIsAdmin(false)
          setAdminLoading(false)
        }
      }
    })()
    return () => {
      active = false
    }
  }, [user])

  if (loading || adminLoading) return <LoadingState label="Verificando sessão administrativa" />
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  if (!isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  return children
}
