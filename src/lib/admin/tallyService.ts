import { supabase } from '../supabase/client'
import type { ElectionTally, TallyCandidate } from '../supabase/types'

export async function getElectionTally(
  electionId: string,
): Promise<{ data: ElectionTally | null; error: Error | null }> {
  if (!supabase) return { data: null, error: new Error('SUPABASE_NOT_CONFIGURED') }
  const { data, error } = await supabase.rpc('get_election_tally', { p_election_id: electionId })
  return { data: data as ElectionTally | null, error }
}

export async function getPresenceForReport(electionId: string) {
  if (!supabase) return { data: [], error: new Error('SUPABASE_NOT_CONFIGURED') }
  return supabase
    .from('voters')
    .select('name,cpf_masked,department,role,status,has_voted,voted_at')
    .eq('election_id', electionId)
    .order('name')
}

export function rankCandidates(candidates: TallyCandidate[], titulares: number, suplentes: number) {
  const ranked = [...candidates]
    .sort((a, b) => b.votes_count - a.votes_count || a.display_order - b.display_order)
    .map(
      (candidate, index) =>
        ({
          ...candidate,
          rank_position: index + 1,
          result_status:
            index < titulares
              ? 'Titular'
              : index < titulares + suplentes
                ? 'Suplente'
                : 'Candidato votado não eleito',
        }) as TallyCandidate,
    )
  const topVotes = ranked[0]?.votes_count ?? 0
  return {
    candidates: ranked,
    hasTie:
      topVotes > 0 && ranked.filter((candidate) => candidate.votes_count === topVotes).length > 1,
  }
}

export function hasAttendanceDivergence(totalAttendance: number, totalVotes: number): boolean {
  return totalAttendance !== totalVotes
}
