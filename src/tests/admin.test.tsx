import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../app/providers/AuthProvider'
import { AdminLoginPage } from '../features/admin/AdminLoginPage'
import { parseVoterCsv } from '../lib/admin/csv'

describe('administrative foundation', () => {
  it('renders the administrative login with clear fields', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminLoginPage />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByRole('heading', { name: /entrar no painel/i })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar no painel/i })).toBeDisabled()
  })

  it('parses CSV rows and marks missing required data', () => {
    const rows = parseVoterCsv(
      'nome,cpf,setor,funcao,matricula\nAna,529.982.247-25,Operação,Analista,42\n,123,,-,-',
    )

    expect(rows).toHaveLength(2)
    expect(rows[0].name).toBe('Ana')
    expect(rows[1].error).toBe('Nome obrigatório.')
  })
})
