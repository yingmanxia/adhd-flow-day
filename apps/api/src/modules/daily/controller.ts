import type { FastifyInstance } from 'fastify'

import { currentUserId } from '../../common/current-user.js'

import { dailyQuerySchema } from './schema.js'
import { DailyService } from './service.js'

export function registerDailyRoutes(app: FastifyInstance, service = new DailyService()): void {
  const userId = currentUserId()

  app.get('/api/daily', async (request) => {
    const { date } = dailyQuerySchema.parse(request.query)
    return service.get(userId, date)
  })
}
