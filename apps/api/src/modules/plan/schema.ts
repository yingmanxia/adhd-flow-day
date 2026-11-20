import { createPlanSchema, updatePlanSchema, uuidSchema } from '@flowday/types'
import { z } from 'zod'

export const createPlanRequestSchema = createPlanSchema
export const updatePlanRequestSchema = updatePlanSchema

export const planIdParamsSchema = z.object({ id: uuidSchema })

export type CreatePlanRequest = z.infer<typeof createPlanRequestSchema>
export type UpdatePlanRequest = z.infer<typeof updatePlanRequestSchema>
