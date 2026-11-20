import { addDays, parseDateKey } from '@flowday/core'
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

  /** 今日已完成项：原型「今日待办」卡顶部需要完成数与完成时间。 */
  async doneToday(userId: string, dateKey: string): Promise<TaskView[]> {
    const start = new Date(`${dateKey}T00:00:00+08:00`)
    const end = new Date(`${addDays(dateKey, 1)}T00:00:00+08:00`)
    const rows = await prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        bucket: 'DONE',
        completedAt: { gte: start, lt: end },
      },
      select: VIEW_SELECT,
      orderBy: { completedAt: 'desc' },
    })
    return rows.map(toTaskView)
  }

  /** 原型「明天的第一件事」：取明天最早一件安排。 */
  async tomorrowFirst(userId: string, dateKey: string): Promise<TaskView | null> {
    const rows = await prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        bucket: 'SCHEDULED',
        scheduledDate: parseDateKey(addDays(dateKey, 1)),
      },
      select: VIEW_SELECT,
      orderBy: [{ startDate: 'asc' }, { orderIndex: 'asc' }],
      take: 1,
    })
    return rows[0] ? toTaskView(rows[0]) : null
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
