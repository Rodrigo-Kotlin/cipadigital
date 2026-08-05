import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type TurnstileVerification = {
  allowed: boolean
  reason: string
  siteverifySuccess: boolean
  errorCodes: string[]
  hostname?: string
  action?: string
}

function logEvent(event: string, fields: Record<string, unknown> = {}) {
  console.info(JSON.stringify({ event, ...fields }))
}

function safeReason(value: unknown): string {
  const reason = String(value ?? '')
  return /^[A-Z0-9_]+$/.test(reason) ? reason : 'RPC_ERROR'
}

function normalizeCpf(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '')
}

function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false
  let sum = 0
  for (let index = 0; index < 9; index += 1) sum += Number(cpf[index]) * (10 - index)
  let digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== Number(cpf[9])) return false
  sum = 0
  for (let index = 0; index < 10; index += 1) sum += Number(cpf[index]) * (11 - index)
  digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  return digit === Number(cpf[10])
}

async function hashCpf(cpf: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${cpf}`))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function verifyTurnstile(
  token: unknown,
  secret: string,
  request: Request,
  expectedAction: string,
): Promise<TurnstileVerification> {
  if (typeof token !== 'string' || token.length === 0)
    return {
      allowed: false,
      reason: 'TURNSTILE_TOKEN_MISSING',
      siteverifySuccess: false,
      errorCodes: [],
    }
  if (token.length > 2048)
    return {
      allowed: false,
      reason: 'TURNSTILE_TOKEN_INVALID',
      siteverifySuccess: false,
      errorCodes: [],
    }
  const form = new URLSearchParams({ secret, response: token })
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwardedFor) form.set('remoteip', forwardedFor)
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok)
      return {
        allowed: false,
        reason: 'TURNSTILE_SITEVERIFY_HTTP_ERROR',
        siteverifySuccess: false,
        errorCodes: [],
      }
    const result = await response.json()
    const allowedHostnames = (Deno.env.get('TURNSTILE_HOSTNAMES') ?? '')
      .split(',')
      .map((hostname) => hostname.trim())
      .filter(Boolean)
    const errorCodes = Array.isArray(result['error-codes'])
      ? result['error-codes'].filter((code: unknown): code is string => typeof code === 'string')
      : []
    const siteverifySuccess = result.success === true
    const hostnameAllowed = allowedHostnames.includes(result.hostname)
    const actionAllowed = result.action === expectedAction
    let reason = 'TURNSTILE_TOKEN_INVALID'
    if (siteverifySuccess && !hostnameAllowed) reason = 'TURNSTILE_HOSTNAME_NOT_ALLOWED'
    else if (siteverifySuccess && !actionAllowed) reason = 'TURNSTILE_ACTION_MISMATCH'
    else if (errorCodes.includes('timeout-or-duplicate')) reason = 'TURNSTILE_TOKEN_EXPIRED_OR_USED'
    return {
      allowed: siteverifySuccess && hostnameAllowed && actionAllowed,
      reason,
      siteverifySuccess,
      errorCodes,
      hostname: typeof result.hostname === 'string' ? result.hostname : undefined,
      action: typeof result.action === 'string' ? result.action : undefined,
    }
  } catch {
    return {
      allowed: false,
      reason: 'TURNSTILE_SITEVERIFY_UNAVAILABLE',
      siteverifySuccess: false,
      errorCodes: [],
    }
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST')
    return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: corsHeaders })

  try {
    const body = await request.json()
    const action = body.action
    const electionSlug = String(body.electionSlug ?? '')
    logEvent('request_received', {
      action_received: action,
      action_allowed: ['voter_access', 'cast_vote'].includes(action),
      token_present: typeof body.turnstileToken === 'string' && body.turnstileToken.length > 0,
      election_slug: electionSlug,
    })
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
    const cpfHashSalt = Deno.env.get('CPF_HASH_SALT')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!turnstileSecret || !cpfHashSalt || !supabaseUrl || !serviceRoleKey)
      return Response.json(
        { error: 'GATEWAY_NOT_CONFIGURED' },
        { status: 503, headers: corsHeaders },
      )
    const verification = await verifyTurnstile(
      body.turnstileToken,
      turnstileSecret,
      request,
      action,
    )
    logEvent('turnstile_verification', {
      turnstile_siteverify_success: verification.siteverifySuccess,
      turnstile_error_codes: verification.errorCodes,
      turnstile_hostname: verification.hostname,
      hostname_allowed:
        verification.siteverifySuccess && verification.reason !== 'TURNSTILE_HOSTNAME_NOT_ALLOWED',
      turnstile_action: verification.action,
      action_allowed:
        verification.siteverifySuccess && verification.reason !== 'TURNSTILE_ACTION_MISMATCH',
    })
    if (!['voter_access', 'cast_vote'].includes(action) || !verification.allowed) {
      logEvent('decision', { decision: 'deny', deny_reason: verification.reason })
      return Response.json(
        {
          error: 'TURNSTILE_FAILED',
          diagnostic: verification.reason,
          turnstile_error_codes: verification.errorCodes,
        },
        { status: 403, headers: corsHeaders },
      )
    }

    const cpf = normalizeCpf(body.cpf)
    if (!isValidCpf(cpf))
      return Response.json({ error: 'INVALID_CPF' }, { status: 400, headers: corsHeaders })
    const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    const { data: election } = await client
      .from('elections')
      .select('status, voting_start, voting_end')
      .eq('slug', electionSlug)
      .maybeSingle()
    const now = Date.now()
    const windowValid =
      Boolean(election) &&
      new Date(election.voting_start).getTime() <= now &&
      new Date(election.voting_end).getTime() >= now
    logEvent('election_state', {
      election_slug: electionSlug,
      election_status: election?.status,
      window_valid: windowValid,
    })
    const cpfHash = await hashCpf(cpf, cpfHashSalt)

    if (action === 'voter_access') {
      const { data, error } = await client.rpc('verify_voter_access', {
        p_election_slug: String(body.electionSlug ?? ''),
        p_cpf_hash: cpfHash,
      })
      const row = Array.isArray(data) ? data[0] : data
      logEvent('decision', {
        decision: row?.allowed === true ? 'allow' : 'deny',
        deny_reason:
          row?.allowed === true
            ? undefined
            : safeReason(row?.reason ?? error?.message ?? 'VOTER_NOT_FOUND'),
      })
      return Response.json(row ?? { allowed: false, reason: error?.message ?? 'VOTER_NOT_FOUND' }, {
        status: error ? 400 : 200,
        headers: corsHeaders,
      })
    }

    if (action === 'cast_vote') {
      const { data, error } = await client.rpc('cast_vote', {
        p_election_slug: String(body.electionSlug ?? ''),
        p_cpf_hash: cpfHash,
        p_candidate_id: body.candidateId ?? null,
        p_is_blank: body.isBlank === true,
      })
      if (error) {
        logEvent('decision', { decision: 'deny', deny_reason: safeReason(error.message) })
        return Response.json({ error: error.message }, { status: 400, headers: corsHeaders })
      }
      logEvent('decision', { decision: 'allow' })
      return Response.json(data, { headers: corsHeaders })
    }
    return Response.json({ error: 'INVALID_ACTION' }, { status: 400, headers: corsHeaders })
  } catch {
    return Response.json({ error: 'INVALID_REQUEST' }, { status: 400, headers: corsHeaders })
  }
})
