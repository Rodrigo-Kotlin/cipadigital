import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert } from '../../components/feedback/Alert'
import { EmptyState } from '../../components/feedback/EmptyState'
import { Card } from '../../components/ui/Card'
import { CandidatePreviewCard } from '../../components/ui/CandidatePreviewCard'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { recordAuditLog } from '../../lib/admin/audit'
import {
  candidatePhotoAccept,
  candidatePhotoMaxBytes,
  removeCandidatePhoto,
  uploadCandidatePhoto,
  validateCandidatePhoto,
} from '../../lib/admin/candidatePhotoService'
import {
  canEditCandidates,
  getElection,
  type ElectionWithCompany,
} from '../../lib/admin/electionService'
import { supabase } from '../../lib/supabase/client'
import type { Candidate } from '../../lib/supabase/types'

const emptyForm = { name: '', role: '', slogan: '', photo_url: '', display_order: '1' }

export function CandidatesPage() {
  const { id = '' } = useParams()
  const [election, setElection] = useState<ElectionWithCompany | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  async function load() {
    if (!supabase) {
      setLoading(false)
      setError('Supabase não configurado.')
      return
    }
    const [electionResult, candidatesResult] = await Promise.all([
      getElection(id),
      supabase.from('candidates').select('*').eq('election_id', id).order('display_order'),
    ])
    setElection(electionResult.data as ElectionWithCompany | null)
    setCandidates((candidatesResult.data as Candidate[] | null) ?? [])
    if (electionResult.error || candidatesResult.error)
      setError('Não foi possível carregar os candidatos.')
    setLoading(false)
  }

  // load is scoped to this page and the election id is the only trigger.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    void load()
  }, [id])
  /* eslint-enable react-hooks/exhaustive-deps */

  function editCandidate(candidate: Candidate) {
    setEditingId(candidate.id)
    setForm({
      name: candidate.name,
      role: candidate.role,
      slogan: candidate.slogan ?? '',
      photo_url: candidate.photo_url ?? '',
      display_order: String(candidate.display_order),
    })
    setSelectedPhoto(null)
    setPhotoPreviewUrl(candidate.photo_url)
    setMessage('')
  }

  function resetCandidateForm() {
    setEditingId(null)
    setForm(emptyForm)
    setSelectedPhoto(null)
    setPhotoPreviewUrl(null)
  }

  function handlePhotoChange(file?: File) {
    if (!file) return
    const validationError = validateCandidatePhoto(file)
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setSelectedPhoto(file)
    setPhotoPreviewUrl(URL.createObjectURL(file))
  }

  async function uploadPhoto() {
    if (!selectedPhoto || !editingId || !supabase || !election) {
      setError('Salve o candidato antes de enviar a foto.')
      return
    }
    setPhotoUploading(true)
    setError('')
    const result = await uploadCandidatePhoto(
      election.slug,
      editingId,
      selectedPhoto,
      form.photo_url || null,
    )
    if (result.error || !result.url) setError('Não foi possível enviar a foto.')
    else {
      const update = await supabase
        .from('candidates')
        .update({ photo_url: result.url })
        .eq('id', editingId)
      if (update.error) setError('A foto foi enviada, mas não foi vinculada ao candidato.')
      else {
        setForm((current) => ({ ...current, photo_url: result.url ?? '' }))
        setSelectedPhoto(null)
        setPhotoPreviewUrl(result.url)
        setMessage('Foto enviada com sucesso.')
        await recordAuditLog('candidate_photo_uploaded', id, { candidate_id: editingId })
        await load()
      }
    }
    setPhotoUploading(false)
  }

  async function clearPhoto() {
    if (!editingId || !supabase) return
    setPhotoUploading(true)
    const previousUrl = form.photo_url || null
    const storageResult = await removeCandidatePhoto(previousUrl)
    const update = await supabase.from('candidates').update({ photo_url: null }).eq('id', editingId)
    if (storageResult.error || update.error) setError('Não foi possível remover a foto.')
    else {
      setForm((current) => ({ ...current, photo_url: '' }))
      setSelectedPhoto(null)
      setPhotoPreviewUrl(null)
      setMessage('Foto removida.')
      await recordAuditLog('candidate_photo_removed', id, { candidate_id: editingId })
      await load()
    }
    setPhotoUploading(false)
  }

  async function saveCandidate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !election || !canEditCandidates(election.status)) return
    setSaving(true)
    setMessage('')
    setError('')
    const payload = {
      election_id: id,
      name: form.name.trim(),
      role: form.role.trim(),
      slogan: form.slogan.trim() || null,
      photo_url: form.photo_url.trim() || null,
      display_order: Number(form.display_order),
      active: true,
    }
    const result = editingId
      ? await supabase.from('candidates').update(payload).eq('id', editingId)
      : await supabase.from('candidates').insert(payload)
    if (result.error)
      setError(
        result.error.code === '23505'
          ? 'Essa ordem já está em uso nesta eleição.'
          : 'Não foi possível salvar o candidato.',
      )
    else {
      await recordAuditLog(editingId ? 'candidate_updated' : 'candidate_created', id, {
        candidate_id: editingId ?? 'new',
      })
      setMessage('Candidato salvo com sucesso.')
      resetCandidateForm()
      await load()
    }
    setSaving(false)
  }

  async function toggleCandidate(candidate: Candidate) {
    if (!supabase || !election || !canEditCandidates(election.status)) return
    const result = await supabase
      .from('candidates')
      .update({ active: !candidate.active })
      .eq('id', candidate.id)
    if (result.error) setError('Não foi possível alterar a situação.')
    else {
      await recordAuditLog(
        candidate.active ? 'candidate_deactivated' : 'candidate_reactivated',
        id,
        { candidate_id: candidate.id },
      )
      await load()
    }
  }

  if (loading)
    return (
      <div className="admin-page">
        <PageHeader eyebrow="Candidatos" title="Candidatos" />
        <div className="admin-form-grid">
          <Card>
            <span className="skeleton-line" />
          </Card>
        </div>
      </div>
    )
  if (!election) return <Alert tone="error">Eleição não encontrada.</Alert>
  const editable = canEditCandidates(election.status)

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Participantes · Candidatos"
        title="Candidatos"
        description="Prepare a lista que será exibida aos eleitores."
      />
      {!editable && (
        <Alert tone="warning" title="Edição bloqueada">
          A eleição está {election.status}. Candidatos não podem ser alterados neste status.
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      <div className="admin-form-grid">
        <Card className="admin-form-card">
          <div className="card-heading-row">
            <div>
              <span className="eyebrow">{editingId ? 'Editar' : 'Novo'}</span>
              <h2>{editingId ? 'Editar candidato' : 'Cadastrar candidato'}</h2>
            </div>
          </div>
          <form className="admin-form" onSubmit={saveCandidate}>
            <Input
              label="Nome completo"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              disabled={!editable}
              required
            />
            <Input
              label="Função"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
              disabled={!editable}
              required
            />
            <Input
              label="Frase"
              value={form.slogan}
              onChange={(event) => setForm({ ...form, slogan: event.target.value })}
              disabled={!editable}
            />
            <Input
              label="URL da foto (opcional)"
              type="url"
              value={form.photo_url}
              onChange={(event) => setForm({ ...form, photo_url: event.target.value })}
              disabled={!editable}
              hint="Você também pode enviar JPG, PNG ou WebP pelo Storage."
            />
            <div className="photo-upload-field">
              <label htmlFor="candidate-photo">Foto do candidato</label>
              <input
                id="candidate-photo"
                type="file"
                accept={candidatePhotoAccept}
                disabled={!editable || photoUploading}
                onChange={(event) => handlePhotoChange(event.target.files?.[0])}
              />
              <small>
                JPG, JPEG, PNG ou WebP · máximo {candidatePhotoMaxBytes / 1024 / 1024} MB · prefira
                imagem quadrada.
              </small>
              {photoPreviewUrl && (
                <img
                  className="candidate-photo-upload-preview"
                  src={photoPreviewUrl}
                  alt="Pré-visualização da foto"
                />
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={!editable || !editingId || !selectedPhoto || photoUploading}
                  onClick={() => void uploadPhoto()}
                >
                  {photoUploading ? 'Enviando...' : 'Enviar foto'}
                </button>
                {editingId && form.photo_url && (
                  <button
                    type="button"
                    className="button button-ghost"
                    disabled={!editable || photoUploading}
                    onClick={() => void clearPhoto()}
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>
            <Input
              label="Ordem de exibição"
              type="number"
              min="1"
              value={form.display_order}
              onChange={(event) => setForm({ ...form, display_order: event.target.value })}
              disabled={!editable}
              required
            />
            <div className="form-actions">
              <button className="button button-primary" disabled={!editable || saving}>
                {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar candidato'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => {
                    resetCandidateForm()
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </Card>
        <div className="candidate-preview-column">
          <span className="eyebrow">Pré-visualização</span>
          <CandidatePreviewCard
            name={form.name || 'Nome do candidato'}
            role={form.role || 'Função'}
            phrase={form.slogan || 'A frase aparecerá aqui.'}
            photoUrl={photoPreviewUrl}
          />
        </div>
      </div>
      <Card className="admin-list-card">
        <div className="card-heading-row">
          <div>
            <span className="eyebrow">Lista atual</span>
            <h2>{candidates.length} candidatos</h2>
          </div>
          <StatusBadge tone="neutral">{editable ? 'Editável' : 'Somente leitura'}</StatusBadge>
        </div>
        {candidates.length === 0 ? (
          <EmptyState
            title="Nenhum candidato cadastrado"
            description="Use o formulário para adicionar o primeiro candidato."
          />
        ) : (
          <div className="candidate-admin-list">
            {candidates.map((candidate) => (
              <div
                className={`candidate-admin-row ${candidate.active ? '' : 'inactive'}`}
                key={candidate.id}
              >
                <div className="candidate-order">
                  {String(candidate.display_order).padStart(2, '0')}
                </div>
                <div className="candidate-admin-photo" aria-label={`Foto de ${candidate.name}`}>
                  {candidate.photo_url ? (
                    <img src={candidate.photo_url} alt="" />
                  ) : (
                    candidate.name.charAt(0)
                  )}
                </div>
                <div className="candidate-admin-info">
                  <strong>{candidate.name}</strong>
                  <span>{candidate.role}</span>
                </div>
                <StatusBadge tone={candidate.active ? 'success' : 'neutral'}>
                  {candidate.active ? 'Ativo' : 'Inativo'}
                </StatusBadge>
                <div className="row-actions">
                  <button
                    className="text-button"
                    disabled={!editable}
                    onClick={() => editCandidate(candidate)}
                  >
                    Editar
                  </button>
                  <button
                    className="text-button"
                    disabled={!editable}
                    onClick={() => void toggleCandidate(candidate)}
                  >
                    {candidate.active ? 'Inativar' : 'Reativar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
