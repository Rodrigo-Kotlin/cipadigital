import type { ElectionStatus, PublicElection } from '../supabase/types'

export type VotingAvailabilityReason =
  | 'not_configured'
  | 'not_started'
  | 'outside_window'
  | 'paused'
  | 'closed'
  | 'tallied'
  | 'archived'
  | 'available'

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value))
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value))
}

export function formatVotingWindow(election: Pick<PublicElection, 'voting_start' | 'voting_end'>) {
  return `Período de votação: ${formatDate(election.voting_start)}, das ${formatTime(election.voting_start)} às ${formatTime(election.voting_end)}.`
}

export function getVotingAvailability(
  election: Pick<PublicElection, 'status' | 'voting_start' | 'voting_end'>,
  now = new Date(),
): { available: boolean; reason: VotingAvailabilityReason; message: string } {
  const start = new Date(election.voting_start).getTime()
  const end = new Date(election.voting_end).getTime()
  const timestamp = now.getTime()
  const period = formatVotingWindow(election)

  if (election.status === 'draft')
    return {
      available: false,
      reason: 'not_configured',
      message: 'A votação ainda não foi configurada para abertura.',
    }
  if (election.status === 'scheduled' && timestamp < start)
    return {
      available: false,
      reason: 'not_started',
      message: `A votação ainda não iniciou. ${period}`,
    }
  if (election.status === 'scheduled')
    return {
      available: false,
      reason: 'not_started',
      message: `A votação está agendada, mas ainda não foi aberta. ${period}`,
    }
  if (election.status === 'paused')
    return {
      available: false,
      reason: 'paused',
      message: 'A votação está temporariamente pausada. Procure a Comissão Eleitoral.',
    }
  if (election.status === 'closed')
    return { available: false, reason: 'closed', message: 'A votação foi encerrada.' }
  if (election.status === 'tallied')
    return {
      available: false,
      reason: 'tallied',
      message: 'A votação foi encerrada e a apuração já foi realizada.',
    }
  if (election.status === 'archived')
    return { available: false, reason: 'archived', message: 'Esta eleição está arquivada.' }
  if (timestamp < start)
    return {
      available: false,
      reason: 'not_started',
      message: `A votação ainda não iniciou. ${period}`,
    }
  if (timestamp > end)
    return {
      available: false,
      reason: 'outside_window',
      message: `A votação está aberta, mas o horário permitido já terminou. ${period} Procure a Comissão Eleitoral.`,
    }
  return { available: true, reason: 'available', message: '' }
}

export function isElectionWindowExpired(
  status: ElectionStatus,
  votingEnd: string,
  now = new Date(),
) {
  return status === 'open' && now.getTime() > new Date(votingEnd).getTime()
}
