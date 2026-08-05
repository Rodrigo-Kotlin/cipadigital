import { supabase } from '../supabase/client'
import type { PublicCandidate, PublicElection, VoterAccessResult } from '../supabase/types'

export async function getElectionBySlug(
  slug: string,
): Promise<{ data: PublicElection | null; error: Error | null }> {
  if (!supabase) return { data: null, error: new Error('SUPABASE_NOT_CONFIGURED') }
  try {
    const result = await Promise.race([
      supabase.rpc('get_public_election', { p_election_slug: slug }),
      new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error('SUPABASE_REQUEST_TIMEOUT')), 8000),
      ),
    ])
    return {
      data: (Array.isArray(result.data) ? result.data[0] : result.data) as PublicElection | null,
      error: result.error,
    }
  } catch (caught) {
    return {
      data: null,
      error: caught instanceof Error ? caught : new Error(String(caught)),
    }
  }
}

export async function verifyVoterAccess(
  slug: string,
  cpfHash: string,
): Promise<{ data: VoterAccessResult | null; error: Error | null }> {
  if (!supabase) return { data: null, error: new Error('SUPABASE_NOT_CONFIGURED') }
  const { data, error } = await supabase.rpc('verify_voter_access', {
    p_election_slug: slug,
    p_cpf_hash: cpfHash,
  })
  return { data: (Array.isArray(data) ? data[0] : data) as VoterAccessResult | null, error }
}

export async function getActiveCandidates(
  slug: string,
): Promise<{ data: PublicCandidate[]; error: Error | null }> {
  if (!supabase) return { data: [], error: new Error('SUPABASE_NOT_CONFIGURED') }
  const { data, error } = await supabase.rpc('get_active_candidates', { p_election_slug: slug })
  return { data: (data as PublicCandidate[] | null) ?? [], error }
}

export async function submitVote(
  slug: string,
  cpfHash: string,
  candidateId: string | null,
  isBlank: boolean,
) {
  if (!supabase) return { data: null, error: new Error('SUPABASE_NOT_CONFIGURED') }
  return supabase.rpc('cast_vote', {
    p_election_slug: slug,
    p_cpf_hash: cpfHash,
    p_candidate_id: candidateId,
    p_is_blank: isBlank,
  })
}

export function mapVotingError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '')
  if (message.includes('ELECTION_NOT_FOUND')) return 'Eleição não localizada.'
  if (message.includes('ELECTION_PAUSED')) return 'A votação está temporariamente pausada.'
  if (message.includes('ELECTION_CLOSED')) return 'A votação foi encerrada.'
  if (message.includes('ELECTION_NOT_OPEN') || message.includes('VOTING_OUTSIDE_WINDOW'))
    return 'A votação não está disponível neste momento.'
  if (message.includes('VOTER_NOT_FOUND'))
    return 'CPF não localizado na lista de eleitores aptos. Procure a Comissão Eleitoral.'
  if (message.includes('VOTER_NOT_ACTIVE'))
    return 'Eleitor não habilitado para votação. Procure a Comissão Eleitoral.'
  if (message.includes('VOTER_ALREADY_VOTED'))
    return 'Voto já registrado para este CPF. Obrigado pela participação.'
  if (message.includes('SUPABASE_NOT_CONFIGURED'))
    return 'A votação está temporariamente indisponível. Procure a Comissão Eleitoral.'
  if (message.includes('SUPABASE_REQUEST_TIMEOUT'))
    return 'O serviço demorou a responder. Tente novamente em instantes.'
  return 'Não foi possível concluir esta etapa. Tente novamente ou procure a Comissão Eleitoral.'
}
