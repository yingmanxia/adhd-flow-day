/**
 * S2 固定演示数据（二）：近两月完成历史、拆解步骤、专注会话。
 * 只依赖 seed-data.ts，供 seed.ts 汇总写入。
 */

import { PLAN_IDS, TODAY, addDays, atDate, dateOnly, seedId } from './seed-data'
import type { CompletionSeed, FocusSeed, TaskSeed } from './seed-data'

// 近两月完成历史：24 条，供热力图 / 周回顾 / 完成记录卡聚合
const HISTORY_OFFSETS = [
  -1, -2, -3, -5, -6, -8, -9, -10, -12, -13, -15, -17, -18, -20, -22, -24, -27, -30, -34, -38, -42,
  -48, -52, -56,
]
const HISTORY_TITLES = [
  '读 10 页资料',
  '收拾桌面',
  '散步 15 分钟',
  '写一页草稿',
  '洗衣服',
  '整理笔记',
]

export const historyTasks: TaskSeed[] = []
export const completionSeeds: CompletionSeed[] = []

HISTORY_OFFSETS.forEach((offset, index) => {
  const key = addDays(TODAY, offset)
  const taskId = seedId(2, 100 + index)
  const estimateMin = 10 + ((index * 7) % 30)
  const actualMin = estimateMin + ((index % 5) - 2) * 3
  const completedAt = atDate(key, 14 + (index % 5), (index * 10) % 60)

  historyTasks.push({
    id: taskId,
    title: HISTORY_TITLES[index % HISTORY_TITLES.length]!,
    bucket: 'DONE',
    orderIndex: index,
    planId: index % 3 === 0 ? PLAN_IDS[0] : undefined,
    scheduledDate: dateOnly(key),
    estimateMin,
    actualMin,
    completedAt,
  })

  completionSeeds.push({
    id: seedId(5, index + 1),
    taskId,
    statDate: dateOnly(key),
    completedAt,
    estimateMin,
    actualMin: Math.max(1, actualMin),
  })
})

/** 今日已完成两件：让「今日待办」卡按原型显示完成进度与完成时间。 */
const atShanghai = (key: string, hour: number, minute: number): Date =>
  new Date(`${key}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+08:00`)

export const todayDoneTasks: TaskSeed[] = [
  {
    id: seedId(2, 300),
    title: '整理桌面 10 分钟',
    bucket: 'DONE',
    orderIndex: 0,
    estimateMin: 10,
    actualMin: 10,
    scheduledDate: dateOnly(TODAY),
    completedAt: atShanghai(TODAY, 9, 12),
  },
  {
    id: seedId(2, 301),
    title: '回复导师邮件',
    bucket: 'DONE',
    orderIndex: 1,
    estimateMin: 15,
    actualMin: 15,
    scheduledDate: dateOnly(TODAY),
    completedAt: atShanghai(TODAY, 10, 35),
  },
]

export const todayCompletionSeeds: CompletionSeed[] = todayDoneTasks.map((task, index) => ({
  id: seedId(5, 100 + index),
  taskId: task.id,
  statDate: dateOnly(TODAY),
  completedAt: task.completedAt!,
  estimateMin: task.estimateMin!,
  actualMin: task.actualMin!,
}))

export const focusSeeds: FocusSeed[] = [
  {
    id: seedId(6, 1),
    taskId: seedId(2, 1),
    status: 'COMPLETED',
    plannedSec: 300,
    actualFocusSec: 300,
    pauseCount: 0,
    startedAt: atDate(addDays(TODAY, -2), 9),
    endedAt: atDate(addDays(TODAY, -2), 9, 5),
    statDate: dateOnly(addDays(TODAY, -2)),
    idempotencyKey: 'seed-focus-1',
  },
  {
    id: seedId(6, 2),
    taskId: seedId(2, 2),
    status: 'EARLY_STOPPED',
    plannedSec: 300,
    actualFocusSec: 135,
    pauseCount: 1,
    startedAt: atDate(addDays(TODAY, -1), 20),
    endedAt: atDate(addDays(TODAY, -1), 20, 3),
    statDate: dateOnly(addDays(TODAY, -1)),
    idempotencyKey: 'seed-focus-2',
  },
  {
    id: seedId(6, 3),
    taskId: seedId(2, 3),
    status: 'COMPLETED',
    plannedSec: 300,
    actualFocusSec: 300,
    pauseCount: 0,
    startedAt: atDate(TODAY, 8),
    endedAt: atDate(TODAY, 8, 5),
    statDate: dateOnly(TODAY),
    idempotencyKey: 'seed-focus-3',
  },
]
