import type { FastifyInstance } from 'fastify'

import { currentUserId } from '../../common/current-user.js'

import {
  createInboxRequestSchema,
  inboxIdParamsSchema,
  inboxTriageRequestSchema,
} from './schema.js'
import { InboxService } from './service.js'

export function registerInboxRoutes(app: FastifyInstance, service = new InboxService()): void {
  const userId = currentUserId()

  app.get('/api/inbox', async () => ({
    tasks: await service.list(userId),
    count: await service.count(userId),
  }))

  app.post('/api/inbox', async (request, reply) => {
    const input = createInboxRequestSchema.parse(request.body)
    const task = await service.create(userId, input)
    return reply.code(201).send({ task })
  })

  app.post('/api/inbox/:id/triage', async (request) => {
    const { id } = inboxIdParamsSchema.parse(request.params)
    const input = inboxTriageRequestSchema.parse(request.body)
    return { task: await service.triage(userId, id, input) }
  })
}
