import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VotingFlowPage } from '../features/voting/VotingFlowPage'

const { mockGetElection, mockVerify, mockCandidates, mockSubmit } = vi.hoisted(() => ({
  mockGetElection: vi.fn(),
  mockVerify: vi.fn(),
  mockCandidates: vi.fn(),
  mockSubmit: vi.fn(),
}))

vi.mock('../lib/voting/votingService', () => ({
  getElectionBySlug: mockGetElection,
  verifyVoterAccess: mockVerify,
  getActiveCandidates: mockCandidates,
  submitVote: mockSubmit,
  mapVotingError: (error: Error) => error.message,
}))

vi.mock('../lib/cpf/hashCpf', () => ({ hashCpf: vi.fn().mockResolvedValue('cpf-hash') }))

const election = {
  id: 'election-id',
  slug: 'arati-2026',
  title: 'Eleição da CIPA',
  company_name: 'ARATI',
  management_period: '2026/2027',
  voting_date: '2026-08-06',
  voting_start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  voting_end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  status: 'open',
  allow_blank_vote: true,
}

function renderFlow() {
  return render(
    <MemoryRouter initialEntries={['/votar/arati-2026']}>
      <VotingFlowPage />
    </MemoryRouter>,
  )
}

describe('voter flow', () => {
  beforeEach(() => {
    mockGetElection.mockResolvedValue({ data: election, error: null })
    mockVerify.mockResolvedValue({
      data: {
        allowed: true,
        reason: 'OK',
        election_id: 'election-id',
        election_title: election.title,
        company_name: 'ARATI',
        management_period: '2026/2027',
        voting_date: '2026-08-06',
        allow_blank_vote: true,
        voter_name: 'Ana Lima',
        cpf_masked: '***.***.***-25',
        department: 'Operação',
        role: 'Analista',
      },
      error: null,
    })
    mockCandidates.mockResolvedValue({
      data: [
        {
          id: 'candidate-id',
          name: 'Ana Lima',
          role: 'Analista',
          slogan: 'Segurança sempre',
          photo_url: null,
          display_order: 1,
        },
      ],
      error: null,
    })
    mockSubmit.mockResolvedValue({ data: { success: true }, error: null })
  })

  it('rejects invalid CPF before querying the voter', async () => {
    const user = userEvent.setup()
    renderFlow()
    const input = await screen.findByLabelText('CPF do eleitor')
    await user.type(input, '11111111111')
    await user.click(screen.getByRole('button', { name: /acessar votação/i }))

    expect(await screen.findByText(/cpf inválido/i)).toBeInTheDocument()
    expect(mockVerify).not.toHaveBeenCalled()
  })

  it('confirms a candidate and sends only the anonymous RPC payload', async () => {
    const user = userEvent.setup()
    renderFlow()
    await user.type(await screen.findByLabelText('CPF do eleitor'), '52998224725')
    await user.click(screen.getByRole('button', { name: /acessar votação/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar e votar/i }))
    await user.click(await screen.findByRole('button', { name: /ana lima/i }))
    await user.click(screen.getByRole('button', { name: /revisar escolha/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /confirmar voto/i }))

    expect(mockSubmit).toHaveBeenCalledWith('arati-2026', 'cpf-hash', 'candidate-id', false)
    expect(
      await screen.findByRole('heading', { name: /voto registrado com sucesso/i }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('CPF do eleitor')).not.toBeInTheDocument()
  })
})
