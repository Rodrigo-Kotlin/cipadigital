import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { NavLink, useLocation } from 'react-router-dom'
import { OfflineNotice } from '../feedback/OfflineNotice'
import { useAuth } from '../../app/providers/AuthProvider'

interface AdminShellProps {
  children: ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const isLogin = location.pathname === '/admin/login'
  if (isLogin)
    return (
      <div className="admin-shell">
        <OfflineNotice />
        <header className="admin-topbar">
          <Link className="brand" to="/" aria-label="CIPA Digital, início">
            <span className="brand-mark" aria-hidden="true">
              C
            </span>
            <span>
              <strong>CIPA Digital</strong>
              <small>Área administrativa</small>
            </span>
          </Link>
        </header>
        <main className="admin-auth-content">{children}</main>
      </div>
    )

  const electionIdMatch = location.pathname.match(/\/admin\/eleicoes\/([^/]+)/)
  const electionId = electionIdMatch?.[1]
  const links = electionId
    ? ([
        ['Visão geral', `/admin/eleicoes/${electionId}`],
        ['Candidatos', `/admin/eleicoes/${electionId}/candidatos`],
        ['Eleitores', `/admin/eleicoes/${electionId}/eleitores`],
        ['Presença', `/admin/eleicoes/${electionId}/presenca`],
        ['Apuração', `/admin/eleicoes/${electionId}/apuracao`],
        ['Configurações', `/admin/eleicoes/${electionId}/configuracoes`],
      ] as const)
    : ([
        ['Visão geral', '/admin'],
        ['Eleições', '/admin/eleicoes'],
      ] as const)
  return (
    <div className="admin-shell">
      <OfflineNotice />
      <header className="admin-topbar">
        <Link className="brand" to="/" aria-label="CIPA Digital, início">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <span>
            <strong>CIPA Digital</strong>
            <small>Área administrativa</small>
          </span>
        </Link>
        <div className="admin-user">
          <span className="avatar" aria-hidden="true">
            {(user?.email?.slice(0, 2) ?? 'AD').toUpperCase()}
          </span>
          <span className="admin-user-label">{user?.email ?? 'Administrador'}</span>
          <button
            className="admin-exit text-button"
            onClick={() => void signOut()}
            aria-label="Sair da área administrativa"
          >
            Sair
          </button>
        </div>
      </header>
      <div className="admin-body">
        <aside className="admin-sidebar" aria-label="Navegação administrativa">
          <span className="sidebar-label">Gestão da eleição</span>
          <nav>
            {links.map(([label, href], index) => (
              <NavLink
                className={({ isActive }) =>
                  isActive ? 'admin-nav-link active' : 'admin-nav-link'
                }
                to={href}
                key={href}
                end={index === 0}
              >
                <span className="nav-index" aria-hidden="true">
                  0{index + 1}
                </span>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <span>CIPA Digital</span>
            <strong>Painel administrativo</strong>
          </div>
        </aside>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}
