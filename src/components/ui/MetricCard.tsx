interface MetricCardProps {
  label: string
  value: string
  detail: string
  tone?: 'green' | 'amber' | 'slate'
}

export function MetricCard({ label, value, detail, tone = 'green' }: MetricCardProps) {
  return (
    <article className={`metric-card metric-card-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}
