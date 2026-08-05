import migration from '../../supabase/migrations/0001_initial_schema.sql?raw'
import { describe, expect, it } from 'vitest'
import type { Vote } from '../lib/supabase/types'
import {
  canVoteInStatus,
  isAnonymousVote,
  validateVoteChoice,
  voteSecurityRules,
} from '../lib/security/votingRules'

describe('anonymous vote model', () => {
  it('defines a Vote without a voter identifier', () => {
    const vote: Vote = {
      id: 'vote-id',
      election_id: 'election-id',
      candidate_id: 'candidate-id',
      is_blank: false,
      created_at: new Date().toISOString(),
    }

    expect('voter_id' in vote).toBe(false)
    expect(isAnonymousVote(vote)).toBe(true)
    expect(voteSecurityRules.presenceAndVoteAreSeparate).toBe(true)
  })

  it('enforces blank and nominal choice invariants', () => {
    expect(validateVoteChoice({ election_id: 'e', candidate_id: null, is_blank: true })).toBe(true)
    expect(validateVoteChoice({ election_id: 'e', candidate_id: 'c', is_blank: false })).toBe(true)
    expect(validateVoteChoice({ election_id: 'e', candidate_id: 'c', is_blank: true })).toBe(false)
    expect(validateVoteChoice({ election_id: 'e', candidate_id: null, is_blank: false })).toBe(
      false,
    )
  })

  it('rejects an attempted association in a vote payload', () => {
    expect(
      isAnonymousVote({ election_id: 'e', candidate_id: 'c', is_blank: false, cpf: '52998224725' }),
    ).toBe(false)
    expect(
      isAnonymousVote({ election_id: 'e', candidate_id: 'c', is_blank: false, voter_id: 'voter' }),
    ).toBe(false)
  })

  it('keeps forbidden voter fields out of the votes table migration', () => {
    const votesTable = migration.match(/create table public\.votes \([\s\S]*?\n\);/)?.[0]

    expect(votesTable).toBeDefined()
    expect(votesTable).not.toMatch(
      /voter_id|cpf|registration_number|attendance_token|ip_address|name|department|role/,
    )
  })

  it('allows voting only while an election is open', () => {
    expect(canVoteInStatus('open')).toBe(true)
    for (const status of [
      'draft',
      'scheduled',
      'paused',
      'closed',
      'tallied',
      'archived',
    ] as const) {
      expect(canVoteInStatus(status)).toBe(false)
    }
  })

  it('keeps the database security boundaries enabled', () => {
    expect(migration).toMatch(/alter table public\.votes enable row level security/)
    expect(migration).toMatch(
      /revoke insert, update, delete on public\.votes from anon, authenticated/,
    )
    expect(migration).toMatch(/create or replace function public\.get_election_tally/)
    expect(migration).toMatch(/create or replace function public\.verify_voter_access/)
    expect(migration).not.toMatch(/create policy .* on public\.votes/i)
  })
})
