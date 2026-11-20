import { toDateKey } from '@flowday/core'
import type { TaskView } from '@flowday/types'

import { TaskService } from '../task/service.js'

import { InboxRepository } from './repository.js'
import type { CreateInboxRequest, InboxTriageRequest } from './schema.js'

const TODAY_TIMEZONE = 'Asia/Shanghai'

export class InboxService {
  constructor(
    private readonly repo = new InboxRepository(),
    private readonly tasks = new TaskService(),
  ) {}

  list(userId: string): Promise<TaskView[]> {
    return this.repo.list(userId)
  }

  count(userId: string): Promise<number> {
    return this.repo.count(userId)
  }

  create(userId: string, input: CreateInboxRequest): Promise<TaskView> {
    return this.repo.create(userId, input)
  }

  /** 四向分流：并入今日 / 归入计划 / 删除 / 安排未来，全部复用 TaskService 的状态机守卫。 */
  async triage(userId: string, id: string, input: InboxTriageRequest): Promise<TaskView> {
    const today = toDateKey(new Date(), TODAY_TIMEZONE)

    switch (input.action) {
      case 'TODAY': {
        const scheduledDate = input.scheduledDate ?? today
        return this.tasks.move(
          userId,
          id,
          { to: 'TODAY', via: 'triage', scheduledDate },
          { via: 'triage', triageAction: input.action },
        )
      }
      case 'PLAN':
        return this.tasks.move(
          userId,
          id,
          { to: 'UNSCHEDULED', via: 'triage', planId: input.planId },
          { via: 'triage', triageAction: input.action },
        )
      case 'SCHEDULE':
        return this.tasks.move(
          userId,
          id,
          {
            to: 'SCHEDULED',
            via: 'triage',
            scheduledDate: input.scheduledDate,
            startAt: input.startAt,
            dueAt: input.dueAt,
          },
          { via: 'triage', triageAction: input.action },
        )
      case 'DELETE':
        return this.tasks.softDelete(userId, id)
    }
  }
}
