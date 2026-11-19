import { z } from 'zod'

import { Bucket, MoveVia, TaskPriority, TriageAction } from '../enums'

export const uuidSchema = z.string().uuid()
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export const isoDateTimeSchema = z.string().datetime({ offset: true })

export const bucketSchema = z.nativeEnum(Bucket)
export const moveViaSchema = z.nativeEnum(MoveVia)
export const triageActionSchema = z.nativeEnum(TriageAction)
export const taskPrioritySchema = z.nativeEnum(TaskPriority)

const timeWindowFields = {
  startAt: isoDateTimeSchema.optional(),
  dueAt: isoDateTimeSchema.optional(),
}

const validTimeWindow = ({ startAt, dueAt }: { startAt?: string; dueAt?: string }): boolean =>
  !startAt || !dueAt || new Date(dueAt).getTime() >= new Date(startAt).getTime()

export const captureTaskSchema = z
  .object({
    title: z.string().min(1),
    bucket: bucketSchema.optional(),
    planId: uuidSchema.optional(),
    scheduledDate: isoDateSchema.optional(),
    estimateMin: z.number().int().nonnegative().optional(),
    priority: taskPrioritySchema.optional(),
    ...timeWindowFields,
  })
  .refine(validTimeWindow, {
    message: 'dueAt must not be earlier than startAt',
    path: ['dueAt'],
  })

export type CaptureTaskInput = z.infer<typeof captureTaskSchema>

export const moveTaskSchema = z.object({
  to: bucketSchema,
  via: moveViaSchema,
  scheduledDate: isoDateSchema.optional(),
  planId: uuidSchema.optional(),
  startAt: isoDateTimeSchema.optional(),
  dueAt: isoDateTimeSchema.optional(),
})

export type MoveTaskInput = z.infer<typeof moveTaskSchema>

export const triageTaskSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal(TriageAction.TODAY),
    scheduledDate: isoDateSchema.optional(),
  }),
  z.object({
    action: z.literal(TriageAction.PLAN),
    planId: uuidSchema,
  }),
  z.object({
    action: z.literal(TriageAction.DELETE),
  }),
  z.object({
    action: z.literal(TriageAction.SCHEDULE),
    scheduledDate: isoDateSchema,
    startAt: isoDateTimeSchema.optional(),
    dueAt: isoDateTimeSchema.optional(),
  }),
])

export type TriageTaskInput = z.infer<typeof triageTaskSchema>

export const taskViewSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  bucket: bucketSchema,
  planId: uuidSchema.nullable(),
  planName: z.string().nullable(),
  scheduledDate: isoDateSchema.nullable(),
  startAt: isoDateTimeSchema.nullable(),
  dueAt: isoDateTimeSchema.nullable(),
  isFromSchedule: z.boolean(),
  priority: taskPrioritySchema,
  estimateMin: z.number().int().nonnegative(),
  actualMin: z.number().int().nonnegative(),
  deferCount: z.number().int().nonnegative(),
  completedAt: isoDateTimeSchema.nullable(),
})

export type TaskView = z.infer<typeof taskViewSchema>
