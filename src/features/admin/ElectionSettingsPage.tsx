import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert } from '../../components/feedback/Alert'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import {
  canEditElection,
  getElection,
  type ElectionWithCompany,
} from '../../lib/admin/electionService'
import { recordAuditLog } from '../../lib/admin/audit'
import { supabase } from '../../lib/supabase/client'

function toDateTimeLocal(value: string) {
  return value ? value.slice(0, 16) : ''
}

export function ElectionSettingsPage() {
  const { id = '' } = useParams()
  const [election, setElection] = useState<ElectionWithCompany | null>(null)
  const [form, setForm] = useState({
    title: '',
    management_period: '',
    voting_date: '',
    voting_start: '',
    voting_end: '',
    total_employees: '1',
    titulares_count: '1',
    suplentes_count: '1',
    allow_blank_vote: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void getElection(id).then(({ data, error: requestError }) => {
      const found = data as ElectionWithCompany | null
      setElection(found)
      if (found)
        setForm({
          title: found.title,
          management_period: found.management_period,
          voting_date: found.voting_date,
          voting_start: toDateTimeLocal(found.voting_start),
          voting_end: toDateTimeLocal(found.voting_end),
          total_employees: String(found.total_employees),
          titulares_count: String(found.titulares_count),
          suplentes_count: String(found.suplentes_count),
          allow_blank_vote: found.allow_blank_vote,
        })
      if (requestError) setError('Não foi possível carregar a configuração.')
      setLoading(false)
    })
  }, [id])

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !election || !canEditElection(election.status)) return
    setSaving(true)
    setError('')
    setMessage('')
    if (new Date(form.voting_end) <= new Date(form.voting_start)) {
      setError('O encerramento deve ser posterior ao início.')
      setSaving(false)
      return
    }
    const result = await supabase
      .from('elections')
      .update({
        title: form.title.trim(),
        management_period: form.management_period.trim(),
        voting_date: form.voting_date,
        voting_start: new Date(form.voting_start).toISOString(),
        voting_end: new Date(form.voting_end).toISOString(),
        total_employees: Number(form.total_employees),
        titulares_count: Number(form.titulares_count),
        suplentes_count: Number(form.suplentes_count),
        allow_blank_vote: form.allow_blank_vote,
      })
      .eq('id', id)
    if (result.error) setError('Não foi possível salvar a configuração.')
    else {
      await recordAuditLog('election_updated', id, {
        fields: ['title', 'calendar', 'counts', 'allow_blank_vote'],
      })
      setMessage('Configuração salva com sucesso.')
      setElection({
        ...election,
        ...form,
        total_employees: Number(form.total_employees),
        titulares_count: Number(form.titulares_count),
        suplentes_count: Number(form.suplentes_count),
        voting_start: new Date(form.voting_start).toISOString(),
        voting_end: new Date(form.voting_end).toISOString(),
      })
    }
    setSaving(false)
  }

  if (loading)
    return (
      <div className="admin-page">
        <PageHeader eyebrow="Configurações" title="Configurações" />
        <div className="loading-state">Carregando configuração</div>
      </div>
    )
  if (!election) return <Alert tone="error">Eleição não encontrada.</Alert>
  const editable = canEditElection(election.status)
  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Configuração da eleição"
        title="Dados da eleição"
        description="Revise o calendário e os parâmetros antes de abrir o processo."
      />
      {!editable && (
        <Alert tone="warning" title="Edição bloqueada">
          A configuração não pode ser alterada após a abertura da eleição.
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      <Card className="admin-form-card settings-card">
        <div className="company-summary">
          <span className="eyebrow">Empresa vinculada</span>
          <strong>{election.companies?.name ?? 'Não vinculada'}</strong>
          <span>{election.companies?.cnpj ?? 'CNPJ não informado'}</span>
        </div>
        <form className="admin-form settings-form" onSubmit={save}>
          <Input
            label="Título da eleição"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            disabled={!editable}
            required
          />
          <Input
            label="Gestão"
            value={form.management_period}
            onChange={(e) => setForm({ ...form, management_period: e.target.value })}
            disabled={!editable}
            required
          />
          <div className="form-grid-2">
            <Input
              label="Data da eleição"
              type="date"
              value={form.voting_date}
              onChange={(e) => setForm({ ...form, voting_date: e.target.value })}
              disabled={!editable}
              required
            />
            <Input
              label="Total de empregados"
              type="number"
              min="1"
              value={form.total_employees}
              onChange={(e) => setForm({ ...form, total_employees: e.target.value })}
              disabled={!editable}
              required
            />
            <Input
              label="Início"
              type="datetime-local"
              value={form.voting_start}
              onChange={(e) => setForm({ ...form, voting_start: e.target.value })}
              disabled={!editable}
              required
            />
            <Input
              label="Encerramento"
              type="datetime-local"
              value={form.voting_end}
              onChange={(e) => setForm({ ...form, voting_end: e.target.value })}
              disabled={!editable}
              required
            />
            <Input
              label="Titulares"
              type="number"
              min="0"
              value={form.titulares_count}
              onChange={(e) => setForm({ ...form, titulares_count: e.target.value })}
              disabled={!editable}
              required
            />
            <Input
              label="Suplentes"
              type="number"
              min="0"
              value={form.suplentes_count}
              onChange={(e) => setForm({ ...form, suplentes_count: e.target.value })}
              disabled={!editable}
              required
            />
          </div>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.allow_blank_vote}
              onChange={(e) => setForm({ ...form, allow_blank_vote: e.target.checked })}
              disabled={!editable}
            />{' '}
            Permitir voto em branco
          </label>
          <button className="button button-primary" disabled={!editable || saving}>
            {saving ? 'Salvando...' : 'Salvar configuração'}
          </button>
        </form>
      </Card>
    </div>
  )
}
