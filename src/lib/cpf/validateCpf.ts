import { normalizeCpf } from './normalizeCpf'

export function validateCpf(value: string): boolean {
  const cpf = normalizeCpf(value)

  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false

  const digits = cpf.split('').map(Number)
  const firstSum = digits.slice(0, 9).reduce((sum, digit, index) => sum + digit * (10 - index), 0)
  const firstCheck = (firstSum * 10) % 11 === 10 ? 0 : (firstSum * 10) % 11
  if (firstCheck !== digits[9]) return false

  const secondSum = digits.slice(0, 10).reduce((sum, digit, index) => sum + digit * (11 - index), 0)
  const secondCheck = (secondSum * 10) % 11 === 10 ? 0 : (secondSum * 10) % 11
  return secondCheck === digits[10]
}
