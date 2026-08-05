import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { LoadingState } from '../../components/feedback/LoadingState'
import { useAuth } from '../../app/providers/AuthProvider'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingState label="Verificando sessão administrativa" />
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  return children
}
