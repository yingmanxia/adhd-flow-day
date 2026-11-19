import { describe, expect, it } from 'vitest'

import {
  addDays,
  diffDays,
  isFutureDate,
  isPastOrToday,
  isWithinRange,
  monthRange,
  toDateKey,
  weekRange,
} from './date'

describe('date helpers', () => {
  it('converts instants to a date key in the given timezone', () => {
    const instant = new Date('2026-11-17T16:30:00.000Z')
    expect(toDateKey(instant, 'UTC')).toBe('2026-11-17')
    expect(toDateKey(instant, 'Asia/Shanghai')).toBe('2026-11-18')
  })

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('computes signed day differences', () => {
    expect(diffDays('2026-11-17', '2026-11-18')).toBe(1)
    expect(diffDays('2026-11-18', '2026-11-17')).toBe(-1)
    expect(diffDays('2026-11-17', '2026-11-17')).toBe(0)
  })

  it('builds Monday-based week ranges', () => {
    expect(weekRange('2026-11-19')).toEqual({ start: '2026-11-16', end: '2026-11-22' })
    expect(weekRange('2026-11-16')).toEqual({ start: '2026-11-16', end: '2026-11-22' })
  })

  it('builds month ranges including leap years', () => {
    expect(monthRange('2026-11')).toEqual({ start: '2026-11-01', end: '2026-11-30' })
    expect(monthRange('2028-02')).toEqual({ start: '2028-02-01', end: '2028-02-29' })
  })

  it('checks range and future/past predicates', () => {
    const range = { start: '2026-11-16', end: '2026-11-22' }
    expect(isWithinRange('2026-11-19', range)).toBe(true)
    expect(isWithinRange('2026-11-23', range)).toBe(false)
    expect(isFutureDate('2026-11-18', '2026-11-17')).toBe(true)
    expect(isFutureDate('2026-11-17', '2026-11-17')).toBe(false)
    expect(isPastOrToday('2026-11-16', '2026-11-17')).toBe(true)
  })
})
