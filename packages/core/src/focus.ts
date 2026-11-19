import { isWithinRange, weekRange } from './date'

export interface FocusTiming {
  startedAt: string | number | Date
  accumulatedFocusMs: number
  now: number
  plannedSec: number
}

export interface FocusSessionLike {
  statDate: string
  status?: string
}

function elapsedMs({ startedAt, accumulatedFocusMs, now }: FocusTiming): number {
  const started = startedAt instanceof Date ? startedAt.getTime() : new Date(startedAt).getTime()
  return Math.max(0, accumulatedFocusMs + now - started)
}

export function focusRemainingMs(timing: FocusTiming): number {
  return Math.max(0, timing.plannedSec * 1000 - elapsedMs(timing))
}

export function focusRemaining(timing: FocusTiming): number {
  return Math.ceil(focusRemainingMs(timing) / 1000)
}

export function focusProgress(timing: FocusTiming): number {
  if (timing.plannedSec <= 0) return 1
  return Math.min(1, elapsedMs(timing) / (timing.plannedSec * 1000))
}

export function weekFocusCount(
  sessions: readonly FocusSessionLike[],
  dateKey: string,
  weekStartsOn = 1,
): number {
  const range = weekRange(dateKey, weekStartsOn)
  return sessions.filter(
    (session) =>
      isWithinRange(session.statDate, range) &&
      session.status !== 'RUNNING' &&
      session.status !== 'PAUSED',
  ).length
}
