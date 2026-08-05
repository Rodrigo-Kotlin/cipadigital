import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '../../components/feedback/Alert'
import { EmptyState } from '../../components/feedback/EmptyState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Card } from '../../components/ui/Card'
import { MetricCard } from '../../components/ui/MetricCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { listElections, statusLabels } from '../../lib/admin/electionService'
import { supabase } from '../../lib/supabase/client'
import type { Election } from '../../lib/supabase/types'

export function AdminPage() {
  const [elections, setElections] = useState<Election[]>([])
  const [counts, setCounts] = useState({ voters: 0, candidates: 0, voted: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void listElections().then(async ({ data, error: requestError }) => {
      const current = (data as Election[] | null)?.[0]
      setElections((data as Election[] | null) ?? [])
      if (requestError) setError('Não foi possível carregar as eleições.')
      if (current && supabase) {
        const [voters, candidates] = await Promise.all([
          supabase.from('voters').select('id,has_voted').eq('election_id', current.id),
          supabase.from('candidates').select('id').eq('election_id', current.id).eq('active', true),
        ])
        const voterRows = (voters.data ?? []) as { id: string; has_voted: boolean }[]
        setCounts({
          voters: voterRows.length,
          candidates: candidates.data?.length ?? 0,
          voted: voterRows.filter((voter) => voter.has_voted).length,
        })
      }
      setLoading(false)
    })
  }, [])

  if (loading)
    return (
      <div className="admin-page">
        <LoadingState label="Carregando dashboard" />
      </div>
    )
  const current = elections[0]
  const participation = counts.voters ? Math.round((counts.voted / counts.voters) * 100) : 0

  return (
    <div className="admin-page" id="overview">
      <PageHeader
        eyebrow="Visão geral · Painel administrativo"
        title="Dashboard da eleição"
        description="Configure o processo eleitoral e acompanhe sua preparação com segurança."
        actions={
          <Link className="button button-secondary" to="/admin/eleicoes">
            Ver eleições
          </Link>
        }
      />
      {error && (
        <Alert tone="warning" title="Supabase indisponível">
          {error} Verifique as variáveis de ambiente.
        </Alert>
      )}
      {!current ? (
        <EmptyState
          title="Nenhuma eleição cadastrada"
          description="Crie uma eleição no Supabase para começar a configurar o processo administrativo."
        />
      ) : (
        <>
          <div className="metric-grid">
            <MetricCard
              label="Eleitores aptos"
              value={String(counts.voters)}
              detail="Eleitores ativos"
            />
            <MetricCard
              label="Candidatos ativos"
              value={String(counts.candidates)}
              detail="Nesta eleição"
              tone="slate"
            />
            <MetricCard
              label="Participação"
              value={`${participation}%`}
              detail={`${counts.voted} votantes`}
              tone="amber"
            />
          </div>
          <Card className="election-status-card">
            <div className="card-heading-row">
              <div>
                <span className="eyebrow">Eleição principal</span>
                <h2>{current.title}</h2>
                <p>
                  {current.management_period} · {current.voting_date}
                </p>
              </div>
              <StatusBadge tone={current.status === 'open' ? 'success' : 'warning'}>
                {statusLabels[current.status]}
              </StatusBadge>
            </div>
            <div className="quick-actions">
              <Link to={`/admin/eleicoes/${current.id}/configuracoes`}>
                Configurar eleição <span>→</span>
              </Link>
              <Link to={`/admin/eleicoes/${current.id}/candidatos`}>
                Gerenciar candidatos <span>→</span>
              </Link>
              <Link to={`/admin/eleicoes/${current.id}/eleitores`}>
                Gerenciar eleitores <span>→</span>
              </Link>
              <Link to={`/admin/eleicoes/${current.id}/presenca`}>
                Consultar presença <span>→</span>
              </Link>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
