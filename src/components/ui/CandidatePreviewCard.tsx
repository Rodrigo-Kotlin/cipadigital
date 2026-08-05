interface CandidatePreviewCardProps {
  name: string
  role: string
  phrase: string
  photoLabel?: string
}

export function CandidatePreviewCard({
  name,
  role,
  phrase,
  photoLabel = 'Foto',
}: CandidatePreviewCardProps) {
  return (
    <article className="candidate-card">
      <div className="candidate-photo" role="img" aria-label={`${photoLabel} de ${name}`}>
        {name.charAt(0)}
      </div>
      <div className="candidate-details">
        <span className="eyebrow">Candidato</span>
        <h3>{name}</h3>
        <span className="candidate-role">{role}</span>
        <p>“{phrase}”</p>
      </div>
    </article>
  )
}
