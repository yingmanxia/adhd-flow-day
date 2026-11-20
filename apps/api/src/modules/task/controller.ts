import { captureTaskSchema, moveTaskSchema } from '@flowday/types'
import type { FastifyInstance } from 'fastify'

import { currentUserId } from '../../common/current-user.js'

import {
  completeTaskRequestSchema,
  deferTaskRequestSchema,
  listTasksQuerySchema,
  patchTaskRequestSchema,
  taskIdParamsSchema,
} from './schema.js'
import { TaskService } from './service.js'

export function registerTaskRoutes(app: FastifyInstance, service = new TaskService()): void {
  const userId = currentUserId()

  app.get('/api/tasks', async (request) => {
    const query = listTasksQuerySchema.parse(request.query)
    return { tasks: await service.list(userId, query) }
  })

  app.post('/api/tasks', async (request, reply) => {
    const input = captureTaskSchema.parse(request.body)
    const task = await service.capture(userId, input)
    return reply.code(201).send({ task })
  })

  app.get('/api/tasks/:id', async (request) => {
    const { id } = taskIdParamsSchema.parse(request.params)
    return { task: await service.get(userId, id) }
  })

  app.patch('/api/tasks/:id', async (request) => {
    const { id } = taskIdParamsSchema.parse(request.params)
    const input = patchTaskRequestSchema.parse(request.body)
    return { task: await service.patch(userId, id, input) }
  })

  app.delete('/api/tasks/:id', async (request) => {
    const { id } = taskIdParamsSchema.parse(request.params)
    return { task: await service.softDelete(userId, id) }
  })

  app.post('/api/tasks/:id/undo-delete', async (request) => {
    const { id } = taskIdParamsSchema.parse(request.params)
    return { task: await service.undoDelete(userId, id) }
  })

  app.post('/api/tasks/:id/complete', async (request) => {
    const { id } = taskIdParamsSchema.parse(request.params)
    const input = completeTaskRequestSchema.parse(request.body ?? {})
    return { task: await service.complete(userId, id, input) }
  })

  app.post('/api/tasks/:id/defer', async (request) => {
    const { id } = taskIdParamsSchema.parse(request.params)
    const { to } = deferTaskRequestSchema.parse(request.body)
    return { task: await service.defer(userId, id, to) }
  })

  app.post('/api/tasks/:id/move', async (request) => {
    const { id } = taskIdParamsSchema.parse(request.params)
    const input = moveTaskSchema.parse(request.body)
    return { task: await service.move(userId, id, input) }
  })
}
