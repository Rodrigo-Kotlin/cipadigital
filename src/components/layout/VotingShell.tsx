import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { OfflineNotice } from '../feedback/OfflineNotice'

interface VotingShellProps {
  children: ReactNode
}

export function VotingShell({ children }: VotingShellProps) {
  return (
    <div className="voting-shell">
      <OfflineNotice />
      <header className="voting-header">
        <div className="container voting-header-inner">
          <Link className="brand" to="/" aria-label="CIPA Digital, início">
            <span className="brand-mark" aria-hidden="true">
              C
            </span>
            <span>
              <strong>CIPA Digital</strong>
              <small>Votação eletrônica da CIPA</small>
            </span>
          </Link>
          <span className="secure-label">
            <span className="secure-dot" aria-hidden="true" /> Ambiente protegido
          </span>
        </div>
      </header>
      <main className="voting-content">{children}</main>
      <footer className="voting-footer">
        <span>CIPA Digital</span>
        <span>Presença identificada · Voto anônimo</span>
      </footer>
    </div>
  )
}
