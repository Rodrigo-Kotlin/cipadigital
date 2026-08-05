import type { ElectionStatus, Vote } from '../supabase/types'

export type VoteChoice = Pick<Vote, 'election_id' | 'candidate_id' | 'is_blank'>

const forbiddenVoteKeys = [
  'voter_id',
  'cpf',
  'cpf_hash',
  'name',
  'registration_number',
  'department',
  'role',
  'attendance_token',
  'ip_address',
  'token',
] as const

export function validateVoteChoice(choice: VoteChoice): boolean {
  return choice.is_blank ? choice.candidate_id === null : choice.candidate_id !== null
}

export function canVoteInStatus(status: ElectionStatus): boolean {
  return status === 'open'
}

export function isAnonymousVote(value: unknown): value is VoteChoice {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (forbiddenVoteKeys.some((key) => key in record)) return false

  return (
    typeof record.election_id === 'string' &&
    typeof record.is_blank === 'boolean' &&
    (record.candidate_id === null || typeof record.candidate_id === 'string') &&
    validateVoteChoice(record as VoteChoice)
  )
}

export const voteSecurityRules = Object.freeze({
  presenceAndVoteAreSeparate: true,
  voteMayNotContainVoterIdentifier: true,
  resultVisibleOnlyAfterClose: true,
})
