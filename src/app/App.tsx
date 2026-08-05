import { useRoutes } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { AuthProvider } from './providers/AuthProvider'
import { AdminShell } from '../components/layout/AdminShell'
import { AppShell } from '../components/layout/AppShell'
import { VotingShell } from '../components/layout/VotingShell'
import { routes } from './routes'

function AppContent() {
  const content = useRoutes(routes)
  const { pathname } = useLocation()

  if (pathname.startsWith('/admin')) return <AdminShell>{content}</AdminShell>
  if (pathname.startsWith('/votar')) return <VotingShell>{content}</VotingShell>

  return <AppShell>{content}</AppShell>
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
