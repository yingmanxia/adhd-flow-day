import type { Bucket, MoveVia, TriageAction } from '@flowday/types'

import { isFutureDate } from './date'

export type TransitionTarget = Bucket | 'DELETED'

export interface MoveContext {
  from: Bucket
  to: TransitionTarget
  via: MoveVia
  triageAction?: TriageAction
  scheduledDate?: string
  planId?: string | null
  today?: string
}

interface TransitionRequirements {
  scheduledDate?: boolean
  planId?: boolean
  futureDate?: boolean
  dueDate?: boolean
}

export interface TransitionSpec {
  from: Bucket
  to: TransitionTarget
  via: MoveVia
  triageAction?: TriageAction
  requires?: TransitionRequirements
}

export const TRANSITIONS: readonly TransitionSpec[] = [
  {
    from: 'INBOX',
    to: 'TODAY',
    via: 'triage',
    triageAction: 'TODAY',
    requires: { scheduledDate: true },
  },
  {
    from: 'INBOX',
    to: 'UNSCHEDULED',
    via: 'triage',
    triageAction: 'PLAN',
    requires: { planId: true },
  },
  { from: 'INBOX', to: 'DELETED', via: 'triage', triageAction: 'DELETE' },
  {
    from: 'INBOX',
    to: 'SCHEDULED',
    via: 'triage',
    triageAction: 'SCHEDULE',
    requires: { scheduledDate: true, futureDate: true },
  },
  { from: 'INBOX', to: 'TODAY', via: 'move', requires: { scheduledDate: true } },
  { from: 'INBOX', to: 'UNSCHEDULED', via: 'move', requires: { planId: true } },
  {
    from: 'INBOX',
    to: 'SCHEDULED',
    via: 'move',
    requires: { scheduledDate: true, futureDate: true },
  },
  { from: 'UNSCHEDULED', to: 'TODAY', via: 'move' },
  { from: 'UNSCHEDULED', to: 'TODAY', via: 'plan-queue' },
  { from: 'UNSCHEDULED', to: 'TODAY', via: 'kanban' },
  {
    from: 'UNSCHEDULED',
    to: 'SCHEDULED',
    via: 'schedule',
    requires: { scheduledDate: true, futureDate: true },
  },
  { from: 'TODAY', to: 'UNSCHEDULED', via: 'kanban', requires: { planId: true } },
  { from: 'TODAY', to: 'DONE', via: 'kanban' },
  { from: 'DONE', to: 'TODAY', via: 'kanban' },
  {
    from: 'TODAY',
    to: 'SCHEDULED',
    via: 'schedule',
    requires: { scheduledDate: true, futureDate: true },
  },
  {
    from: 'SCHEDULED',
    to: 'TODAY',
    via: 'due',
    requires: { scheduledDate: true, dueDate: true },
  },
  { from: 'SCHEDULED', to: 'TODAY', via: 'schedule' },
  {
    from: 'SCHEDULED',
    to: 'SCHEDULED',
    via: 'schedule',
    requires: { scheduledDate: true, futureDate: true },
  },
  {
    from: 'SCHEDULED',
    to: 'UNSCHEDULED',
    via: 'schedule',
    requires: { planId: true },
  },
  { from: 'SCHEDULED', to: 'INBOX', via: 'schedule' },
]

export class DomainError extends Error {
  readonly code: string

  constructor(message: string, code = 'DOMAIN_ERROR') {
    super(message)
    this.name = 'DomainError'
    this.code = code
  }
}

function requirementsMet(spec: TransitionSpec, input: MoveContext): boolean {
  const requires = spec.requires ?? {}
  if (requires.scheduledDate && !input.scheduledDate) return false
  if (requires.planId && !input.planId) return false

  if (requires.futureDate) {
    if (!input.today || !input.scheduledDate) return false
    if (!isFutureDate(input.scheduledDate, input.today)) return false
  }

  if (requires.dueDate) {
    if (!input.today || !input.scheduledDate) return false
    if (isFutureDate(input.scheduledDate, input.today)) return false
  }

  return true
}

export function findTransition(input: MoveContext): TransitionSpec | undefined {
  return TRANSITIONS.find(
    (spec) =>
      spec.from === input.from &&
      spec.to === input.to &&
      spec.via === input.via &&
      (spec.triageAction ?? null) === (input.triageAction ?? null) &&
      requirementsMet(spec, input),
  )
}

export function canMove(input: MoveContext): boolean {
  return findTransition(input) !== undefined
}

export function assertMove(input: MoveContext): TransitionSpec {
  const spec = findTransition(input)
  if (!spec) {
    throw new DomainError(
      `Illegal transition: ${input.from} -> ${input.to} via ${input.via}`,
      'INVALID_TRANSITION',
    )
  }
  return spec
}

export function nextDeferCount(current: number): number {
  return current + 1
}
