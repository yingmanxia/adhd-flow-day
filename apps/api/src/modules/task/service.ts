import { addDays, assertMove, toDateKey } from '@flowday/core'
import type {
  Bucket,
  CaptureTaskInput,
  MoveTaskInput,
  TaskView,
  TriageAction,
} from '@flowday/types'

import { badRequest, notFound } from '../../common/errors.js'
import { inTransaction } from '../../common/transaction.js'

import { TaskRepository, type MoveUpdateData, type TaskWriteData } from './repository.js'
import type { CompleteTaskRequest, ListTasksQuery, PatchTaskRequest } from './schema.js'

const UNDO_WINDOW_MS = 5_000
const TODAY_TIMEZONE = 'Asia/Shanghai'

export class TaskService {
  constructor(private readonly repo: TaskRepository = new TaskRepository()) {}

  list(userId: string, query: ListTasksQuery): Promise<TaskView[]> {
    return this.repo.list(userId, query)
  }

  async get(userId: string, id: string): Promise<TaskView> {
    const task = await this.repo.findById(userId, id)
    if (!task) throw notFound('任务不存在')
    return task
  }

  /** 捕捉：留空日期→INBOX，今天→TODAY，未来→SCHEDULED。带 planId 表示计划下拆解出的任务。 */
  async capture(userId: string, input: CaptureTaskInput): Promise<TaskView> {
    const today = toDateKey(new Date(), TODAY_TIMEZONE)
    const dateKey =
      input.scheduledDate ?? (input.startAt ? toDateKey(input.startAt, TODAY_TIMEZONE) : undefined)
    // 带 planId 且无日期 = 计划下拆解出的任务，直接进计划池；散装留空才进收件箱。
    let bucket: Bucket = input.planId ? 'UNSCHEDULED' : 'INBOX'
    if (dateKey === today) bucket = 'TODAY'
    else if (dateKey && addDays(today, 1) <= dateKey) bucket = 'SCHEDULED'

    const data: TaskWriteData = {
      title: input.title,
      bucket,
      planId: input.planId ?? null,
      priority: input.priority ?? 'MED',
      scheduledDate: dateKey ? new Date(`${dateKey}T00:00:00.000Z`) : null,
      startDate: input.startAt ? new Date(input.startAt) : null,
      dueDate: input.dueAt ? new Date(input.dueAt) : null,
      estimateMin: input.estimateMin ?? null,
      orderIndex: 0,
      isFromSchedule: false,
      isFrog: input.isFrog ?? false,
    }
    return this.repo.create(userId, data)
  }

  async patch(userId: string, id: string, input: PatchTaskRequest): Promise<TaskView> {
    await this.requireRow(userId, id)
    return this.repo.update(id, input)
  }

  async softDelete(userId: string, id: string): Promise<TaskView> {
    await this.requireRow(userId, id)
    return this.repo.softDelete(id)
  }

  /** 5 秒撤销窗口：超时返回 400，不静默失败。 */
  async undoDelete(userId: string, id: string): Promise<TaskView> {
    const row = await this.repo.findDeleted(userId, id)
    if (!row?.deletedAt) throw notFound('没有可撤销的删除')
    if (Date.now() - row.deletedAt.getTime() > UNDO_WINDOW_MS) {
      throw badRequest('撤销窗口已过（5 秒）')
    }
    return this.repo.restore(id)
  }

  /** 勾选完成：tasks + completion_log 同一事务，重复调用不产生第二条日志。 */
  async complete(userId: string, id: string, input: CompleteTaskRequest): Promise<TaskView> {
    const row = await this.requireRow(userId, id)
    if (row.bucket === 'DONE') {
      const existing = await this.repo.findById(userId, id)
      if (existing) return existing
    }
    const estimated = row.estimateMin ?? 0
    const actualMin = input.actualMin ?? estimated
    return inTransaction((tx) => this.repo.complete(userId, id, actualMin, tx))
  }

  /** 顺延：TODAY 自环，deferCount++，不改失败语义。 */
  async defer(userId: string, id: string, to: string): Promise<TaskView> {
    const row = await this.requireRow(userId, id)
    if (row.bucket !== 'TODAY') throw badRequest('只有今日待办可以顺延')
    return inTransaction((tx) => this.repo.defer(id, to, tx))
  }

  /** 唯一位置变更入口：所有写动作都经 core 状态机守卫后再落库。 */
  async move(
    userId: string,
    id: string,
    input: MoveTaskInput,
    viaOverride?: { via?: MoveTaskInput['via']; triageAction?: TriageAction },
  ): Promise<TaskView> {
    const row = await this.requireRow(userId, id)
    const via = viaOverride?.via ?? input.via
    const today = toDateKey(new Date(), TODAY_TIMEZONE)
    const from = row.bucket

    assertMove({
      from,
      to: input.to,
      via,
      triageAction: viaOverride?.triageAction,
      scheduledDate: input.scheduledDate,
      planId: input.planId,
      today,
    })

    if (input.to === 'SCHEDULED' && !input.scheduledDate) throw badRequest('需要指定日期')
    if (input.to === 'UNSCHEDULED' && !input.planId) throw badRequest('需要指定计划')

    const data: MoveUpdateData = {
      bucket: input.to,
      scheduledDate: input.scheduledDate ? new Date(`${input.scheduledDate}T00:00:00.000Z`) : null,
      planId: input.planId ?? (input.to === 'UNSCHEDULED' ? row.planId : null) ?? row.planId,
      startDate: input.startAt ? new Date(input.startAt) : undefined,
      dueDate: input.dueAt ? new Date(input.dueAt) : undefined,
      isFromSchedule: input.to === 'TODAY' && via === 'due',
    }
    return inTransaction((tx) => this.repo.move(id, data, tx))
  }

  private async requireRow(userId: string, id: string) {
    const row = await this.repo.findRow(userId, id)
    if (!row) throw notFound('任务不存在')
    return row
  }
}
