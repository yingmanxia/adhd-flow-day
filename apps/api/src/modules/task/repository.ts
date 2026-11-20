import { parseDateKey, toDateKey } from '@flowday/core'
import type { Bucket, TaskPriority, TaskView } from '@flowday/types'
import type { Prisma, PrismaClient, Task as TaskRow } from '@prisma/client'

import { prisma } from '../../db/client.js'

import type { ListTasksQuery, PatchTaskRequest } from './schema.js'

export interface TaskWriteData {
  title: string
  bucket: Bucket
  planId: string | null
  priority: TaskPriority
  scheduledDate: Date | null
  startDate: Date | null
  dueDate: Date | null
  estimateMin: number | null
  orderIndex: number
  isFromSchedule: boolean
  isFrog: boolean
}

export interface MoveUpdateData {
  bucket: Bucket
  scheduledDate: Date | null
  planId: string | null
  startDate?: Date | null
  dueDate?: Date | null
  isFromSchedule: boolean
  dailyPlanId?: string | null
}

export const VIEW_SELECT = {
  id: true,
  title: true,
  bucket: true,
  planId: true,
  plan: { select: { title: true } },
  scheduledDate: true,
  startDate: true,
  dueDate: true,
  isFromSchedule: true,
  isFrog: true,
  priority: true,
  estimateMin: true,
  actualMin: true,
  deferCount: true,
  completedAt: true,
} satisfies Prisma.TaskSelect

type ViewRow = Prisma.TaskGetPayload<{ select: typeof VIEW_SELECT }>

export function toTaskView(row: ViewRow): TaskView {
  return {
    id: row.id,
    title: row.title,
    bucket: row.bucket,
    planId: row.planId,
    planName: row.plan?.title ?? null,
    scheduledDate: row.scheduledDate ? toDateKey(row.scheduledDate) : null,
    startAt: row.startDate?.toISOString() ?? null,
    dueAt: row.dueDate?.toISOString() ?? null,
    isFromSchedule: row.isFromSchedule,
    isFrog: row.isFrog,
    priority: row.priority,
    estimateMin: row.estimateMin ?? 0,
    actualMin: row.actualMin ?? 0,
    deferCount: row.deferCount,
    completedAt: row.completedAt?.toISOString() ?? null,
  }
}

/** 仓储层只负责数据访问，归属校验在 Service 用 findRow(id, userId) 完成。 */
export class TaskRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async list(userId: string, query: ListTasksQuery): Promise<TaskView[]> {
    const rows = await this.db.task.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(query.bucket ? { bucket: query.bucket } : {}),
        ...(query.planId ? { planId: query.planId } : {}),
        ...(query.from || query.to
          ? {
              scheduledDate: {
                ...(query.from ? { gte: parseDateKey(query.from) } : {}),
                ...(query.to ? { lte: parseDateKey(query.to) } : {}),
              },
            }
          : {}),
      },
      select: VIEW_SELECT,
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
    })
    return rows.map(toTaskView)
  }

  findRow(userId: string, id: string): Promise<TaskRow | null> {
    return this.db.task.findFirst({ where: { id, userId, deletedAt: null } })
  }

  async findById(userId: string, id: string): Promise<TaskView | null> {
    const row = await this.db.task.findFirst({
      where: { id, userId, deletedAt: null },
      select: VIEW_SELECT,
    })
    return row ? toTaskView(row) : null
  }

  findDeleted(userId: string, id: string): Promise<TaskRow | null> {
    return this.db.task.findFirst({ where: { id, userId, deletedAt: { not: null } } })
  }

  async create(userId: string, data: TaskWriteData): Promise<TaskView> {
    const row = await this.db.task.create({ data: { userId, ...data }, select: VIEW_SELECT })
    return toTaskView(row)
  }

  async update(id: string, input: PatchTaskRequest): Promise<TaskView> {
    const row = await this.db.task.update({
      where: { id },
      data: {
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.planId === undefined ? {} : { planId: input.planId }),
        ...(input.estimateMin === undefined ? {} : { estimateMin: input.estimateMin }),
        ...(input.priority === undefined ? {} : { priority: input.priority }),
        ...(input.isFrog === undefined ? {} : { isFrog: input.isFrog }),
      },
      select: VIEW_SELECT,
    })
    return toTaskView(row)
  }

  async softDelete(id: string): Promise<TaskView> {
    const row = await this.db.task.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: VIEW_SELECT,
    })
    return toTaskView(row)
  }

  async restore(id: string): Promise<TaskView> {
    const row = await this.db.task.update({
      where: { id },
      data: { deletedAt: null },
      select: VIEW_SELECT,
    })
    return toTaskView(row)
  }

  async move(id: string, data: MoveUpdateData, tx: PrismaClient = this.db): Promise<TaskView> {
    const row = await tx.task.update({
      where: { id },
      data: {
        bucket: data.bucket,
        scheduledDate: data.scheduledDate,
        planId: data.planId,
        ...(data.startDate === undefined ? {} : { startDate: data.startDate }),
        ...(data.dueDate === undefined ? {} : { dueDate: data.dueDate }),
        isFromSchedule: data.isFromSchedule,
        ...(data.dailyPlanId === undefined ? {} : { dailyPlanId: data.dailyPlanId }),
      },
      select: VIEW_SELECT,
    })
    return toTaskView(row)
  }

  async complete(
    userId: string,
    id: string,
    actualMin: number,
    tx: PrismaClient,
  ): Promise<TaskView> {
    const now = new Date()
    const row = await tx.task.update({
      where: { id },
      data: { bucket: 'DONE', actualMin, completedAt: now, isFromSchedule: false },
      select: VIEW_SELECT,
    })
    await tx.completionLog.create({
      data: {
        userId,
        taskId: id,
        statDate: parseDateKey(toDateKey(now, 'Asia/Shanghai')),
        completed: true,
        estimateMin: row.estimateMin ?? 0,
        actualMin,
        completedAt: now,
      },
    })
    return toTaskView(row)
  }

  async defer(id: string, to: string, tx: PrismaClient): Promise<TaskView> {
    const row = await tx.task.update({
      where: { id },
      data: { scheduledDate: parseDateKey(to), deferCount: { increment: 1 } },
      select: VIEW_SELECT,
    })
    return toTaskView(row)
  }

  /** 取消完成：回今日 + 清空完成时刻/实际用时（完成日志的删除由 Service 同事务处理）。 */
  async uncomplete(id: string, scheduledDate: Date, tx: PrismaClient): Promise<TaskView> {
    const row = await tx.task.update({
      where: { id },
      data: {
        bucket: 'TODAY',
        scheduledDate,
        completedAt: null,
        actualMin: null,
        isFromSchedule: false,
      },
      select: VIEW_SELECT,
    })
    return toTaskView(row)
  }
}
