/**
 * S2 固定演示数据（二）：近两月完成历史、拆解步骤、专注会话。
 * 只依赖 seed-data.ts，供 seed.ts 汇总写入。
 */

import { PLAN_IDS, TODAY, addDays, atDate, dateOnly, seedId } from './seed-data'
import type { CompletionSeed, FocusSeed, StepSeed, TaskSeed } from './seed-data'

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
    category: index % 3 === 0 ? 'WORK' : 'LIFE',
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

export const steps: StepSeed[] = [
  { id: seedId(3, 1), taskId: seedId(2, 1), text: '打开第三章', done: true, orderIndex: 0 },
  { id: seedId(3, 2), taskId: seedId(2, 1), text: '读前 10 页', done: false, orderIndex: 1 },
  { id: seedId(3, 3), taskId: seedId(2, 1), text: '记 3 条笔记', done: false, orderIndex: 2 },
  { id: seedId(3, 4), taskId: seedId(2, 20), text: '导出文献列表', done: false, orderIndex: 0 },
  { id: seedId(3, 5), taskId: seedId(2, 20), text: '按主题分组', done: false, orderIndex: 1 },
  { id: seedId(3, 6), taskId: seedId(2, 20), text: '挑 5 篇精读', done: false, orderIndex: 2 },
]

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
