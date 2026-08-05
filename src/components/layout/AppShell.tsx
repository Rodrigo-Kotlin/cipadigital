import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { OfflineNotice } from '../feedback/OfflineNotice'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <OfflineNotice />
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" to="/" aria-label="CIPA Digital, início">
            <span className="brand-mark" aria-hidden="true">
              C
            </span>
            <span>
              <strong>CIPA Digital</strong>
              <small>Sistema de votação da CIPA</small>
            </span>
          </Link>
          <nav className="site-nav" aria-label="Navegação principal">
            <Link to="/votar">Acessar votação</Link>
            <Link to="/admin">Área administrativa</Link>
          </nav>
        </div>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <span>CIPA Digital</span>
          <span>Sistema de Votação Eletrônica da CIPA</span>
        </div>
      </footer>
    </div>
  )
}
