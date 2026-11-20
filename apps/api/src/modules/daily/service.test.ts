import type { TaskView } from '@flowday/types'
import { describe, expect, it, vi } from 'vitest'

import type { DailyRepository } from './repository.js'
import { DailyService } from './service.js'

vi.mock('../../common/transaction.js', () => ({
  inTransaction: (work: (tx: unknown) => Promise<number>) => work({}),
}))

const USER = '00000000-0000-4000-8000-000000000001'

function harness() {
  const due = vi.fn(() =>
    Promise.resolve([] as Array<{ id: string; scheduledDate: Date; planId: string | null }>),
  )
  const todayTasks = vi.fn(() => Promise.resolve([] as TaskView[]))
  const planQueue = vi.fn(() => Promise.resolve([] as TaskView[]))
  const inboxCount = vi.fn(() => Promise.resolve(0))
  const tasksMove = vi.fn((_id: string, _data: unknown, _tx?: unknown) =>
    Promise.resolve({} as TaskView),
  )
  const repo = { dueTasks: due, todayTasks, planQueue, inboxCount } as unknown as DailyRepository
  return {
    repo,
    tasksMove,
    due,
    todayTasks,
    planQueue,
    inboxCount,
    service: new DailyService(repo, { move: tasksMove } as never),
  }
}

describe('DailyService.get（到期浮现）', () => {
  it('无到期任务时 surfacedCount=0 且不写库', async () => {
    const h = harness()
    const view = await h.service.get(USER, '2026-11-20')
    expect(view.surfacedCount).toBe(0)
    expect(h.tasksMove).not.toHaveBeenCalled()
    expect(view.date).toBe('2026-11-20')
  })

  it('聚合一屏数据：今日/计划池/角标', async () => {
    const h = harness()
    const view = await h.service.get(USER, '2026-11-20')
    expect(view.tasks).toEqual([])
    expect(view.planQueue).toEqual([])
    expect(view.inboxCount).toBe(0)
  })
})
