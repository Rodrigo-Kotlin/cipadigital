import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../../components/feedback/Alert'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Card } from '../../components/ui/Card'
import { MetricCard } from '../../components/ui/MetricCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import {
  getElection,
  statusLabels,
  transitionElectionStatus,
  type ElectionWithCompany,
} from '../../lib/admin/electionService'
import { supabase } from '../../lib/supabase/client'
import type { ElectionStatus } from '../../lib/supabase/types'
import { isElectionWindowExpired } from '../../lib/voting/votingAvailability'

interface Metrics {
  voters: number
  candidates: number
  voted: number
}

export function ElectionDashboardPage() {
  const { id = '' } = useParams()
  const [election, setElection] = useState<ElectionWithCompany | null>(null)
  const [metrics, setMetrics] = useState<Metrics>({ voters: 0, candidates: 0, voted: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const [electionResult, votersResult, candidatesResult] = await Promise.all([
          getElection(id),
          supabase?.from('voters').select('id,has_voted').eq('election_id', id),
          supabase?.from('candidates').select('id').eq('election_id', id).eq('active', true),
        ])
        setElection(electionResult.data as ElectionWithCompany | null)
        const voters = (votersResult?.data ?? []) as { id: string; has_voted: boolean }[]
        setMetrics({
          voters: voters.length,
          candidates: candidatesResult?.data?.length ?? 0,
          voted: voters.filter((voter) => voter.has_voted).length,
        })
        if (electionResult.error) setError('Não foi possível carregar esta eleição.')
      } catch {
        setError('Não foi possível carregar esta eleição.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  async function changeStatus(target: ElectionStatus) {
    const result = await transitionElectionStatus(id, target)
    if (result.error)
      setError('A transição não foi permitida. Confira os pré-requisitos da eleição.')
    else setElection((current) => (current ? { ...current, status: target } : current))
  }

  if (loading) return <LoadingState label="Carregando eleição" />
  if (!election) return <Alert tone="error">Eleição não encontrada.</Alert>
  const participation = metrics.voters ? Math.round((metrics.voted / metrics.voters) * 100) : 0
  const canSchedule = election.status === 'draft'
  const canOpen = election.status === 'scheduled'
  const canPause = election.status === 'open'
  const canResume = election.status === 'paused'
  const canClose = election.status === 'open' || election.status === 'paused'
  const votingWindowExpired = isElectionWindowExpired(election.status, election.voting_end)
  const scheduledWindowExpired =
    election.status === 'scheduled' && Date.now() > new Date(election.voting_start).getTime()

  return (
    <div className="admin-page">
      <Link className="back-link" to="/admin/eleicoes">
        ← Todas as eleições
      </Link>
      <PageHeader
        eyebrow="Dashboard da eleição"
        title={election.title}
        description={`${election.management_period} · ${election.companies?.name ?? 'Empresa não vinculada'}`}
      />
      {error && <Alert tone="warning">{error}</Alert>}
      {votingWindowExpired && (
        <Alert tone="warning" title="Janela de votação encerrada">
          A eleição está com status Aberta, mas o horário de encerramento já foi ultrapassado.
          Encerre a votação ou ajuste a janela de horário.
        </Alert>
      )}
      {scheduledWindowExpired && (
        <Alert tone="warning" title="Eleição agendada com horário vencido">
          O horário inicial já foi ultrapassado. Abra a votação ou ajuste a janela de horário.
        </Alert>
      )}
      <div className="metric-grid">
        <MetricCard
          label="Eleitores aptos"
          value={String(metrics.voters)}
          detail="Eleitores ativos"
        />
        <MetricCard
          label="Candidatos ativos"
          value={String(metrics.candidates)}
          detail="Disponíveis nesta eleição"
          tone="slate"
        />
        <MetricCard
          label="Participação"
          value={`${participation}%`}
          detail={`${metrics.voted} votantes`}
          tone="amber"
        />
      </div>
      <Card className="status-control-card">
        <div className="card-heading-row">
          <div>
            <span className="eyebrow">Status da eleição</span>
            <h2>{statusLabels[election.status]}</h2>
          </div>
          <StatusBadge tone={election.status === 'open' ? 'success' : 'warning'}>
            {statusLabels[election.status]}
          </StatusBadge>
        </div>
        <p className="status-control-copy">
          {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(
            new Date(`${election.voting_date}T12:00:00`),
          )}{' '}
          ·{' '}
          {new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(
            new Date(election.voting_start),
          )}{' '}
          -{' '}
          {new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(
            new Date(election.voting_end),
          )}
        </p>
        <div className="status-actions">
          {canSchedule && (
            <button
              className="button button-secondary"
              onClick={() => void changeStatus('scheduled')}
            >
              Agendar eleição
            </button>
          )}
          {canOpen && (
            <button className="button button-primary" onClick={() => void changeStatus('open')}>
              Abrir votação
            </button>
          )}
          {canPause && (
            <button className="button button-secondary" onClick={() => void changeStatus('paused')}>
              Pausar votação
            </button>
          )}
          {canResume && (
            <button className="button button-primary" onClick={() => void changeStatus('open')}>
              Retomar votação
            </button>
          )}
          {canClose && (
            <button className="button button-danger" onClick={() => void changeStatus('closed')}>
              Encerrar votação
            </button>
          )}
        </div>
      </Card>
      <div className="admin-overview-grid admin-link-cards">
        <Link to={`/admin/eleicoes/${id}/configuracoes`}>
          <Card>
            <span className="eyebrow">Configuração</span>
            <h2>Dados da eleição →</h2>
            <p>Empresa, calendário e quantidade de vagas.</p>
          </Card>
        </Link>
        <Link to={`/admin/eleicoes/${id}/candidatos`}>
          <Card>
            <span className="eyebrow">Participantes</span>
            <h2>Candidatos →</h2>
            <p>Cadastre, ordene e prepare os candidatos.</p>
          </Card>
        </Link>
        <Link to={`/admin/eleicoes/${id}/eleitores`}>
          <Card>
            <span className="eyebrow">Base eleitoral</span>
            <h2>Eleitores →</h2>
            <p>Cadastre ou importe a lista de aptos.</p>
          </Card>
        </Link>
        <Link to={`/admin/eleicoes/${id}/presenca`}>
          <Card>
            <span className="eyebrow">Acompanhamento</span>
            <h2>Presença →</h2>
            <p>Consulte presença sem acessar votos.</p>
          </Card>
        </Link>
        <Link to={`/admin/eleicoes/${id}/apuracao`}>
          <Card>
            <span className="eyebrow">Resultado</span>
            <h2>Apuração →</h2>
            <p>Disponível somente após o encerramento oficial.</p>
          </Card>
        </Link>
      </div>
    </div>
  )
}
