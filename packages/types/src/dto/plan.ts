import { z } from 'zod'

import { PlanStatus } from '../enums'

import { isoDateSchema, uuidSchema } from './task'

export const planStatusSchema = z.nativeEnum(PlanStatus)

export const createPlanSchema = z.object({
  title: z.string().min(1),
  motivation: z.string().optional(),
  expectedDate: isoDateSchema.optional(),
})

export type CreatePlanInput = z.infer<typeof createPlanSchema>

export const updatePlanSchema = z
  .object({
    title: z.string().min(1).optional(),
    motivation: z.string().nullable().optional(),
    expectedDate: isoDateSchema.nullable().optional(),
    status: planStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: '至少提供一个待更新字段' })

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>

export const planViewSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  motivation: z.string().nullable(),
  expectedDate: isoDateSchema.nullable(),
  status: planStatusSchema,
  taskCount: z.number().int().nonnegative(),
  doneCount: z.number().int().nonnegative(),
})

export type PlanView = z.infer<typeof planViewSchema>
