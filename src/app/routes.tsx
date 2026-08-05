import type { RouteObject } from 'react-router-dom'
import { HomePage } from '../features/home/HomePage'
import { NotFoundPage } from '../features/placeholder/NotFoundPage'
import { AdminPage } from '../features/admin/AdminPage'
import { AdminLoginPage } from '../features/admin/AdminLoginPage'
import { AdminRoute } from '../features/admin/AdminRoute'
import { ElectionListPage } from '../features/admin/ElectionListPage'
import { ElectionDashboardPage } from '../features/admin/ElectionDashboardPage'
import { CandidatesPage } from '../features/admin/CandidatesPage'
import { VotersPage } from '../features/admin/VotersPage'
import { PresencePage } from '../features/admin/PresencePage'
import { ElectionSettingsPage } from '../features/admin/ElectionSettingsPage'
import { ApurationPage } from '../features/admin/ApurationPage'
import { VotingFlowPage } from '../features/voting/VotingFlowPage'
import { Navigate } from 'react-router-dom'

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/votar', element: <Navigate to="/votar/arati-2026-2027" replace /> },
  { path: '/votar/:electionSlug', element: <VotingFlowPage /> },
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/eleicoes',
    element: (
      <AdminRoute>
        <ElectionListPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/eleicoes/:id',
    element: (
      <AdminRoute>
        <ElectionDashboardPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/eleicoes/:id/candidatos',
    element: (
      <AdminRoute>
        <CandidatesPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/eleicoes/:id/eleitores',
    element: (
      <AdminRoute>
        <VotersPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/eleicoes/:id/presenca',
    element: (
      <AdminRoute>
        <PresencePage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/eleicoes/:id/configuracoes',
    element: (
      <AdminRoute>
        <ElectionSettingsPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/eleicoes/:id/apuracao',
    element: (
      <AdminRoute>
        <ApurationPage />
      </AdminRoute>
    ),
  },
  { path: '*', element: <NotFoundPage /> },
]
