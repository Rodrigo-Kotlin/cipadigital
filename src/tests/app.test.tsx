import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from '../app/App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('CIPA Digital layouts', () => {
  it('renders the institutional home page', () => {
    renderAt('/')

    expect(screen.getByRole('heading', { name: /uma votação mais simples/i })).toBeInTheDocument()
    expect(screen.getAllByText('CIPA Digital').length).toBeGreaterThan(0)
  })

  it('shows the main access links', () => {
    renderAt('/')

    const votingLinks = screen.getAllByRole('link', { name: /acessar votação/i })
    expect(votingLinks.some((link) => link.getAttribute('href') === '/votar/arati-2026-2027')).toBe(
      true,
    )
    const adminLinks = screen.getAllByRole('link', { name: /área administrativa/i })
    expect(adminLinks.some((link) => link.getAttribute('href') === '/admin')).toBe(true)
  })

  it('routes the generic voting entry to the functional election flow', async () => {
    renderAt('/votar')

    expect(await screen.findByText(/carregando dados da eleição/i)).toBeInTheDocument()
  })

  it('redirects unauthenticated administrators to login', async () => {
    renderAt('/admin')

    expect(await screen.findByRole('heading', { name: /entrar no painel/i })).toBeInTheDocument()
    expect(screen.getByText(/ambiente não configurado/i)).toBeInTheDocument()
  })

  it('renders the not found page', () => {
    renderAt('/rota-inexistente')

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /este endereço não existe/i })).toBeInTheDocument()
  })
})
