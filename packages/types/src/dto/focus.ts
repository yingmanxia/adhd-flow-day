import { z } from 'zod'

import { FocusOutcome, FocusSessionStatus, FocusSource } from '../enums'

import { isoDateSchema, isoDateTimeSchema, uuidSchema } from './task'

export const focusOutcomeSchema = z.nativeEnum(FocusOutcome)
export const focusSourceSchema = z.nativeEnum(FocusSource)
export const focusSessionStatusSchema = z.nativeEnum(FocusSessionStatus)

export const startFocusSchema = z.object({
  taskId: uuidSchema.optional(),
  plannedSec: z.number().int().positive(),
  source: focusSourceSchema,
})

export type StartFocusInput = z.infer<typeof startFocusSchema>

export const finishFocusSchema = z.object({
  outcome: focusOutcomeSchema,
})

export type FinishFocusInput = z.infer<typeof finishFocusSchema>

export const focusSessionViewSchema = z.object({
  id: uuidSchema,
  taskId: uuidSchema.nullable(),
  status: focusSessionStatusSchema,
  plannedSec: z.number().int().positive(),
  actualFocusSec: z.number().int().nonnegative(),
  pauseCount: z.number().int().nonnegative(),
  startedAt: isoDateTimeSchema,
  endedAt: isoDateTimeSchema.nullable(),
  statDate: isoDateSchema,
})

export type FocusSessionView = z.infer<typeof focusSessionViewSchema>
