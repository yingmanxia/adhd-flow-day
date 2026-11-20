import { triageTaskSchema, uuidSchema } from '@flowday/types'
import { z } from 'zod'

export const inboxIdParamsSchema = z.object({ id: uuidSchema })

export const inboxTriageRequestSchema = triageTaskSchema

export const createInboxRequestSchema = z.object({
  title: z.string().min(1),
  estimateMin: z.number().int().nonnegative().optional(),
})

export type InboxTriageRequest = z.infer<typeof inboxTriageRequestSchema>
export type CreateInboxRequest = z.infer<typeof createInboxRequestSchema>
