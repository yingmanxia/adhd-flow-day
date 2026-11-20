import { DomainError } from '@flowday/core'
import type { Bucket, TaskView } from '@flowday/types'
import { describe, expect, it, vi } from 'vitest'

import { AppError } from '../../common/errors.js'

import type { TaskRepository } from './repository.js'
import { TaskService } from './service.js'

vi.mock('../../common/transaction.js', () => ({
  inTransaction: (work: (tx: unknown) => Promise<TaskView>) => work({}),
}))
vi.mock('../../db/client.js', () => ({ prisma: {} }))

const USER = '00000000-0000-4000-8000-000000000001'
const TASK_ID = '00000000-0000-4000-8000-000000000101'
const PLAN_ID = '00000000-0000-4000-8000-000000000201'

function view(overrides: Partial<TaskView> = {}): TaskView {
  return {
    id: TASK_ID,
    title: '测试任务',
    bucket: 'INBOX',
    planId: null,
    planName: null,
    scheduledDate: null,
    startAt: null,
    dueAt: null,
    isFromSchedule: false,
    priority: 'MED',
    estimateMin: 10,
    actualMin: 0,
    deferCount: 0,
    completedAt: null,
    ...overrides,
  }
}

interface RepoHarness {
  repo: TaskRepository
  findRow: ReturnType<typeof vi.fn>
  findById: ReturnType<typeof vi.fn>
  findDeleted: ReturnType<typeof vi.fn>
  create: ReturnType<typeof vi.fn>
  move: ReturnType<typeof vi.fn>
  restore: ReturnType<typeof vi.fn>
  state: {
    row: {
      id: string
      userId: string
      bucket: Bucket
      planId: string | null
      estimateMin: number | null
      deletedAt: Date | null
    }
    created: unknown
    moved: unknown
  }
}

function makeRepo(bucket: Bucket = 'INBOX'): RepoHarness {
  const state = {
    row: { id: TASK_ID, userId: USER, bucket, planId: null, estimateMin: 10, deletedAt: null },
    created: undefined as unknown,
    moved: undefined as unknown,
  }
  const findRow = vi.fn(() => Promise.resolve(state.row))
  const findById = vi.fn(() => Promise.resolve(view({ bucket: state.row.bucket })))
  const findDeleted = vi.fn(() => Promise.resolve(null))
  const create = vi.fn((_userId: string, data: unknown) => {
    state.created = data
    return Promise.resolve(view())
  })
  const move = vi.fn((_id: string, data: unknown) => {
    state.moved = data
    return Promise.resolve(view())
  })
  const restore = vi.fn(() => Promise.resolve(view()))
  const repo = {
    findRow,
    findById,
    findDeleted,
    create,
    update: vi.fn(() => Promise.resolve(view())),
    softDelete: vi.fn(() => Promise.resolve(view())),
    restore,
    move,
    complete: vi.fn(() => Promise.resolve(view({ bucket: 'DONE' }))),
    defer: vi.fn(() => Promise.resolve(view())),
    list: vi.fn(() => Promise.resolve([])),
  } as unknown as TaskRepository
  return { repo, findRow, findById, findDeleted, create, move, restore, state }
}

describe('TaskService.capture（捕捉路由）', () => {
  it('留空日期进 INBOX', async () => {
    const h = makeRepo()
    await new TaskService(h.repo).capture(USER, { title: '想试试番茄钟' })
    expect(h.create).toHaveBeenCalledWith(USER, expect.objectContaining({ bucket: 'INBOX' }))
  })

  it('带 planId 时保留计划归属（计划拆解走同一端点）', async () => {
    const h = makeRepo()
    await new TaskService(h.repo).capture(USER, { title: '读第三章', planId: PLAN_ID })
    expect(h.create).toHaveBeenCalledWith(
      USER,
      expect.objectContaining({ planId: PLAN_ID, bucket: 'INBOX' }),
    )
  })
})

describe('TaskService.move（状态机守卫）', () => {
  it('合法迁移 UNSCHEDULED → TODAY（via=plan-queue）放行', async () => {
    const h = makeRepo('UNSCHEDULED')
    await new TaskService(h.repo).move(USER, TASK_ID, { to: 'TODAY', via: 'plan-queue' })
    expect(h.move).toHaveBeenCalled()
  })

  it('非法迁移 DONE → INBOX 抛领域错误且不落库', async () => {
    const h = makeRepo('DONE')
    await expect(
      new TaskService(h.repo).move(USER, TASK_ID, { to: 'INBOX', via: 'move' }),
    ).rejects.toBeInstanceOf(DomainError)
    expect(h.move).not.toHaveBeenCalled()
  })

  it('迁移到 SCHEDULED 缺日期被拒绝且不落库', async () => {
    const h = makeRepo('UNSCHEDULED')
    await expect(
      new TaskService(h.repo).move(USER, TASK_ID, { to: 'SCHEDULED', via: 'schedule' }),
    ).rejects.toSatisfy(
      (error: unknown) => error instanceof DomainError || error instanceof AppError,
    )
    expect(h.move).not.toHaveBeenCalled()
  })
})

describe('TaskService 边界', () => {
  it('撤销窗口超过 5 秒返回 400', async () => {
    const h = makeRepo()
    h.findDeleted.mockReturnValue(Promise.resolve({ deletedAt: new Date(Date.now() - 6_000) }))
    await expect(new TaskService(h.repo).undoDelete(USER, TASK_ID)).rejects.toMatchObject({
      statusCode: 400,
    })
    expect(h.restore).not.toHaveBeenCalled()
  })

  it('撤销窗口内可恢复', async () => {
    const h = makeRepo()
    h.findDeleted.mockReturnValue(Promise.resolve({ deletedAt: new Date(Date.now() - 1_000) }))
    await expect(new TaskService(h.repo).undoDelete(USER, TASK_ID)).resolves.toBeDefined()
    expect(h.restore).toHaveBeenCalledWith(TASK_ID)
  })

  it('不存在任务抛 NOT_FOUND', async () => {
    const h = makeRepo()
    h.findById.mockReturnValue(Promise.resolve(null))
    await expect(new TaskService(h.repo).get(USER, TASK_ID)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
})
