export const Bucket = {
  INBOX: 'INBOX',
  UNSCHEDULED: 'UNSCHEDULED',
  SCHEDULED: 'SCHEDULED',
  TODAY: 'TODAY',
  DONE: 'DONE',
} as const
export type Bucket = (typeof Bucket)[keyof typeof Bucket]

export const MoveVia = {
  TRIAGE: 'triage',
  MOVE: 'move',
  PLAN_QUEUE: 'plan-queue',
  KANBAN: 'kanban',
  SCHEDULE: 'schedule',
  DUE: 'due',
} as const
export type MoveVia = (typeof MoveVia)[keyof typeof MoveVia]

export const TriageAction = {
  TODAY: 'TODAY',
  PLAN: 'PLAN',
  DELETE: 'DELETE',
  SCHEDULE: 'SCHEDULE',
} as const
export type TriageAction = (typeof TriageAction)[keyof typeof TriageAction]

export const FocusOutcome = {
  COMPLETED: 'COMPLETED',
  EARLY_STOPPED: 'EARLY_STOPPED',
} as const
export type FocusOutcome = (typeof FocusOutcome)[keyof typeof FocusOutcome]

export const FocusSource = {
  PLAN_COLLAPSED: 'plan-collapsed',
  TASK_CARD: 'task-card',
} as const
export type FocusSource = (typeof FocusSource)[keyof typeof FocusSource]

export const FocusSessionStatus = {
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  EARLY_STOPPED: 'EARLY_STOPPED',
} as const
export type FocusSessionStatus = (typeof FocusSessionStatus)[keyof typeof FocusSessionStatus]

export const TaskPriority = {
  HIGH: 'HIGH',
  MED: 'MED',
  LOW: 'LOW',
} as const
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority]

export const TaskCategory = {
  WORK: 'WORK',
  LIFE: 'LIFE',
  HEALTH: 'HEALTH',
} as const
export type TaskCategory = (typeof TaskCategory)[keyof typeof TaskCategory]

export const PlanStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const
export type PlanStatus = (typeof PlanStatus)[keyof typeof PlanStatus]
