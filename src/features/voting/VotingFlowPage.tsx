import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../components/feedback/Alert'
import { EmptyState } from '../../components/feedback/EmptyState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { ModalConfirm } from '../../components/feedback/ModalConfirm'
import { Card } from '../../components/ui/Card'
import { InputCPF } from '../../components/ui/InputCPF'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { validateCpf } from '../../lib/cpf/validateCpf'
import { TurnstileWidget } from '../../components/security/TurnstileWidget'
import { getVotingAvailability } from '../../lib/voting/votingAvailability'
import {
  getActiveCandidates,
  getElectionBySlug,
  mapVotingError,
  submitVote,
  verifyVoterAccess,
} from '../../lib/voting/votingService'
import type { PublicCandidate, PublicElection, VoterAccessResult } from '../../lib/supabase/types'

type VotingStage = 'access' | 'confirm' | 'ballot' | 'success'

export function VotingFlowPage() {
  const { electionSlug = '' } = useParams()
  const navigate = useNavigate()
  const [election, setElection] = useState<PublicElection | null>(null)
  const [voter, setVoter] = useState<VoterAccessResult | null>(null)
  const [candidates, setCandidates] = useState<PublicCandidate[]>([])
  const [cpf, setCpf] = useState('')
  const [accessTurnstileToken, setAccessTurnstileToken] = useState('')
  const [voteTurnstileToken, setVoteTurnstileToken] = useState('')
  const [accessTurnstileReset, setAccessTurnstileReset] = useState(0)
  const [voteTurnstileReset, setVoteTurnstileReset] = useState(0)
  const [selectedCandidate, setSelectedCandidate] = useState<PublicCandidate | null>(null)
  const [isBlank, setIsBlank] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [stage, setStage] = useState<VotingStage>('access')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(() => !navigator.onLine)

  useEffect(() => {
    const online = () => setOffline(false)
    const offlineEvent = () => setOffline(true)
    window.addEventListener('online', online)
    window.addEventListener('offline', offlineEvent)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offlineEvent)
    }
  }, [])

  useEffect(() => {
    void getElectionBySlug(electionSlug).then(({ data, error: requestError }) => {
      setElection(data)
      if (requestError || !data)
        setError(mapVotingError(requestError ?? new Error('ELECTION_NOT_FOUND')))
      setLoading(false)
    })
  }, [electionSlug])

  const stageNumber = stage === 'access' ? 1 : stage === 'confirm' ? 2 : stage === 'ballot' ? 3 : 4
  const selectedLabel = useMemo(
    () => (isBlank ? 'voto em branco' : (selectedCandidate?.name ?? '')),
    [isBlank, selectedCandidate],
  )

  async function accessVoting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (offline) {
      setError('Você está offline. Conecte-se à internet para acessar a votação.')
      return
    }
    if (election && !getVotingAvailability(election).available) {
      setError(getVotingAvailability(election).message)
      return
    }
    if (!validateCpf(cpf)) {
      setError('CPF inválido. Verifique os números digitados.')
      return
    }
    setSubmitting(true)
    try {
      if (!accessTurnstileToken) {
        console.info('[voter-gateway] gateway_request_blocked_no_token', {
          action: 'voter_access',
        })
        setError('Conclua a verificação de segurança para continuar.')
        return
      }
      const access = await verifyVoterAccess(electionSlug, cpf, accessTurnstileToken)
      if (access.error || !access.data?.allowed) {
        setAccessTurnstileToken('')
        setAccessTurnstileReset((value) => value + 1)
        setError(
          mapVotingError(access.error ?? new Error(access.data?.reason ?? 'VOTER_NOT_FOUND')),
        )
        return
      }
      const candidateResult = await getActiveCandidates(electionSlug)
      if (candidateResult.error) {
        setError(mapVotingError(candidateResult.error))
        return
      }
      setVoter(access.data)
      setCandidates(candidateResult.data)
      setStage('confirm')
    } catch (caught) {
      setAccessTurnstileToken('')
      setAccessTurnstileReset((value) => value + 1)
      setError(mapVotingError(caught))
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmVote() {
    if (!election || !cpf || !voteTurnstileToken || (!selectedCandidate && !isBlank) || offline) {
      if (offline) setError('Você está offline. Não é possível registrar o voto.')
      else if (!voteTurnstileToken) {
        console.info('[voter-gateway] gateway_request_blocked_no_token', { action: 'cast_vote' })
        setError('Conclua a verificação de segurança para votar.')
      }
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const result = await submitVote(
        election.slug,
        cpf,
        isBlank ? null : (selectedCandidate?.id ?? null),
        isBlank,
        voteTurnstileToken,
      )
      if (result.error) {
        setVoteTurnstileToken('')
        setVoteTurnstileReset((value) => value + 1)
        setError(mapVotingError(result.error))
      } else {
        setCpf('')
        setAccessTurnstileToken('')
        setVoteTurnstileToken('')
        setSelectedCandidate(null)
        setIsBlank(false)
        setConfirmOpen(false)
        setStage('success')
      }
    } catch (caught) {
      setVoteTurnstileToken('')
      setVoteTurnstileReset((value) => value + 1)
      setError(mapVotingError(caught))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading)
    return (
      <div className="voting-page container">
        <LoadingState label="Carregando dados da eleição" />
      </div>
    )
  if (!election)
    return (
      <div className="voting-page container">
        <Alert tone="error">{error || 'Eleição não localizada.'}</Alert>
        <Link className="back-link" to="/">
          ← Voltar ao início
        </Link>
      </div>
    )

  const availability = getVotingAvailability(election)

  return (
    <div className="voting-page container">
      <div className="voting-event-heading">
        <span className="eyebrow">
          {election.company_name ?? 'Eleição da CIPA'} · {election.management_period}
        </span>
        <h1>{election.title}</h1>
        <p>
          {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(
            new Date(`${election.voting_date}T12:00:00`),
          )}
        </p>
      </div>
      {stage !== 'success' && (
        <div className="voting-progress" aria-label={`Etapa ${Math.min(stageNumber, 3)} de 3`}>
          <span className={stageNumber >= 1 ? 'progress-step active' : 'progress-step'}>
            <b>01</b> Identificação
          </span>
          <span className="progress-line" />
          <span className={stageNumber >= 2 ? 'progress-step active' : 'progress-step'}>
            <b>02</b> Confirmação
          </span>
          <span className="progress-line" />
          <span className={stageNumber >= 3 ? 'progress-step active' : 'progress-step'}>
            <b>03</b> Votação
          </span>
        </div>
      )}
      {offline && (
        <Alert tone="warning" title="Sem conexão">
          A votação exige conexão ativa. Nenhuma operação será confirmada offline.
        </Alert>
      )}
      {!availability.available && <Alert tone="warning">{availability.message}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      {stage === 'access' && (
        <div className="voting-grid">
          <div>
            <PageHeader
              eyebrow="Acesso protegido"
              title="Digite seu CPF para votar."
              description="Vamos verificar se você está apto a participar desta eleição."
            />
            <Card className="voting-access-card">
              <form onSubmit={accessVoting}>
                <InputCPF
                  value={cpf}
                  onChange={(event) => setCpf(event.target.value)}
                  disabled={submitting || offline || !availability.available}
                  required
                  hint="Seu CPF é usado somente para validar a elegibilidade e impedir duplicidade."
                />
                <TurnstileWidget
                  action="voter_access"
                  onToken={setAccessTurnstileToken}
                  resetKey={accessTurnstileReset}
                />
                <Button
                  type="submit"
                  className="full-width"
                  disabled={
                    submitting || offline || !availability.available || !accessTurnstileToken
                  }
                >
                  {submitting ? 'Consultando CPF...' : 'Acessar votação'}{' '}
                  <span aria-hidden="true">→</span>
                </Button>
              </form>
              <p className="form-disclaimer">
                O voto será registrado de forma anônima, sem vínculo com seus dados.
              </p>
            </Card>
            <Link className="back-link" to="/">
              ← Voltar para o início
            </Link>
          </div>
          <aside className="voting-aside">
            <Card className="privacy-card">
              <span className="privacy-icon" aria-hidden="true">
                ⌁
              </span>
              <h2>Presença identificada, voto anônimo</h2>
              <p>
                Seu acesso será registrado para controle de presença. A escolha do candidato será
                armazenada separadamente.
              </p>
            </Card>
          </aside>
        </div>
      )}
      {stage === 'confirm' && voter && (
        <Card className="voter-confirm-card">
          <PageHeader
            eyebrow="Etapa 2 · Confirmação"
            title="Confirme seus dados."
            description="Confira as informações antes de prosseguir para a cédula."
          />
          <div className="voter-data-grid">
            <div>
              <span>Nome</span>
              <strong>{voter.voter_name}</strong>
            </div>
            <div>
              <span>CPF</span>
              <strong>{voter.cpf_masked}</strong>
            </div>
            <div>
              <span>Setor</span>
              <strong>{voter.department ?? 'Não informado'}</strong>
            </div>
            <div>
              <span>Função</span>
              <strong>{voter.role ?? 'Não informado'}</strong>
            </div>
          </div>
          <div className="form-actions">
            <button className="button button-primary" onClick={() => setStage('ballot')}>
              Confirmar e votar <span aria-hidden="true">→</span>
            </button>
            <button
              className="button button-ghost"
              onClick={() => {
                setCpf('')
                setAccessTurnstileToken('')
                setAccessTurnstileReset((value) => value + 1)
                setVoter(null)
                setStage('access')
              }}
            >
              Voltar e corrigir CPF
            </button>
          </div>
        </Card>
      )}
      {stage === 'ballot' && (
        <div className="ballot-area">
          <PageHeader
            eyebrow="Etapa 3 · Cédula"
            title="Escolha uma opção."
            description="Selecione um candidato ou vote em branco. Você poderá revisar antes da confirmação."
          />
          {candidates.length === 0 ? (
            <EmptyState
              title="Nenhum candidato ativo"
              description="A Comissão Eleitoral ainda não disponibilizou candidatos para esta eleição."
            />
          ) : (
            <div className="ballot-grid">
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  className={
                    selectedCandidate?.id === candidate.id && !isBlank
                      ? 'candidate-vote-card selected'
                      : 'candidate-vote-card'
                  }
                  onClick={() => {
                    setSelectedCandidate(candidate)
                    setIsBlank(false)
                  }}
                  aria-pressed={selectedCandidate?.id === candidate.id && !isBlank}
                >
                  <div className="ballot-photo">
                    {candidate.photo_url ? (
                      <img src={candidate.photo_url} alt={`Foto de ${candidate.name}`} />
                    ) : (
                      candidate.name.charAt(0)
                    )}
                  </div>
                  <div className="candidate-details">
                    <span className="eyebrow">Candidato</span>
                    <h2>{candidate.name}</h2>
                    <span className="candidate-role">{candidate.role}</span>
                    {candidate.slogan && <p>“{candidate.slogan}”</p>}
                  </div>
                  <span className="selection-mark" aria-hidden="true">
                    {selectedCandidate?.id === candidate.id && !isBlank ? '✓' : ''}
                  </span>
                </button>
              ))}
              {election.allow_blank_vote && (
                <button
                  className={isBlank ? 'blank-vote-card selected' : 'blank-vote-card'}
                  onClick={() => {
                    setIsBlank(true)
                    setSelectedCandidate(null)
                  }}
                  aria-pressed={isBlank}
                >
                  <span className="blank-vote-icon" aria-hidden="true">
                    □
                  </span>
                  <span>
                    <strong>Voto em branco</strong>
                    <small>Não escolher nenhum candidato</small>
                  </span>
                  <span className="selection-mark" aria-hidden="true">
                    {isBlank ? '✓' : ''}
                  </span>
                </button>
              )}
            </div>
          )}
          <div className="ballot-actions">
            <TurnstileWidget
              action="cast_vote"
              onToken={setVoteTurnstileToken}
              resetKey={voteTurnstileReset}
            />
            <Button
              disabled={!selectedCandidate && !isBlank}
              onClick={() => {
                setError('')
                setConfirmOpen(true)
              }}
            >
              Revisar escolha →
            </Button>
          </div>
          {(selectedCandidate || isBlank) && (
            <ModalConfirm
              open={confirmOpen}
              title="Confirma seu voto?"
              description="Após a confirmação, não será possível alterar sua escolha."
              confirmLabel={submitting ? 'Registrando...' : 'Confirmar voto'}
              cancelLabel="Cancelar"
              onCancel={() => setConfirmOpen(false)}
              onConfirm={() => void confirmVote()}
            >
              <div className="modal-choice">
                <span>Sua escolha</span>
                <strong>{selectedLabel}</strong>
              </div>
            </ModalConfirm>
          )}
        </div>
      )}
      {stage === 'success' && (
        <div className="vote-success">
          <span className="success-check" aria-hidden="true">
            ✓
          </span>
          <span className="eyebrow">Participação confirmada</span>
          <h1>Voto registrado com sucesso.</h1>
          <p>
            Obrigado por participar da eleição da CIPA. Sua participação fortalece a segurança no
            trabalho.
          </p>
          <Button onClick={() => navigate('/')}>Finalizar</Button>
        </div>
      )}
    </div>
  )
}
