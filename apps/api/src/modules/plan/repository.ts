import { toDateKey } from '@flowday/core'
import type { PlanView } from '@flowday/types'
import type { Prisma } from '@prisma/client'

import { prisma } from '../../db/client.js'

import type { CreatePlanRequest, UpdatePlanRequest } from './schema.js'

export interface PlanRepository {
  list(userId: string): Promise<PlanView[]>
  create(userId: string, input: CreatePlanRequest): Promise<PlanView>
  findById(userId: string, id: string): Promise<PlanView | null>
  update(id: string, input: UpdatePlanRequest): Promise<PlanView>
  remove(userId: string, id: string): Promise<void>
}

type PlanRow = Prisma.PlanGetPayload<{
  select: {
    id: true
    title: true
    motivation: true
    expectedDate: true
    status: true
    tasks: { select: { bucket: true } }
  }
}>

function toView(row: PlanRow): PlanView {
  return {
    id: row.id,
    title: row.title,
    motivation: row.motivation,
    expectedDate: row.expectedDate ? toDateKey(row.expectedDate) : null,
    status: row.status,
    taskCount: row.tasks.length,
    doneCount: row.tasks.filter((task) => task.bucket === 'DONE').length,
  }
}

const PLAN_SELECT = {
  id: true,
  title: true,
  motivation: true,
  expectedDate: true,
  status: true,
  tasks: { where: { deletedAt: null }, select: { bucket: true } },
} satisfies Prisma.PlanSelect

export class PrismaPlanRepository implements PlanRepository {
  async list(userId: string): Promise<PlanView[]> {
    const rows = await prisma.plan.findMany({
      where: { userId, status: { not: 'ARCHIVED' } },
      select: PLAN_SELECT,
      orderBy: { createdAt: 'asc' },
    })
    return rows.map(toView)
  }

  async create(userId: string, input: CreatePlanRequest): Promise<PlanView> {
    const row = await prisma.plan.create({
      data: {
        userId,
        title: input.title,
        motivation: input.motivation ?? null,
        expectedDate: input.expectedDate ? new Date(`${input.expectedDate}T00:00:00.000Z`) : null,
      },
      select: PLAN_SELECT,
    })
    return toView(row)
  }

  async findById(userId: string, id: string): Promise<PlanView | null> {
    const row = await prisma.plan.findFirst({ where: { id, userId }, select: PLAN_SELECT })
    return row ? toView(row) : null
  }

  async update(id: string, input: UpdatePlanRequest): Promise<PlanView> {
    const row = await prisma.plan.update({
      where: { id },
      data: {
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.motivation === undefined ? {} : { motivation: input.motivation }),
        ...(input.expectedDate === undefined
          ? {}
          : {
              expectedDate: input.expectedDate
                ? new Date(`${input.expectedDate}T00:00:00.000Z`)
                : null,
            }),
        ...(input.status === undefined ? {} : { status: input.status }),
      },
      select: PLAN_SELECT,
    })
    // 归属由 Service 前置 findById 校验；这里只按 id 更新，避免把 userId 误写进 data。
    return toView(row)
  }

  async remove(userId: string, id: string): Promise<void> {
    // 归档删除而非物理删除：保留历史完成记录的归属。
    await prisma.plan.updateMany({ where: { id, userId }, data: { status: 'ARCHIVED' } })
  }
}
