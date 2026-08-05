import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '../../components/feedback/Alert'
import { EmptyState } from '../../components/feedback/EmptyState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { MetricCard } from '../../components/ui/MetricCard'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { recordAuditLog } from '../../lib/admin/audit'
import {
  getElection,
  statusLabels,
  transitionElectionStatus,
  type ElectionWithCompany,
} from '../../lib/admin/electionService'
import { getElectionTally, getPresenceForReport } from '../../lib/admin/tallyService'
import {
  attendanceTableHtml,
  buildAtaText,
  downloadCsv,
  escapeHtml,
  printReport,
  tallyTableHtml,
} from '../../lib/reports/exporters'
import type { ElectionTally } from '../../lib/supabase/types'

type PresenceRow = {
  name: string
  cpf_masked: string | null
  department: string | null
  role: string | null
  status: string
  has_voted: boolean
  voted_at: string | null
}

export function ApurationPage() {
  const { id = '' } = useParams()
  const [election, setElection] = useState<ElectionWithCompany | null>(null)
  const [tally, setTally] = useState<ElectionTally | null>(null)
  const [presence, setPresence] = useState<PresenceRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const { data, error: electionError } = await getElection(id)
        const found = data as ElectionWithCompany | null
        setElection(found)
        if (electionError || !found) setError('Eleição não encontrada.')
        else if (['closed', 'tallied', 'archived'].includes(found.status)) {
          const result = await getElectionTally(id)
          setTally(result.data)
          if (result.error)
            setError(
              result.error.message.includes('TALLY_NOT_AVAILABLE')
                ? 'A apuração ainda não está disponível.'
                : 'Não foi possível carregar a apuração.',
            )
        }
      } catch {
        setError('Não foi possível carregar a apuração.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  async function loadPresence() {
    if (presence) return presence
    const result = await getPresenceForReport(id)
    if (result.error) {
      setError('Não foi possível carregar a lista de presença.')
      return []
    }
    const rows = (result.data as PresenceRow[] | null) ?? []
    setPresence(rows)
    return rows
  }

  async function exportPresence(format: 'csv' | 'pdf') {
    const rows = await loadPresence()
    if (format === 'csv')
      downloadCsv(
        `presenca-${id}.csv`,
        ['Nome', 'CPF mascarado', 'Setor', 'Função', 'Situação', 'Votou', 'Data/hora'],
        rows.map((row) => [
          row.name,
          row.cpf_masked ?? '***.***.***-**',
          row.department ?? '',
          row.role ?? '',
          row.status,
          row.has_voted ? 'Sim' : 'Não',
          row.voted_at ? new Date(row.voted_at).toLocaleString('pt-BR') : '',
        ]),
      )
    else printReport('Lista de presença', attendanceTableHtml(rows))
    await recordAuditLog(`report_presence_${format}`, id)
  }

  async function exportTally(format: 'csv' | 'pdf') {
    if (!tally) return
    if (format === 'csv')
      downloadCsv(
        `apuracao-${id}.csv`,
        ['Classificação', 'Candidato', 'Função', 'Votos', 'Situação'],
        tally.candidates.map((candidate) => [
          candidate.rank_position,
          candidate.candidate_name,
          candidate.candidate_role,
          candidate.votes_count,
          candidate.result_status,
        ]),
      )
    else printReport('Relatório de apuração', tallyTableHtml(tally))
    await recordAuditLog(`report_tally_${format}`, id)
  }

  async function exportParticipation() {
    if (!tally) return
    printReport(
      'Relatório de participação',
      `<h1>Relatório de participação</h1><p>${escapeHtml(tally.company_name ?? '')} · ${escapeHtml(tally.title)} · Gestão ${escapeHtml(tally.management_period)}</p><table><tbody><tr><th>Eleitores aptos</th><td>${tally.total_active_voters}</td></tr><tr><th>Votantes</th><td>${tally.total_attendance}</td></tr><tr><th>Participação</th><td>${tally.participation_percentage}%</td></tr></tbody></table>`,
    )
    await recordAuditLog('report_participation_pdf', id)
  }

  async function exportResult() {
    if (!tally) return
    printReport(
      'Resultado final',
      `<h1>Resultado final</h1><p>${escapeHtml(tally.company_name ?? '')} · ${escapeHtml(tally.title)} · Gestão ${escapeHtml(tally.management_period)}</p>${tallyTableHtml(tally)}`,
    )
    await recordAuditLog('report_final_result_pdf', id)
  }

  async function exportAta() {
    if (!tally) return
    const text = buildAtaText(tally)
    printReport(
      'Ata de eleição e apuração',
      `<h1>Ata de eleição e apuração</h1><div style="white-space:pre-wrap">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`,
    )
    await recordAuditLog('report_minutes_pdf', id)
  }

  async function confirmTally() {
    const result = await transitionElectionStatus(id, 'tallied')
    if (result.error) setError('Não foi possível confirmar a apuração.')
    else {
      setElection((current) => (current ? { ...current, status: 'tallied' } : current))
      await recordAuditLog('election_tallied', id)
    }
  }

  if (loading)
    return (
      <div className="admin-page">
        <LoadingState label="Carregando apuração" />
      </div>
    )
  if (!election) return <Alert tone="error">{error || 'Eleição não encontrada.'}</Alert>
  const locked = !['closed', 'tallied', 'archived'].includes(election.status)
  if (locked)
    return (
      <div className="admin-page">
        <Link className="back-link" to={`/admin/eleicoes/${id}`}>
          ← Dashboard da eleição
        </Link>
        <PageHeader
          eyebrow="Apuração bloqueada"
          title="A apuração ainda não está disponível."
          description="A Comissão Eleitoral poderá consultar os resultados somente após o encerramento oficial."
        />
        <Alert
          tone="warning"
          title="A apuração será liberada somente após o encerramento oficial da votação."
        >
          Status atual: {statusLabels[election.status]}.
        </Alert>
      </div>
    )
  if (!tally)
    return (
      <div className="admin-page">
        <Alert tone="error">{error || 'Não foi possível gerar a apuração.'}</Alert>
      </div>
    )
  return (
    <div className="admin-page apuration-page">
      <Link className="back-link" to={`/admin/eleicoes/${id}`}>
        ← Dashboard da eleição
      </Link>
      <PageHeader
        eyebrow="Apuração da eleição"
        title={tally.title}
        description={`${tally.company_name ?? 'Empresa não vinculada'} · Gestão ${tally.management_period}`}
        actions={
          election.status === 'closed' ? (
            <button className="button button-primary" onClick={() => void confirmTally()}>
              Confirmar apuração
            </button>
          ) : (
            <StatusBadge tone="success">{statusLabels[election.status]}</StatusBadge>
          )
        }
      />
      {error && <Alert tone="warning">{error}</Alert>}
      {tally.has_tie && (
        <Alert tone="warning" title="Empate na apuração">
          Há empate na apuração. A Comissão Eleitoral deverá aplicar o critério administrativo
          previsto no processo eleitoral e registrar a decisão em ata.
        </Alert>
      )}
      {tally.has_divergence && (
        <Alert tone="error" title="Divergência identificada">
          Há divergência entre o total de presenças e o total de votos registrados. Recomenda-se
          verificar os logs técnicos antes de finalizar a ata.
        </Alert>
      )}
      <div className="metric-grid">
        <MetricCard
          label="Eleitores aptos"
          value={String(tally.total_active_voters)}
          detail="Eleitores ativos"
        />
        <MetricCard
          label="Votantes"
          value={String(tally.total_attendance)}
          detail="Presenças registradas"
          tone="slate"
        />
        <MetricCard
          label="Participação"
          value={`${tally.participation_percentage}%`}
          detail="Participação total"
          tone="amber"
        />
        <MetricCard
          label="Votos registrados"
          value={String(tally.total_votes)}
          detail={`${tally.blank_votes} em branco`}
        />
      </div>
      <Card className="admin-list-card">
        <div className="card-heading-row">
          <div>
            <span className="eyebrow">Resultado agregado</span>
            <h2>Ranking dos candidatos</h2>
          </div>
          <StatusBadge tone="neutral">Sem vínculo com eleitor</StatusBadge>
        </div>
        {tally.candidates.length === 0 ? (
          <EmptyState
            title="Nenhum candidato encontrado"
            description="Não há candidatos para exibir nesta apuração."
          />
        ) : (
          <DataTable
            columns={[
              {
                key: 'rank',
                label: 'Classificação',
                render: (row) => <strong>{row.rank_position}º</strong>,
              },
              {
                key: 'candidate',
                label: 'Candidato',
                render: (row) => <strong>{row.candidate_name}</strong>,
              },
              { key: 'role', label: 'Função', render: (row) => row.candidate_role },
              { key: 'votes', label: 'Votos', render: (row) => <strong>{row.votes_count}</strong> },
              {
                key: 'status',
                label: 'Situação',
                render: (row) => (
                  <StatusBadge
                    tone={
                      row.result_status === 'Titular'
                        ? 'success'
                        : row.result_status === 'Suplente'
                          ? 'info'
                          : 'neutral'
                    }
                  >
                    {row.result_status}
                  </StatusBadge>
                ),
              },
            ]}
            rows={tally.candidates}
            rowKey={(row) => row.candidate_id}
          />
        )}
      </Card>
      <Card className="report-actions-card">
        <span className="eyebrow">Documentos do dossiê</span>
        <h2>Gerar relatórios</h2>
        <p>
          Os PDFs são preparados para impressão. CSVs usam UTF-8, separador `;` e CPF mascarado.
        </p>
        <div className="report-action-grid">
          <button className="button button-secondary" onClick={() => void exportPresence('pdf')}>
            Presença · PDF
          </button>
          <button className="button button-secondary" onClick={() => void exportPresence('csv')}>
            Presença · CSV
          </button>
          <button className="button button-secondary" onClick={() => void exportTally('pdf')}>
            Apuração · PDF
          </button>
          <button className="button button-secondary" onClick={() => void exportTally('csv')}>
            Apuração · CSV
          </button>
          <button className="button button-secondary" onClick={() => void exportParticipation()}>
            Participação · PDF
          </button>
          <button className="button button-secondary" onClick={() => void exportResult()}>
            Resultado final · PDF
          </button>
          <button className="button button-primary" onClick={() => void exportAta()}>
            Ata · PDF
          </button>
        </div>
      </Card>
    </div>
  )
}
