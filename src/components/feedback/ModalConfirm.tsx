import type { ReactNode } from 'react'
import { Button } from '../ui/Button'

interface ModalConfirmProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  onCancel?: () => void
  children?: ReactNode
}

export function ModalConfirm({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  children,
}: ModalConfirmProps) {
  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <span className="modal-kicker">Confirmação necessária</span>
        <h2 id="modal-title">{title}</h2>
        <p>{description}</p>
        {children}
        <div className="modal-actions">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </section>
    </div>
  )
}
