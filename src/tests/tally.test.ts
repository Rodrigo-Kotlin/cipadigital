import { describe, expect, it } from 'vitest'
import { hasAttendanceDivergence, rankCandidates } from '../lib/admin/tallyService'
import { attendanceTableHtml, buildCsvContent, tallyTableHtml } from '../lib/reports/exporters'

const candidates = [
  {
    candidate_id: 'a',
    candidate_name: 'Ana',
    candidate_role: 'Analista',
    display_order: 1,
    votes_count: 8,
    rank_position: 0,
    result_status: 'Candidato votado não eleito' as const,
  },
  {
    candidate_id: 'b',
    candidate_name: 'Bruno',
    candidate_role: 'Técnico',
    display_order: 2,
    votes_count: 5,
    rank_position: 0,
    result_status: 'Candidato votado não eleito' as const,
  },
  {
    candidate_id: 'c',
    candidate_name: 'Carla',
    candidate_role: 'Assistente',
    display_order: 3,
    votes_count: 2,
    rank_position: 0,
    result_status: 'Candidato votado não eleito' as const,
  },
]

describe('tally and report safeguards', () => {
  it('classifies titular and suplente without using voter data', () => {
    const result = rankCandidates(candidates, 1, 1)

    expect(result.candidates[0].result_status).toBe('Titular')
    expect(result.candidates[1].result_status).toBe('Suplente')
    expect(result.candidates[2].result_status).toBe('Candidato votado não eleito')
    expect(result.hasTie).toBe(false)
  })

  it('detects a tie and attendance divergence', () => {
    const result = rankCandidates(
      [
        { ...candidates[0], votes_count: 8 },
        { ...candidates[1], votes_count: 8 },
      ],
      1,
      1,
    )

    expect(result.hasTie).toBe(true)
    expect(hasAttendanceDivergence(8, 7)).toBe(true)
    expect(hasAttendanceDivergence(8, 8)).toBe(false)
  })

  it('keeps voter identity out of report bodies', () => {
    const tally = {
      title: 'Eleição',
      company_name: 'ARATI',
      management_period: '2026/2027',
      total_votes: 8,
      blank_votes: 1,
      participation_percentage: 80,
      has_tie: false,
      has_divergence: false,
      candidates,
    } as never
    const tallyHtml = tallyTableHtml(tally)
    const presenceHtml = attendanceTableHtml([
      {
        name: 'Ana',
        cpf_masked: '***.***.***-25',
        department: 'Operação',
        role: 'Analista',
        status: 'active',
        has_voted: true,
        voted_at: null,
      },
    ])

    expect(tallyHtml).not.toContain('cpf')
    expect(tallyHtml).not.toContain('voter')
    expect(presenceHtml).toContain('***.***.***-25')
    expect(presenceHtml).not.toContain('candidate')
    expect(buildCsvContent(['Nome', 'CPF'], [['Ana', '***.***.***-25']])).toContain(';')
    expect(buildCsvContent(['Nome', 'CPF'], [['Ana', '***.***.***-25']])).not.toContain(
      '52998224725',
    )
  })
})
