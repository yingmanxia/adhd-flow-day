import type { FastifyInstance } from 'fastify'

import { currentUserId } from '../../common/current-user.js'

import { PrismaPlanRepository } from './repository.js'
import { createPlanRequestSchema, planIdParamsSchema, updatePlanRequestSchema } from './schema.js'
import { PlanService } from './service.js'

export function registerPlanRoutes(
  app: FastifyInstance,
  service = new PlanService(new PrismaPlanRepository()),
): void {
  const userId = currentUserId()

  app.get('/api/plans', async () => ({ plans: await service.list(userId) }))

  app.post('/api/plans', async (request, reply) => {
    const input = createPlanRequestSchema.parse(request.body)
    const plan = await service.create(userId, input)
    return reply.code(201).send({ plan })
  })

  app.get('/api/plans/:id', async (request) => {
    const { id } = planIdParamsSchema.parse(request.params)
    return { plan: await service.get(userId, id) }
  })

  app.patch('/api/plans/:id', async (request) => {
    const { id } = planIdParamsSchema.parse(request.params)
    const input = updatePlanRequestSchema.parse(request.body)
    return { plan: await service.update(userId, id, input) }
  })

  app.delete('/api/plans/:id', async (request, reply) => {
    const { id } = planIdParamsSchema.parse(request.params)
    await service.remove(userId, id)
    return reply.code(204).send()
  })
}
