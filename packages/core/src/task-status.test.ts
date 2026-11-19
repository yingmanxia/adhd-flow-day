import { describe, expect, it } from 'vitest'

import {
  TRANSITIONS,
  assertMove,
  canMove,
  nextDeferCount,
  type MoveContext,
  type TransitionSpec,
} from './task-status'

const TODAY = '2026-11-17'
const TOMORROW = '2026-11-18'
const PLAN_ID = '11111111-1111-4111-8111-111111111111'

function contextFor(spec: TransitionSpec): MoveContext {
  const scheduledDate = spec.requires?.futureDate
    ? TOMORROW
    : spec.requires?.dueDate
      ? TODAY
      : spec.requires?.scheduledDate
        ? TODAY
        : undefined

  return {
    from: spec.from,
    to: spec.to,
    via: spec.via,
    triageAction: spec.triageAction,
    scheduledDate,
    planId: spec.requires?.planId ? PLAN_ID : undefined,
    today: TODAY,
  }
}

describe('task status machine', () => {
  it('accepts every declared legal transition', () => {
    for (const spec of TRANSITIONS) {
      const context = contextFor(spec)
      expect(canMove(context), `${spec.from}->${spec.to} via ${spec.via}`).toBe(true)
      expect(assertMove(context)).toBe(spec)
    }
  })

  it('rejects moving a done task back to inbox', () => {
    expect(canMove({ from: 'DONE', to: 'INBOX', via: 'move', today: TODAY })).toBe(false)
    expect(() => assertMove({ from: 'DONE', to: 'INBOX', via: 'move', today: TODAY })).toThrow(
      'Illegal transition',
    )
  })

  it('rejects completing directly from scheduled', () => {
    expect(
      canMove({
        from: 'SCHEDULED',
        to: 'DONE',
        via: 'due',
        scheduledDate: TODAY,
        today: TODAY,
      }),
    ).toBe(false)
  })

  it('requires a date when scheduling', () => {
    expect(
      canMove({
        from: 'INBOX',
        to: 'SCHEDULED',
        via: 'triage',
        triageAction: 'SCHEDULE',
        today: TODAY,
      }),
    ).toBe(false)
  })

  it('rejects scheduling into the past or today', () => {
    expect(
      canMove({
        from: 'INBOX',
        to: 'SCHEDULED',
        via: 'triage',
        triageAction: 'SCHEDULE',
        scheduledDate: TODAY,
        today: TODAY,
      }),
    ).toBe(false)
  })

  it('requires a plan when entering the plan pool', () => {
    expect(
      canMove({
        from: 'INBOX',
        to: 'UNSCHEDULED',
        via: 'triage',
        triageAction: 'PLAN',
        today: TODAY,
      }),
    ).toBe(false)
  })

  it('only surfaces tasks whose date has arrived', () => {
    expect(
      canMove({
        from: 'SCHEDULED',
        to: 'TODAY',
        via: 'due',
        scheduledDate: TOMORROW,
        today: TODAY,
      }),
    ).toBe(false)
    expect(
      canMove({
        from: 'SCHEDULED',
        to: 'TODAY',
        via: 'due',
        scheduledDate: TODAY,
        today: TODAY,
      }),
    ).toBe(true)
  })

  it('increments defer count without a failure semantic', () => {
    expect(nextDeferCount(0)).toBe(1)
    expect(nextDeferCount(3)).toBe(4)
  })
})
