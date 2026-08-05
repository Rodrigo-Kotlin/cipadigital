import { describe, expect, it } from 'vitest'
import {
  attendanceTableHtml,
  buildAtaText,
  buildPrintDocument,
  tallyTableHtml,
} from '../lib/reports/exporters'
import type { ElectionTally } from '../lib/supabase/types'

const tally: ElectionTally = {
  election_id: 'election-id',
  title: 'Eleição da CIPA ARATI',
  company_name: 'ARATI',
  company_cnpj: '10.712.785/0001-89',
  management_period: '2026/2027',
  voting_date: '2026-08-06',
  voting_start: '2026-08-06T11:00:00Z',
  voting_end: '2026-08-06T20:00:00Z',
  total_active_voters: 2,
  total_attendance: 2,
  total_votes: 2,
  blank_votes: 1,
  participation_percentage: 100,
  has_tie: false,
  has_divergence: false,
  candidates: [
    {
      candidate_id: 'candidate-id',
      candidate_name: 'Rosiane Farias',
      candidate_role: 'Serviços Gerais',
      display_order: 1,
      votes_count: 1,
      rank_position: 1,
      result_status: 'Titular',
    },
  ],
}

describe('report exporters', () => {
  it('builds a printable document with a header, footer, and report content', () => {
    const document = buildPrintDocument('Relatório de apuração', tallyTableHtml(tally))

    expect(document).toContain('<strong>CIPA Digital</strong>')
    expect(document).toContain('Relatório de apuração')
    expect(document).toContain('Documento de homologação')
    expect(document).toContain('Rosiane Farias')
  })

  it('keeps attendance masked and separate from vote content', () => {
    const document = attendanceTableHtml([
      {
        name: 'Eleitor Teste',
        cpf_masked: '***.***.***-25',
        department: 'Operação',
        role: 'Analista',
        status: 'active',
        has_voted: true,
        voted_at: '2026-08-06T12:00:00Z',
      },
    ])

    expect(document).toContain('***.***.***-25')
    expect(document).not.toContain('52998224725')
    expect(document).not.toContain('Rosiane Farias')
  })

  it('keeps the minutes aggregated without voter identifiers', () => {
    const document = buildAtaText(tally)

    expect(document).toContain('Rosiane Farias')
    expect(document).not.toContain('Eleitor Teste')
    expect(document).not.toContain('52998224725')
  })
})
