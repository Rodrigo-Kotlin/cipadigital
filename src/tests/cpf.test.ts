import { describe, expect, it } from 'vitest'
import { hashCpfForTest } from '../lib/cpf/hashCpfForTest'
import { maskCpf } from '../lib/cpf/maskCpf'
import { normalizeCpf } from '../lib/cpf/normalizeCpf'
import { validateCpf } from '../lib/cpf/validateCpf'

describe('CPF utilities', () => {
  it('normalizes punctuation and spaces', () => {
    expect(normalizeCpf(' 529.982.247-25 ')).toBe('52998224725')
  })

  it('accepts valid CPF and rejects invalid or repeated digits', () => {
    expect(validateCpf('529.982.247-25')).toBe(true)
    expect(validateCpf('529.982.247-26')).toBe(false)
    expect(validateCpf('111.111.111-11')).toBe(false)
  })

  it('masks CPF without exposing the first digits', () => {
    expect(maskCpf('529.982.247-25')).toBe('***.***.***-25')
  })

  it('generates a stable salted hash and separates different CPFs', async () => {
    const salt = 'test-only-salt'
    const first = await hashCpfForTest('529.982.247-25', salt)
    const same = await hashCpfForTest('52998224725', salt)
    const other = await hashCpfForTest('123.456.789-09', salt)

    expect(first).toHaveLength(64)
    expect(first).toBe(same)
    expect(first).not.toBe(other)
  })
})
