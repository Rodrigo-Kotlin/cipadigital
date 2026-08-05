import { normalizeCpf } from './normalizeCpf'
import { validateCpf } from './validateCpf'
import { supabase } from '../supabase/client'

export async function hashCpf(value: string): Promise<string> {
  const cpf = normalizeCpf(value)
  if (!validateCpf(cpf)) throw new Error('CPF inválido.')
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED')

  const { data, error } = await supabase.functions.invoke<{ hash: string }>('hash-cpf', {
    body: { cpf },
  })
  if (error) throw error
  if (!data?.hash || !/^[a-f0-9]{64}$/.test(data.hash)) {
    throw new Error('CPF_HASH_INVALID_RESPONSE')
  }
  return data.hash
}
