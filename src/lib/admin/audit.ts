import { supabase } from '../supabase/client'

export async function recordAuditLog(
  action: string,
  electionId?: string,
  details: Record<string, unknown> = {},
) {
  if (!supabase) return { error: new Error('Supabase não configurado.') }
  const { data: authData } = await supabase.auth.getUser()

  return supabase.from('audit_logs').insert({
    election_id: electionId ?? null,
    actor_id: authData.user?.id ?? null,
    action,
    details,
    ip_address: null,
    user_agent: typeof navigator === 'undefined' ? null : navigator.userAgent,
  })
}
