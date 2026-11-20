import { parseDateKey } from '@flowday/core'
import type { TaskView } from '@flowday/types'

import { prisma } from '../../db/client.js'
import { VIEW_SELECT, toTaskView } from '../task/repository.js'

/** daily 聚合：一屏所需数据固定三次查询（今日/计划池/角标），不随任务数增长。 */
export class DailyRepository {
  /** bucket=TODAY 即今日待办，不再按 scheduledDate 过滤——顺延/浮现的任务保留原日期也应显示。 */
  async todayTasks(userId: string): Promise<TaskView[]> {
    const rows = await prisma.task.findMany({
      where: { userId, deletedAt: null, bucket: 'TODAY' },
      select: VIEW_SELECT,
      orderBy: [{ isFrog: 'desc' }, { orderIndex: 'asc' }],
    })
    return rows.map(toTaskView)
  }

  async planQueue(userId: string): Promise<TaskView[]> {
    const rows = await prisma.task.findMany({
      where: { userId, bucket: 'UNSCHEDULED', deletedAt: null },
      select: VIEW_SELECT,
      orderBy: { orderIndex: 'asc' },
    })
    return rows.map(toTaskView)
  }

  async inboxCount(userId: string): Promise<number> {
    return prisma.task.count({ where: { userId, bucket: 'INBOX', deletedAt: null } })
  }

  /** 查出所有已到期但未浮现的 SCHEDULED 任务（scheduledDate <= date）。 */
  async dueTasks(userId: string, dateKey: string) {
    return prisma.task.findMany({
      where: {
        userId,
        bucket: 'SCHEDULED',
        deletedAt: null,
        scheduledDate: { lte: parseDateKey(dateKey) },
      },
      select: { id: true, scheduledDate: true, planId: true },
    })
  }
}
