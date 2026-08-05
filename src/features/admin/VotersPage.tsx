import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert } from '../../components/feedback/Alert'
import { EmptyState } from '../../components/feedback/EmptyState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { Input } from '../../components/ui/Input'
import { InputCPF } from '../../components/ui/InputCPF'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { recordAuditLog } from '../../lib/admin/audit'
import {
  canEditElection,
  getElection,
  type ElectionWithCompany,
} from '../../lib/admin/electionService'
import { parseVoterCsv, type CsvVoterRow } from '../../lib/admin/csv'
import { hashCpf } from '../../lib/cpf/hashCpf'
import { maskCpf } from '../../lib/cpf/maskCpf'
import { normalizeCpf } from '../../lib/cpf/normalizeCpf'
import { validateCpf } from '../../lib/cpf/validateCpf'
import { supabase } from '../../lib/supabase/client'
import type { Voter } from '../../lib/supabase/types'

const emptyForm = { name: '', cpf: '', department: '', role: '', registrationNumber: '' }

export function VotersPage() {
  const { id = '' } = useParams()
  const [election, setElection] = useState<ElectionWithCompany | null>(null)
  const [voters, setVoters] = useState<Voter[]>([])
  const [form, setForm] = useState(emptyForm)
  const [csvRows, setCsvRows] = useState<CsvVoterRow[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    if (!supabase) {
      setLoading(false)
      setError('Supabase não configurado.')
      return
    }
    try {
      const [electionResult, votersResult] = await Promise.all([
        getElection(id),
        supabase.from('voters').select('*').eq('election_id', id).order('name'),
      ])
      setElection(electionResult.data as ElectionWithCompany | null)
      setVoters((votersResult.data as Voter[] | null) ?? [])
      if (electionResult.error || votersResult.error)
        setError('Não foi possível carregar os eleitores.')
    } catch {
      setError('Não foi possível carregar os eleitores.')
    } finally {
      setLoading(false)
    }
  }
  // load is scoped to this page and the election id is the only trigger.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    void load()
  }, [id])
  /* eslint-enable react-hooks/exhaustive-deps */

  async function createVoter(
    name: string,
    cpf: string,
    department: string | null,
    role: string | null,
    registrationNumber: string | null,
  ) {
    if (!supabase || !validateCpf(cpf)) throw new Error('CPF inválido.')
    const normalized = normalizeCpf(cpf)
    const cpfHash = await hashCpf(normalized)
    return supabase.from('voters').insert({
      election_id: id,
      name: name.trim(),
      cpf_hash: cpfHash,
      cpf_last2: normalized.slice(-2),
      cpf_masked: maskCpf(normalized),
      department,
      role,
      registration_number: registrationNumber,
      status: 'active',
      has_voted: false,
      voted_at: null,
      attendance_token: null,
    })
  }

  async function saveVoter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!election || !canEditElection(election.status)) {
      setError('Eleitores não podem ser alterados após a abertura.')
      return
    }
    setSaving(true)
    try {
      const result = await createVoter(
        form.name,
        form.cpf,
        form.department || null,
        form.role || null,
        form.registrationNumber || null,
      )
      if (result.error)
        setError(
          result.error.code === '23505'
            ? 'Este CPF já está cadastrado nesta eleição.'
            : 'Não foi possível salvar o eleitor.',
        )
      else {
        await recordAuditLog('voter_created', id)
        setMessage('Eleitor cadastrado com sucesso.')
        setForm(emptyForm)
        await load()
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível salvar o eleitor.')
    }
    setSaving(false)
  }

  async function handleCsv(file?: File) {
    if (!file) return
    setError('')
    setMessage('')
    setCsvRows(parseVoterCsv(await file.text()))
  }

  async function importCsv() {
    if (!election || !canEditElection(election.status) || !supabase) return
    const invalid = csvRows.find((row) => row.error || !validateCpf(row.cpf))
    if (invalid) {
      setError(`Linha ${invalid.line}: ${invalid.error ?? 'CPF inválido.'}`)
      return
    }
    setSaving(true)
    try {
      const payload = await Promise.all(
        csvRows.map(async (row) => {
          const normalized = normalizeCpf(row.cpf)
          return {
            election_id: id,
            name: row.name.trim(),
            cpf_hash: await hashCpf(normalized),
            cpf_last2: normalized.slice(-2),
            cpf_masked: maskCpf(normalized),
            department: row.department,
            role: row.role,
            registration_number: row.registrationNumber,
            status: 'active' as const,
            has_voted: false,
            voted_at: null,
            attendance_token: null,
          }
        }),
      )
      const result = await supabase.from('voters').insert(payload)
      if (result.error)
        setError(
          result.error.code === '23505'
            ? 'A importação contém CPF duplicado.'
            : 'Não foi possível importar a lista.',
        )
      else {
        await recordAuditLog('voters_imported', id, { rows: payload.length })
        setMessage(`${payload.length} eleitores importados.`)
        setCsvRows([])
        await load()
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível importar a lista.')
    }
    setSaving(false)
  }

  async function toggleVoter(voter: Voter) {
    if (!supabase || !election || !canEditElection(election.status) || voter.has_voted) return
    const nextStatus = voter.status === 'active' ? 'blocked' : 'active'
    const result = await supabase.from('voters').update({ status: nextStatus }).eq('id', voter.id)
    if (result.error) setError('Não foi possível alterar a situação.')
    else {
      await recordAuditLog('voter_status_changed', id, { voter_id: voter.id, status: nextStatus })
      await load()
    }
  }

  const filteredVoters = useMemo(
    () => voters.filter((voter) => voter.name.toLowerCase().includes(filter.toLowerCase())),
    [filter, voters],
  )
  if (loading)
    return (
      <div className="admin-page">
        <LoadingState label="Carregando eleitores" />
      </div>
    )
  if (!election) return <Alert tone="error">Eleição não encontrada.</Alert>
  const editable = canEditElection(election.status)

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Base eleitoral"
        title="Eleitores"
        description="Cadastre os empregados aptos sem armazenar CPF em texto aberto."
      />
      {!editable && (
        <Alert tone="warning" title="Edição bloqueada">
          A lista está protegida porque a eleição não está mais em preparação.
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      <div className="admin-form-grid voter-forms">
        <Card className="admin-form-card">
          <span className="eyebrow">Cadastro manual</span>
          <h2>Novo eleitor</h2>
          <form className="admin-form" onSubmit={saveVoter}>
            <Input
              label="Nome completo"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={!editable}
              required
            />
            <InputCPF
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              disabled={!editable}
              required
            />
            <Input
              label="Setor"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              disabled={!editable}
            />
            <Input
              label="Função"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              disabled={!editable}
            />
            <Input
              label="Matrícula"
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
              disabled={!editable}
            />
            <button className="button button-primary" disabled={!editable || saving}>
              {saving ? 'Salvando...' : 'Cadastrar eleitor'}
            </button>
          </form>
        </Card>
        <Card className="admin-form-card">
          <span className="eyebrow">Importação simples</span>
          <h2>Importar CSV</h2>
          <p className="form-help">Colunas aceitas: `nome,cpf,setor,funcao,matricula`.</p>
          <label className={`csv-dropzone ${!editable ? 'disabled' : ''}`}>
            <span>Escolher arquivo CSV</span>
            <small>Pré-visualização antes de confirmar</small>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => void handleCsv(e.target.files?.[0])}
              disabled={!editable}
            />
          </label>
          {csvRows.length > 0 && (
            <div className="csv-preview">
              <strong>{csvRows.length} linhas encontradas</strong>
              <span>
                {csvRows.filter((row) => row.error || !validateCpf(row.cpf)).length} com erro
              </span>
              <button
                className="button button-secondary"
                onClick={() => void importCsv()}
                disabled={!editable || saving}
              >
                Confirmar importação
              </button>
            </div>
          )}
        </Card>
      </div>
      <Card className="admin-list-card">
        <div className="card-heading-row">
          <div>
            <span className="eyebrow">Presença administrativa</span>
            <h2>{voters.length} eleitores</h2>
          </div>
          <Input
            label=""
            aria-label="Filtrar eleitores"
            placeholder="Filtrar por nome"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        {filteredVoters.length === 0 ? (
          <EmptyState
            title="Nenhum eleitor encontrado"
            description="Cadastre manualmente ou importe um CSV para começar."
          />
        ) : (
          <DataTable
            columns={[
              { key: 'name', label: 'Nome', render: (row) => <strong>{row.name}</strong> },
              { key: 'cpf', label: 'CPF', render: (row) => row.cpf_masked ?? '***.***.***-**' },
              { key: 'role', label: 'Função', render: (row) => row.role ?? 'Não informado' },
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
                key: 'actions',
                label: 'Ação',
                render: (row) => (
                  <button
                    className="text-button"
                    disabled={!editable || row.has_voted}
                    onClick={() => void toggleVoter(row)}
                  >
                    {row.status === 'active' ? 'Bloquear' : 'Ativar'}
                  </button>
                ),
              },
            ]}
            rows={filteredVoters}
            rowKey={(row) => row.id}
          />
        )}
      </Card>
    </div>
  )
}
