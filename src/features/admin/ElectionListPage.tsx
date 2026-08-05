import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert } from '../../components/feedback/Alert'
import { EmptyState } from '../../components/feedback/EmptyState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { listElections, statusLabels } from '../../lib/admin/electionService'
import type { Election } from '../../lib/supabase/types'
import { Input } from '../../components/ui/Input'
import { recordAuditLog } from '../../lib/admin/audit'
import { supabase } from '../../lib/supabase/client'
import { useAuth } from '../../app/providers/AuthProvider'

export function ElectionListPage() {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    management: '',
    date: '',
    start: '',
    end: '',
    total: '1',
    titulares: '1',
    suplentes: '1',
  })
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    void listElections().then(({ data, error: requestError }) => {
      setElections((data as Election[] | null) ?? [])
      if (requestError) setError('Não foi possível carregar as eleições.')
      setLoading(false)
    })
  }, [])

  async function createElection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) {
      setError('Supabase não configurado.')
      return
    }
    if (new Date(form.end) <= new Date(form.start)) {
      setError('O encerramento deve ser posterior ao início.')
      return
    }
    setSaving(true)
    setError('')
    const slug = `${form.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}-${Date.now()}`
    const result = await supabase.from('elections').insert({
      company_id: null,
      slug,
      title: form.title.trim(),
      management_period: form.management.trim(),
      voting_date: form.date,
      voting_start: new Date(form.start).toISOString(),
      voting_end: new Date(form.end).toISOString(),
      status: 'draft',
      total_employees: Number(form.total),
      titulares_count: Number(form.titulares),
      suplentes_count: Number(form.suplentes),
      allow_blank_vote: true,
      show_results_only_after_close: true,
      created_by: user?.id ?? null,
    })
    if (result.error) setError('Não foi possível criar a eleição. Verifique os campos e a conexão.')
    else {
      await recordAuditLog('election_created')
      setFormOpen(false)
      setForm({
        title: '',
        management: '',
        date: '',
        start: '',
        end: '',
        total: '1',
        titulares: '1',
        suplentes: '1',
      })
      await listElections().then(({ data }) => setElections((data as Election[] | null) ?? []))
    }
    setSaving(false)
  }

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Administração"
        title="Eleições"
        description="Selecione uma eleição para configurar seu processo."
      />
      <div className="list-page-actions">
        <button className="button button-primary" onClick={() => setFormOpen((open) => !open)}>
          {formOpen ? 'Fechar cadastro' : 'Nova eleição'}
        </button>
      </div>
      {formOpen && (
        <Card className="create-election-card">
          <span className="eyebrow">Nova eleição</span>
          <h2>Configurar uma eleição</h2>
          <form className="form-grid-2" onSubmit={createElection}>
            <Input
              label="Título da eleição"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Input
              label="Gestão"
              value={form.management}
              onChange={(e) => setForm({ ...form, management: e.target.value })}
              required
            />
            <Input
              label="Data"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <Input
              label="Total de empregados"
              type="number"
              min="1"
              value={form.total}
              onChange={(e) => setForm({ ...form, total: e.target.value })}
              required
            />
            <Input
              label="Início"
              type="datetime-local"
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
              required
            />
            <Input
              label="Encerramento"
              type="datetime-local"
              value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
              required
            />
            <Input
              label="Titulares"
              type="number"
              min="0"
              value={form.titulares}
              onChange={(e) => setForm({ ...form, titulares: e.target.value })}
              required
            />
            <Input
              label="Suplentes"
              type="number"
              min="0"
              value={form.suplentes}
              onChange={(e) => setForm({ ...form, suplentes: e.target.value })}
              required
            />
            <button className="button button-primary" disabled={saving}>
              {saving ? 'Criando...' : 'Criar eleição em preparação'}
            </button>
          </form>
        </Card>
      )}
      {error && (
        <Alert tone="warning" title="Supabase indisponível">
          {error} Verifique as variáveis de ambiente.
        </Alert>
      )}
      {loading ? (
        <LoadingState label="Carregando eleições" />
      ) : elections.length === 0 ? (
        <EmptyState
          title="Nenhuma eleição encontrada"
          description="As eleições cadastradas aparecerão aqui quando o Supabase estiver conectado."
        />
      ) : (
        <div className="election-list-grid">
          {elections.map((election) => (
            <Card
              key={election.id}
              className="election-list-item"
              onClick={() => navigate(`/admin/eleicoes/${election.id}`)}
              tabIndex={0}
            >
              <div className="card-heading-row">
                <span className="eyebrow">{election.management_period}</span>
                <StatusBadge tone={election.status === 'open' ? 'success' : 'warning'}>
                  {statusLabels[election.status]}
                </StatusBadge>
              </div>
              <h2>{election.title}</h2>
              <p>
                {new Intl.DateTimeFormat('pt-BR').format(
                  new Date(`${election.voting_date}T12:00:00`),
                )}
              </p>
              <span className="text-link">Abrir eleição →</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
