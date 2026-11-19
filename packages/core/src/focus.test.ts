import { describe, expect, it } from 'vitest'

import { focusProgress, focusRemaining, focusRemainingMs, weekFocusCount } from './focus'

const STARTED_AT = '2026-11-17T09:00:00.000Z'

describe('focus helpers', () => {
  it('counts remaining seconds down from the planned duration', () => {
    expect(
      focusRemaining({
        startedAt: STARTED_AT,
        accumulatedFocusMs: 0,
        now: new Date(STARTED_AT).getTime() + 60_000,
        plannedSec: 300,
      }),
    ).toBe(240)
  })

  it('does not count paused time', () => {
    const timing = {
      startedAt: STARTED_AT,
      accumulatedFocusMs: 60_000,
      now: new Date(STARTED_AT).getTime() + 180_000,
      plannedSec: 300,
    }
    expect(focusRemainingMs(timing)).toBe(60_000)
    expect(focusRemaining(timing)).toBe(60)
  })

  it('clamps progress and remaining time after the deadline', () => {
    const timing = {
      startedAt: STARTED_AT,
      accumulatedFocusMs: 0,
      now: new Date(STARTED_AT).getTime() + 400_000,
      plannedSec: 300,
    }
    expect(focusProgress(timing)).toBe(1)
    expect(focusRemaining(timing)).toBe(0)
  })

  it('counts finished sessions in a week', () => {
    const sessions = [
      { statDate: '2026-11-16', status: 'COMPLETED' },
      { statDate: '2026-11-17', status: 'EARLY_STOPPED' },
      { statDate: '2026-11-17', status: 'RUNNING' },
      { statDate: '2026-11-09', status: 'COMPLETED' },
    ]
    expect(weekFocusCount(sessions, '2026-11-19')).toBe(2)
  })
})
