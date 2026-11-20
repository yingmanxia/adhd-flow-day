import { assertMove, toDateKey } from '@flowday/core'

import { inTransaction } from '../../common/transaction.js'
import { TaskRepository } from '../task/repository.js'

import { DailyRepository } from './repository.js'

const TODAY_TIMEZONE = 'Asia/Shanghai'

export interface DailyView {
  date: string
  tasks: Awaited<ReturnType<DailyRepository['todayTasks']>>
  doneTasks: Awaited<ReturnType<DailyRepository['doneToday']>>
  tomorrowFirst: Awaited<ReturnType<DailyRepository['tomorrowFirst']>>
  planQueue: Awaited<ReturnType<DailyRepository['planQueue']>>
  inboxCount: number
  surfacedCount: number
}

export class DailyService {
  constructor(
    private readonly repo = new DailyRepository(),
    private readonly tasks = new TaskRepository(),
  ) {}

  async get(userId: string, dateKey = toDateKey(new Date(), TODAY_TIMEZONE)): Promise<DailyView> {
    const surfacedCount = await this.surfaceDue(userId, dateKey)
    const [tasks, doneTasks, tomorrowFirst, planQueue, inboxCount] = await Promise.all([
      this.repo.todayTasks(userId),
      this.repo.doneToday(userId, dateKey),
      this.repo.tomorrowFirst(userId, dateKey),
      this.repo.planQueue(userId),
      this.repo.inboxCount(userId),
    ])
    return { date: dateKey, tasks, doneTasks, tomorrowFirst, planQueue, inboxCount, surfacedCount }
  }

  /**
   * 到期浮现：事务内把 SCHEDULED 且 scheduledDate<=today 的任务原子迁到 TODAY。
   * 幂等——只有 bucket=SCHEDULED 的行会被选中，重复调用第二次 surfacedCount=0。
   */
  private async surfaceDue(userId: string, dateKey: string): Promise<number> {
    const due = await this.repo.dueTasks(userId, dateKey)
    if (due.length === 0) return 0

    return inTransaction(async (tx) => {
      let count = 0
      for (const row of due) {
        const scheduledDate = row.scheduledDate
        if (!scheduledDate) continue
        const date = toDateKey(scheduledDate)
        assertMove({
          from: 'SCHEDULED',
          to: 'TODAY',
          via: 'due',
          scheduledDate: date,
          today: dateKey,
        })
        await this.tasks.move(
          row.id,
          {
            bucket: 'TODAY',
            scheduledDate,
            planId: row.planId,
            isFromSchedule: true,
          },
          tx,
        )
        count++
      }
      return count
    })
  }
}
