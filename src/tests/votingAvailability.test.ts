import { describe, expect, it } from 'vitest'
import { getVotingAvailability } from '../lib/voting/votingAvailability'

const window = {
  voting_start: '2026-08-05T12:00:00Z',
  voting_end: '2026-08-05T20:00:00Z',
}

describe('voting availability', () => {
  it('allows an open election inside the configured window', () => {
    expect(
      getVotingAvailability({ ...window, status: 'open' }, new Date('2026-08-05T15:00:00Z'))
        .available,
    ).toBe(true)
  })

  it('explains an open election after its end time', () => {
    const result = getVotingAvailability(
      { ...window, status: 'open' },
      new Date('2026-08-05T21:00:00Z'),
    )
    expect(result.reason).toBe('outside_window')
    expect(result.message).toMatch(/horário permitido já terminou/i)
  })

  it('distinguishes preparation, paused, closed, and tallied states', () => {
    expect(getVotingAvailability({ ...window, status: 'draft' }).reason).toBe('not_configured')
    expect(getVotingAvailability({ ...window, status: 'paused' }).reason).toBe('paused')
    expect(getVotingAvailability({ ...window, status: 'closed' }).reason).toBe('closed')
    expect(getVotingAvailability({ ...window, status: 'tallied' }).reason).toBe('tallied')
  })
})
