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

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST')
    return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: corsHeaders })

  try {
    const { cpf } = await request.json()
    const normalizedCpf = normalizeCpf(cpf)
    if (!isValidCpf(normalizedCpf))
      return Response.json({ error: 'INVALID_CPF' }, { status: 400, headers: corsHeaders })

    const salt = Deno.env.get('CPF_HASH_SALT')
    if (!salt)
      return Response.json({ error: 'HASH_NOT_CONFIGURED' }, { status: 503, headers: corsHeaders })

    const hash = await sha256Hex(`${salt}:${normalizedCpf}`)
    return Response.json({ hash }, { headers: corsHeaders })
  } catch {
    return Response.json({ error: 'INVALID_REQUEST' }, { status: 400, headers: corsHeaders })
  }
})
