/**
 * S2 固定演示数据（一）：工具函数、类型契约、计划与「今日/收件箱/未来/计划池」任务。
 * 对应《ADHD-架构设计文档》§6.3 与技术实现方案 S2 卡片。
 * 被 seed-history.ts 与 seed.ts 单向依赖，三者无循环引用。
 */

export type Bucket = 'INBOX' | 'UNSCHEDULED' | 'SCHEDULED' | 'TODAY' | 'DONE'
export type Priority = 'HIGH' | 'MED' | 'LOW'
export type PlanState = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
export type FocusState = 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'EARLY_STOPPED'

const ID_PREFIX = '00000000-0000-4000-8000-'

export function seedId(group: number, index: number): string {
  return `${ID_PREFIX}${String(group).padStart(4, '0')}${String(index).padStart(8, '0')}`
}

export function dateOnly(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`)
}

export function atDate(key: string, hour: number, minute = 0): Date {
  return new Date(
    `${key}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`,
  )
}

export function addDays(key: string, days: number): string {
  const date = dateOnly(key)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function startOfWeek(key: string): string {
  const day = dateOnly(key).getUTCDay()
  return addDays(key, -((day - 1 + 7) % 7))
}

export const USER_ID = seedId(0, 1)
export const PLAN_IDS = [seedId(1, 1), seedId(1, 2), seedId(1, 3)]
export const DAILY_PLAN_ID = seedId(4, 1)

export const TODAY = new Date().toISOString().slice(0, 10)
export const TOMORROW = addDays(TODAY, 1)
export const WEEK_END = addDays(startOfWeek(TODAY), 6)
// 保证 7 件未来任务始终落在「明天 / 本周晚些 / 下周」且都在未来（周一起始，与 core 分组一致）
export const THIS_WEEK_A = WEEK_END > TOMORROW ? WEEK_END : addDays(TOMORROW, 7)
export const THIS_WEEK_B =
  addDays(WEEK_END, -1) > TOMORROW ? addDays(WEEK_END, -1) : addDays(TOMORROW, 8)
export const NEXT_WEEK_A = addDays(WEEK_END, 2)
export const NEXT_WEEK_B = addDays(WEEK_END, 4)

export interface PlanSeed {
  id: string
  title: string
  motivation: string
  expectedDate: Date
  status: PlanState
}

export interface TaskSeed {
  id: string
  title: string
  bucket: Bucket
  orderIndex: number
  planId?: string
  dailyPlanId?: string
  scheduledDate?: Date
  startDate?: Date
  dueDate?: Date
  priority?: Priority
  estimateMin?: number
  actualMin?: number
  deferCount?: number
  isFrog?: boolean
  isFromSchedule?: boolean
  completedAt?: Date
}

export interface StepSeed {
  id: string
  taskId: string
  text: string
  done: boolean
  orderIndex: number
}

export interface CompletionSeed {
  id: string
  taskId: string
  statDate: Date
  completedAt: Date
  estimateMin: number
  actualMin: number
}

export interface FocusSeed {
  id: string
  taskId: string
  status: FocusState
  plannedSec: number
  actualFocusSec: number
  pauseCount: number
  startedAt: Date
  endedAt: Date
  statDate: Date
  idempotencyKey: string
}

export const plans: PlanSeed[] = [
  {
    id: PLAN_IDS[0]!,
    title: '毕业论文',
    motivation: '把大任务拆小就不吓人了',
    expectedDate: dateOnly(addDays(TODAY, 30)),
    status: 'ACTIVE',
  },
  {
    id: PLAN_IDS[1]!,
    title: '房间整理',
    motivation: '每天 10 分钟就好',
    expectedDate: dateOnly(addDays(TODAY, 14)),
    status: 'ACTIVE',
  },
  {
    id: PLAN_IDS[2]!,
    title: '健身习惯',
    motivation: '先动起来 5 分钟',
    expectedDate: dateOnly(addDays(TODAY, 60)),
    status: 'ACTIVE',
  },
]

// 今日 4 件：计划归属 2 + 散装 2；其中 1 件演示「来自安排」标签
export const todayTasks: TaskSeed[] = [
  {
    id: seedId(2, 1),
    title: '把论文第三章读完',
    bucket: 'TODAY',
    orderIndex: 0,
    planId: PLAN_IDS[0],
    dailyPlanId: DAILY_PLAN_ID,
    scheduledDate: dateOnly(TODAY),
    startDate: atDate(TODAY, 9),
    dueDate: atDate(TODAY, 11),
    priority: 'HIGH',
    estimateMin: 25,
    isFrog: true,
  },
  {
    id: seedId(2, 2),
    title: '整理书桌一角',
    bucket: 'TODAY',
    orderIndex: 1,
    planId: PLAN_IDS[1],
    dailyPlanId: DAILY_PLAN_ID,
    scheduledDate: dateOnly(TODAY),
    estimateMin: 10,
  },
  {
    id: seedId(2, 3),
    title: '给绿萝浇水',
    bucket: 'TODAY',
    orderIndex: 2,
    dailyPlanId: DAILY_PLAN_ID,
    scheduledDate: dateOnly(TODAY),
    estimateMin: 5,
    isFromSchedule: true,
  },
  {
    id: seedId(2, 4),
    title: '回复两封邮件',
    bucket: 'TODAY',
    orderIndex: 3,
    dailyPlanId: DAILY_PLAN_ID,
    scheduledDate: dateOnly(TODAY),
    estimateMin: 15,
    deferCount: 1,
  },
]

export const inboxTasks: TaskSeed[] = [
  { id: seedId(2, 10), title: '想试试番茄钟', bucket: 'INBOX', orderIndex: 0 },
  { id: seedId(2, 11), title: '预约牙医', bucket: 'INBOX', orderIndex: 1 },
  { id: seedId(2, 12), title: '整理浏览器收藏夹', bucket: 'INBOX', orderIndex: 2 },
  { id: seedId(2, 13), title: '给朋友回个消息', bucket: 'INBOX', orderIndex: 3 },
]

// 未来安排 7 件：明天 3 / 本周晚些 2 / 下周 2；计划归属 5 + 散装 2
export const futureTasks: TaskSeed[] = [
  {
    id: seedId(2, 20),
    title: '整理论文文献',
    bucket: 'SCHEDULED',
    orderIndex: 0,
    planId: PLAN_IDS[0],
    scheduledDate: dateOnly(TOMORROW),
    startDate: atDate(TOMORROW, 10),
    estimateMin: 30,
    priority: 'HIGH',
  },
  {
    id: seedId(2, 21),
    title: '去超市补货',
    bucket: 'SCHEDULED',
    orderIndex: 1,
    scheduledDate: dateOnly(TOMORROW),
    startDate: atDate(TOMORROW, 18),
    estimateMin: 20,
  },
  {
    id: seedId(2, 22),
    title: '慢跑 20 分钟',
    bucket: 'SCHEDULED',
    orderIndex: 2,
    planId: PLAN_IDS[2],
    scheduledDate: dateOnly(TOMORROW),
    startDate: atDate(TOMORROW, 7),
    estimateMin: 20,
  },
  {
    id: seedId(2, 23),
    title: '把衣柜上层清出来',
    bucket: 'SCHEDULED',
    orderIndex: 3,
    planId: PLAN_IDS[1],
    scheduledDate: dateOnly(THIS_WEEK_A),
    estimateMin: 25,
  },
  {
    id: seedId(2, 24),
    title: '取快递',
    bucket: 'SCHEDULED',
    orderIndex: 4,
    scheduledDate: dateOnly(THIS_WEEK_B),
    estimateMin: 10,
  },
  {
    id: seedId(2, 25),
    title: '写论文提纲',
    bucket: 'SCHEDULED',
    orderIndex: 5,
    planId: PLAN_IDS[0],
    scheduledDate: dateOnly(NEXT_WEEK_A),
    startDate: atDate(NEXT_WEEK_A, 9, 30),
    estimateMin: 45,
    priority: 'HIGH',
  },
  {
    id: seedId(2, 26),
    title: '第一次力量训练',
    bucket: 'SCHEDULED',
    orderIndex: 6,
    planId: PLAN_IDS[2],
    scheduledDate: dateOnly(NEXT_WEEK_B),
    estimateMin: 30,
  },
]

// 计划池待并入 3 件（S6/S7 计划区联调用）
export const poolTasks: TaskSeed[] = [
  {
    id: seedId(2, 30),
    title: '拆分论文第二章',
    bucket: 'UNSCHEDULED',
    orderIndex: 0,
    planId: PLAN_IDS[0],
    estimateMin: 40,
  },
  {
    id: seedId(2, 31),
    title: '整理阳台',
    bucket: 'UNSCHEDULED',
    orderIndex: 1,
    planId: PLAN_IDS[1],
    estimateMin: 20,
  },
  {
    id: seedId(2, 32),
    title: '选一双跑鞋',
    bucket: 'UNSCHEDULED',
    orderIndex: 2,
    planId: PLAN_IDS[2],
    estimateMin: 15,
  },
]
