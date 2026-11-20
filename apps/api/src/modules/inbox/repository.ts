import { prisma } from '../../db/client.js'
import { VIEW_SELECT, toTaskView } from '../task/repository.js'

import type { CreateInboxRequest } from './schema.js'

/** 收件箱只是 bucket=INBOX 的视图，不引入独立表；仓储负责查询与角标计数。 */
export class InboxRepository {
  async list(userId: string) {
    const rows = await prisma.task.findMany({
      where: { userId, bucket: 'INBOX', deletedAt: null },
      select: VIEW_SELECT,
      orderBy: { createdAt: 'asc' },
    })
    return rows.map(toTaskView)
  }

  async count(userId: string): Promise<number> {
    return prisma.task.count({ where: { userId, bucket: 'INBOX', deletedAt: null } })
  }

  async create(userId: string, input: CreateInboxRequest) {
    const row = await prisma.task.create({
      data: { userId, title: input.title, bucket: 'INBOX', estimateMin: input.estimateMin ?? null },
      select: VIEW_SELECT,
    })
    return toTaskView(row)
  }
}
