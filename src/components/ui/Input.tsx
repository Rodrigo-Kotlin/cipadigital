import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

export function Input({ id, label, hint, error, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replaceAll(' ', '-')

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className={`input ${error ? 'input-error' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={hint || error ? `${inputId}-hint` : undefined}
        {...props}
      />
      {(hint || error) && (
        <span
          id={`${inputId}-hint`}
          className={error ? 'field-message field-error' : 'field-message'}
        >
          {error ?? hint}
        </span>
      )}
    </div>
  )
}
