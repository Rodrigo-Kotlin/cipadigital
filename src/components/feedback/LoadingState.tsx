interface LoadingStateProps {
  label?: string
}

export function LoadingState({ label = 'Carregando informações' }: LoadingStateProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
