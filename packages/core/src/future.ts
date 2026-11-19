import { addDays, isFutureDate, isWithinRange, monthRange, type DateRange, weekRange } from './date'

export interface FutureTaskLike {
  id: string
  title: string
  scheduledDate: string
  planId?: string | null
  planName?: string | null
  startAt?: string | null
  dueAt?: string | null
  completed?: boolean
}

export type FutureGroupKey = 'tomorrow' | 'thisWeek' | 'nextWeek' | 'later'

export interface FutureGroup {
  key: FutureGroupKey
  label: string
  range?: DateRange
  tasks: FutureTaskLike[]
}

export function sortFutureTasks(tasks: readonly FutureTaskLike[]): FutureTaskLike[] {
  return [...tasks].sort((a, b) => {
    if (a.scheduledDate !== b.scheduledDate) return a.scheduledDate.localeCompare(b.scheduledDate)
    const left = a.startAt ?? ''
    const right = b.startAt ?? ''
    if (left !== right) return left.localeCompare(right)
    return a.title.localeCompare(b.title)
  })
}

export function groupFutureTasks(
  tasks: readonly FutureTaskLike[],
  today: string,
  weekStartsOn = 1,
): FutureGroup[] {
  const tomorrow = addDays(today, 1)
  const currentWeek = weekRange(today, weekStartsOn)
  const followingWeek = weekRange(addDays(currentWeek.end, 1), weekStartsOn)

  const groups: FutureGroup[] = [
    { key: 'tomorrow', label: '明天', range: { start: tomorrow, end: tomorrow }, tasks: [] },
    { key: 'thisWeek', label: '本周晚些', range: currentWeek, tasks: [] },
    { key: 'nextWeek', label: '下周', range: followingWeek, tasks: [] },
    { key: 'later', label: '更远', tasks: [] },
  ]

  const byKey = new Map<FutureGroupKey, FutureGroup>(groups.map((group) => [group.key, group]))

  for (const task of sortFutureTasks(tasks)) {
    if (task.completed || !isFutureDate(task.scheduledDate, today)) continue

    let key: FutureGroupKey = 'later'
    if (task.scheduledDate === tomorrow) key = 'tomorrow'
    else if (isWithinRange(task.scheduledDate, currentWeek)) key = 'thisWeek'
    else if (isWithinRange(task.scheduledDate, followingWeek)) key = 'nextWeek'

    byKey.get(key)?.tasks.push(task)
  }

  return groups
}

export function futureCalendarMarkers(
  tasks: readonly FutureTaskLike[],
  monthKey: string,
): Record<string, number> {
  const { start, end } = monthRange(monthKey)
  const markers: Record<string, number> = {}

  for (const task of tasks) {
    if (task.completed) continue
    if (task.scheduledDate < start || task.scheduledDate > end) continue
    markers[task.scheduledDate] = (markers[task.scheduledDate] ?? 0) + 1
  }

  return markers
}

export function isDueOn(task: FutureTaskLike, dateKey: string): boolean {
  return !task.completed && task.scheduledDate <= dateKey
}

export function dueTasks(tasks: readonly FutureTaskLike[], dateKey: string): FutureTaskLike[] {
  return sortFutureTasks(tasks.filter((task) => isDueOn(task, dateKey)))
}
