import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert } from '../../components/feedback/Alert'
import { EmptyState } from '../../components/feedback/EmptyState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { MetricCard } from '../../components/ui/MetricCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { supabase } from '../../lib/supabase/client'
import type { Voter } from '../../lib/supabase/types'

type AttendanceFilter = 'all' | 'voted' | 'pending'

export function PresencePage() {
  const { id = '' } = useParams()
  const [voters, setVoters] = useState<Voter[]>([])
  const [filter, setFilter] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) {
      setError('Supabase não configurado.')
      setLoading(false)
      return
    }
    void (async () => {
      try {
        const { data, error: requestError } = await supabase
          .from('voters')
          .select('*')
          .eq('election_id', id)
          .order('name')
        setVoters((data as Voter[] | null) ?? [])
        if (requestError) setError('Não foi possível carregar a presença.')
      } catch {
        setError('Não foi possível carregar a presença.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const filtered = useMemo(
    () =>
      voters.filter((voter) => {
        const matchesName = voter.name.toLowerCase().includes(filter.toLowerCase())
        const matchesAttendance =
          attendanceFilter === 'all' ||
          (attendanceFilter === 'voted' ? voter.has_voted : !voter.has_voted)
        return matchesName && matchesAttendance
      }),
    [attendanceFilter, filter, voters],
  )
  const voted = voters.filter((voter) => voter.has_voted).length
  const participation = voters.length ? Math.round((voted / voters.length) * 100) : 0

  if (loading)
    return (
      <div className="admin-page">
        <LoadingState label="Carregando presença" />
      </div>
    )
  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Acompanhamento"
        title="Presença"
        description="Acompanhe quem já foi registrado sem acessar o conteúdo de nenhum voto."
      />
      {error && <Alert tone="warning">{error}</Alert>}
      <Alert tone="info">
        Esta lista mostra apenas a participação dos eleitores. O voto permanece anônimo.
      </Alert>
      <div className="metric-grid">
        <MetricCard label="Eleitores aptos" value={String(voters.length)} detail="Base atual" />
        <MetricCard
          label="Votantes"
          value={String(voted)}
          detail="Presença registrada"
          tone="slate"
        />
        <MetricCard
          label="Participação"
          value={`${participation}%`}
          detail="Sem apuração por candidato"
          tone="amber"
        />
      </div>
      <Card className="admin-list-card">
        <div className="presence-toolbar">
          <Input
            label=""
            aria-label="Filtrar presença por nome"
            placeholder="Pesquisar por nome"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="filter-buttons" role="group" aria-label="Filtrar situação de presença">
            <button
              className={attendanceFilter === 'all' ? 'filter-button active' : 'filter-button'}
              onClick={() => setAttendanceFilter('all')}
            >
              Todos
            </button>
            <button
              className={attendanceFilter === 'voted' ? 'filter-button active' : 'filter-button'}
              onClick={() => setAttendanceFilter('voted')}
            >
              Votaram
            </button>
            <button
              className={attendanceFilter === 'pending' ? 'filter-button active' : 'filter-button'}
              onClick={() => setAttendanceFilter('pending')}
            >
              Pendentes
            </button>
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum registro encontrado"
            description="Ajuste os filtros ou cadastre eleitores nesta eleição."
          />
        ) : (
          <DataTable
            columns={[
              { key: 'name', label: 'Nome', render: (row) => <strong>{row.name}</strong> },
              {
                key: 'cpf',
                label: 'CPF mascarado',
                render: (row) => row.cpf_masked ?? '***.***.***-**',
              },
              {
                key: 'department',
                label: 'Setor',
                render: (row) => row.department ?? 'Não informado',
              },
              {
                key: 'role',
                label: 'Função/Cargo',
                render: (row) => row.role ?? 'Não informado',
              },
              {
                key: 'status',
                label: 'Situação',
                render: (row) => (
                  <StatusBadge tone={row.status === 'active' ? 'success' : 'danger'}>
                    {row.status === 'active' ? 'Ativo' : 'Bloqueado'}
                  </StatusBadge>
                ),
              },
              {
                key: 'voted',
                label: 'Votou',
                render: (row) =>
                  row.has_voted ? (
                    <StatusBadge tone="success">Sim</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Não</StatusBadge>
                  ),
              },
              {
                key: 'date',
                label: 'Data/hora',
                render: (row) =>
                  row.voted_at
                    ? new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(row.voted_at))
                    : '-',
              },
            ]}
            rows={filtered}
            rowKey={(row) => row.id}
          />
        )}
      </Card>
    </div>
  )
}
