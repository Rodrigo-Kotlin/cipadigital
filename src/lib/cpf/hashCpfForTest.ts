import { normalizeCpf } from './normalizeCpf'
import { validateCpf } from './validateCpf'

/** Test-only reference for the Edge Function hashing contract. */
export async function hashCpfForTest(value: string, salt: string): Promise<string> {
  const cpf = normalizeCpf(value)
  if (!validateCpf(cpf)) throw new Error('CPF inválido.')
  const data = new TextEncoder().encode(`${salt}:${cpf}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
