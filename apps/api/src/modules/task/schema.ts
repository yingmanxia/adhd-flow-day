import { bucketSchema, uuidSchema } from '@flowday/types'
import { z } from 'zod'

export const taskIdParamsSchema = z.object({ id: uuidSchema })

export const listTasksQuerySchema = z.object({
  bucket: bucketSchema.optional(),
  planId: uuidSchema.optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

export const patchTaskRequestSchema = z
  .object({
    title: z.string().min(1).optional(),
    planId: uuidSchema.nullable().optional(),
    estimateMin: z.number().int().nonnegative().nullable().optional(),
    priority: z.enum(['HIGH', 'MED', 'LOW']).optional(),
    isFrog: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: '至少提供一个待更新字段' })

export const completeTaskRequestSchema = z.object({
  actualMin: z.number().int().nonnegative().optional(),
})

export const deferTaskRequestSchema = z.object({
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>
export type PatchTaskRequest = z.infer<typeof patchTaskRequestSchema>
export type CompleteTaskRequest = z.infer<typeof completeTaskRequestSchema>
