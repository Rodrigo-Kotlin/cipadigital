import type { Election, ElectionStatus } from '../supabase/types'
import { supabase } from '../supabase/client'

export const statusLabels: Record<ElectionStatus, string> = {
  draft: 'Preparação',
  scheduled: 'Agendada',
  open: 'Aberta',
  paused: 'Pausada',
  closed: 'Encerrada',
  tallied: 'Apurada',
  archived: 'Arquivada',
}

export function canEditElection(status: ElectionStatus): boolean {
  return status === 'draft' || status === 'scheduled'
}

export function canEditCandidates(status: ElectionStatus): boolean {
  return canEditElection(status)
}

export async function listElections() {
  if (!supabase) return { data: [], error: new Error('Supabase não configurado.') }
  return supabase.from('elections').select('*').order('voting_date', { ascending: false })
}

export async function getElection(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') }
  return supabase.from('elections').select('*, companies(*)').eq('id', id).maybeSingle()
}

export async function transitionElectionStatus(id: string, targetStatus: ElectionStatus) {
  if (!supabase) return { data: null, error: new Error('Supabase não configurado.') }
  return supabase.rpc('transition_election_status', {
    p_election_id: id,
    p_target_status: targetStatus,
  })
}

export type ElectionWithCompany = Election & {
  companies: { name: string; cnpj: string | null } | null
}
