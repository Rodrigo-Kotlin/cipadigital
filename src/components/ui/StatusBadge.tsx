type StatusBadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

interface StatusBadgeProps {
  children: string
  tone?: StatusBadgeTone
}

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return <span className={`status-badge status-badge-${tone}`}>{children}</span>
}
