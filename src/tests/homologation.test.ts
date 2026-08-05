import migration from '../../supabase/migrations/0001_initial_schema.sql?raw'
import seed from '../../supabase/seed/arati_seed.sql?raw'
import { describe, expect, it } from 'vitest'

describe('Supabase homologation package', () => {
  it('contains all required ARATI staging data', () => {
    expect(seed).toContain('ARATI DISTRIBUIDORA DE BEBIDAS E ALIMENTOS LTDA')
    expect(seed).toContain('10.712.785/0001-89')
    expect(seed).toContain('arati-2026-2027')
    expect(seed).toContain("'2026-08-06'")
    expect(seed).toContain(', 53, 1, 1')
    expect(seed).toContain('Rosiane Farias')
    expect(seed).toContain('Mateus Silveira Duarte')
    expect(seed).toContain('João Sarmento Paz')
    expect(seed).toContain('Emerson Rodrigues Bastos')
  })

  it('contains the complete RPC and RLS package for homologation', () => {
    for (const rpc of [
      'cast_vote',
      'verify_voter_access',
      'get_public_election',
      'get_active_candidates',
      'get_election_tally',
      'transition_election_status',
    ]) {
      expect(migration).toContain(`function public.${rpc}`)
    }
    for (const table of [
      'companies',
      'elections',
      'candidates',
      'voters',
      'votes',
      'admin_users',
      'audit_logs',
    ]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`)
    }
    expect(migration).toContain(
      'revoke insert, update, delete on public.votes from anon, authenticated',
    )
  })
})
