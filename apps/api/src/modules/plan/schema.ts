import { createPlanSchema, planStatusSchema, uuidSchema } from '@flowday/types'
import { z } from 'zod'

export const createPlanRequestSchema = createPlanSchema

export const updatePlanRequestSchema = z
  .object({
    title: z.string().min(1).optional(),
    motivation: z.string().nullable().optional(),
    expectedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
    status: planStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: '至少提供一个待更新字段' })

export const planIdParamsSchema = z.object({ id: uuidSchema })

export type CreatePlanRequest = z.infer<typeof createPlanRequestSchema>
export type UpdatePlanRequest = z.infer<typeof updatePlanRequestSchema>
