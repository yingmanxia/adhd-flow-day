import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { config as loadDotenv } from 'dotenv'
import {
  DAILY_PLAN_ID,
  TODAY,
  USER_ID,
  dateOnly,
  futureTasks,
  inboxTasks,
  plans,
  poolTasks,
  todayTasks,
} from './seed-data'
import type { TaskSeed } from './seed-data'
import { completionSeeds, focusSeeds, historyTasks, steps } from './seed-history'

// 根 .env 是本地唯一配置源（apps/api/src/common/config.ts 也从这里读）。
// Prisma CLI 默认只找 cwd/.env，所以 seed 自己再加载一次，保证 `prisma db seed` 单独跑也能用。
loadDotenv({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) })

/**
 * S2 固定演示数据写入入口，对应《ADHD-架构设计文档》§6.3 与技术实现方案 S2 卡片。
 *
 * 幂等策略：所有行使用固定 UUID + upsert，update 分支同步相对日期字段。
 * 重复执行不产生重复行，也不会删掉用户在演示库里手工新增的数据。
 * 数据定义拆到 seed-data.ts / seed-history.ts，保持单文件低于 400 行建议值。
 */

const allTasks: TaskSeed[] = [
  ...todayTasks,
  ...inboxTasks,
  ...futureTasks,
  ...poolTasks,
  ...historyTasks,
]

export const SEED_COUNTS = {
  users: 1,
  plans: plans.length,
  dailyPlans: 1,
  tasks: allTasks.length,
  today: todayTasks.length,
  inbox: inboxTasks.length,
  future: futureTasks.length,
  planPool: poolTasks.length,
  history: historyTasks.length,
  steps: steps.length,
  completionLogs: completionSeeds.length,
  focusSessions: focusSeeds.length,
  events: 0,
} as const

function toTaskData(task: TaskSeed) {
  return {
    userId: USER_ID,
    title: task.title,
    bucket: task.bucket,
    category: task.category ?? 'LIFE',
    priority: task.priority ?? 'MED',
    planId: task.planId ?? null,
    dailyPlanId: task.dailyPlanId ?? null,
    scheduledDate: task.scheduledDate ?? null,
    startDate: task.startDate ?? null,
    dueDate: task.dueDate ?? null,
    estimateMin: task.estimateMin ?? null,
    actualMin: task.actualMin ?? null,
    deferCount: task.deferCount ?? 0,
    isFrog: task.isFrog ?? false,
    hasCream: task.hasCream ?? false,
    isFromSchedule: task.isFromSchedule ?? false,
    completedAt: task.completedAt ?? null,
    orderIndex: task.orderIndex,
  }
}

async function seed(prisma: PrismaClient): Promise<void> {
  await prisma.user.upsert({
    where: { id: USER_ID },
    create: {
      id: USER_ID,
      email: 'demo@flowday.local',
      displayName: 'FlowDay Demo',
      timezone: 'Asia/Shanghai',
    },
    update: { displayName: 'FlowDay Demo', timezone: 'Asia/Shanghai' },
  })

  for (const plan of plans) {
    const { id, ...data } = plan
    await prisma.plan.upsert({
      where: { id },
      create: { id, userId: USER_ID, ...data },
      update: data,
    })
  }

  await prisma.dailyPlan.upsert({
    where: { id: DAILY_PLAN_ID },
    create: { id: DAILY_PLAN_ID, userId: USER_ID, planDate: dateOnly(TODAY) },
    update: { planDate: dateOnly(TODAY) },
  })

  for (const task of allTasks) {
    const data = toTaskData(task)
    await prisma.task.upsert({
      where: { id: task.id },
      create: { id: task.id, ...data },
      update: data,
    })
  }

  for (const step of steps) {
    const { id, ...data } = step
    await prisma.step.upsert({ where: { id }, create: { id, ...data }, update: data })
  }

  for (const log of completionSeeds) {
    const { id, ...data } = log
    await prisma.completionLog.upsert({
      where: { id },
      create: { id, userId: USER_ID, completed: true, ...data },
      update: data,
    })
  }

  for (const session of focusSeeds) {
    const { id, ...data } = session
    await prisma.focusSession.upsert({
      where: { id },
      create: { id, userId: USER_ID, ...data },
      update: data,
    })
  }
}

async function summary(prisma: PrismaClient): Promise<void> {
  const counts = {
    users: await prisma.user.count(),
    plans: await prisma.plan.count(),
    dailyPlans: await prisma.dailyPlan.count(),
    tasks: await prisma.task.count(),
    today: await prisma.task.count({ where: { bucket: 'TODAY' } }),
    inbox: await prisma.task.count({ where: { bucket: 'INBOX' } }),
    future: await prisma.task.count({ where: { bucket: 'SCHEDULED' } }),
    planPool: await prisma.task.count({ where: { bucket: 'UNSCHEDULED' } }),
    history: await prisma.task.count({ where: { bucket: 'DONE' } }),
    steps: await prisma.step.count(),
    completionLogs: await prisma.completionLog.count(),
    focusSessions: await prisma.focusSession.count(),
    events: await prisma.event.count(),
  }

  const mismatches = Object.entries(SEED_COUNTS).filter(
    ([key, expected]) => counts[key as keyof typeof counts] !== expected,
  )
  console.log(`SEED_SUMMARY=${JSON.stringify(counts)}`)
  if (mismatches.length > 0) {
    throw new Error(`种子数据条数与声明不一致：${JSON.stringify(mismatches)}`)
  }
}

async function main(): Promise<void> {
  const prisma = new PrismaClient()
  try {
    await seed(prisma)
    await summary(prisma)
    console.log('seed 完成：数据条数与 SEED_COUNTS 一致')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
