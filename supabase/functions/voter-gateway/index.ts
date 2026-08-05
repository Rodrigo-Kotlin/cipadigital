import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
): Promise<boolean> {
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return false
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
    if (!response.ok) return false
    const result = await response.json()
    const allowedHostnames = (Deno.env.get('TURNSTILE_HOSTNAMES') ?? '')
      .split(',')
      .map((hostname) => hostname.trim())
      .filter(Boolean)
    return (
      result.success === true &&
      result.action === expectedAction &&
      allowedHostnames.includes(result.hostname)
    )
  } catch {
    return false
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST')
    return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: corsHeaders })

  try {
    const body = await request.json()
    const action = body.action
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY')
    const cpfHashSalt = Deno.env.get('CPF_HASH_SALT')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!turnstileSecret || !cpfHashSalt || !supabaseUrl || !serviceRoleKey)
      return Response.json(
        { error: 'GATEWAY_NOT_CONFIGURED' },
        { status: 503, headers: corsHeaders },
      )
    if (
      !['voter_access', 'cast_vote'].includes(body.action) ||
      !(await verifyTurnstile(body.turnstileToken, turnstileSecret, request, body.action))
    )
      return Response.json({ error: 'TURNSTILE_FAILED' }, { status: 403, headers: corsHeaders })

    const cpf = normalizeCpf(body.cpf)
    if (!isValidCpf(cpf))
      return Response.json({ error: 'INVALID_CPF' }, { status: 400, headers: corsHeaders })
    const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
    const cpfHash = await hashCpf(cpf, cpfHashSalt)

    if (action === 'voter_access') {
      const { data, error } = await client.rpc('verify_voter_access', {
        p_election_slug: String(body.electionSlug ?? ''),
        p_cpf_hash: cpfHash,
      })
      const row = Array.isArray(data) ? data[0] : data
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
      if (error)
        return Response.json({ error: error.message }, { status: 400, headers: corsHeaders })
      return Response.json(data, { headers: corsHeaders })
    }
    return Response.json({ error: 'INVALID_ACTION' }, { status: 400, headers: corsHeaders })
  } catch {
    return Response.json({ error: 'INVALID_REQUEST' }, { status: 400, headers: corsHeaders })
  }
})
