import { normalizeCpf } from './normalizeCpf'

export function maskCpf(value: string): string {
  const cpf = normalizeCpf(value)
  const suffix = cpf.length >= 2 ? cpf.slice(-2) : '**'
  return `***.***.***-${suffix}`
}
