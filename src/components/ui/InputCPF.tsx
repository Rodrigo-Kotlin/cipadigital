import type { InputHTMLAttributes } from 'react'
import { Input } from './Input'

interface InputCPFProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id?: string
  error?: string
  hint?: string
}

export function InputCPF({ error, hint, id = 'cpf', ...props }: InputCPFProps) {
  return (
    <Input
      id={id}
      label="CPF do eleitor"
      placeholder="000.000.000-00"
      inputMode="numeric"
      autoComplete="off"
      hint={hint ?? 'Digite os 11 números do seu CPF.'}
      error={error}
      {...props}
    />
  )
}
