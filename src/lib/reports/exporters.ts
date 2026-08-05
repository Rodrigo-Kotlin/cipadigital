import type { ElectionTally } from '../supabase/types'

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export function buildCsvContent(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const content = buildCsvContent(headers, rows)
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  window.setTimeout(() => {
    URL.revokeObjectURL(url)
    link.remove()
  }, 1000)
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>'"]/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char,
  )
}

export function buildPrintDocument(title: string, body: string): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>@page{size:auto;margin:16mm}body{font-family:Arial,sans-serif;color:#0f172a;padding:36px;line-height:1.45}header{border-bottom:2px solid #0B6B3A;margin-bottom:24px;padding-bottom:10px}header strong{color:#0B6B3A}h1{font-size:22px;margin:0 0 6px}h2{font-size:16px;margin-top:24px;border-bottom:1px solid #e2e8f0;padding-bottom:6px}p{color:#475569}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{padding:8px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:12px}th{color:#475569;font-size:10px;text-transform:uppercase}footer{margin-top:36px;color:#64748b;font-size:10px;border-top:1px solid #e2e8f0;padding-top:8px}@media print{body{padding:0}header,footer{display:block}tr{break-inside:avoid}}</style></head><body><header><strong>CIPA Digital</strong><br>${escapeHtml(title)}</header>${body}<footer>Documento de homologação · Gerado pelo CIPA Digital · ${escapeHtml(new Date().toLocaleString('pt-BR'))}</footer></body></html>`
}

export function printReport(title: string, body: string) {
  const reportWindow = window.open('', '_blank', 'width=900,height=700')
  if (!reportWindow) return false
  reportWindow.opener = null
  reportWindow.document.write(buildPrintDocument(title, body))
  reportWindow.document.close()
  window.setTimeout(() => {
    reportWindow.focus()
    reportWindow.print()
  }, 250)
  return true
}

export function tallyTableHtml(tally: ElectionTally): string {
  const rows = tally.candidates
    .map(
      (candidate) =>
        `<tr><td>${candidate.rank_position}º</td><td>${escapeHtml(candidate.candidate_name)}</td><td>${escapeHtml(candidate.candidate_role)}</td><td>${candidate.votes_count}</td><td>${escapeHtml(candidate.result_status)}</td></tr>`,
    )
    .join('')
  return `<h1>Relatório de apuração</h1><p>${escapeHtml(tally.company_name)} · ${escapeHtml(tally.title)} · Gestão ${escapeHtml(tally.management_period)}</p><p>Total de votos: <strong>${tally.total_votes}</strong> · Votos em branco: <strong>${tally.blank_votes}</strong> · Participação: <strong>${tally.participation_percentage}%</strong></p>${tally.has_tie ? '<p><strong>Alerta:</strong> há empate na apuração. A Comissão Eleitoral deve aplicar o critério administrativo e registrar a decisão em ata.</p>' : ''}${tally.has_divergence ? '<p><strong>Alerta:</strong> há divergência entre presença e votos registrados.</p>' : ''}<table><thead><tr><th>Classificação</th><th>Candidato</th><th>Função</th><th>Votos</th><th>Situação</th></tr></thead><tbody>${rows}</tbody></table>`
}

export function attendanceTableHtml(
  rows: Array<{
    name: string
    cpf_masked: string | null
    department: string | null
    role: string | null
    status: string
    has_voted: boolean
    voted_at: string | null
  }>,
): string {
  const content = rows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.cpf_masked ?? '***.***.***-**')}</td><td>${escapeHtml(row.department ?? '-')}</td><td>${escapeHtml(row.role ?? '-')}</td><td>${row.has_voted ? 'Sim' : 'Não'}</td><td>${row.voted_at ? escapeHtml(new Date(row.voted_at).toLocaleString('pt-BR')) : '-'}</td></tr>`,
    )
    .join('')
  return `<h1>Lista de presença</h1><p>Presença identificada da eleição. Este documento não contém qualquer escolha de voto.</p><table><thead><tr><th>Nome</th><th>CPF mascarado</th><th>Setor</th><th>Função</th><th>Votou</th><th>Data/hora</th></tr></thead><tbody>${content}</tbody></table>`
}

export function buildAtaText(tally: ElectionTally): string {
  const candidates = tally.candidates
    .map(
      (candidate) =>
        `${candidate.rank_position}º - ${candidate.candidate_name} (${candidate.candidate_role}): ${candidate.votes_count} voto(s) - ${candidate.result_status}`,
    )
    .join('\n')
  return `Aos ___ dias do mês de __________ de ______, foi realizada a eleição dos representantes dos empregados para composição da Comissão Interna de Prevenção de Acidentes e de Assédio — CIPA, gestão ${tally.management_period}, da empresa ${tally.company_name ?? '______________________________'}.\n\nA votação ocorreu por meio do sistema CIPA Digital, com acesso individual dos eleitores aptos, registro de presença e preservação do sigilo do voto.\n\nEncerrada a votação, procedeu-se à apuração dos votos, sendo registrado o total de ${tally.total_active_voters} eleitores aptos, ${tally.total_attendance} votantes, correspondente a ${tally.participation_percentage}% de participação.\n\nO resultado da apuração foi o seguinte:\n${candidates}\n\nTotal de votos: ${tally.total_votes}. Votos em branco: ${tally.blank_votes}.${tally.has_tie ? '\n\nHá empate na apuração. A Comissão Eleitoral deverá registrar o critério administrativo aplicado.' : ''}${tally.has_divergence ? '\n\nFoi identificada divergência entre presença e votos registrados, sujeita a verificação técnica.' : ''}\n\nNada mais havendo a tratar, lavra-se a presente ata, que segue assinada pela Comissão Eleitoral e representante da empresa.\n\nComissão Eleitoral: ______________________________\n\nRepresentante da empresa: ______________________________`
}
